// Miroir de `StatutAffectation` / `Jour` / `AffectationResponse` (backend, module
// affectation) : un créneau (salle/matière/jour/séance/semaine) au sein d'une
// formation, avec ou sans enseignant assigné. `semaine` est un entier positif simple
// (numéro de semaine relatif à la session), pas une semaine calendaire ISO - aucun
// endpoint ne fournit de correspondance date <-> semaine côté backend. `jour` est en
// revanche un vrai jour fixe (Lundi→Samedi), indépendant de `seance`.
export type StatutAffectation =
  "PLANIFIEE" | "ASSIGNEE" | "EFFECTUEE" | "ANNULEE";

export type StatutPaiementAffectation = "NON_PAYEE" | "PROGRAMMEE" | "PAYEE";

export const LABELS_STATUT_PAIEMENT: Record<StatutPaiementAffectation, string> = {
  NON_PAYEE: "Non payée",
  PROGRAMMEE: "Programmée",
  PAYEE: "Payée",
};

export type Jour =
  "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI";

// Ordre d'affichage fixe (Lundi→Samedi) - mêmes valeurs que l'enum backend.
export const JOURS: Jour[] = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
];

export const LABELS_JOUR: Record<Jour, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
};

export type Affectation = {
  id: string;
  centreId: string;
  sessionId: string;
  formationId: string;
  salleId: string;
  matiereId: string;
  enseignantId: string | null;
  jour: Jour;
  seance: number;
  semaine: number;
  statut: StatutAffectation;
  statutPaiement?: StatutPaiementAffectation;
  coutApplique?: number | null;
  fichePaieId?: string | null;
  dateSeance?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
};

export type ConflitHoraireResponse = {
  conflit: boolean;
  message?: string | null;
  affectationExistanteId?: string | null;
  dateSeance?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
  centreId?: string | null;
  centreNom?: string | null;
  formationId?: string | null;
  formationNom?: string | null;
  matiereId?: string | null;
  matiereNom?: string | null;
};

export function horaireDebutParDefaut(seance: number): string {
  switch (seance) {
    case 1:
      return "08:00";
    case 2:
      return "10:45";
    case 3:
      return "14:00";
    case 4:
      return "16:45";
    default: {
      const minutes = 8 * 60 + Math.max(0, seance - 1) * 165;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
}

export function horaireFinParDefaut(seance: number): string {
  switch (seance) {
    case 1:
      return "10:30";
    case 2:
      return "13:15";
    case 3:
      return "16:30";
    case 4:
      return "19:15";
    default: {
      const minutes = 8 * 60 + Math.max(0, seance - 1) * 165 + 150;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
}
