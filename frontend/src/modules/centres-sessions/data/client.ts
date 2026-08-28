import { apiFetch } from "@/shared/lib/api-client";

import type { Centre, SessionAcademique } from "../domain/types";

export function listCentres(): Promise<Centre[]> {
    return apiFetch<Centre[]>("/api/centres");
}

export function getCentre(id: string): Promise<Centre> {
    return apiFetch<Centre>(`/api/centres/${id}`);
}

export function listSessions(): Promise<SessionAcademique[]> {
    return apiFetch<SessionAcademique[]>("/api/sessions");
}