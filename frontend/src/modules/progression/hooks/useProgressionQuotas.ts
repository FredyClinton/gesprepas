"use client";

import { useCallback } from "react";
import { useQuotasHebdomadaires, useDefinirQuota } from "../data/queries";

/**
 * Quotas hebdomadaires de cours max par matière pour une formation/session,
 * persistés côté backend (table quotas_hebdomadaires) et appliqués à la saisie
 * (voir ProgressionService.creerProgression côté backend - un Chef de
 * Département ne peut plus dépasser le quota fixé ici). Le Directeur
 * Académique définit le quota (voir MatricePermissions.PROGRESSION_GERER_QUOTA
 * côté backend, vérifié aussi côté UI via `estDirecteur` dans les vues
 * appelantes) ; les autres rôles le consultent en lecture seule.
 */
export function useProgressionQuotas(formationId?: string, sessionId?: string) {
  const { data: quotas = [] } = useQuotasHebdomadaires(formationId, sessionId);
  const mutation = useDefinirQuota(formationId, sessionId);

  /**
   * Récupère le quota pour une semaine et une matière.
   * Si non configuré côté backend, utilise la valeur par défaut fournie par
   * l'appelant (ex: calculée d'après les affectations).
   */
  const getQuota = useCallback(
    (semaine: number, matiereId: string, defaut: number = 3): number => {
      const trouve = quotas.find(
        (q) => q.semaine === semaine && q.matiereId === matiereId,
      );
      return trouve ? trouve.quota : defaut;
    },
    [quotas],
  );

  /**
   * Définit ou ajuste le quota de cours max pour une semaine et une matière
   * (réservé Directeur Académique / Directeur côté backend - PROGRESSION_GERER_QUOTA).
   */
  const setQuota = useCallback(
    (semaine: number, matiereId: string, maxCours: number) => {
      if (!formationId || !sessionId) return;
      mutation.mutate({
        formationId,
        sessionId,
        matiereId,
        semaine,
        quota: Math.max(0, Math.min(10, maxCours)),
      });
    },
    [formationId, sessionId, mutation],
  );

  return { quotas, getQuota, setQuota };
}
