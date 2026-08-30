// Miroir de `StatutAffectation` / `Jour` / `AffectationResponse` (backend, module
// affectation) : un créneau (salle/matière/jour/séance/semaine) au sein d'une
// formation, avec ou sans enseignant assigné. `semaine` est un entier positif simple
// (numéro de semaine relatif à la session), pas une semaine calendaire ISO — aucun
// endpoint ne fournit de correspondance date <-> semaine côté backend. `jour` est en
// revanche un vrai jour fixe (Lundi→Samedi), indépendant de `seance`.
export type StatutAffectation =
  "PLANIFIEE" | "ASSIGNEE" | "EFFECTUEE" | "ANNULEE";

export type Jour =
  "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI";

// Ordre d'affichage fixe (Lundi→Samedi) — mêmes valeurs que l'enum backend.
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
};
