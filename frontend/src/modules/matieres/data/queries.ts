"use client";

import { useQuery } from "@tanstack/react-query";

import { listMatieres } from "./client";

export function useMatieres() {
  return useQuery({
    queryKey: ["matieres"],
    queryFn: listMatieres,
  });
}
