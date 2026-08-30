"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  creerEnseignant,
  getEnseignant,
  listEnseignants,
  modifierCoutParSeance,
  reactiverEnseignant,
  renommerEnseignant,
  supprimerEnseignant,
  suspendreEnseignant,
} from "./client";

export function useEnseignants() {
  return useQuery({
    queryKey: ["enseignants"],
    queryFn: listEnseignants,
  });
}

export function useEnseignant(id: string | undefined) {
  return useQuery({
    queryKey: ["enseignant", id],
    queryFn: () => getEnseignant(id!),
    enabled: Boolean(id),
  });
}

function useInvalidationEnseignants() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["enseignants"] });
    queryClient.invalidateQueries({ queryKey: ["enseignant"] });
  };
}

export function useCreerEnseignant() {
  const invalider = useInvalidationEnseignants();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (input: Parameters<typeof creerEnseignant>[0]) =>
      creerEnseignant(input, session?.user.role),
    onSuccess: invalider,
  });
}

export function useRenommerEnseignant() {
  const invalider = useInvalidationEnseignants();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({
      id,
      nom,
      prenom,
    }: {
      id: string;
      nom: string;
      prenom: string;
    }) => renommerEnseignant(id, nom, prenom, session?.user.role),
    onSuccess: invalider,
  });
}

export function useModifierCoutParSeance() {
  const invalider = useInvalidationEnseignants();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({
      id,
      coutParSeance,
    }: {
      id: string;
      coutParSeance: number;
    }) => modifierCoutParSeance(id, coutParSeance, session?.user.role),
    onSuccess: invalider,
  });
}

export function useSuspendreEnseignant() {
  const invalider = useInvalidationEnseignants();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (id: string) => suspendreEnseignant(id, session?.user.role),
    onSuccess: invalider,
  });
}

export function useReactiverEnseignant() {
  const invalider = useInvalidationEnseignants();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (id: string) => reactiverEnseignant(id, session?.user.role),
    onSuccess: invalider,
  });
}

export function useSupprimerEnseignant() {
  const invalider = useInvalidationEnseignants();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (id: string) => supprimerEnseignant(id, session?.user.role),
    onSuccess: invalider,
  });
}
