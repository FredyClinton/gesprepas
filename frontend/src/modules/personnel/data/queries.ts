"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  creerEnseignant,
  definirSalairePersonnel,
  getAncienneteEnseignant,
  getEnseignant,
  getHistoriqueSalairePersonnel,
  getPersonnel,
  listEnseignants,
  listPersonnel,
  listAccesPersonnel,
  getAccesPersonnel,
  gererAccesPersonnel,
  modifierCoutParSeance,
  reactiverEnseignant,
  renommerEnseignant,
  supprimerEnseignant,
  suspendreEnseignant,
  creerPersonnel,
  modifierPersonnel,
  supprimerPersonnel,
  creerComptePourPersonnel,
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

export function useAncienneteEnseignant(id: string | undefined) {
  return useQuery({
    queryKey: ["enseignant-anciennete", id],
    queryFn: () => getAncienneteEnseignant(id!),
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
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (id: string) => suspendreEnseignant(id, session?.user.role),
    // La suspension désassigne aussi côté backend les créneaux ASSIGNEE de cet
    // enseignant (voir AffectationService.suspendreEnseignant) - sans invalider
    // ces requêtes, le planning et la fiche enseignant restent affichés comme
    // avant la suspension jusqu'au prochain rechargement manuel.
    onSuccess: () => {
      invalider();
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
      queryClient.invalidateQueries({ queryKey: ["affectations-enseignant"] });
    },
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

export function usePersonnel(id: string | undefined) {
  return useQuery({
    queryKey: ["personnel", id],
    queryFn: () => getPersonnel(id!),
    enabled: Boolean(id),
  });
}

export function usePersonnelList() {
  return useQuery({
    queryKey: ["personnel-list"],
    queryFn: listPersonnel,
  });
}

export function useHistoriqueSalairePersonnel(
  personnelId: string | undefined,
  sessionId: string | undefined,
) {
  return useQuery({
    queryKey: ["personnel-salaire-historique", personnelId, sessionId],
    queryFn: () => getHistoriqueSalairePersonnel(personnelId!, sessionId!),
    enabled: Boolean(personnelId && sessionId),
  });
}

export function useDefinirSalairePersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      personnelId,
      sessionId,
      salaireReference,
      dateDebutEffet,
    }: {
      personnelId: string;
      sessionId: string;
      salaireReference: number;
      dateDebutEffet?: string;
    }) =>
      definirSalairePersonnel(
        personnelId,
        sessionId,
        salaireReference,
        dateDebutEffet,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "personnel-salaire-historique",
          variables.personnelId,
          variables.sessionId,
        ],
      });
    },
  });
}

export function useAccesPersonnelList(
  sessionId: string | undefined,
  phaseId?: string | null,
) {
  return useQuery({
    queryKey: ["acces-personnel-list", sessionId, phaseId],
    queryFn: () => listAccesPersonnel(sessionId!, phaseId),
    enabled: Boolean(sessionId),
  });
}

export function useAccesPersonnelMembre(
  personnelId: string | undefined,
  sessionId?: string,
) {
  return useQuery({
    queryKey: ["acces-personnel", personnelId, sessionId],
    queryFn: () => getAccesPersonnel(personnelId!, sessionId),
    enabled: Boolean(personnelId),
  });
}

export function useGererAccesPersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      personnelId,
      input,
    }: {
      personnelId: string;
      input: import("../domain/types").GererAccesInput;
    }) => gererAccesPersonnel(personnelId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["acces-personnel-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["acces-personnel", variables.personnelId],
      });
    },
  });
}

export function useCreerPersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: import("../domain/types").CreerPersonnelInput) => creerPersonnel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-list"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });
}

export function useModifierPersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: import("../domain/types").ModifierPersonnelInput;
    }) => modifierPersonnel(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["personnel-list"] });
      queryClient.invalidateQueries({ queryKey: ["personnel", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });
}

export function useSupprimerPersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerPersonnel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-list"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["acces-personnel-list"] });
    },
  });
}

export function useCreerComptePourPersonnel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: import("../domain/types").CreerComptePersonnelInput;
    }) => creerComptePourPersonnel(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["personnel-list"] });
      queryClient.invalidateQueries({ queryKey: ["personnel", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["acces-personnel-list"] });
    },
  });
}

