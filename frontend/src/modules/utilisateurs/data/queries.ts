import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUtilisateur,
  listUtilisateurs,
  modifierUtilisateur,
  changerMotDePasse,
  revoquerCompteUtilisateur,
} from "./client";

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

export function useModifierUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: import("../domain/types").ModifierUtilisateurInput;
    }) => modifierUtilisateur(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateur", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["personnel-list"] });
    },
  });
}

export function useChangerMotDePasseAdmin() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      changerMotDePasse(id, password),
  });
}

export function useRevoquerCompteUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revoquerCompteUtilisateur(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateur", id] });
      queryClient.invalidateQueries({ queryKey: ["personnel-list"] });
      queryClient.invalidateQueries({ queryKey: ["acces-personnel-list"] });
    },
  });
}

