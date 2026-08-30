"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getGelEnseignants, modifierGelEnseignants } from "./client";

// L'état du gel conditionne en direct les permissions du Chef de Département dans
// l'UI — staleTime court pour qu'un changement fait par le DA se propage vite, sans
// pour autant repartir sur du polling agressif.
export function useGelEnseignants() {
  return useQuery({
    queryKey: ["gel-enseignants"],
    queryFn: getGelEnseignants,
    staleTime: 10_000,
  });
}

export function useModifierGelEnseignants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: modifierGelEnseignants,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gel-enseignants"] });
    },
  });
}
