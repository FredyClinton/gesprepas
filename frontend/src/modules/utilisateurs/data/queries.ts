"use client";

import { useQuery } from "@tanstack/react-query";

import { getUtilisateur, listUtilisateurs } from "./client";

export function useUtilisateurs() {
  return useQuery({
    queryKey: ["utilisateurs"],
    queryFn: listUtilisateurs,
  });
}

export function useUtilisateur(id: string | undefined) {
  return useQuery({
    queryKey: ["utilisateur", id],
    queryFn: () => getUtilisateur(id!),
    enabled: Boolean(id),
  });
}
