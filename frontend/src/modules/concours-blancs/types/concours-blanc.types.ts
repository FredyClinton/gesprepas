export type StatutConcoursBlanc = "PROGRAMME" | "EN_COURS" | "PUBLIE" | "CLOTURE";
export type StatutNote = "NOTE" | "ABS" | "DISP";
export type JourSemaine = "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI";

export interface EpreuveConcoursBlanc {
  id: string;
  concoursBlancId: string;
  formationId: string;
  matiereId: string;
  intitule: string;
  dureeMinutes: number;
  noteMax: number;
  coefficient: number;
  contenuEvaluation?: string | null;
  consignes?: string | null;
}

export interface ConcoursBlanc {
  id: string;
  sessionId: string;
  titre: string;
  numero: number;
  dateEpreuve: string; // YYYY-MM-DD
  jour: JourSemaine;
  semaine: number;
  statut: StatutConcoursBlanc;
  seanceDebut: number;
  seanceFin: number;
  tousLesCentres: boolean;
  centreIds: string[];
  saisieNotesBloqueeCentre: boolean;
  epreuves: EpreuveConcoursBlanc[];
}

export interface NoteDetail {
  epreuveId: string;
  note?: number | null;
  statut: StatutNote;
}

export interface ResultatCandidat {
  id: string;
  concoursBlancId: string;
  formationId: string;
  centreId: string;
  apprenantId?: string | null;
  nomComplet: string;
  etablissementOrigine?: string | null;
  horsListe: boolean;
  notes: NoteDetail[];
  totalPondere?: number | null;
  moyennePonderee?: number | null;
  rang?: number | null;
  rangCentre?: number | null;
  deltaRang?: number | null; // e.g. +2, -1, 0, null
}

export interface BordereauResultats {
  concoursBlanc: ConcoursBlanc;
  formationId: string;
  epreuves: EpreuveConcoursBlanc[];
  meilleuresNotesParEpreuve: Record<string, number>;
  candidats: ResultatCandidat[];
}

export interface CreerEpreuveInput {
  formationId: string;
  matiereId: string;
  intitule?: string;
  dureeMinutes: number;
  noteMax: number;
  coefficient: number;
}

export interface CreerConcoursBlancPayload {
  sessionId: string;
  titre: string;
  numero: number;
  dateEpreuve: string;
  jour: JourSemaine;
  semaine: number;
  seanceDebut: number;
  seanceFin: number;
  tousLesCentres?: boolean;
  centreIds?: string[];
  epreuves: CreerEpreuveInput[];
}

export type ModifierConcoursBlancPayload = Omit<CreerConcoursBlancPayload, "sessionId">;

export interface DefinirContenuEpreuvePayload {
  contenuEvaluation?: string;
  consignes?: string;
}

export interface NoteInput {
  epreuveId: string;
  note?: number | null;
  statut: StatutNote;
}

export interface CandidatNotesInput {
  id?: string;
  formationId: string;
  apprenantId?: string | null;
  nomComplet: string;
  etablissementOrigine?: string | null;
  horsListe: boolean;
  notes: NoteInput[];
}

export interface EnregistrerNotesPayload {
  centreId: string;
  candidats: CandidatNotesInput[];
}

