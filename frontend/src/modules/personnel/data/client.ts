import { apiFetch } from "@/shared/lib/api-client";
import type { Role } from "@/types/roles";

import type { Enseignant } from "../domain/types";

// Header placeholder : le backend n'a pas encore d'authentification réelle, il fait
// confiance à ce rôle auto-déclaré pour appliquer le gel de gestion des enseignants
// (voir gelenseignants côté backend). À retirer une fois Spring Security en place.
function headerRole(role: Role | undefined): HeadersInit | undefined {
  return role ? { "X-User-Role": role } : undefined;
}

export function listEnseignants(): Promise<Enseignant[]> {
  return apiFetch<Enseignant[]>("/api/enseignants");
}

export function getEnseignant(id: string): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}`);
}

export type CreerEnseignantInput = {
  nom: string;
  prenom: string;
  matricule: string;
  coutParSeance: number;
};

export function creerEnseignant(
  input: CreerEnseignantInput,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>("/api/enseignants", {
    method: "POST",
    headers: headerRole(role),
    body: JSON.stringify(input),
  });
}

export function renommerEnseignant(
  id: string,
  nom: string,
  prenom: string,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/renommer`, {
    method: "PATCH",
    headers: headerRole(role),
    body: JSON.stringify({ nom, prenom }),
  });
}

export function modifierCoutParSeance(
  id: string,
  coutParSeance: number,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/cout-par-seance`, {
    method: "PATCH",
    headers: headerRole(role),
    body: JSON.stringify({ coutParSeance }),
  });
}

export function suspendreEnseignant(
  id: string,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/suspendre`, {
    method: "PATCH",
    headers: headerRole(role),
  });
}

export function reactiverEnseignant(
  id: string,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/reactiver`, {
    method: "PATCH",
    headers: headerRole(role),
  });
}

export function supprimerEnseignant(
  id: string,
  role: Role | undefined,
): Promise<void> {
  return apiFetch<void>(`/api/enseignants/${id}`, {
    method: "DELETE",
    headers: headerRole(role),
  });
}
