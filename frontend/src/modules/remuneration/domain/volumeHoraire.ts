// Une séance de cours dure 2h30 (voir RemunerationService#construireSeanceItem côté
// backend, seule source de vérité pour les horaires de créneau). Le volume horaire
// affiché dans les bordereaux/bulletins/dashboards de charge doit toujours dériver de
// cette même durée - ne jamais recalculer avec un autre facteur ailleurs dans le code.
export const DUREE_SEANCE_HEURES = 2.5;

export function volumeHoraireTotal(nombreSeances: number): number {
  return nombreSeances * DUREE_SEANCE_HEURES;
}

export function formatVolumeHoraire(nombreSeances: number): string {
  const totalMinutes = Math.round(nombreSeances * DUREE_SEANCE_HEURES * 60);
  const heures = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${heures}h${minutes.toString().padStart(2, "0")}`;
}
