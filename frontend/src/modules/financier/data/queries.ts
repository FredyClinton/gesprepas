"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBilanDuJour,
  getBilanConsolideDuJour,
  getRepartitionFormations,
  listMotifs,
  listVersementsApprenant,
  saisirEntree,
  saisirSortie,
  soumettreBilanCaissier,
  validerBilanChefCentre,
  validerBilanControleur,
  listMouvementsFinanciers,
  modifierEntree,
  supprimerEntree,
  ajusterActiviteBilan,
  type AjusterActiviteBilanInput,
  type ModifierEntreeInput,
  type SaisirSortieInput,
  type SoumettreBilanCaissierInput,
  type ValiderBilanChefCentreInput,
} from "./client";
import type { TypeMotif } from "../domain/types";

export function useBilanDuJour(
  centreId: string | undefined,
  sessionId: string | undefined,
  dateSelectionnee?: string,
) {
  const date = dateSelectionnee || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return useQuery({
    queryKey: ["bilan-du-jour", centreId, sessionId, date],
    queryFn: () => getBilanDuJour(centreId!, sessionId!, date),
    enabled: Boolean(centreId && sessionId),
  });
}

export function useBilanConsolideDuJour(
  sessionId: string | undefined,
  dateSelectionnee?: string,
) {
  const date = dateSelectionnee || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return useQuery({
    queryKey: ["bilan-consolide", sessionId, date],
    queryFn: () => getBilanConsolideDuJour(sessionId!, date),
    enabled: Boolean(sessionId),
  });
}

export function useRepartitionFormations(bilanId: string | undefined) {
  return useQuery({
    queryKey: ["repartition-formations", bilanId],
    queryFn: () => getRepartitionFormations(bilanId!),
    enabled: Boolean(bilanId),
  });
}

export function useVersementsApprenant(apprenantId: string | undefined) {
  return useQuery({
    queryKey: ["versements-apprenant", apprenantId],
    queryFn: () => listVersementsApprenant(apprenantId!),
    enabled: Boolean(apprenantId),
  });
}

export function useMotifs(type?: TypeMotif) {
  return useQuery({
    queryKey: ["motifs", type],
    queryFn: () => listMotifs(type),
  });
}

export function useSaisirEntree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saisirEntree,
    onSuccess: (_, variables) => {
      if (variables.apprenantId) {
        queryClient.invalidateQueries({
          queryKey: ["versements-apprenant", variables.apprenantId],
        });
        queryClient.invalidateQueries({
          queryKey: ["apprenants"],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
      queryClient.invalidateQueries({ queryKey: ["livres"] });
    },
  });
}

export function useSaisirSortie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaisirSortieInput) => saisirSortie(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
    },
  });
}

export function useModifierEntree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ModifierEntreeInput }) =>
      modifierEntree(id, input),
    onSuccess: (_, variables) => {
      if (variables.input.apprenantId) {
        queryClient.invalidateQueries({
          queryKey: ["versements-apprenant", variables.input.apprenantId],
        });
        queryClient.invalidateQueries({
          queryKey: ["apprenants"],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
    },
  });
}

export function useSupprimerEntree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerEntree(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versements-apprenant"] });
      queryClient.invalidateQueries({ queryKey: ["apprenants"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
      queryClient.invalidateQueries({ queryKey: ["livres"] });
      queryClient.invalidateQueries({ queryKey: ["ventes-livres"] });
    },
  });
}

export function useSoumettreBilanCaissier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SoumettreBilanCaissierInput) => soumettreBilanCaissier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
    },
  });
}

export function useValiderBilanChefCentre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ValiderBilanChefCentreInput) => validerBilanChefCentre(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
    },
  });
}

export function useValiderBilanControleur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bilanId, validateurUtilisateurId }: { bilanId: string; validateurUtilisateurId: string }) =>
      validerBilanControleur(bilanId, validateurUtilisateurId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
    },
  });
}

export function useAjusterActiviteBilan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AjusterActiviteBilanInput) => ajusterActiviteBilan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-consolide"] });
    },
  });
}

export function useMouvementsFinanciers(
  sessionId: string | undefined,
  centreId?: string | undefined,
) {
  return useQuery({
    queryKey: ["mouvements-financiers", sessionId, centreId],
    queryFn: () => (sessionId ? listMouvementsFinanciers(sessionId, centreId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
  });
}
