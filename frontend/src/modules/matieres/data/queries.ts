"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changerCouleurMatiere,
  creerMatiere,
  listMatieres,
  modifierMatiere,
  supprimerMatiere,
} from "./client";

export function useMatieres() {
  return useQuery({
    queryKey: ["matieres"],
    queryFn: listMatieres,
  });
}

export function useModifierMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { nom?: string; couleur?: string };
    }) => modifierMatiere(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["seances"] });
      queryClient.invalidateQueries({ queryKey: ["progressions"] });
    },
  });
}

export function useChangerCouleurMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, couleur }: { id: string; couleur: string }) =>
      changerCouleurMatiere(id, couleur),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["seances"] });
      queryClient.invalidateQueries({ queryKey: ["progressions"] });
    },
  });
}

export function useCreerMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nom: string; couleur?: string }) => creerMatiere(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["departements"] });
    },
  });
}

export function useSupprimerMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerMatiere(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["departements"] });
    },
  });
}

