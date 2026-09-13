import { apiFetch } from "@/shared/lib/api-client";
import type {
  ConcoursBlanc,
  CreerConcoursBlancPayload,
  ModifierConcoursBlancPayload,
  DefinirContenuEpreuvePayload,
  EpreuveConcoursBlanc,
  EnregistrerNotesPayload,
  ResultatCandidat,
  BordereauResultats,
  StatutConcoursBlanc,
} from "../types/concours-blanc.types";

export function listerConcoursBlancs(
  sessionId: string,
  role?: string,
  userCentreId?: string,
): Promise<ConcoursBlanc[]> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;
  return apiFetch<ConcoursBlanc[]>(`/api/concours-blancs?sessionId=${sessionId}`, { headers });
}

export function recupererConcoursBlanc(
  id: string,
  role?: string,
  userCentreId?: string,
): Promise<ConcoursBlanc> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;
  return apiFetch<ConcoursBlanc>(`/api/concours-blancs/${id}`, { headers });
}

export function creerConcoursBlanc(payload: CreerConcoursBlancPayload): Promise<ConcoursBlanc> {
  return apiFetch<ConcoursBlanc>("/api/concours-blancs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function modifierConcoursBlanc(
  id: string,
  payload: ModifierConcoursBlancPayload,
): Promise<ConcoursBlanc> {
  return apiFetch<ConcoursBlanc>(`/api/concours-blancs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function supprimerConcoursBlanc(id: string): Promise<void> {
  return apiFetch<void>(`/api/concours-blancs/${id}`, {
    method: "DELETE",
  });
}

export function definirContenuEpreuve(
  concoursBlancId: string,
  epreuveId: string,
  payload: DefinirContenuEpreuvePayload,
  role?: string,
  departementId?: string,
): Promise<EpreuveConcoursBlanc> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (departementId) headers["X-Departement-Id"] = departementId;

  return apiFetch<EpreuveConcoursBlanc>(
    `/api/concours-blancs/${concoursBlancId}/epreuves/${epreuveId}/contenu`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    },
  );
}

export function changerStatutConcoursBlanc(
  id: string,
  statut: StatutConcoursBlanc,
): Promise<ConcoursBlanc> {
  return apiFetch<ConcoursBlanc>(`/api/concours-blancs/${id}/statut`, {
    method: "PUT",
    body: JSON.stringify({ statut }),
  });
}

export function recupererResultatsConcoursBlanc(
  id: string,
  centreId?: string,
  formationId?: string,
  role?: string,
  userCentreId?: string,
): Promise<ResultatCandidat[]> {
  const params = new URLSearchParams();
  if (centreId) params.append("centreId", centreId);
  if (formationId) params.append("formationId", formationId);
  const q = params.toString() ? `?${params.toString()}` : "";
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;
  return apiFetch<ResultatCandidat[]>(`/api/concours-blancs/${id}/resultats${q}`, { headers });
}

export function enregistrerNotesConcoursBlanc(
  id: string,
  payload: EnregistrerNotesPayload,
  role?: string,
  userCentreId?: string,
): Promise<ResultatCandidat[]> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;

  return apiFetch<ResultatCandidat[]>(`/api/concours-blancs/${id}/notes`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function recupererBordereauConcoursBlanc(
  id: string,
  formationId: string,
  centreId?: string,
  role?: string,
  userCentreId?: string,
): Promise<BordereauResultats> {
  const params = new URLSearchParams({ formationId });
  if (centreId) params.append("centreId", centreId);
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;
  return apiFetch<BordereauResultats>(`/api/concours-blancs/${id}/bordereau?${params.toString()}`, { headers });
}

export function verrouillerSaisieCentres(
  id: string,
  bloquer: boolean,
  role?: string,
): Promise<ConcoursBlanc> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;

  return apiFetch<ConcoursBlanc>(`/api/concours-blancs/${id}/verrouiller-centres?bloquer=${bloquer}`, {
    method: "PUT",
    headers,
  });
}

export function compilerResultatsConcoursBlanc(
  id: string,
  role?: string,
): Promise<void> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;

  return apiFetch<void>(`/api/concours-blancs/${id}/compiler`, {
    method: "POST",
    headers,
  });
}


