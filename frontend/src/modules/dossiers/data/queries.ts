"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getConcours,
  getDossierParApprenant,
  getSoldeDossierConcours,
  listConcoursDuDossier,
  listPiecesDossierConcours,
  listPiecesRequises,
} from "./client";

// 404 si l'apprenant n'a pas encore de dossier ouvert -- traité comme un état
// normal ("Aucun dossier"), pas une erreur à afficher, voir le composant qui
// consomme ce hook.
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

export function usePiecesRequises() {
  return useQuery({
    queryKey: ["pieces-requises"],
    queryFn: listPiecesRequises,
  });
}
