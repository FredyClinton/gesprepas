"use client";

import { useEffect, useState } from "react";

// Renvoie `valeur` une fois qu'elle n'a plus changé pendant `delaiMs` : évite une
// requête serveur à chaque frappe dans un champ de recherche.
export function useDebouncedValue<T>(valeur: T, delaiMs = 300): T {
  const [valeurStable, setValeurStable] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => setValeurStable(valeur), delaiMs);
    return () => clearTimeout(minuteur);
  }, [valeur, delaiMs]);

  return valeurStable;
}
