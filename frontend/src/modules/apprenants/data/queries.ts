"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { CriteresRechercheApprenants } from "../domain/types";

import {
  creerApprenant,
  getApprenant,
  getSyntheseApprenants,
  rechercherApprenants,
  listApprenants,
  modifierApprenant,
  type ModifierApprenantInput,
} from "./client";

// Liste complète, non paginée : réservée aux écrans qui agrègent ou alimentent un
// sélecteur. Pour afficher une liste, utiliser useRechercheApprenants (paginée).
// Passer sessionId/centreId dès que l'écran ne s'intéresse qu'à ce périmètre : le
// filtre est alors fait par le backend au lieu de télécharger tous les apprenants.
export function useApprenants({
  sessionId,
  centreId,
  enabled = true,
}: { sessionId?: string; centreId?: string; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["apprenants", "liste", { sessionId, centreId }],
    queryFn: () => listApprenants({ sessionId, centreId }),
    enabled,
  });
}

// Liste paginée côté serveur (page 0-based). Clé sous ["apprenants"] : toute
// mutation qui invalide ["apprenants"] rafraîchit aussi cette liste.
export function useRechercheApprenants(
  criteres: CriteresRechercheApprenants,
  page: number,
  taille: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ["apprenants", "recherche", criteres, page, taille],
    queryFn: () => rechercherApprenants(criteres, page, taille),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSyntheseApprenants(sessionId?: string, centreId?: string) {
  return useQuery({
    queryKey: ["apprenants", "synthese", sessionId, centreId],
    queryFn: () => getSyntheseApprenants(sessionId, centreId),
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

export function useModifierApprenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ModifierApprenantInput;
    }) => modifierApprenant(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["apprenants"] });
      queryClient.invalidateQueries({ queryKey: ["apprenant", variables.id] });
    },
  });
}
