"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignerEnseignant,
  annulerCreneau,
  creerCreneau,
  listAffectations,
  modifierMatiere,
  supprimerCreneau,
  listAffectationsParEnseignant,
} from "./client";

type UseAffectationsParams = {
  sessionId: string | undefined;
  semaine: number;
  matiereId: string | undefined;
  centreId?: string;
};

export function useAffectations({
  sessionId,
  semaine,
  matiereId,
  centreId,
}: UseAffectationsParams) {
  return useQuery({
    queryKey: ["affectations", sessionId, semaine, matiereId, centreId],
    queryFn: () =>
      listAffectations({ sessionId: sessionId!, semaine, matiereId, centreId }),
    // matiereId est optionnel : Directeur Académique voit toutes les matières
    // (pas de filtre), Chef de Département ne voit que la sienne (filtre appliqué
    // par l'appelant). Seul sessionId est réellement requis pour interroger l'API.
    enabled: Boolean(sessionId),
  });
}

// Pas de mise à jour optimiste : le backend valide la disponibilité de l'enseignant
// au moment de l'assignation (409 possible) — on préfère réinterroger plutôt que
// de supposer le succès dans l'UI avant confirmation du serveur.
export function useAssignerEnseignant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enseignantId }: { id: string; enseignantId: string }) =>
      assignerEnseignant(id, enseignantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

// Création d'un créneau — matière uniquement, sans enseignant (statut PLANIFIEE en
// sortie). L'assignation est une étape séparée volontaire, via useAssignerEnseignant
// (décision du 30/08/2026 : créer d'abord, assigner ensuite, pas les deux en un clic).
export function useCreerCreneau() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerCreneau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

export function useModifierMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, matiereId }: { id: string; matiereId: string }) =>
      modifierMatiere(id, matiereId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

export function useAnnulerCreneau() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: annulerCreneau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

// Suppression définitive — utilisée par le bouton "Supprimer le créneau" de la
// grille (voir client.ts : distincte de useAnnulerCreneau, qui reste disponible
// mais n'est plus branché sur aucun bouton pour l'instant).
export function useSupprimerCreneau() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supprimerCreneau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

// Historique des séances d'un enseignant (fiche enseignant) — toutes semaines
// confondues, pour une session donnée.
export function useAffectationsParEnseignant(
  enseignantId: string | undefined,
  sessionId: string | undefined,
) {
  return useQuery({
    queryKey: ["affectations-enseignant", enseignantId, sessionId],
    queryFn: () => listAffectationsParEnseignant(enseignantId!, sessionId!),
    enabled: Boolean(enseignantId && sessionId),
  });
}
