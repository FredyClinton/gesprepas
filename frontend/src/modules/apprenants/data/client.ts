import { apiFetch } from "@/shared/lib/api-client";

import type { Apprenant } from "../domain/types";
import { Affectation } from "@/modules/affectation";

export function listApprenants(): Promise<Apprenant[]> {
  return apiFetch<Apprenant[]>("/api/apprenants");
}

export function getApprenant(id: string): Promise<Apprenant> {
  return apiFetch<Apprenant>(`/api/apprenants/${id}`);
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

export type CreerApprenantInput = {
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateInscription: string;
  montantContrat: number;
  dateDefinitionContrat: string;
  centreId: string;
  sessionId: string;
  formationId: string;
};

export function creerApprenant(input: CreerApprenantInput): Promise<Apprenant> {
  return apiFetch<Apprenant>("/api/apprenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
