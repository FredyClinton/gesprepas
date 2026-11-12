// Filtres de période des écrans financiers (grand livre, décaissements), traduits
// en bornes de dates ISO (yyyy-mm-dd, date locale) pour la recherche serveur.

export type PeriodeFiltre =
  "AUJOURDHUI" | "HIER" | "7_JOURS" | "MOIS" | "DATE_SPECIFIQUE" | "TOUS";

function isoLocal(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function bornesPeriode(
  periode: PeriodeFiltre,
  dateSpecifique?: string,
): { dateDebut?: string; dateFin?: string } {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  switch (periode) {
    case "AUJOURDHUI": {
      const jour = isoLocal(aujourdhui);
      return { dateDebut: jour, dateFin: jour };
    }
    case "HIER": {
      const hier = new Date(aujourdhui);
      hier.setDate(hier.getDate() - 1);
      const jour = isoLocal(hier);
      return { dateDebut: jour, dateFin: jour };
    }
    case "7_JOURS": {
      const debut = new Date(aujourdhui);
      debut.setDate(debut.getDate() - 7);
      return { dateDebut: isoLocal(debut) };
    }
    case "MOIS":
      return {
        dateDebut: isoLocal(
          new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1),
        ),
      };
    case "DATE_SPECIFIQUE":
      return dateSpecifique
        ? { dateDebut: dateSpecifique, dateFin: dateSpecifique }
        : {};
    case "TOUS":
      return {};
  }
}
