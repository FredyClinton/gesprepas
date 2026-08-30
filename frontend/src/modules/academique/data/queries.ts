"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createFormation, listFormations } from "./client";

export function useFormations() {
  return useQuery({
    queryKey: ["formations"],
    queryFn: listFormations,
  });
}

export function useCreateFormation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFormation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formations"] });
    },
  });
}
