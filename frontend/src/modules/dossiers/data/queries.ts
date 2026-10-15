"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ajouterConcoursAuDossier,
  ajouterPieceAuConcours,
  cloturerDossier,
  creerConcours,
  creerPieceRequise,
  desactiverPieceRequise,
  enregistrerPaiementDossier,
  getConcours,
  getDossier,
  getDossierParApprenant,
  getSoldeDossierConcours,
  listConcoursDuDossier,
  listConcoursSession,
  listDossiers,
  listPiecesDossierConcours,
  listPiecesDuConcours,
  listPiecesRequises,
  modifierObservationDossier,
  modifierPieceRequise,
  ouvrirDossier,
  reactiverPieceRequise,
  retirerPieceDuConcours,
  rouvrirDossier,
  signalerDossierComplet,
  validerPieceDossier,
} from "./client";
import type {
  AjouterConcoursAuDossierInput,
  CreerConcoursInput,
  CreerPieceRequiseInput,
  EnregistrerPaiementDossierInput,
  ModifierPieceRequiseInput,
} from "../domain/types";

export function useDossiers(sessionId?: string, centreId?: string) {
  return useQuery({
    queryKey: ["dossiers", { sessionId, centreId }],
    queryFn: () => listDossiers(sessionId, centreId),
  });
}

export function useDossier(dossierId: string | undefined) {
  return useQuery({
    queryKey: ["dossier", dossierId],
    queryFn: () => getDossier(dossierId!),
    enabled: Boolean(dossierId),
  });
}

export function useDossierParApprenant(apprenantId: string | undefined) {
  return useQuery({
    queryKey: ["dossier-apprenant", apprenantId],
    queryFn: () => getDossierParApprenant(apprenantId!),
    enabled: Boolean(apprenantId),
    retry: false,
  });
}

export function useConcoursDuDossier(dossierId: string | undefined) {
  return useQuery({
    queryKey: ["dossier-concours", dossierId],
    queryFn: () => listConcoursDuDossier(dossierId!),
    enabled: Boolean(dossierId),
  });
}

export function usePiecesDossierConcours(
  dossierConcoursId: string | undefined,
) {
  return useQuery({
    queryKey: ["pieces-dossier-concours", dossierConcoursId],
    queryFn: () => listPiecesDossierConcours(dossierConcoursId!),
    enabled: Boolean(dossierConcoursId),
  });
}

export function useSoldeDossierConcours(dossierConcoursId: string | undefined) {
  return useQuery({
    queryKey: ["solde-dossier-concours", dossierConcoursId],
    queryFn: () => getSoldeDossierConcours(dossierConcoursId!),
    enabled: Boolean(dossierConcoursId),
  });
}

export function useConcours(id: string | undefined) {
  return useQuery({
    queryKey: ["concours", id],
    queryFn: () => getConcours(id!),
    enabled: Boolean(id),
  });
}

export function useConcoursSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["concours-session", sessionId],
    queryFn: () => listConcoursSession(sessionId),
  });
}

export function usePiecesDuConcours(concoursId: string | undefined) {
  return useQuery({
    queryKey: ["pieces-concours", concoursId],
    queryFn: () => listPiecesDuConcours(concoursId!),
    enabled: Boolean(concoursId),
  });
}

export function usePiecesRequises() {
  return useQuery({
    queryKey: ["pieces-requises"],
    queryFn: listPiecesRequises,
  });
}

// Mutations
export function useOuvrirDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      apprenantId,
      sessionId,
    }: {
      apprenantId: string;
      sessionId: string;
    }) => ouvrirDossier(apprenantId, sessionId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({
        queryKey: ["dossier-apprenant", variables.apprenantId],
      });
    },
  });
}

export function useAjouterConcoursAuDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dossierId,
      input,
    }: {
      dossierId: string;
      input: AjouterConcoursAuDossierInput;
    }) => ajouterConcoursAuDossier(dossierId, input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["dossier", variables.dossierId] });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({
        queryKey: ["dossier-concours", variables.dossierId],
      });
      qc.invalidateQueries({ queryKey: ["dossier-apprenant"] });
    },
  });
}

export function useValiderPieceDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pieceDossierId: string) => validerPieceDossier(pieceDossierId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pieces-dossier-concours"] });
      qc.invalidateQueries({ queryKey: ["dossier"] });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({ queryKey: ["dossier-apprenant"] });
    },
  });
}

export function useSignalerDossierComplet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dossierId: string) => signalerDossierComplet(dossierId),
    onSuccess: (updatedDossier, dossierId) => {
      qc.setQueryData(["dossier", dossierId], updatedDossier);
      qc.invalidateQueries({ queryKey: ["dossier", dossierId] });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({ queryKey: ["dossier-apprenant"] });
    },
  });
}

export function useCloturerDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dossierId: string) => cloturerDossier(dossierId),
    onSuccess: (updatedDossier, dossierId) => {
      qc.setQueryData(["dossier", dossierId], updatedDossier);
      qc.invalidateQueries({ queryKey: ["dossier", dossierId] });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({ queryKey: ["dossier-apprenant"] });
    },
  });
}

export function useRouvrirDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dossierId: string) => rouvrirDossier(dossierId),
    onSuccess: (updatedDossier, dossierId) => {
      qc.setQueryData(["dossier", dossierId], updatedDossier);
      qc.invalidateQueries({ queryKey: ["dossier", dossierId] });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({ queryKey: ["dossier-apprenant"] });
    },
  });
}

export function useModifierObservationDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dossierId,
      observation,
    }: {
      dossierId: string;
      observation: string;
    }) => modifierObservationDossier(dossierId, observation),
    onSuccess: (updatedDossier, variables) => {
      qc.setQueryData(["dossier", variables.dossierId], updatedDossier);
      qc.invalidateQueries({ queryKey: ["dossier", variables.dossierId] });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({ queryKey: ["dossier-apprenant"] });
    },
  });
}

export function useEnregistrerPaiementDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dossierConcoursId,
      input,
    }: {
      dossierConcoursId: string;
      input: EnregistrerPaiementDossierInput;
    }) => enregistrerPaiementDossier(dossierConcoursId, input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["solde-dossier-concours", variables.dossierConcoursId],
      });
      qc.invalidateQueries({ queryKey: ["dossiers"] });
      qc.invalidateQueries({ queryKey: ["finances"] });
    },
  });
}

export function useCreerConcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreerConcoursInput) => creerConcours(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concours-session"] });
      qc.invalidateQueries({ queryKey: ["concours"] });
    },
  });
}

export function useAjouterPieceAuConcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      concoursId,
      pieceRequiseId,
    }: {
      concoursId: string;
      pieceRequiseId: string;
    }) => ajouterPieceAuConcours(concoursId, pieceRequiseId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["pieces-concours", variables.concoursId],
      });
    },
  });
}

export function useRetirerPieceDuConcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      concoursId,
      pieceRequiseId,
    }: {
      concoursId: string;
      pieceRequiseId: string;
    }) => retirerPieceDuConcours(concoursId, pieceRequiseId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["pieces-concours", variables.concoursId],
      });
    },
  });
}

export function useCreerPieceRequise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreerPieceRequiseInput) => creerPieceRequise(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pieces-requises"] });
    },
  });
}

export function useModifierPieceRequise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ModifierPieceRequiseInput;
    }) => modifierPieceRequise(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pieces-requises"] });
    },
  });
}

export function useDesactiverPieceRequise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desactiverPieceRequise(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pieces-requises"] });
    },
  });
}

export function useReactiverPieceRequise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactiverPieceRequise(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pieces-requises"] });
    },
  });
}
