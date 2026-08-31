// Miroir de `DossierResponse` (backend, module dossier). Module volontairement
// minimal : sert uniquement à résoudre le statut du dossier d'un apprenant (écran
// Apprenants) — pas encore de gestion des concours/pièces côté frontend.
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
