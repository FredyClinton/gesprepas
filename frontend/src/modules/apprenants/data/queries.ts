"use client";

import { useQuery } from "@tanstack/react-query";

import { listApprenants } from "./client";

// Pas d'endpoint de pagination/comptage côté backend : on récupère la liste complète
// et "Total apprenants" se calcule côté client (items.length). À revoir si le volume
// rend ça coûteux un jour — pas un problème au stade actuel.
export function useApprenants() {
  return useQuery({
    queryKey: ["apprenants"],
    queryFn: listApprenants,
  });
}
