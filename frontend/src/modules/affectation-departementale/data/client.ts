import { apiFetch } from "@/shared/lib/api-client";

import type { AffectationDepartementale } from "../domain/types";

export function listRosterDepartement(
    departementId: string,
    sessionId: string,
): Promise<AffectationDepartementale[]> {
    const params = new URLSearchParams({ departementId, sessionId });
    return apiFetch<AffectationDepartementale[]>(
        `/api/affectations-departementales?${params}`,
    );
}