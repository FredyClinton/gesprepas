import type { DefaultSession } from "next-auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- voir commentaire ci-dessus
import type { JWT } from "next-auth/jwt";

import type { Role } from "./roles";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      centreId: string | null;
      departementId: string | null;
    } & DefaultSession["user"];
    // Access token JWT du backend, exposé au client pour que apiFetch (voir
    // shared/lib/api-client.ts) puisse l'attacher en Authorization: Bearer ...
    // Le refresh token, lui, ne quitte jamais le serveur (voir JWT ci-dessous).
    accessToken: string;
    // Présent seulement si le rafraîchissement automatique (callback jwt()) a
    // échoué - le composant qui lit la session doit alors forcer une déconnexion.
    error?: "RefreshAccessTokenError";
  }

  interface User {
    role: Role;
    centreId: string | null;
    departementId: string | null;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    centreId: string | null;
    departementId: string | null;
    accessToken: string;
    refreshToken: string;
    // Timestamp (ms epoch) d'expiration de l'access token, calculé à la connexion
    // et à chaque rafraîchissement - permet au callback jwt() de savoir quand
    // rafraîchir sans décoder le JWT lui-même.
    accessTokenExpires: number;
    error?: "RefreshAccessTokenError";
  }
}
