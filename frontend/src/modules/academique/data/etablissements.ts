import { apiFetch } from "@/shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Etablissement = {
  id: string;
  nom: string;
  ville?: string | null;
};

export function listEtablissements(): Promise<Etablissement[]> {
  return apiFetch<Etablissement[]>("/api/etablissements");
}

export function creerEtablissement(nom: string, ville?: string): Promise<Etablissement> {
  return apiFetch<Etablissement>("/api/etablissements", {
    method: "POST",
    body: JSON.stringify({ nom: nom.trim(), ville: ville?.trim() || undefined }),
  });
}

export function useEtablissements() {
  return useQuery({
    queryKey: ["etablissements"],
    queryFn: listEtablissements,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnregistrerEtablissement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nom, ville }: { nom: string; ville?: string }) =>
      creerEtablissement(nom, ville),
    onSuccess: (nouveau) => {
      queryClient.setQueryData<Etablissement[]>(["etablissements"], (prev) => {
        if (!prev) return [nouveau];
        if (prev.some((e) => e.id === nouveau.id || e.nom.toLowerCase() === nouveau.nom.toLowerCase())) {
          return prev;
        }
        return [...prev, nouveau].sort((a, b) => a.nom.localeCompare(b.nom));
      });
      queryClient.invalidateQueries({ queryKey: ["etablissements"] });
    },
  });
}

