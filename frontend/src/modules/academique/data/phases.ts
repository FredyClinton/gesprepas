import { apiFetch } from "@/shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export type Phase = {
  id: string;
  code: string;
  libelle: string;
};

export function listPhases(): Promise<Phase[]> {
  return apiFetch<Phase[]>("/api/phases");
}

export function usePhases() {
  return useQuery({
    queryKey: ["phases"],
    queryFn: listPhases,
  });
}

