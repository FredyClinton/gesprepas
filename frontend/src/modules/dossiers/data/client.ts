import { apiFetch } from "@/shared/lib/api-client";

import type {
  AjouterConcoursAuDossierInput,
  Concours,
  CreerConcoursInput,
  CreerPieceRequiseInput,
  Dossier,
  DossierConcours,
  EnregistrerPaiementDossierInput,
  ModifierPieceRequiseInput,
  PieceDossier,
  PieceRequise,
  SoldeDossierConcours,
} from "../domain/types";

export function getDossier(dossierId: string): Promise<Dossier> {
  return apiFetch<Dossier>(`/api/dossiers/${dossierId}`);
}

export function getDossierParApprenant(apprenantId: string): Promise<Dossier> {
  const params = new URLSearchParams({ apprenantId });
  return apiFetch<Dossier>(`/api/dossiers?${params}`);
}

export function listDossiers(
  sessionId?: string,
  centreId?: string,
): Promise<Dossier[]> {
  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  if (centreId) params.set("centreId", centreId);
  const query = params.toString();
  return apiFetch<Dossier[]>(`/api/dossiers/liste${query ? `?${query}` : ""}`);
}

export function ouvrirDossier(
  apprenantId: string,
  sessionId: string,
): Promise<Dossier> {
  return apiFetch<Dossier>("/api/dossiers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apprenantId, sessionId }),
  });
}

export function listConcoursDuDossier(
  dossierId: string,
): Promise<DossierConcours[]> {
  return apiFetch<DossierConcours[]>(`/api/dossiers/${dossierId}/concours`);
}

export function ajouterConcoursAuDossier(
  dossierId: string,
  input: AjouterConcoursAuDossierInput,
): Promise<DossierConcours> {
  return apiFetch<DossierConcours>(`/api/dossiers/${dossierId}/concours`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function signalerDossierComplet(dossierId: string): Promise<Dossier> {
  return apiFetch<Dossier>(`/api/dossiers/${dossierId}/signaler-complet`, {
    method: "PATCH",
  });
}

export function cloturerDossier(dossierId: string): Promise<Dossier> {
  return apiFetch<Dossier>(`/api/dossiers/${dossierId}/cloturer`, {
    method: "PATCH",
  });
}

export function rouvrirDossier(dossierId: string): Promise<Dossier> {
  return apiFetch<Dossier>(`/api/dossiers/${dossierId}/rouvrir`, {
    method: "PATCH",
  });
}

export function modifierObservationDossier(
  dossierId: string,
  observation: string,
): Promise<Dossier> {
  return apiFetch<Dossier>(`/api/dossiers/${dossierId}/observation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observation }),
  });
}

export function listPiecesDossierConcours(
  dossierConcoursId: string,
): Promise<PieceDossier[]> {
  return apiFetch<PieceDossier[]>(
    `/api/dossiers-concours/${dossierConcoursId}/pieces`,
  );
}

export function validerPieceDossier(
  pieceDossierId: string,
): Promise<PieceDossier> {
  return apiFetch<PieceDossier>(
    `/api/pieces-dossier/${pieceDossierId}/valider`,
    {
      method: "PATCH",
    },
  );
}

export function getSoldeDossierConcours(
  dossierConcoursId: string,
): Promise<SoldeDossierConcours> {
  return apiFetch<SoldeDossierConcours>(
    `/api/dossiers-concours/${dossierConcoursId}/solde`,
  );
}

export function enregistrerPaiementDossier(
  dossierConcoursId: string,
  input: EnregistrerPaiementDossierInput,
): Promise<unknown> {
  return apiFetch(`/api/dossiers-concours/${dossierConcoursId}/paiements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getConcours(id: string): Promise<Concours> {
  return apiFetch<Concours>(`/api/concours/${id}`);
}

export function listConcoursSession(
  sessionId?: string,
): Promise<Concours[]> {
  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  const query = params.toString();
  return apiFetch<Concours[]>(`/api/concours${query ? `?${query}` : ""}`);
}

export function creerConcours(input: CreerConcoursInput): Promise<Concours> {
  return apiFetch<Concours>("/api/concours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function listPiecesDuConcours(
  concoursId: string,
): Promise<PieceRequise[]> {
  const pieces = await apiFetch<PieceRequise[]>(`/api/concours/${concoursId}/pieces-requises`);
  return [...pieces].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
}

export function ajouterPieceAuConcours(
  concoursId: string,
  pieceRequiseId: string,
): Promise<void> {
  return apiFetch<void>(`/api/concours/${concoursId}/pieces-requises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pieceRequiseId }),
  });
}

export function retirerPieceDuConcours(
  concoursId: string,
  pieceRequiseId: string,
): Promise<void> {
  return apiFetch<void>(
    `/api/concours/${concoursId}/pieces-requises/${pieceRequiseId}`,
    {
      method: "DELETE",
    },
  );
}

export async function listPiecesRequises(): Promise<PieceRequise[]> {
  const pieces = await apiFetch<PieceRequise[]>("/api/pieces-requises");
  return [...pieces].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
}

export function creerPieceRequise(
  input: CreerPieceRequiseInput,
): Promise<PieceRequise> {
  return apiFetch<PieceRequise>("/api/pieces-requises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function modifierPieceRequise(
  id: string,
  input: ModifierPieceRequiseInput,
): Promise<PieceRequise> {
  return apiFetch<PieceRequise>(`/api/pieces-requises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function desactiverPieceRequise(id: string): Promise<PieceRequise> {
  return apiFetch<PieceRequise>(`/api/pieces-requises/${id}/desactiver`, {
    method: "PATCH",
  });
}

export function reactiverPieceRequise(id: string): Promise<PieceRequise> {
  return apiFetch<PieceRequise>(`/api/pieces-requises/${id}/reactiver`, {
    method: "PATCH",
  });
}
