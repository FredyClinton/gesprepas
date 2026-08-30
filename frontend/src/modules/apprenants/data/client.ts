import { apiFetch } from "@/shared/lib/api-client";

import type { Apprenant } from "../domain/types";
import { Affectation } from "@/modules/affectation";

export function listApprenants(): Promise<Apprenant[]> {
  return apiFetch<Apprenant[]>("/api/apprenants");
}

export function listAffectationsParEnseignant(
  enseignantId: string,
  sessionId: string,
): Promise<Affectation[]> {
  const params = new URLSearchParams({ sessionId });
  return apiFetch<Affectation[]>(
    `/api/affectations/enseignant/${enseignantId}?${params}`,
  );
}
