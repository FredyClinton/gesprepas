export type Apprenant = {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateInscription: string;
  montantContrat: number;
  dateDefinitionContrat?: string;
  centreId: string;
  sessionId: string;
  formationId: string;
  etablissementOrigine?: string;
  contactApprenant?: string;
  nomParent?: string;
  contactParent?: string;
  preInscrit?: boolean;
  referenceRecu?: string;
};

// Ligne de la liste paginée (GET /api/apprenants/recherche) : l'apprenant plus sa
// situation de paiement (entrées non rejetées de la session, hors livres) et son
// dossier de concours éventuel, calculés par le backend.
export type LigneApprenant = Apprenant & {
  montantPaye: number;
  soldeRestant: number;
  dossierId?: string | null;
  statutDossier?: "OUVERT" | "COMPLET" | "CLOTURE" | null;
};

export type TriApprenants =
  "NOM" | "FORMATION" | "ETABLISSEMENT" | "PAIEMENT" | "DOSSIER" | "DATE";

export type CriteresRechercheApprenants = {
  sessionId?: string;
  centreId?: string;
  formationId?: string;
  etablissement?: string;
  admission?: "TOUS" | "DEFINITIF" | "PRE_INSCRIT";
  paiement?: "TOUS" | "SOLDE" | "RESTANT";
  recherche?: string;
  tri?: TriApprenants;
  sens?: "ASC" | "DESC";
};

export type SyntheseApprenants = {
  total: number;
  preInscrits: number;
  definitifs: number;
  etablissements: string[];
};
