import { apiFetch } from "@/shared/lib/api-client";

import type { Entree, Motif, TypeMotif, StatutMouvement } from "../domain/types";

import type { BilanApercu, RepartitionFormation } from "../domain/types";

export function getBilanDuJour(
  centreId: string,
  sessionId: string,
  date: string,
): Promise<BilanApercu> {
  const params = new URLSearchParams({ centreId, sessionId, date });
  return apiFetch<BilanApercu>(`/api/bilans-journaliers/du-jour?${params}`);
}

export function getRepartitionFormations(
  bilanId: string,
): Promise<RepartitionFormation[]> {
  return apiFetch<RepartitionFormation[]>(
    `/api/bilans-journaliers/${bilanId}/repartition-formations`,
  );
}

export function listVersementsApprenant(
  apprenantId: string,
): Promise<Entree[]> {
  const params = new URLSearchParams({ apprenantId });
  return apiFetch<Entree[]>(`/api/entrees?${params}`);
}

export function listMotifs(type?: TypeMotif): Promise<Motif[]> {
  const params = type ? `?${new URLSearchParams({ type })}` : "";
  return apiFetch<Motif[]>(`/api/motifs${params}`);
}

export type SaisirEntreeInput = {
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  centreId: string;
  apprenantId?: string;
  formationId?: string;
};

export function saisirEntree(input: SaisirEntreeInput): Promise<Entree> {
  return apiFetch<Entree>("/api/entrees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type MouvementFinancier = {
  id: string;
  type: "ENTREE" | "SORTIE";
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  statut: StatutMouvement;
  centreId?: string | null;
  apprenantId?: string | null;
  formationId?: string | null;
  ordonnateur?: string | null;
};

export function listMouvementsFinanciers(
  sessionId: string,
  centreId?: string,
): Promise<MouvementFinancier[]> {
  const params = new URLSearchParams({ sessionId });
  if (centreId) params.append("centreId", centreId);
  return apiFetch<MouvementFinancier[]>(`/api/mouvements-financiers?${params}`);
}
