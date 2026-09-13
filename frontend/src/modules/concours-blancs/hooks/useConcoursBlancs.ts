import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listerConcoursBlancs,
  recupererConcoursBlanc,
  creerConcoursBlanc,
  modifierConcoursBlanc,
  supprimerConcoursBlanc,
  definirContenuEpreuve,
  changerStatutConcoursBlanc,
  recupererResultatsConcoursBlanc,
  enregistrerNotesConcoursBlanc,
  recupererBordereauConcoursBlanc,
  verrouillerSaisieCentres,
  compilerResultatsConcoursBlanc,
} from "../data/concours-blanc.api";
import type {
  CreerConcoursBlancPayload,
  ModifierConcoursBlancPayload,
  DefinirContenuEpreuvePayload,
  EnregistrerNotesPayload,
  StatutConcoursBlanc,
} from "../types/concours-blanc.types";

export const CONCOURS_BLANCS_QUERY_KEY = "concours-blancs";

export function useConcoursBlancs(sessionId?: string, role?: string, userCentreId?: string) {
  return useQuery({
    queryKey: [CONCOURS_BLANCS_QUERY_KEY, sessionId, role, userCentreId],
    queryFn: () => (sessionId ? listerConcoursBlancs(sessionId, role, userCentreId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
  });
}

export function useConcoursBlanc(id?: string, role?: string, userCentreId?: string) {
  return useQuery({
    queryKey: [CONCOURS_BLANCS_QUERY_KEY, id, role, userCentreId],
    queryFn: () => (id ? recupererConcoursBlanc(id, role, userCentreId) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useResultatsConcoursBlanc(
  id?: string,
  centreId?: string,
  formationId?: string,
  role?: string,
  userCentreId?: string,
) {
  return useQuery({
    queryKey: [CONCOURS_BLANCS_QUERY_KEY, "resultats", id, centreId, formationId, role, userCentreId],
    queryFn: () =>
      id ? recupererResultatsConcoursBlanc(id, centreId, formationId, role, userCentreId) : Promise.resolve([]),
    enabled: Boolean(id),
  });
}

export function useBordereauConcoursBlanc(
  id?: string,
  formationId?: string,
  centreId?: string,
  role?: string,
  userCentreId?: string,
) {
  return useQuery({
    queryKey: [CONCOURS_BLANCS_QUERY_KEY, "bordereau", id, formationId, centreId, role, userCentreId],
    queryFn: () =>
      id && formationId
        ? recupererBordereauConcoursBlanc(id, formationId, centreId, role, userCentreId)
        : Promise.resolve(null),
    enabled: Boolean(id && formationId),
  });
}

export function useCreerConcoursBlanc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreerConcoursBlancPayload) => creerConcoursBlanc(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}

export function useModifierConcoursBlanc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModifierConcoursBlancPayload }) =>
      modifierConcoursBlanc(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY, variables.id] });
    },
  });
}

export function useSupprimerConcoursBlanc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerConcoursBlanc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}

export function useDefinirContenuEpreuve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      concoursBlancId,
      epreuveId,
      payload,
      role,
      departementId,
    }: {
      concoursBlancId: string;
      epreuveId: string;
      payload: DefinirContenuEpreuvePayload;
      role?: string;
      departementId?: string;
    }) => definirContenuEpreuve(concoursBlancId, epreuveId, payload, role, departementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}

export function useChangerStatutConcoursBlanc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutConcoursBlanc }) =>
      changerStatutConcoursBlanc(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}

export function useEnregistrerNotesConcoursBlanc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      role,
      userCentreId,
    }: {
      id: string;
      payload: EnregistrerNotesPayload;
      role?: string;
      userCentreId?: string;
    }) => enregistrerNotesConcoursBlanc(id, payload, role, userCentreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}

export function useVerrouillerSaisieCentres() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      bloquer,
      role,
    }: {
      id: string;
      bloquer: boolean;
      role?: string;
    }) => verrouillerSaisieCentres(id, bloquer, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}

export function useCompilerResultatsConcoursBlanc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string;
      role?: string;
    }) => compilerResultatsConcoursBlanc(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONCOURS_BLANCS_QUERY_KEY] });
    },
  });
}


