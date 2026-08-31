"use client";

import { useQuery } from "@tanstack/react-query";

import { listUtilisateurs } from "./client";

export function useUtilisateurs() {
  return useQuery({
    queryKey: ["utilisateurs"],
    queryFn: listUtilisateurs,
  });
}
