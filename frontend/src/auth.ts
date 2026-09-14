import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { login, logout, refresh } from "@/modules/utilisateurs/data/client";
import { loginSchema } from "./modules/utilisateurs/domain/schemas";
import { ApiError } from "@/shared/lib/api-client";

// Doit rester en dessous de app.jwt.access-token-ttl-minutes côté backend (20 min,
// voir backend/src/main/resources/application.yaml) - marge de sécurité de 60s pour
// ne jamais présenter un token déjà expiré à l'API.
const ACCESS_TOKEN_TTL_MS = (20 * 60 - 60) * 1000;

// Le callback jwt() s'exécute une fois par requête (chaque auth(), chaque poll de
// /api/auth/session) - deux onglets, ou un poll client qui chevauche un auth()
// serveur, peuvent donc appeler rafraichirToken() en parallèle avec le MÊME
// refreshToken encore valide. Le backend révoque ce refresh token dès sa première
// utilisation (rotation) : sans déduplication, le second appel se prend un 401 et
// force une déconnexion alors que le premier a bien obtenu un token valide. On
// mutualise les rafraîchissements concurrents pour un même refreshToken (clé de la
// Map) - jamais un verrou global, qui mélangerait les rafraîchissements de
// plusieurs utilisateurs distincts en même temps sur ce même serveur.
const rafraichissementsEnCours = new Map<string, Promise<JWT>>();

function rafraichirToken(token: JWT): Promise<JWT> {
  const cle = token.refreshToken;
  if (!cle) {
    return Promise.resolve({
      ...token,
      error: "RefreshAccessTokenError" as const,
    });
  }

  const enCours = rafraichissementsEnCours.get(cle);
  if (enCours) {
    return enCours;
  }

  const promesse = (async () => {
    try {
      const resultat = await refresh({ refreshToken: token.refreshToken });
      return {
        ...token,
        accessToken: resultat.accessToken,
        refreshToken: resultat.refreshToken,
        accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
        error: undefined,
      };
    } catch {
      // Refresh token invalide, expiré ou révoqué : plus rien à faire côté serveur,
      // le client doit se reconnecter (voir session.error dans le callback session).
      return { ...token, error: "RefreshAccessTokenError" as const };
    } finally {
      rafraichissementsEnCours.delete(cle);
    }
  })();

  rafraichissementsEnCours.set(cle, promesse);
  return promesse;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  //  page de connexion
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const analyse = loginSchema.safeParse(credentials);

        if (!analyse.success) return null;

        try {
          const { accessToken, refreshToken, utilisateur } = await login(
            analyse.data,
          );

          // Les parametres du callback jwt()

          return {
            id: utilisateur.id,
            name: `${utilisateur.prenom} ${utilisateur.nom}`,
            email: utilisateur.email,
            role: utilisateur.role,
            centreId: utilisateur.centreId,
            departementId: utilisateur.departementId,
            accessToken,
            refreshToken,
          };
        } catch (erreur) {
          // Cas d'une erreur sur les identifiants
          if (erreur instanceof ApiError && erreur.status === 401) {
            return null;
          }

          throw erreur;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.centreId = user.centreId;
        token.departementId = user.departementId;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS;
        return token;
      }

      // Invalide les anciennes sessions qui ne contiennent pas les deux jetons
      // nécessaires au rafraîchissement, au lieu d'envoyer une requête vide au
      // backend puis de poursuivre avec un access token inutilisable.
      if (!token.accessToken || !token.refreshToken || !token.accessTokenExpires) {
        return { ...token, error: "RefreshAccessTokenError" as const };
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return rafraichirToken(token);
    },

    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.centreId = token.centreId;
      session.user.departementId = token.departementId;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
    authorized: ({ auth }) => !!auth && !auth.error,
  },
  events: {
    async signOut(message) {
      // Révocation best-effort du refresh token côté backend : une erreur réseau
      // ici ne doit pas empêcher la déconnexion côté client (le cookie de session
      // est de toute façon détruit par NextAuth).
      const token = "token" in message ? message.token : undefined;
      if (!token?.refreshToken) return;

      try {
        await logout({ refreshToken: token.refreshToken });
      } catch {
        // best-effort - voir commentaire ci-dessus
      }
    },
  },
});
