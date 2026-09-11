"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  abonnerCentreFormation,
  desabonnerCentreFormation,
  listCentresAbonnesFormation,
  listFormationsAbonneesCentre,
  listAbonnementsSession,
} from "./client";

export function useAbonnementsSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["abonnements-session", sessionId],
    queryFn: () =>
      sessionId ? listAbonnementsSession(sessionId) : Promise.resolve([]),
    enabled: Boolean(sessionId),
  });
}

export function useFormationsAbonneesCentre(
  centreId: string | undefined,
  sessionId: string | undefined,
) {
  return useQuery({
    queryKey: ["formations-abonnees", centreId, sessionId],
    queryFn: () =>
      centreId && sessionId
        ? listFormationsAbonneesCentre(centreId, sessionId)
        : Promise.resolve([]),
    enabled: Boolean(centreId && sessionId),
  });
}

export function useCentresAbonnesFormation(
  formationId: string | undefined,
  sessionId: string | undefined,
) {
  return useQuery({
    queryKey: ["centres-abonnes", formationId, sessionId],
    queryFn: () =>
      formationId
        ? listCentresAbonnesFormation(formationId, sessionId)
        : Promise.resolve([]),
    enabled: Boolean(formationId),
  });
}

export function useAbonnerCentreFormation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      centreId,
      sessionId,
      formationId,
    }: {
      centreId: string;
      sessionId: string;
      formationId: string;
    }) => abonnerCentreFormation(centreId, sessionId, formationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["formations-abonnees", variables.centreId],
      });
      queryClient.invalidateQueries({
        queryKey: ["centres-abonnes", variables.formationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["centres"],
      });
    },
  });
}

export function useDesabonnerCentreFormation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      centreId,
      sessionId,
      formationId,
    }: {
      centreId: string;
      sessionId: string;
      formationId: string;
    }) => desabonnerCentreFormation(centreId, sessionId, formationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["formations-abonnees", variables.centreId],
      });
      queryClient.invalidateQueries({
        queryKey: ["centres-abonnes", variables.formationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["centres"],
      });
    },
  });
}

