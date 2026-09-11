import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignerChefDepartement,
  creerDepartement,
  getDepartement,
  listDepartements,
  renommerDepartement,
  supprimerDepartement,
} from "./client";

export function useDepartement(id: string | undefined) {
  return useQuery({
    queryKey: ["departement", id],
    queryFn: () => getDepartement(id!),
    enabled: Boolean(id),
  });
}

export function useDepartements() {
  return useQuery({
    queryKey: ["departements"],
    queryFn: listDepartements,
  });
}

export function useCreerDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerDepartement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
    },
  });
}

export function useRenommerDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nom }: { id: string; nom: string }) =>
      renommerDepartement(id, { nom }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["departement", variables.id] });
    },
  });
}

export function useSupprimerDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supprimerDepartement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });
}

export function useAssignerChefDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      departementId,
      utilisateurId,
    }: {
      departementId: string;
      utilisateurId: string | null;
    }) => assignerChefDepartement(departementId, utilisateurId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departements"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });
}
