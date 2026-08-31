// `Affectation.semaine` est un entier positif simple côté backend (numéro de
// semaine relatif au début de la session), pas une semaine calendaire ISO — aucun
// endpoint ne fait la correspondance date <-> semaine. On calcule donc la "semaine
// courante" nous-mêmes, à partir de dateDebut/dateFin de la session active, plafonnée
// à la durée réelle de la session — sinon une session restée EN_COURS après sa
// dateFin (ex: données de seed non rafraîchies) ferait grimper le numéro de semaine
// indéfiniment au fil du temps système, sans rapport avec la session elle-même.
export function semaineCouranteDepuis(
  dateDebut: string,
  dateFin: string,
): number {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const maintenant = new Date();
  const bornee =
    maintenant < debut ? debut : maintenant > fin ? fin : maintenant;
  const joursEcoules = Math.floor(
    (bornee.getTime() - debut.getTime()) / 86_400_000,
  );
  return Math.max(1, Math.floor(joursEcoules / 7) + 1);
}

// Nombre total de semaines de la session, sans plafonner par "aujourd'hui" — utile
// pour les écrans de planification où on doit pouvoir naviguer sur des semaines
// futures (construire le planning à l'avance), contrairement à un tableau de bord
// qui ne regarde que jusqu'à la semaine en cours.
export function semaineTotaleSession(
  dateDebut: string,
  dateFin: string,
): number {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const jours = Math.floor((fin.getTime() - debut.getTime()) / 86_400_000);
  return Math.max(1, Math.floor(jours / 7) + 1);
}

// Inverse de semaineCouranteDepuis : convertit le couple (semaine, jourIndex) d'une
// séance en date calendaire réelle, à partir de la date de début de session.
// jourIndex = index dans JOURS (0 = Lundi ... 5 = Samedi, voir
// modules/affectation), même ordre que l'enum backend Jour.
export function dateSeance(
  dateDebut: string,
  semaine: number,
  jourIndex: number,
): Date {
  const debut = new Date(dateDebut);
  const decalageJours = (semaine - 1) * 7 + jourIndex;
  return new Date(debut.getTime() + decalageJours * 86_400_000);
}
