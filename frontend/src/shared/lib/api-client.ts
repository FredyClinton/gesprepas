// Wrapper fetch générique vers l'API backend EXCELIS PRÉPAS. Les modules l'utilisent
// dans leur `data/client.ts` pour construire leurs appels typés - pas d'appel fetch()
// brut ailleurs dans l'app.

import { getAccessToken } from "./auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Message à afficher à l'utilisateur pour une erreur d'appel API - jamais le
// message brut du backend en 5xx (exception non gérée par un handler domaine
// dédié, ex : erreur DB, bug non mappé) qui peut être un texte technique/Java,
// pas rédigé pour un humain. En 4xx, le backend a un handler dédié qui rédige
// un message métier propre, donc on peut lui faire confiance.
export function messageErreurApi(erreur: unknown, repli: string): string {
  if (
    erreur instanceof ApiError &&
    erreur.status < 500 &&
    typeof (erreur.body as { message?: unknown } | undefined)?.message ===
      "string"
  ) {
    return (erreur.body as { message: string }).message;
  }
  return repli;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  // Surcharge explicite du token, pour les appels faits depuis un Server Component
  // (ex: dashboard layout) : getAccessToken() n'y renvoie jamais rien, ce cache
  // n'étant alimenté que côté client par AuthTokenSync (providers.tsx). Là où
  // l'appelant a déjà `session.accessToken` sous la main (via `auth()`), il doit
  // le passer ici plutôt que de laisser la requête partir sans Authorization.
  token?: string,
): Promise<T> {
  const jeton = token ?? getAccessToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiError(
      `Requête API échouée (${res.status}) : ${path}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
