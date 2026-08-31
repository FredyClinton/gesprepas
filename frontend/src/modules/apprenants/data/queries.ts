"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creerApprenant, getApprenant, listApprenants } from "./client";

// Pas d'endpoint de pagination/comptage côté backend : on récupère la liste complète
// et "Total apprenants" se calcule côté client (items.length). À revoir si le volume
// rend ça coûteux un jour — pas un problème au stade actuel.
export function useApprenants() {
  return useQuery({
    queryKey: ["apprenants"],
    queryFn: listApprenants,
  });
}

export function useApprenant(id: string | undefined) {
  return useQuery({
    queryKey: ["apprenant", id],
    queryFn: () => getApprenant(id!),
    enabled: Boolean(id),
  });
}

export function useCreerApprenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerApprenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprenants"] });
    },
  });
}
