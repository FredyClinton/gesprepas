import { apiFetch } from "@/shared/lib/api-client";

import type { Centre, Localisation, SessionAcademique } from "../domain/types";

export function listCentres(): Promise<Centre[]> {
  return apiFetch<Centre[]>("/api/centres");
}

export function getCentre(id: string): Promise<Centre> {
  return apiFetch<Centre>(`/api/centres/${id}`);
}

export function listSessions(): Promise<SessionAcademique[]> {
  return apiFetch<SessionAcademique[]>("/api/sessions");
}

export function relocaliserCentre(
  id: string,
  input: { adresse: string; ville: string },
): Promise<Centre> {
  return apiFetch<Centre>(`/api/centres/${id}/relocaliser`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listLocalisations(centreId: string): Promise<Localisation[]> {
  return apiFetch<Localisation[]>(`/api/centres/${centreId}/localisations`);
}

export function fermerCentre(id: string): Promise<Centre> {
  return apiFetch<Centre>(`/api/centres/${id}/fermer`, { method: "PATCH" });
}

export function rouvrirCentre(id: string): Promise<Centre> {
  return apiFetch<Centre>(`/api/centres/${id}/rouvrir`, { method: "PATCH" });
}

export function rejoindreSession(
  id: string,
  sessionId: string,
): Promise<Centre> {
  return apiFetch<Centre>(`/api/centres/${id}/rejoindre-session`, {
    method: "PATCH",
    body: JSON.stringify({ sessionId }),
  });
}
