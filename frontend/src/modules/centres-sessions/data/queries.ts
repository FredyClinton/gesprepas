"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fermerCentre,
  listCentres,
  listLocalisations,
  listSessions,
  listSemaines,
  ajouterSemaine,
  rejoindreSession,
  relocaliserCentre,
  rouvrirCentre,
  creerCentre,
  renommerCentre,
  supprimerCentre,
  creerSession,
  modifierSession,
  demarrerSession,
  cloturerSession,
  supprimerSession,
} from "./client";

export function useCentres() {
  return useQuery({
    queryKey: ["centres"],
    queryFn: listCentres,
  });
}

// Pas d'endpoint dédié "session active" côté backend - une seule session EN_COURS à
// la fois dans le système (confirmé), donc on récupère la liste complète et on filtre
// côté client plutôt que de deviner un endpoint qui n'existe pas.
export function useSessionActive() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
    select: (sessions) => sessions.find((s) => s.statut === "EN_COURS"),
  });
}

// Liste complète des sessions (pas seulement celle en cours) - utile pour résoudre
// les noms/dates des sessions qu'un centre a rejointes (Centre.sessionIds).
export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
  });
}

export function useSemaines(sessionId?: string) {
  return useQuery({
    queryKey: ["semaines", sessionId],
    queryFn: () => listSemaines(sessionId!),
    enabled: Boolean(sessionId),
    select: (semaines) => semaines.map((s) => s.numero).sort((a, b) => a - b),
  });
}

export function useAjouterSemaine(sessionId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (numero: number) => ajouterSemaine(sessionId!, numero),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semaines", sessionId] });
    },
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

export function useCreerCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      nom: string;
      adresseInitiale: string;
      villeInitiale: string;
    }) => creerCentre(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}

export function useRenommerCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nom }: { id: string; nom: string }) =>
      renommerCentre(id, { nom }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}

export function useSupprimerCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerCentre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
    },
  });
}

export function useCreerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      annee: string;
      dateDebut: string;
      dateFin: string;
    }) => creerSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useModifierSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        annee: string;
        dateDebut: string;
        dateFin: string;
      };
    }) => modifierSession(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useDemarrerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => demarrerSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCloturerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloturerSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useSupprimerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

