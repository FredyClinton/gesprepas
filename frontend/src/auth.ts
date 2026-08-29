import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { login } from "@/modules/utilisateurs/data/client";
import { loginSchema } from "./modules/utilisateurs/domain/schemas";
import { ApiError } from "@/shared/lib/api-client";

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
          const { token, utilisateur } = await login(analyse.data);

          // Les parametres du callback jwt()

          return {
            id: utilisateur.id,
            name: `${utilisateur.prenom} ${utilisateur.nom}`,
            email: utilisateur.email,
            role: utilisateur.role,
            centreId: utilisateur.centreId,
            departementId: utilisateur.departementId,
            backendToken: token,
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
        token.backendToken = user.backendToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.centreId = token.centreId;
      session.user.departementId = token.departementId;
      return session;
    },
    authorized: ({ auth }) => !!auth,
  },
});
