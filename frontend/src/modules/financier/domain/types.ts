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
  livreTitre?: string | null;
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

export type LigneEntreeResume = {
  categorie: string; // "FORMATION" | "LIVRE" | "AUTRE"
  formationId?: string | null;
  libelle: string;
  montant: number;
  nombreOperations: number;
};

export type LigneSortieResume = {
  motifId?: string | null;
  libelleMotif: string;
  montant: number;
  nombreOperations: number;
};

export type EffectifFormationResume = {
  formationId: string;
  formationNom: string;
  nouveauxElevesJour: number;
  effectifTotal: number;
};

export type BilanCentreResume = {
  centreId: string;
  centreNom: string;
  centreVille: string;
  statut: StatutBilan;
  totalEntrees: number;
  totalSorties: number;
  netAVerser: number;
  effectifNouveauxElevesTotal: number;
  effectifTotalCentre: number;
  nombreSalles?: number | null;
  nombreCours?: number | null;
  nomCaissier?: string | null;
  dateVisaCaissier?: string | null;
  nomChefCentre?: string | null;
  dateValidationChefCentre?: string | null;
  nomControleur?: string | null;
  dateValidationControleur?: string | null;
  entreesDetaillees: LigneEntreeResume[];
  sortiesDetaillees: LigneSortieResume[];
  effectifsParFormation: EffectifFormationResume[];
};

export type BilanConsolideNational = {
  date: string;
  sessionId: string;
  totalEntreesNational: number;
  totalSortiesNational: number;
  netAVerserNational: number;
  totalNouveauxElevesNational: number;
  totalEffectifNational: number;
  centresCloturesCount: number;
  centresTotalCount: number;
  centres: BilanCentreResume[];
  entreesNationalesDetaillees: LigneEntreeResume[];
  sortiesNationalesDetaillees: LigneSortieResume[];
  effectifsNationauxParFormation: EffectifFormationResume[];
};

export type { MouvementFinancier } from "../data/client";
