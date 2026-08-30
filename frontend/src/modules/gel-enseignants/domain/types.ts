// Champ dateFin en ISO 8601 (Instant sérialisé par Jackson côté backend), ou null si le
// gel n'a pas de date de fin (reste actif jusqu'à désactivation manuelle par le DA).
export type GelEnseignants = {
  actif: boolean;
  dateFin: string | null;
  effectif: boolean;
};
