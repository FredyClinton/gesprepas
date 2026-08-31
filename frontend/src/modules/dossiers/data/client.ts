import { apiFetch } from "@/shared/lib/api-client";

import type {
  Concours,
  Dossier,
  DossierConcours,
  PieceDossier,
  PieceRequise,
  SoldeDossierConcours,
} from "../domain/types";

export function getDossierParApprenant(apprenantId: string): Promise<Dossier> {
  const params = new URLSearchParams({ apprenantId });
  return apiFetch<Dossier>(`/api/dossiers?${params}`);
}

export function listConcoursDuDossier(
  dossierId: string,
): Promise<DossierConcours[]> {
  return apiFetch<DossierConcours[]>(`/api/dossiers/${dossierId}/concours`);
}

export function listPiecesDossierConcours(
  dossierConcoursId: string,
): Promise<PieceDossier[]> {
  return apiFetch<PieceDossier[]>(
    `/api/dossiers-concours/${dossierConcoursId}/pieces`,
  );
}

export function getSoldeDossierConcours(
  dossierConcoursId: string,
): Promise<SoldeDossierConcours> {
  return apiFetch<SoldeDossierConcours>(
    `/api/dossiers-concours/${dossierConcoursId}/solde`,
  );
}

export function getConcours(id: string): Promise<Concours> {
  return apiFetch<Concours>(`/api/concours/${id}`);
}

export function listPiecesRequises(): Promise<PieceRequise[]> {
  return apiFetch<PieceRequise[]>("/api/pieces-requises");
}
