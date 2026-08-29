"use client";

import { useQuery } from "@tanstack/react-query";

import { getBilanDuJour, getRepartitionFormations } from "./client";


export function useBilanDuJour(
    centreId: string | undefined,
    sessionId: string | undefined,
) {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, format ISO attendu par le backend
    return useQuery({
        queryKey: ["bilan-du-jour", centreId, sessionId, date],
        queryFn: () => getBilanDuJour(centreId!, sessionId!, date),
        enabled: Boolean(centreId && sessionId),
    });
}

export function useRepartitionFormations(bilanId: string | undefined) {
    return useQuery({
        queryKey: ["repartition-formations", bilanId],
        queryFn: () => getRepartitionFormations(bilanId!),
        enabled: Boolean(bilanId),
    });
}