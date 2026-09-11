import { apiFetch } from "@/shared/lib/api-client";
import type {
  Progression,
  CreerProgressionPayload,
  MettreAJourContenuPayload,
} from "../domain/types";

export function listProgressions(): Promise<Progression[]> {
  return apiFetch<Progression[]>("/api/progressions");
}

export function creerProgression(
  payload: CreerProgressionPayload,
): Promise<Progression> {
  return apiFetch<Progression>("/api/progressions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function mettreAJourContenuProgression(
  id: string,
  payload: MettreAJourContenuPayload,
): Promise<Progression> {
  return apiFetch<Progression>(`/api/progressions/${id}/contenu`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function supprimerProgression(id: string): Promise<void> {
  return apiFetch<void>(`/api/progressions/${id}`, {
    method: "DELETE",
  });
}
