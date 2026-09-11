import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProgressions,
  creerProgression,
  mettreAJourContenuProgression,
  supprimerProgression,
} from "./client";
import type {
  CreerProgressionPayload,
  MettreAJourContenuPayload,
  Progression,
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

