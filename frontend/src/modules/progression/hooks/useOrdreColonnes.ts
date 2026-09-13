"use client";

import { useMemo, useState, useEffect } from "react";
import type { Matiere } from "@/modules/matieres";

export function reordonnerMatieres(
  matieres: Matiere[],
  ordreIds: string[],
): Matiere[] {
  if (!ordreIds || ordreIds.length === 0) return matieres;
  const parId = new Map(matieres.map((m) => [m.id, m]));
  const result: Matiere[] = [];

  // 1. Ajouter dans l'ordre explicite
  ordreIds.forEach((id) => {
    const m = parId.get(id);
    if (m) {
      result.push(m);
      parId.delete(id);
    }
  });

  // 2. Ajouter les éventuelles matières restantes
  parId.forEach((m) => {
    result.push(m);
  });

  return result;
}

export function useOrdreColonnes(
  formationId: string | undefined,
  matieresInitiales: Matiere[],
) {
  const [ordreIds, setOrdreIds] = useState<string[]>([]);

  useEffect(() => {
    if (!formationId) return;
    try {
      const raw = localStorage.getItem(`excelis_ordre_matieres_${formationId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setOrdreIds(parsed);
          return;
        }
      }
    } catch {
      // Ignorer l'erreur localStorage
    }
    setOrdreIds([]);
  }, [formationId]);

  const matieresOrdonnees = useMemo(() => {
    return reordonnerMatieres(matieresInitiales, ordreIds);
  }, [matieresInitiales, ordreIds]);

  const changerOrdre = (nouvellesMatieres: Matiere[]) => {
    const ids = nouvellesMatieres.map((m) => m.id);
    setOrdreIds(ids);
  };

  return {
    matieresOrdonnees,
    changerOrdre,
  };
}

