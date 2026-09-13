"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBilanDuJour,
  getRepartitionFormations,
  listMotifs,
  listVersementsApprenant,
  saisirEntree,
  listMouvementsFinanciers,
} from "./client";
import type { TypeMotif } from "../domain/types";

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

export function useVersementsApprenant(apprenantId: string | undefined) {
  return useQuery({
    queryKey: ["versements-apprenant", apprenantId],
    queryFn: () => listVersementsApprenant(apprenantId!),
    enabled: Boolean(apprenantId),
  });
}

export function useMotifs(type?: TypeMotif) {
  return useQuery({
    queryKey: ["motifs", type],
    queryFn: () => listMotifs(type),
  });
}

export function useSaisirEntree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saisirEntree,
    onSuccess: (_, variables) => {
      if (variables.apprenantId) {
        queryClient.invalidateQueries({
          queryKey: ["versements-apprenant", variables.apprenantId],
        });
        queryClient.invalidateQueries({
          queryKey: ["apprenants"],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
    },
  });
}

export function useMouvementsFinanciers(
  sessionId: string | undefined,
  centreId?: string | undefined,
) {
  return useQuery({
    queryKey: ["mouvements-financiers", sessionId, centreId],
    queryFn: () => (sessionId ? listMouvementsFinanciers(sessionId, centreId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
  });
}
