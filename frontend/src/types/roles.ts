// Types vraiment transverses à toute l'application (pas propres à un seul module métier).
// Exemple : l'énumération des rôles utilisateur, utilisée par shared/auth et par la
// sidebar pour filtrer la navigation visible.

export type Role =
  "Administrateur" | "Directeur" | "Comptable" | "Enseignant" | "Secretaire";
