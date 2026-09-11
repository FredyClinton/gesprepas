import { apiFetch } from "@/shared/lib/api-client";
import type { Formation } from "@/modules/academique";
import type { Abonnement } from "../domain/types";

export function abonnerCentreFormation(
  centreId: string,
  sessionId: string,
  formationId: string,
): Promise<Abonnement> {
  return apiFetch<Abonnement>(
    `/api/centres/${centreId}/sessions/${sessionId}/formations/${formationId}/abonner`,
    {
      method: "POST",
    },
  );
}

export function desabonnerCentreFormation(
  centreId: string,
  sessionId: string,
  formationId: string,
): Promise<void> {
  return apiFetch<void>(
    `/api/centres/${centreId}/sessions/${sessionId}/formations/${formationId}/abonner`,
    {
      method: "DELETE",
    },
  );
}

export function listFormationsAbonneesCentre(
  centreId: string,
  sessionId: string,
): Promise<Formation[]> {
  return apiFetch<Formation[]>(
    `/api/centres/${centreId}/sessions/${sessionId}/formations`,
  );
}

export function listCentresAbonnesFormation(
  formationId: string,
  sessionId?: string,
): Promise<Abonnement[]> {
  const url = sessionId
    ? `/api/formations/${formationId}/centres?sessionId=${encodeURIComponent(sessionId)}`
    : `/api/formations/${formationId}/centres`;
  return apiFetch<Abonnement[]>(url);
}

export function listAbonnementsSession(
  sessionId: string,
): Promise<Abonnement[]> {
  return apiFetch<Abonnement[]>(`/api/sessions/${sessionId}/abonnements`);
}

