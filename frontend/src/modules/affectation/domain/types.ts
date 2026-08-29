// Miroir de `StatutAffectation` / `AffectationResponse` (backend, module
// affectation) : un créneau (salle/matière/séance/semaine) au sein d'une formation,
// avec ou sans enseignant assigné. `semaine` est un entier positif simple (numéro
// de semaine relatif à la session), pas une semaine calendaire ISO — aucun endpoint
// ne fournit de correspondance date <-> semaine côté backend.
export type StatutAffectation = "PLANIFIEE" | "ASSIGNEE" | "EFFECTUEE" | "ANNULEE";

export type Affectation = {
    id: string;
    centreId: string;
    sessionId: string;
    formationId: string;
    salleId: string;
    matiereId: string;
    enseignantId: string | null;
    seance: number;
    semaine: number;
    statut: StatutAffectation;
};