// Types vraiment transverses à toute l'application (pas propres à un seul module métier).
// Rôles applicatifs : miroir exact de `RoleUtilisateur` côté backend
// (com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur). Jackson sérialise
// l'enum Java par son nom -> les valeurs ci-dessous doivent rester en UPPER_SNAKE_CASE,
// identiques à l'enum backend. Enseignant et Apprenant ne figurent pas ici : ce sont des
// rôles passifs (dossiers gérés par d'autres rôles), ils ne se connectent pas à l'appli.
export type Role =
  | "DIRECTEUR"
  | "DIRECTEUR_ACADEMIQUE"
  | "CHEF_CENTRE"
  | "CHEF_DEPARTEMENT"
  | "CHARGE_DOSSIER"
  | "SUPERVISEUR_DOSSIERS"
  | "CAISSIER"
  | "COMPTABLE";

// Libellés d'affichage FR. Note : le rôle backend `COMPTABLE` correspond au
// "Contrôleur financier principal" du modèle métier (10 rôles) — nom de code hérité de
// l'implémentation initiale du module Personnel. À renommer côté backend si besoin un jour ;
// en attendant, l'écart de nom entre code et vocabulaire métier est assumé ici.
export const ROLE_LABELS: Record<Role, string> = {
  DIRECTEUR: "Directeur",
  DIRECTEUR_ACADEMIQUE: "Directeur académique",
  CHEF_CENTRE: "Chef de centre",
  CHEF_DEPARTEMENT: "Chef de département",
  CHARGE_DOSSIER: "Chargé des dossiers",
  SUPERVISEUR_DOSSIERS: "Superviseur des dossiers",
  CAISSIER: "Caissier",
  COMPTABLE: "Contrôleur financier principal",
};

// Rôles dont le périmètre est limité à un centre (RoleUtilisateur.estCentreScope() côté
// backend) — utile pour savoir si on doit afficher/résoudre un nom de centre dans l'UI.
export const CENTRE_SCOPE_ROLES: ReadonlySet<Role> = new Set([
  "CHEF_CENTRE",
  "CHARGE_DOSSIER",
  "CAISSIER",
]);
