"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSalle,
  listSalles,
  reaffecterFormationSalle,
  renommerSalle,
  supprimerSalle,
} from "./client";

export function useSalles(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["salles", sessionId],
    queryFn: () => listSalles({ sessionId }),
    enabled: Boolean(sessionId),
  });
}

function useInvalidationSalles() {
  const queryClient = useQueryClient();
  // Préfixe : invalide toutes les variantes de queryKey ["salles", sessionId]
  return () => queryClient.invalidateQueries({ queryKey: ["salles"] });
}

export function useCreateSalle() {
  const invalider = useInvalidationSalles();
  return useMutation({
    mutationFn: createSalle,
    onSuccess: invalider,
  });
}

export function useRenommerSalle() {
  const invalider = useInvalidationSalles();
  return useMutation({
    mutationFn: ({ id, nom }: { id: string; nom: string }) =>
      renommerSalle(id, nom),
    onSuccess: invalider,
  });
}

export function useReaffecterFormationSalle() {
  const invalider = useInvalidationSalles();
  return useMutation({
    mutationFn: ({ id, formationId }: { id: string; formationId: string }) =>
      reaffecterFormationSalle(id, formationId),
    onSuccess: invalider,
  });
}

export function useSupprimerSalle() {
  const invalider = useInvalidationSalles();
  return useMutation({
    mutationFn: (id: string) => supprimerSalle(id),
    onSuccess: invalider,
  });
}
