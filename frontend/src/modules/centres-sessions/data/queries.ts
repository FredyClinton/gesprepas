"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fermerCentre,
  listCentres,
  listLocalisations,
  listSessions,
  rejoindreSession,
  relocaliserCentre,
  rouvrirCentre,
} from "./client";

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

// Liste complète des sessions (pas seulement celle en cours) — utile pour résoudre
// les noms/dates des sessions qu'un centre a rejointes (Centre.sessionIds).
export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
  });
}

export function useRelocaliserCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      adresse,
      ville,
    }: {
      id: string;
      adresse: string;
      ville: string;
    }) => relocaliserCentre(id, { adresse, ville }),
    onSuccess: (_centre, variables) => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
      queryClient.invalidateQueries({
        queryKey: ["localisations", variables.id],
      });
    },
  });
}

export function useLocalisations(centreId: string | undefined) {
  return useQuery({
    queryKey: ["localisations", centreId],
    queryFn: () => listLocalisations(centreId!),
    enabled: Boolean(centreId),
  });
}

export function useFermerCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fermerCentre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}

export function useRouvrirCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rouvrirCentre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}

export function useRejoindreSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId: string }) =>
      rejoindreSession(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}
