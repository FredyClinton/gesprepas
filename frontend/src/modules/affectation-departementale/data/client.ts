import { apiFetch } from "@/shared/lib/api-client";
import type { Role } from "@/types/roles";

import type { AffectationDepartementale } from "../domain/types";

// Header placeholder : voir personnel/data/client.ts, même mécanisme temporaire.
function headerRole(role: Role | undefined): HeadersInit | undefined {
  return role ? { "X-User-Role": role } : undefined;
}

export function listRosterDepartement(
  departementId: string,
  sessionId: string,
): Promise<AffectationDepartementale[]> {
  const params = new URLSearchParams({ departementId, sessionId });
  return apiFetch<AffectationDepartementale[]>(
    `/api/affectations-departementales?${params}`,
  );
}

export function ajouterEnseignant(
  departementId: string,
  sessionId: string,
  enseignantId: string,
  role: Role | undefined,
): Promise<AffectationDepartementale> {
  return apiFetch<AffectationDepartementale>(
    "/api/affectations-departementales",
    {
      method: "POST",
      headers: headerRole(role),
      body: JSON.stringify({ departementId, sessionId, enseignantId }),
    },
  );
}

export function retirerEnseignant(
  departementId: string,
  sessionId: string,
  enseignantId: string,
  role: Role | undefined,
): Promise<void> {
  const params = new URLSearchParams({
    departementId,
    sessionId,
    enseignantId,
  });
  return apiFetch<void>(`/api/affectations-departementales?${params}`, {
    method: "DELETE",
    headers: headerRole(role),
  });
}
