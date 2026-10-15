import { apiFetch } from "@/shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Phase = {
  id: string;
  code: string;
  libelle: string;
  dateDebut: string | null;
  dateFin: string | null;
};

export function listPhases(): Promise<Phase[]> {
  return apiFetch<Phase[]>("/api/phases");
}

export function creerPhase(input: {
  code: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
}): Promise<Phase> {
  return apiFetch<Phase>("/api/phases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function modifierPhase(
  id: string,
  input: {
    code: string;
    libelle: string;
    dateDebut: string;
    dateFin: string;
  },
): Promise<Phase> {
  return apiFetch<Phase>(`/api/phases/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function supprimerPhase(id: string): Promise<void> {
  return apiFetch<void>(`/api/phases/${id}`, {
    method: "DELETE",
  });
}

export function usePhases() {
  return useQuery({
    queryKey: ["phases"],
    queryFn: listPhases,
  });
}

export function useCreerPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      code: string;
      libelle: string;
      dateDebut: string;
      dateFin: string;
    }) => creerPhase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
    },
  });
}

export function useModifierPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      code: string;
      libelle: string;
      dateDebut: string;
      dateFin: string;
    }) => modifierPhase(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
    },
  });
}

export function useSupprimerPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerPhase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
    },
  });
}


