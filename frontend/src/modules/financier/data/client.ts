import { apiFetch } from "@/shared/lib/api-client";

import type { Entree, Motif, TypeMotif } from "../domain/types";

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
