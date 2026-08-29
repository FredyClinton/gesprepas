"use client";

import { useQuery } from "@tanstack/react-query";

import { listSalles } from "./client";

export function useSalles(sessionId: string | undefined) {
    return useQuery({
        queryKey: ["salles", sessionId],
        queryFn: () => listSalles({ sessionId }),
        enabled: Boolean(sessionId),
    });
}