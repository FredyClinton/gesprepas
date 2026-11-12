"use client";

import { useCallback, useState } from "react";

// Numéro de page (1-based) qui revient automatiquement à 1 dès que `cle` change
// (typiquement JSON.stringify des filtres/tri) : changer un filtre ne doit pas
// laisser l'utilisateur sur une page qui n'existe plus. Dérivé au rendu, sans
// effet, pour éviter un rendu intermédiaire sur l'ancienne page.
export function usePageParCriteres(
  cle: string,
): [number, (page: number) => void] {
  const [etat, setEtat] = useState({ cle, page: 1 });
  const page = etat.cle === cle ? etat.page : 1;
  const setPage = useCallback((p: number) => setEtat({ cle, page: p }), [cle]);
  return [page, setPage];
}
