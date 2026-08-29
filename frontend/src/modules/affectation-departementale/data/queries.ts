"use client";

import { useQuery } from "@tanstack/react-query";

import { listRosterDepartement } from "./client";

export function useRosterDepartement(
    departementId: string | undefined,
    sessionId: string | undefined,
) {
    return useQuery({
        queryKey: ["roster-departement", departementId, sessionId],
        queryFn: () => listRosterDepartement(departementId!, sessionId!),
        enabled: Boolean(departementId && sessionId),
    });
}