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
