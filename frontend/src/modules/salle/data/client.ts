import { apiFetch } from "@/shared/lib/api-client";

import type { Salle } from "../domain/types";

export function listSalles(params?: {
    centreId?: string;
    sessionId?: string;
}): Promise<Salle[]> {
    const query = new URLSearchParams();
    if (params?.centreId) query.set("centreId", params.centreId);
    if (params?.sessionId) query.set("sessionId", params.sessionId);
    const suffix = query.toString() ? `?${query}` : "";
    return apiFetch<Salle[]>(`/api/salles${suffix}`);
}