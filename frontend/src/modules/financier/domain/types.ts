export type StatutBilan = "OUVERT" | "SOUMIS_CAISSIER" | "EN_ATTENTE_CONTROLEUR" | "CLOTURE";

export type BilanApercu = {
  id?: string | null;
  statut?: StatutBilan | null;
  totalEntrees: number;
  totalSorties: number;
  netAVerser: number;
  effectifNouveauxEleves: number;
  effectifTotalCentre: number;
  nombreSalles?: number;
  nombreCours?: number;
  dateVisaCaissier?: string | null;
  nomCaissier?: string | null;
  dateValidationChefCentre?: string | null;
  nomChefCentre?: string | null;
  dateValidationControleur?: string | null;
  nomControleur?: string | null;
};

export type BilanJournalier = {
  id: string;
  centreId: string;
  sessionId: string;
  date: string;
  statut: StatutBilan;
  dateVisaCaissier?: string | null;
  caissierId?: string | null;
  nomCaissier?: string | null;
  dateValidationChefCentre?: string | null;
  validateurChefCentreId?: string | null;
  nomChefCentre?: string | null;
  dateValidationControleur?: string | null;
  validateurControleurId?: string | null;
  nomControleur?: string | null;
  totalEntrees?: number | null;
  totalSorties?: number | null;
  netAVerser?: number | null;
  effectifNouveauxEleves?: number | null;
  effectifTotalCentre?: number | null;
  nombreSalles?: number | null;
  nombreCours?: number | null;
};

export type RepartitionFormation = {
  formationId: string;
  montant: number;
};

export type StatutMouvement = "EN_ATTENTE" | "VALIDE" | "REJETE";

export type TypeMotif = "ENTREE" | "SORTIE";

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

export type Sortie = {
  id: string;
  sessionId: string;
  motifId: string;
  montant: number;
  date: string;
  saisiParUtilisateurId: string;
  statut: StatutMouvement;
  centreId: string | null;
  ordonnateur: string;
};

export type { MouvementFinancier } from "../data/client";
