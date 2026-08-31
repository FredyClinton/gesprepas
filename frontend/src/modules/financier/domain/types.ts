export type StatutBilan = "EN_ATTENTE_CONTROLEUR" | "CLOTURE";

export type BilanApercu = {
  id: string;
  statut: StatutBilan;
  totalEntrees: number;
  totalSorties: number;
  netAVerser: number;
  effectifNouveauxEleves: number;
  effectifTotalCentre: number;
};

export type RepartitionFormation = {
  formationId: string;
  montant: number;
};

// Miroir de `EntreeResponse` (backend, module financier). Module volontairement
// minimal : sert uniquement à calculer le statut de paiement d'un apprenant (écran
// Apprenants) — pas encore de saisie d'entrées/sorties côté frontend.
export type StatutMouvement = "EN_ATTENTE" | "VALIDE" | "REJETE";

export type TypeMotif = "ENTREE" | "SORTIE";

// Miroir de `MotifResponse` (backend, module financier).
export type Motif = {
  id: string;
  nom: string;
  type: TypeMotif;
  actif: boolean;
};

export type Entree = {
  id: string;
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  statut: StatutMouvement;
  centreId: string;
  apprenantId: string | null;
  formationId: string | null;
  dossierConcoursId: string | null;
};
