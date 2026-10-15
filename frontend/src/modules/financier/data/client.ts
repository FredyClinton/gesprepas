import { apiFetch } from "@/shared/lib/api-client";

import type {
  Entree,
  Sortie,
  Motif,
  TypeMotif,
  StatutMouvement,
  BilanApercu,
  BilanJournalier,
  RepartitionFormation,
  BilanConsolideNational,
} from "../domain/types";

export function getBilanDuJour(
  centreId: string,
  sessionId: string,
  date: string,
): Promise<BilanApercu> {
  const params = new URLSearchParams({ centreId, sessionId, date });
  return apiFetch<BilanApercu>(`/api/bilans-journaliers/du-jour?${params}`);
}

export function getBilanConsolideDuJour(
  sessionId: string,
  date: string,
): Promise<BilanConsolideNational> {
  const params = new URLSearchParams({ sessionId, date });
  return apiFetch<BilanConsolideNational>(
    `/api/bilans-journaliers/consolide-du-jour?${params}`,
  );
}

export function getRepartitionFormations(
  bilanId: string,
): Promise<RepartitionFormation[]> {
  return apiFetch<RepartitionFormation[]>(
    `/api/bilans-journaliers/${bilanId}/repartition-formations`,
  );
}

export function listVersementsApprenant(
  apprenantId: string,
): Promise<Entree[]> {
  const params = new URLSearchParams({ apprenantId });
  return apiFetch<Entree[]>(`/api/entrees?${params}`);
}

export function listMotifs(type?: TypeMotif): Promise<Motif[]> {
  const params = type ? `?${new URLSearchParams({ type })}` : "";
  return apiFetch<Motif[]>(`/api/motifs${params}`);
}

export type SaisirEntreeInput = {
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  centreId: string;
  apprenantId?: string;
  formationId?: string;
};

export function saisirEntree(input: SaisirEntreeInput): Promise<Entree> {
  return apiFetch<Entree>("/api/entrees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type SaisirSortieInput = {
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  centreId?: string | null;
  ordonnateur: string;
};

export function saisirSortie(input: SaisirSortieInput): Promise<Sortie> {
  return apiFetch<Sortie>("/api/sorties", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type MouvementFinancier = {
  id: string;
  type: "ENTREE" | "SORTIE";
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  statut: StatutMouvement;
  centreId?: string | null;
  apprenantId?: string | null;
  formationId?: string | null;
  ordonnateur?: string | null;
};

export function listMouvementsFinanciers(
  sessionId: string,
  centreId?: string,
): Promise<MouvementFinancier[]> {
  const params = new URLSearchParams({ sessionId });
  if (centreId) params.append("centreId", centreId);
  return apiFetch<MouvementFinancier[]>(`/api/mouvements-financiers?${params}`);
}

export type ModifierEntreeInput = {
  montant: number;
  date: string;
  motifId: string;
  apprenantId?: string;
};

export function modifierEntree(
  id: string,
  input: ModifierEntreeInput,
): Promise<Entree> {
  return apiFetch<Entree>(`/api/entrees/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function supprimerEntree(id: string): Promise<void> {
  return apiFetch<void>(`/api/entrees/${id}`, {
    method: "DELETE",
  });
}

export type SoumettreBilanCaissierInput = {
  centreId: string;
  sessionId: string;
  date: string;
  caissierUtilisateurId: string;
};

export function soumettreBilanCaissier(
  input: SoumettreBilanCaissierInput,
): Promise<BilanJournalier> {
  return apiFetch<BilanJournalier>("/api/bilans-journaliers/soumettre-caissier", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type ValiderBilanChefCentreInput = {
  centreId: string;
  sessionId: string;
  date: string;
  validateurUtilisateurId: string;
};

export function validerBilanChefCentre(
  input: ValiderBilanChefCentreInput,
): Promise<BilanJournalier> {
  return apiFetch<BilanJournalier>("/api/bilans-journaliers/valider-chef-centre", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function validerBilanControleur(
  bilanId: string,
  validateurUtilisateurId: string,
): Promise<BilanJournalier> {
  return apiFetch<BilanJournalier>(
    `/api/bilans-journaliers/${bilanId}/valider-controleur`,
    {
      method: "PATCH",
      body: JSON.stringify({ validateurUtilisateurId }),
    },
  );
}

export type AjusterActiviteBilanInput = {
  centreId: string;
  sessionId: string;
  date: string;
  nombreSalles: number;
  nombreCours: number;
  utilisateurId: string;
};

export function ajusterActiviteBilan(
  input: AjusterActiviteBilanInput,
): Promise<BilanJournalier> {
  return apiFetch<BilanJournalier>("/api/bilans-journaliers/activite", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
