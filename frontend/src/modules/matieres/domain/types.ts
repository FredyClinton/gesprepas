// Miroir de `MatiereResponse` (backend, module matiere). Module volontairement
// minimal, comme `salle` : sert uniquement à résoudre les noms de matières (et à en
// dériver une couleur stable) dans la grille de planification. Pas de gestion CRUD
// côté frontend pour l'instant.
export type Matiere = {
  id: string;
  nom: string;
};
