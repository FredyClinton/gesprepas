import { apiFetch } from "@/shared/lib/api-client";

import type { Affectation, Jour } from "../domain/types";

type ListerAffectationsParams = {
  sessionId: string;
  semaine: number;
  centreId?: string;
  matiereId?: string;
};

export function listAffectations({
  sessionId,
  semaine,
  centreId,
  matiereId,
}: ListerAffectationsParams): Promise<Affectation[]> {
  const params = new URLSearchParams({ sessionId, semaine: String(semaine) });
  if (centreId) params.set("centreId", centreId);
  if (matiereId) params.set("matiereId", matiereId);
  return apiFetch<Affectation[]>(`/api/affectations?${params}`);
}

export function assignerEnseignant(
  id: string,
  enseignantId: string,
): Promise<Affectation> {
  return apiFetch<Affectation>(`/api/affectations/${id}/assigner-enseignant`, {
    method: "PATCH",
    body: JSON.stringify({ enseignantId }),
  });
}

export type CreerCreneauInput = {
  centreId: string;
  sessionId: string;
  formationId: string;
  salleId: string;
  matiereId: string;
  jour: Jour;
  seance: number;
  semaine: number;
};

export function creerCreneau(input: CreerCreneauInput): Promise<Affectation> {
  return apiFetch<Affectation>("/api/affectations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function modifierMatiere(
  id: string,
  matiereId: string,
): Promise<Affectation> {
  return apiFetch<Affectation>(`/api/affectations/${id}/modifier-matiere`, {
    method: "PATCH",
    body: JSON.stringify({ matiereId }),
  });
}

export function annulerCreneau(id: string): Promise<Affectation> {
  return apiFetch<Affectation>(`/api/affectations/${id}/annuler`, {
    method: "PATCH",
  });
}

// Suppression définitive (DELETE) — distincte de `annulerCreneau` (PATCH /annuler,
// change juste le statut à ANNULEE, garde la ligne en base). Le bouton "Supprimer le
// créneau" de la grille appelle celle-ci : un créneau créé par erreur doit vraiment
// disparaître, pas juste changer de statut (décision du 30/08/2026).
export function supprimerCreneau(id: string): Promise<void> {
  return apiFetch<void>(`/api/affectations/${id}`, { method: "DELETE" });
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
