import { apiFetch } from "@/shared/lib/api-client";
import type { PageResponse } from "@/shared/lib/pagination";

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
  details?: string | null;
  livreTitre?: string | null;
};

// Ligne de la recherche paginée : le mouvement plus le tiers résolu (apprenant,
// ordonnateur ou "Divers") et le solde progressif de toute la session (calculé
// par le backend avant filtres, rejetés exclus).
export type LigneMouvementFinancier = MouvementFinancier & {
  tiers: string;
  soldeProgressif: number;
};

export type TriMouvements =
  | "DATE"
  | "REF"
  | "CENTRE"
  | "TIERS"
  | "MOTIF"
  | "ORDRE_MOTIFS"
  | "MONTANT"
  | "DEBIT"
  | "CREDIT"
  | "SOLDE"
  | "STATUT"
  | "ORDONNATEUR";

export type CriteresRechercheMouvements = {
  sessionId: string;
  centreId?: string;
  type?: "ENTREE" | "SORTIE";
  // Restreint aux motifs listés (vide = tous) : sert au filtre par catégorie.
  motifIds?: string[];
  statut?: StatutMouvement;
  dateDebut?: string;
  dateFin?: string;
  recherche?: string;
  pointage?: "TOUS" | "POINTE" | "NON_POINTE";
  idsPointes?: string[];
  tri?: TriMouvements;
  // Ordre des motifs pour le tri ORDRE_MOTIFS (ex. par catégorie).
  ordreMotifIds?: string[];
  sens?: "ASC" | "DESC";
};

export type TotalMotif = {
  motifId: string;
  type: "ENTREE" | "SORTIE";
  total: number;
  nombre: number;
};

// totalEntrees/totalSorties excluent les rejetés ; totauxParMotif les inclut.
export type ResultatRechercheMouvements = {
  page: PageResponse<LigneMouvementFinancier>;
  totalEntrees: number;
  totalSorties: number;
  totauxParMotif: TotalMotif[];
};

// POST en lecture seule : les listes d'identifiants (pointage, motifs) ne
// tiennent pas forcément dans une URL.
export function rechercherMouvementsFinanciers(
  criteres: CriteresRechercheMouvements,
  page: number,
  taille: number,
): Promise<ResultatRechercheMouvements> {
  return apiFetch<ResultatRechercheMouvements>(
    "/api/mouvements-financiers/recherche",
    { method: "POST", body: JSON.stringify({ ...criteres, page, taille }) },
  );
}

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
  return apiFetch<BilanJournalier>(
    "/api/bilans-journaliers/soumettre-caissier",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
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
  return apiFetch<BilanJournalier>(
    "/api/bilans-journaliers/valider-chef-centre",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
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

export interface ValiderBilanControleurDirectInput {
  centreId: string;
  sessionId: string;
  date: string;
  validateurUtilisateurId?: string;
}

export function validerBilanControleurDirect(
  input: ValiderBilanControleurDirectInput,
): Promise<BilanJournalier> {
  return apiFetch<BilanJournalier>(
    "/api/bilans-journaliers/valider-controleur",
    {
      method: "POST",
      body: JSON.stringify(input),
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

export type DecisionMouvement = "VALIDE" | "REJETE";

export interface ValiderMouvementInput {
  mouvementId: string;
  decision: DecisionMouvement;
  validateurUtilisateurId?: string;
}

export interface ValidationMouvementResponse {
  id: string;
  mouvementFinancierId: string;
  validateurUtilisateurId: string;
  decision: DecisionMouvement;
  date: string;
}

export function validerMouvement(
  input: ValiderMouvementInput,
): Promise<ValidationMouvementResponse> {
  return apiFetch<ValidationMouvementResponse>(
    `/api/mouvements-financiers/${input.mouvementId}/valider`,
    {
      method: "PATCH",
      body: JSON.stringify({
        decision: input.decision,
        validateurUtilisateurId: input.validateurUtilisateurId,
      }),
    },
  );
}
