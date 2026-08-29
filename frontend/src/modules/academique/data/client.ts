import { apiFetch } from "@/shared/lib/api-client";

import type { Formation } from "../domain/types";

export function listFormations(): Promise<Formation[]> {
    return apiFetch<Formation[]>("/api/formations");
}