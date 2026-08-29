import { apiFetch } from "@/shared/lib/api-client";

import type { Enseignant } from "../domain/types";

export function listEnseignants(): Promise<Enseignant[]> {
    return apiFetch<Enseignant[]>("/api/enseignants");
}