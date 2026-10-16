import { apiFetch } from "@/shared/lib/api-client";
import type { Role } from "@/types/roles";

import type {
  Enseignant,
  FicheAncienneteEnseignant,
  PersonnelMembre,
  HistoriqueSalairePersonnel,
} from "../domain/types";

// Header placeholder : le backend n'a pas encore d'authentification réelle, il fait
// confiance à ce rôle auto-déclaré pour appliquer le gel de gestion des enseignants
// (voir gelenseignants côté backend). À retirer une fois Spring Security en place.
function headerRole(role: Role | undefined): HeadersInit | undefined {
  return role ? { "X-User-Role": role } : undefined;
}

export function listEnseignants(): Promise<Enseignant[]> {
  return apiFetch<Enseignant[]>("/api/enseignants");
}

export function getEnseignant(id: string): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}`);
}

export function getAncienneteEnseignant(
  id: string,
): Promise<FicheAncienneteEnseignant> {
  return apiFetch<FicheAncienneteEnseignant>(`/api/enseignants/${id}/anciennete`);
}

export type CreerEnseignantInput = {
  nom: string;
  prenom: string;
  matricule: string;
  coutParSeance: number;
  telephone?: string | null;
  numeroCni?: string | null;
  ecoleFonction?: string | null;
  niveauGrade?: string | null;
  dateRecrutement?: string | null;
};

export function creerEnseignant(
  input: CreerEnseignantInput,
  role: Role | undefined,
): Promise<Enseignant> {
  const payload = {
    ...input,
    telephone: input.telephone?.trim() || null,
    numeroCni: input.numeroCni?.trim() || null,
    ecoleFonction: input.ecoleFonction?.trim() || null,
    niveauGrade: input.niveauGrade?.trim() || null,
    dateRecrutement: input.dateRecrutement?.trim() || null,
  };

  return apiFetch<Enseignant>("/api/enseignants", {
    method: "POST",
    headers: headerRole(role),
    body: JSON.stringify(payload),
  });
}

export function renommerEnseignant(
  id: string,
  nom: string,
  prenom: string,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/renommer`, {
    method: "PATCH",
    headers: headerRole(role),
    body: JSON.stringify({ nom, prenom }),
  });
}

export function modifierCoutParSeance(
  id: string,
  coutParSeance: number,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/cout-par-seance`, {
    method: "PATCH",
    headers: headerRole(role),
    body: JSON.stringify({ coutParSeance }),
  });
}

export function suspendreEnseignant(
  id: string,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/suspendre`, {
    method: "PATCH",
    headers: headerRole(role),
  });
}

export function reactiverEnseignant(
  id: string,
  role: Role | undefined,
): Promise<Enseignant> {
  return apiFetch<Enseignant>(`/api/enseignants/${id}/reactiver`, {
    method: "PATCH",
    headers: headerRole(role),
  });
}

export function supprimerEnseignant(
  id: string,
  role: Role | undefined,
): Promise<void> {
  return apiFetch<void>(`/api/enseignants/${id}`, {
    method: "DELETE",
    headers: headerRole(role),
  });
}

export function getPersonnel(id: string): Promise<PersonnelMembre> {
  return apiFetch<PersonnelMembre>(`/api/personnel/${id}`);
}

export function listPersonnel(): Promise<PersonnelMembre[]> {
  return apiFetch<PersonnelMembre[]>("/api/personnel");
}

export function getHistoriqueSalairePersonnel(
  personnelId: string,
  sessionId: string,
): Promise<HistoriqueSalairePersonnel[]> {
  return apiFetch<HistoriqueSalairePersonnel[]>(
    `/api/personnel/${personnelId}/sessions/${sessionId}/salaire-historique`,
  );
}

export function definirSalairePersonnel(
  personnelId: string,
  sessionId: string,
  salaireReference: number,
  dateDebutEffet?: string,
): Promise<HistoriqueSalairePersonnel> {
  return apiFetch<HistoriqueSalairePersonnel>(
    `/api/personnel/${personnelId}/sessions/${sessionId}/salaire`,
    {
      method: "POST",
      body: JSON.stringify({ salaireReference, dateDebutEffet }),
    },
  );
}

export function listAccesPersonnel(
  sessionId: string,
  phaseId?: string | null,
): Promise<import("../domain/types").AccesPersonnel[]> {
  const params = new URLSearchParams({ sessionId });
  if (phaseId) {
    params.set("phaseId", phaseId);
  }
  return apiFetch<import("../domain/types").AccesPersonnel[]>(
    `/api/personnel/acces?${params.toString()}`,
  );
}

export function getAccesPersonnel(
  personnelId: string,
  sessionId?: string,
): Promise<import("../domain/types").AccesPersonnel[]> {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  return apiFetch<import("../domain/types").AccesPersonnel[]>(
    `/api/personnel/${personnelId}/acces${query}`,
  );
}

export function gererAccesPersonnel(
  personnelId: string,
  input: import("../domain/types").GererAccesInput,
): Promise<import("../domain/types").AccesPersonnel> {
  return apiFetch<import("../domain/types").AccesPersonnel>(
    `/api/personnel/${personnelId}/acces`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function creerPersonnel(
  input: import("../domain/types").CreerPersonnelInput,
): Promise<PersonnelMembre> {
  return apiFetch<PersonnelMembre>("/api/personnel", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function modifierPersonnel(
  id: string,
  input: import("../domain/types").ModifierPersonnelInput,
): Promise<PersonnelMembre> {
  return apiFetch<PersonnelMembre>(`/api/personnel/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function supprimerPersonnel(id: string): Promise<void> {
  return apiFetch<void>(`/api/personnel/${id}`, {
    method: "DELETE",
  });
}

export function creerComptePourPersonnel(
  id: string,
  input: import("../domain/types").CreerComptePersonnelInput,
): Promise<import("@/modules/utilisateurs").Utilisateur> {
  return apiFetch<import("@/modules/utilisateurs").Utilisateur>(
    `/api/personnel/${id}/compte`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

