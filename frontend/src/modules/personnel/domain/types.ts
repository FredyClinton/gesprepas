export type StatutEnseignant = "ACTIF" | "SUSPENDU";

export type Enseignant = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  coutParSeance: number;
  statut: StatutEnseignant;
  telephone?: string | null;
  numeroCni?: string | null;
  email?: string | null;
  ecoleFonction?: string | null;
  niveauGrade?: string | null;
  dateRecrutement?: string | null;
};

export type PersonnelMembre = {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  numeroCni?: string | null;
  email?: string | null;
};

export type HistoriqueSalairePersonnel = {
  id: string;
  personnelId: string;
  sessionId: string;
  salaireReference: number;
  dateDebutEffet: string;
  dateModification: string;
};

export type ResumeSessionEnseignant = {
  sessionId: string;
  libelleSession: string;
  statutSession: string;
  nomsDepartements: string[];
  seancesEffectuees: number;
  seancesTotales: number;
  coutParSeance: number;
};

export type FicheAncienneteEnseignant = {
  enseignantId: string;
  nom: string;
  prenom: string;
  matricule: string;
  statut: StatutEnseignant;
  dateRecrutement: string;
  ancienneteAnnees: number;
  ancienneteMois: number;
  nombreSessionsActives: number;
  historiqueSessions: ResumeSessionEnseignant[];
};

