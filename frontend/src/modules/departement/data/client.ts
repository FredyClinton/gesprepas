import { apiFetch } from "@/shared/lib/api-client";
import { Departement } from "../domain/types";

export function getDepartement(id: string): Promise<Departement> {
  return apiFetch<Departement>(`/api/departements/${id}`);
}

export function listDepartements(): Promise<Departement[]> {
  return apiFetch<Departement[]>("/api/departements");
}
