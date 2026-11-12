// Contrat commun des listes paginées côté serveur (PageResponse du backend) et
// utilitaires associés. Les pages sont 0-based côté API ; l'UI affiche 1-based.

export type PageResponse<T> = {
  contenu: T[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
};

export type SensTri = "ASC" | "DESC";

// Taille de page des écrans de liste.
export const TAILLE_PAGE_LISTE = 20;

// Taille maximale acceptée par le backend (PageDemandee.TAILLE_MAX) : sert aux
// exports/impressions qui ont besoin de toute la sélection filtrée.
export const TAILLE_PAGE_EXPORT = 500;

// Construit une query string en ignorant les valeurs vides (undefined, null, "",
// "TOUS"), pour ne pas envoyer de filtre "neutre" au backend.
export function construireParams(
  valeurs: Record<string, string | number | undefined | null>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur === undefined || valeur === null) continue;
    const texte = String(valeur);
    if (texte.trim() === "" || texte === "TOUS") continue;
    params.set(cle, texte);
  }
  return params;
}

// Charge toutes les pages d'une recherche paginée (export CSV, impression),
// page par page à la taille maximale autorisée.
export async function chargerToutesLesPages<T>(
  chargerPage: (page: number, taille: number) => Promise<PageResponse<T>>,
): Promise<T[]> {
  const premiere = await chargerPage(0, TAILLE_PAGE_EXPORT);
  const elements = [...premiere.contenu];
  for (let page = 1; page < premiere.totalPages; page++) {
    const suivante = await chargerPage(page, TAILLE_PAGE_EXPORT);
    elements.push(...suivante.contenu);
  }
  return elements;
}
