import { apiFetch } from "@/shared/lib/api-client";
import { LoginRequest, LoginResponse, Utilisateur } from "../domain/types";

// fonction de connexion
export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Pas de filtre côté backend (GET /api/utilisateurs retourne la liste complète) —
// le filtrage par centre se fait côté client, comme pour les autres écrans qui
// dérivent un sous-ensemble d'une liste globale déjà chargée.
export function listUtilisateurs(): Promise<Utilisateur[]> {
  return apiFetch<Utilisateur[]>("/api/utilisateurs");
}
