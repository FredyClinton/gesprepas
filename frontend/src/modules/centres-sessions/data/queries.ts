"use client";

import { useQuery } from "@tanstack/react-query";

import { listCentres, listSessions } from "./client";

export function useCentres() {
    return useQuery({
        queryKey: ["centres"],
        queryFn: listCentres,
    });
}

// Pas d'endpoint dédié "session active" côté backend — une seule session EN_COURS à
// la fois dans le système (confirmé), donc on récupère la liste complète et on filtre
// côté client plutôt que de deviner un endpoint qui n'existe pas.
export function useSessionActive() {
    return useQuery({
        queryKey: ["sessions"],
        queryFn: listSessions,
        select: (sessions) => sessions.find((s) => s.statut === "EN_COURS"),
    });
}