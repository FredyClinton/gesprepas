"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "excelis_quotas_";
const EVENT_NAME = "excelis_quotas_updated";

/**
 * Hook pour gérer les quotas hebdomadaires de cours max par matière pour une formation.
 * Permet au Directeur Académique de définir le nombre de cours attendus (ex: 5 cours de Maths en S1),
 * et aux Chefs de Département de visualiser ce quota en lecture seule avec verrouillage des cases excédentaires.
 */
export function useProgressionQuotas(formationId?: string) {
  const [quotas, setQuotas] = useState<Record<string, number>>({});

  const storageKey = formationId ? `${STORAGE_PREFIX}${formationId}` : null;

  // Charger les quotas depuis le stockage local
  const chargerQuotas = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setQuotas(JSON.parse(raw));
      } else {
        setQuotas({});
      }
    } catch {
      setQuotas({});
    }
  }, [storageKey]);

  useEffect(() => {
    chargerQuotas();

    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent<{ formationId?: string }>;
      if (!customEvent.detail || customEvent.detail.formationId === formationId) {
        chargerQuotas();
      }
    }

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", chargerQuotas);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", chargerQuotas);
    };
  }, [chargerQuotas, formationId]);

  /**
   * Récupère le quota pour une semaine et une matière.
   * Si non configuré, utilise la valeur par défaut (defaut = 3 ou calculée d'après les affectations).
   */
  const getQuota = useCallback(
    (semaine: number, matiereId: string, defaut: number = 3): number => {
      const key = `${semaine}_${matiereId}`;
      return quotas[key] ?? defaut;
    },
    [quotas],
  );

  /**
   * Définit ou ajuste le quota de cours max pour une semaine et une matière (réservé Directeur Académique).
   */
  const setQuota = useCallback(
    (semaine: number, matiereId: string, maxCours: number) => {
      if (!storageKey || typeof window === "undefined") return;
      const key = `${semaine}_${matiereId}`;
      const updated = {
        ...quotas,
        [key]: Math.max(1, Math.min(10, maxCours)),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setQuotas(updated);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME, { detail: { formationId } }),
        );
      } catch (err) {
        console.error("Erreur lors de l'enregistrement du quota :", err);
      }
    },
    [storageKey, quotas, formationId],
  );

  return {
    quotas,
    getQuota,
    setQuota,
  };
}
