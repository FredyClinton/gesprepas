import { apiFetch } from "@/shared/lib/api-client";

import type { GelEnseignants } from "../domain/types";

export function getGelEnseignants(): Promise<GelEnseignants> {
  return apiFetch<GelEnseignants>("/api/parametres/gel-enseignants");
}

export type ModifierGelEnseignantsInput = {
  actif: boolean;
  dateFin: string | null;
};

export function modifierGelEnseignants(
  input: ModifierGelEnseignantsInput,
): Promise<GelEnseignants> {
  return apiFetch<GelEnseignants>("/api/parametres/gel-enseignants", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
