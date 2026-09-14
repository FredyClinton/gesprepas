import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProgressions,
  creerProgression,
  mettreAJourContenuProgression,
  supprimerProgression,
  listQuotas,
  definirQuota,
} from "./client";
import type {
  CreerProgressionPayload,
  MettreAJourContenuPayload,
  Progression,
  QuotaHebdomadaire,
  DefinirQuotaPayload,
} from "../domain/types";

export function useProgressions() {
  return useQuery<Progression[]>({
    queryKey: ["progressions"],
    queryFn: listProgressions,
  });
}

export function useCreerProgression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreerProgressionPayload) => creerProgression(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressions"] });
    },
  });
}

export function useMettreAJourContenuProgression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: MettreAJourContenuPayload;
    }) => mettreAJourContenuProgression(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressions"] });
    },
  });
}

export function useSupprimerProgression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerProgression(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressions"] });
    },
  });
}

// Clé de requête partagée entre useQuotasHebdomadaires (lecture) et useQueries
// (ExporterProgressionModal, qui doit lire les quotas de plusieurs formations à
// la fois - useQueries ne peut pas appeler un hook dans une boucle, donc il
// reconstruit cette même clé/fonction directement plutôt que d'appeler le hook).
export function quotaHebdomadaireQueryOptions(
  formationId: string,
  sessionId: string,
) {
  return {
    queryKey: ["quotas-hebdomadaires", formationId, sessionId] as const,
    queryFn: () => listQuotas(formationId, sessionId),
  };
}

export function useQuotasHebdomadaires(
  formationId?: string,
  sessionId?: string,
) {
  return useQuery<QuotaHebdomadaire[]>({
    ...quotaHebdomadaireQueryOptions(formationId ?? "", sessionId ?? ""),
    enabled: Boolean(formationId && sessionId),
  });
}

export function useDefinirQuota(formationId?: string, sessionId?: string) {
  const queryClient = useQueryClient();
  const queryKey = quotaHebdomadaireQueryOptions(
    formationId ?? "",
    sessionId ?? "",
  ).queryKey;

  return useMutation({
    mutationFn: (payload: DefinirQuotaPayload) => definirQuota(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const precedent =
        queryClient.getQueryData<QuotaHebdomadaire[]>(queryKey) ?? [];
      const sansCelui = precedent.filter(
        (q) =>
          !(q.semaine === payload.semaine && q.matiereId === payload.matiereId),
      );
      queryClient.setQueryData<QuotaHebdomadaire[]>(queryKey, [
        ...sansCelui,
        { id: "optimiste", ...payload },
      ]);
      return { precedent };
    },
    onError: (_err, _payload, contexte) => {
      if (contexte) queryClient.setQueryData(queryKey, contexte.precedent);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCreerProgressionsLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payloads: CreerProgressionPayload[]) => {
      const results: Progression[] = [];
      for (const p of payloads) {
        const res = await creerProgression(p);
        results.push(res);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressions"] });
    },
  });
}
