import { apiFetch } from "@/shared/lib/api-client";

import type { Formation } from "../domain/types";

export function listFormations(): Promise<Formation[]> {
  return apiFetch<Formation[]>("/api/formations");
}

export function createFormation(input: {
  nom: string;
  centreId: string;
  sessionId: string;
}): Promise<Formation> {
  return apiFetch<Formation>("/api/formations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function renommerFormation(id: string, nom: string): Promise<Formation> {
  return apiFetch<Formation>(`/api/formations/${id}/renommer`, {
    method: "PATCH",
    body: JSON.stringify({ nom }),
  });
}

export function supprimerFormation(id: string): Promise<void> {
  return apiFetch<void>(`/api/formations/${id}`, {
    method: "DELETE",
  });
}
