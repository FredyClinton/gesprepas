import { apiFetch } from "@/shared/lib/api-client";

import { construireParams, type PageResponse } from "@/shared/lib/pagination";

import type {
  Apprenant,
  CriteresRechercheApprenants,
  LigneApprenant,
  SyntheseApprenants,
} from "../domain/types";
import { Affectation } from "@/modules/affectation";

// Liste non paginée, éventuellement restreinte côté serveur à une session et/ou
// un centre (sans filtre : tous les apprenants de toutes les sessions).
export function listApprenants(
  filtres: { sessionId?: string; centreId?: string } = {},
): Promise<Apprenant[]> {
  const params = construireParams(filtres).toString();
  return apiFetch<Apprenant[]>(`/api/apprenants${params ? `?${params}` : ""}`);
}

export function rechercherApprenants(
  criteres: CriteresRechercheApprenants,
  page: number,
  taille: number,
): Promise<PageResponse<LigneApprenant>> {
  const params = construireParams({ ...criteres, page, taille });
  return apiFetch<PageResponse<LigneApprenant>>(
    `/api/apprenants/recherche?${params}`,
  );
}

export function getSyntheseApprenants(
  sessionId?: string,
  centreId?: string,
): Promise<SyntheseApprenants> {
  const params = construireParams({ sessionId, centreId });
  return apiFetch<SyntheseApprenants>(`/api/apprenants/synthese?${params}`);
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
  dateDefinitionContrat?: string;
  centreId: string;
  sessionId: string;
  formationId: string;
  etablissementOrigine?: string;
  contactApprenant?: string;
  nomParent?: string;
  contactParent?: string;
  preInscrit?: boolean;
  referenceRecu?: string;
};

export function creerApprenant(input: CreerApprenantInput): Promise<Apprenant> {
  return apiFetch<Apprenant>("/api/apprenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type ModifierApprenantInput = {
  nom: string;
  prenom: string;
  dateNaissance: string;
  contactApprenant?: string;
  nomParent?: string;
  contactParent?: string;
  etablissementOrigine?: string;
};

export function modifierApprenant(
  id: string,
  input: ModifierApprenantInput,
): Promise<Apprenant> {
  return apiFetch<Apprenant>(`/api/apprenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
