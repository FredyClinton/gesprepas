// Miroir de `DossierResponse` (backend, module dossier). Module volontairement
// minimal : sert uniquement à résoudre le statut du dossier d'un apprenant (écran
// Apprenants) - pas encore de gestion des concours/pièces côté frontend.
export type StatutDossier = "OUVERT" | "COMPLET" | "CLOTURE";

export type Dossier = {
  id: string;
  apprenantId: string;
  centreId: string;
  sessionId: string;
  statut: StatutDossier;
  dateOuverture: string;
  dateCloture: string | null;
  observation: string | null;
};

// Ligne de la liste paginée (GET /api/dossiers/recherche) : le dossier, son
// apprenant et l'échéance de dépôt la plus proche parmi ses concours.
export type LigneDossier = Dossier & {
  apprenantNom: string | null;
  apprenantPrenom: string | null;
  apprenantReferenceRecu: string | null;
  apprenantFormationId: string | null;
  dateLimiteDepot: string | null;
};

export type TriDossiers =
  "APPRENANT" | "CENTRE" | "FILIERE" | "DATE" | "DATE_LIMITE" | "STATUT";

export type CriteresRechercheDossiers = {
  sessionId?: string;
  centreId?: string;
  statut?: StatutDossier;
  formationId?: string;
  recherche?: string;
  tri?: TriDossiers;
  sens?: "ASC" | "DESC";
};

// Page de dossiers + compteurs par statut du périmètre session/centre
// (indépendants des filtres statut/formation/recherche).
export type ResultatRechercheDossiers = {
  page: import("@/shared/lib/pagination").PageResponse<LigneDossier>;
  total: number;
  ouverts: number;
  complets: number;
  clotures: number;
};

// Miroir de `ConcoursResponse` (backend, module dossier) : un concours auquel un
// centre peut inscrire des apprenants, avec ses échéances.
export type Concours = {
  id: string;
  nom: string;
  sessionId: string;
  dateLimiteDepot: string;
  dateLimiteRecevabiliteCentre: string;
};

// Catalogue réutilisable des pièces administratives (miroir de `PieceRequiseResponse`).
export type PieceRequise = {
  id: string;
  nom: string;
  montant: number;
  actif: boolean;
};

// Miroir de `DossierConcoursResponse` : l'inscription d'un dossier à un concours.
export type DossierConcours = {
  id: string;
  dossierId: string;
  concoursId: string;
  centreId: string;
  sessionId: string;
  dateAjout: string;
  montantTotal: number;
};

export type StatutPieceDossier = "EN_ATTENTE" | "VALIDEE";

// Miroir de `PieceDossierResponse` : le dépôt d'une pièce requise pour un
// dossier-concours donné.
export type PieceDossier = {
  id: string;
  dossierConcoursId: string;
  pieceRequiseId: string;
  quantite: number;
  statut: StatutPieceDossier;
  dateValidation: string | null;
};

// Miroir de `SoldeDossierConcoursResponse`.
export type SoldeDossierConcours = {
  dossierConcoursId: string;
  montantTotal: number;
  montantPaye: number;
  soldeRestant: number;
};

export type CreerConcoursInput = {
  nom: string;
  sessionId: string;
  formationId?: string;
  phaseId?: string;
  dateLimiteDepot: string;
  dateLimiteRecevabiliteCentre: string;
};

export type SelectionPieceInput = {
  pieceRequiseId: string;
  quantite: number;
};

export type AjouterConcoursAuDossierInput = {
  concoursId: string;
  selections: SelectionPieceInput[];
};

export type EnregistrerPaiementDossierInput = {
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
};

export type CreerPieceRequiseInput = {
  nom: string;
  montant: number;
};

export type ModifierPieceRequiseInput = {
  nom: string;
  montant: number;
};
