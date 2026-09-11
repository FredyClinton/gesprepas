export type StatutFichePaie = "PROGRAMMEE" | "PAYEE";

export const LABELS_STATUT_FICHE_PAIE: Record<StatutFichePaie, string> = {
  PROGRAMMEE: "Programmée",
  PAYEE: "Payée",
};

export const CLASSES_STATUT_FICHE_PAIE: Record<StatutFichePaie, string> = {
  PROGRAMMEE: "bg-blue-50 text-blue-700 border border-blue-200/80",
  PAYEE: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
};

export type FichePaieEnseignant = {
  id: string;
  bordereauPaieId: string;
  referenceBordereau: string;
  datePaiement: string;
  sessionId: string;
  enseignantId: string;
  nombreSeances: number;
  montantTotal: number;
  statut: StatutFichePaie;
};

export type FichePaieEnseignantDetail = {
  id: string;
  enseignantId: string;
  enseignantNom: string;
  enseignantPrenom: string;
  enseignantMatricule: string;
  departementNom: string;
  nombreSeances: number;
  coutParSeance: number;
  montantTotal: number;
  statut: StatutFichePaie;
  affectationIds: string[];
  seances?: SeanceFichePaieItem[];
};

export type BordereauPaieEnseignantDetail = {
  id: string;
  sessionId: string;
  reference: string;
  datePaiement: string;
  nombreTotalEnseignants: number;
  nombreTotalSeances: number;
  montantTotalGlobal: number;
  sortieId?: string | null;
  saisiPar: string;
  fiches: FichePaieEnseignantDetail[];
};

export type SeanceFichePaieItem = {
  affectationId: string;
  semaine: number;
  jour: string;
  creneauSeance: number;
  dateSeance?: string | null;
  horaire?: string | null;
  duree?: string | null;
  centreNom: string;
  formationNom: string;
  matiereNom: string;
  salleNom: string;
  theme?: string | null;
  coutApplique: number;
  statutPaiement: string;
};

export type FichePaieDetail = {
  id: string;
  bordereauPaieId: string;
  referenceBordereau: string;
  datePaiement: string;
  sessionId: string;
  sessionNom: string;
  enseignantId: string;
  enseignantNom: string;
  enseignantPrenom: string;
  enseignantMatricule: string;
  enseignantTelephone: string;
  enseignantEmail: string;
  departementNom: string;
  nombreSeances: number;
  coutParSeance: number;
  montantTotal: number;
  statut: StatutFichePaie;
  saisiPar: string;
  seances: SeanceFichePaieItem[];
};

export type LigneAjustementEnseignantInput = {
  enseignantId: string;
  coutParSeance: number;
  affectationIds?: string[];
};

export type ValiderBordereauEnseignantPayload = {
  datePaiement: string;
  reference?: string;
  intitule?: string;
  lignes: LigneAjustementEnseignantInput[];
  saisiPar?: string;
};

export type FichePaiePersonnel = {
  id: string;
  personnelId: string;
  salaireReference: number;
  montantPaye: number;
  observations?: string | null;
};

export type BordereauPaiePersonnel = {
  id: string;
  sessionId: string;
  reference: string;
  intitule: string;
  datePaiement: string;
  nombrePersonnelsPayes: number;
  montantTotalGlobal: number;
  sortieId?: string | null;
  fiches: FichePaiePersonnel[];
};

export type PaiementPhasePersonnel = {
  ficheId: string;
  bordereauId: string;
  referenceBordereau: string;
  intituleBordereau: string;
  datePaiement: string;
  salaireReference: number;
  montantPaye: number;
  observations?: string | null;
};
