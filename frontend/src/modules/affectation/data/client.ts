import { apiFetch } from "@/shared/lib/api-client";

import type { Affectation } from "../domain/types";

type ListerAffectationsParams = {
    sessionId: string;
    semaine: number;
    centreId?: string;
    matiereId?: string;
};

export function listAffectations({
    sessionId,
    semaine,
    centreId,
    matiereId,
}: ListerAffectationsParams): Promise<Affectation[]> {
    const params = new URLSearchParams({ sessionId, semaine: String(semaine) });
    if (centreId) params.set("centreId", centreId);
    if (matiereId) params.set("matiereId", matiereId);
    return apiFetch<Affectation[]>(`/api/affectations?${params}`);
}

export function assignerEnseignant(
    id: string,
    enseignantId: string,
): Promise<Affectation> {
    return apiFetch<Affectation>(`/api/affectations/${id}/assigner-enseignant`, {
        method: "PATCH",
        body: JSON.stringify({ enseignantId }),
    });
}