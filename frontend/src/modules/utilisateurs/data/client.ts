import { apiFetch } from "@/shared/lib/api-client";
import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  Utilisateur,
} from "../domain/types";

// fonction de connexion
export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Échange un refresh token valide contre un nouveau couple access/refresh token
// (rotation : l'ancien refresh token est révoqué côté backend). Appelée depuis le
// callback jwt() de NextAuth (src/auth.ts), pas depuis un composant.
export function refresh(payload: RefreshRequest): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Révoque le refresh token fourni. Appelée depuis l'event signOut de NextAuth
// (src/auth.ts) - best-effort, une erreur réseau ne doit pas bloquer la
// déconnexion côté client.
export function logout(payload: LogoutRequest): Promise<void> {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Pas de filtre côté backend (GET /api/utilisateurs retourne la liste complète) -
// le filtrage par centre se fait côté client, comme pour les autres écrans qui
// dérivent un sous-ensemble d'une liste globale déjà chargée.
export function listUtilisateurs(): Promise<Utilisateur[]> {
  return apiFetch<Utilisateur[]>("/api/utilisateurs");
}

export function getUtilisateur(id: string): Promise<Utilisateur> {
  return apiFetch<Utilisateur>(`/api/utilisateurs/${id}`);
}
