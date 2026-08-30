// Miroir de `SalleResponse` (backend, module salle). Module volontairement minimal
// pour l'instant : seule la résolution de nom (affichage dans les tableaux de
// créneaux) est nécessaire aujourd'hui — pas encore de gestion CRUD des salles
// côté frontend (l'écran /salles du Chef de Centre n'est pas encore construit).
export type Salle = {
  id: string;
  nom: string;
  centreId: string;
  sessionId: string;
  formationId: string;
};
