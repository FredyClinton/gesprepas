import { apiFetch } from "@/shared/lib/api-client";

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
