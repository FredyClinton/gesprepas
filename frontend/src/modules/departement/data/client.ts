import { apiFetch } from "@/shared/lib/api-client";
import { Departement } from "../domain/types";

export function getDepartement(id: string): Promise<Departement> {
  return apiFetch<Departement>(`/api/departements/${id}`);
}

export function listDepartements(): Promise<Departement[]> {
  return apiFetch<Departement[]>("/api/departements");
}

export function creerDepartement(payload: {
  nomDepartement: string;
  nomMatiere: string;
  couleur?: string;
}): Promise<Departement> {
  return apiFetch<Departement>("/api/departements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function renommerDepartement(
  id: string,
  payload: { nom: string },
): Promise<Departement> {
  return apiFetch<Departement>(`/api/departements/${id}/renommer`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function supprimerDepartement(id: string): Promise<void> {
  return apiFetch<void>(`/api/departements/${id}`, {
    method: "DELETE",
  });
}

export function assignerChefDepartement(
  departementId: string,
  utilisateurId: string | null,
): Promise<void> {
  return apiFetch<void>(`/api/departements/${departementId}/chef`, {
    method: "PUT",
    body: JSON.stringify({ utilisateurId }),
  });
}
