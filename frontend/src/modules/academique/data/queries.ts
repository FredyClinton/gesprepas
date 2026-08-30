"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFormation,
  listFormations,
  renommerFormation,
  supprimerFormation,
} from "./client";

export function useFormations() {
  return useQuery({
    queryKey: ["formations"],
    queryFn: listFormations,
  });
}

function useInvalidationFormations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["formations"] });
}

export function useCreateFormation() {
  const invalider = useInvalidationFormations();
  return useMutation({
    mutationFn: createFormation,
    onSuccess: invalider,
  });
}

export function useRenommerFormation() {
  const invalider = useInvalidationFormations();
  return useMutation({
    mutationFn: ({ id, nom }: { id: string; nom: string }) =>
      renommerFormation(id, nom),
    onSuccess: invalider,
  });
}

export function useSupprimerFormation() {
  const invalider = useInvalidationFormations();
  return useMutation({
    mutationFn: (id: string) => supprimerFormation(id),
    onSuccess: invalider,
  });
}
