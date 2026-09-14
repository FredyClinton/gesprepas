import { apiFetch } from "@/shared/lib/api-client";

import type { Centre, Localisation, SessionAcademique } from "../domain/types";
import type { SemaineSession } from "../domain/semaine";

export function listCentres(): Promise<Centre[]> {
  return apiFetch<Centre[]>("/api/centres");
}

// `token` optionnel : à passer explicitement quand l'appelant l'a déjà sous la
// main côté serveur (ex: dashboard layout, un Server Component - voir le
// commentaire sur `apiFetch` dans shared/lib/api-client.ts).
export function getCentre(id: string, token?: string): Promise<Centre> {
  return apiFetch<Centre>(`/api/centres/${id}`, undefined, token);
}

export function listSessions(): Promise<SessionAcademique[]> {
  return apiFetch<SessionAcademique[]>("/api/sessions");
}

export function listSemaines(sessionId: string): Promise<SemaineSession[]> {
  return apiFetch<SemaineSession[]>(`/api/semaines?sessionId=${sessionId}`);
}

export function ajouterSemaine(
  sessionId: string,
  numero: number,
): Promise<SemaineSession> {
  return apiFetch<SemaineSession>("/api/semaines", {
    method: "POST",
    body: JSON.stringify({ sessionId, numero }),
  });
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
