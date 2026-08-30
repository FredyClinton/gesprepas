import { apiFetch } from "@/shared/lib/api-client";

import type { Matiere } from "../domain/types";

export function listMatieres(): Promise<Matiere[]> {
  return apiFetch<Matiere[]>("/api/matieres");
}
