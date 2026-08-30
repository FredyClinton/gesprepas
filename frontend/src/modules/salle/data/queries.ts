"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createSalle, listSalles } from "./client";

export function useSalles(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["salles", sessionId],
    queryFn: () => listSalles({ sessionId }),
    enabled: Boolean(sessionId),
  });
}

export function useCreateSalle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSalle,
    onSuccess: () => {
      // Préfixe : invalide toutes les variantes de queryKey ["salles", sessionId]
      queryClient.invalidateQueries({ queryKey: ["salles"] });
    },
  });
}
