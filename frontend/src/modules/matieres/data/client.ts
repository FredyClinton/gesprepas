import { apiFetch } from "@/shared/lib/api-client";

import type { Matiere } from "../domain/types";

export function listMatieres(): Promise<Matiere[]> {
  return apiFetch<Matiere[]>("/api/matieres");
}

export function creerMatiere(payload: { nom: string; couleur?: string }): Promise<Matiere> {
  return apiFetch<Matiere>("/api/matieres", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function modifierMatiere(
  id: string,
  payload: { nom?: string; couleur?: string },
): Promise<Matiere> {
  return apiFetch<Matiere>(`/api/matieres/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changerCouleurMatiere(id: string, couleur: string): Promise<Matiere> {
  return apiFetch<Matiere>(`/api/matieres/${id}/couleur`, {
    method: "PATCH",
    body: JSON.stringify({ couleur }),
  });
}

export function supprimerMatiere(id: string): Promise<void> {
  return apiFetch<void>(`/api/matieres/${id}`, {
    method: "DELETE",
  });
}

