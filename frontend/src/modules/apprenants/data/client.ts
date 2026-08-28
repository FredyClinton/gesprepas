import { apiFetch } from "@/shared/lib/api-client";

import type { Apprenant } from "../domain/types";

export function listApprenants(): Promise<Apprenant[]> {
    return apiFetch<Apprenant[]>("/api/apprenants");
}