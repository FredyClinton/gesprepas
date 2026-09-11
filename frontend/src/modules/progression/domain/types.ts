export interface Progression {
  id: string;
  formationId: string;
  sessionId: string;
  phaseId: string;
  matiereId: string;
  semaine: number;
  numeroCours: number;
  theme: string;
  contenu: string;
  exercices?: string | null;
}

export interface CreerProgressionPayload {
  formationId: string;
  sessionId: string;
  phaseId: string;
  matiereId: string;
  semaine: number;
  numeroCours: number;
  theme: string;
  contenu: string;
  exercices?: string | null;
}

export interface MettreAJourContenuPayload {
  theme: string;
  contenu: string;
  exercices?: string | null;
}
