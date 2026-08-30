import { useQuery } from "@tanstack/react-query";
import { getDepartement, listDepartements } from "./client";

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
