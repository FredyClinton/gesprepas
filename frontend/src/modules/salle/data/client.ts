import { apiFetch } from "@/shared/lib/api-client";

import type { Salle } from "../domain/types";

export function listSalles(params?: {
  centreId?: string;
  sessionId?: string;
}): Promise<Salle[]> {
  const query = new URLSearchParams();
  if (params?.centreId) query.set("centreId", params.centreId);
  if (params?.sessionId) query.set("sessionId", params.sessionId);
  const suffix = query.toString() ? `?${query}` : "";
  return apiFetch<Salle[]>(`/api/salles${suffix}`);
}

export function createSalle(input: {
  nom: string;
  centreId: string;
  sessionId: string;
  formationId: string;
}): Promise<Salle> {
  return apiFetch<Salle>("/api/salles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
