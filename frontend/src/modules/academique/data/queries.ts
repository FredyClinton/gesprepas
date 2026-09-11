"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  associerMatiereFormation,
  createFormation,
  dissocierMatiereFormation,
  getFormation,
  listFormations,
  listMatieresFormation,
  renommerFormation,
  supprimerFormation,
} from "./client";

export function useFormations() {
  return useQuery({
    queryKey: ["formations"],
    queryFn: listFormations,
  });
}

export function useFormation(formationId: string | undefined) {
  return useQuery({
    queryKey: ["formations", formationId],
    queryFn: () => (formationId ? getFormation(formationId) : Promise.reject("ID manquant")),
    enabled: Boolean(formationId),
  });
}

export function useMatieresFormation(formationId: string | undefined) {
  return useQuery({
    queryKey: ["formations", formationId, "matieres"],
    queryFn: () => (formationId ? listMatieresFormation(formationId) : Promise.resolve([])),
    enabled: Boolean(formationId),
  });
}

function useInvalidationFormations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["formations"] });
  };
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

export function useAssocierMatiereFormation() {
  const invalider = useInvalidationFormations();
  return useMutation({
    mutationFn: ({ id, matiereId }: { id: string; matiereId: string }) =>
      associerMatiereFormation(id, matiereId),
    onSuccess: invalider,
  });
}

export function useDissocierMatiereFormation() {
  const invalider = useInvalidationFormations();
  return useMutation({
    mutationFn: ({ id, matiereId }: { id: string; matiereId: string }) =>
      dissocierMatiereFormation(id, matiereId),
    onSuccess: invalider,
  });
}

