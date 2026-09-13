import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listLivres,
  creerLivre,
  modifierLivre,
  supprimerLivre,
  listerVentesLivres,
  getStatsVentesLivres,
  enregistrerVenteLivre,
} from "./client";
import type { CreerLivreDTO, ModifierLivreDTO } from "../domain/types";

export const LIVRES_KEYS = {
  all: ["livres"] as const,
  list: (actifsSeulement?: boolean) => [...LIVRES_KEYS.all, "list", { actifsSeulement }] as const,
};

export function useLivres(actifsSeulement = false) {
  return useQuery({
    queryKey: LIVRES_KEYS.list(actifsSeulement),
    queryFn: () => listLivres(actifsSeulement),
  });
}

export function useCreerLivre(role?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreerLivreDTO) => creerLivre(payload, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVRES_KEYS.all });
    },
  });
}

export function useModifierLivre(role?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModifierLivreDTO }) =>
      modifierLivre(id, payload, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVRES_KEYS.all });
    },
  });
}

export function useSupprimerLivre(role?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerLivre(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVRES_KEYS.all });
    },
  });
}

export const VENTES_LIVRES_KEYS = {
  all: ["ventes-livres"] as const,
  list: (params: Record<string, unknown>) => [...VENTES_LIVRES_KEYS.all, "list", params] as const,
  stats: (params: Record<string, unknown>) => [...VENTES_LIVRES_KEYS.all, "stats", params] as const,
};

export function useVentesLivres(
  params: {
    sessionId: string;
    centreId?: string;
    livreId?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  role?: string,
  userCentreId?: string,
) {
  return useQuery({
    queryKey: VENTES_LIVRES_KEYS.list({ ...params, role, userCentreId }),
    queryFn: () => listerVentesLivres(params, role, userCentreId),
    enabled: Boolean(params.sessionId),
  });
}

export function useStatsVentesLivres(
  params: {
    sessionId: string;
    centreId?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  role?: string,
  userCentreId?: string,
) {
  return useQuery({
    queryKey: VENTES_LIVRES_KEYS.stats({ ...params, role, userCentreId }),
    queryFn: () => getStatsVentesLivres(params, role, userCentreId),
    enabled: Boolean(params.sessionId),
  });
}

export function useEnregistrerVenteLivre(role?: string, userCentreId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: import("../domain/types").EnregistrerVenteLivreDTO) =>
      enregistrerVenteLivre(payload, role, userCentreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVRES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: VENTES_LIVRES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
      queryClient.invalidateQueries({ queryKey: ["bilan-journalier"] });
    },
  });
}


