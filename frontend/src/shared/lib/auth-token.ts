// Cache en mémoire du token d'accès courant, tenu à jour par AuthTokenSync
// (src/app/providers.tsx) à chaque changement de session NextAuth. apiFetch
// (api-client.ts) le lit pour poser l'en-tête Authorization - ce module ne dépend
// de rien (pas de next-auth/react) pour rester utilisable aussi bien côté serveur
// (où il reste simplement vide) que côté client.
let accessToken: string | undefined;

export function setAccessToken(token: string | undefined): void {
  accessToken = token;
}

export function getAccessToken(): string | undefined {
  return accessToken;
}
