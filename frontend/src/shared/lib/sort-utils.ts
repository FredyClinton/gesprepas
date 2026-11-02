/**
 * Utilitaires de tri normalisés pour les tableaux ERP EXCELIS PRÉPAS
 * Gère rigoureusement :
 * - Chaînes en français avec accents et insensibilité à la casse (localeCompare fr-FR)
 * - Nombres et montants financiers XAF (tri arithmétique exact)
 * - Dates (ISO string ou Date object, comparaison par timestamp millisecondes)
 * - Traitement des valeurs nulles/indéfinies (placées à la fin de la liste)
 */

export type SortDirection = "asc" | "desc";

export function compareStrings(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  if (!a && !b) return 0;
  if (!a) return 1; // nulls à la fin
  if (!b) return -1;
  return a.localeCompare(b, "fr-FR", { sensitivity: "base", numeric: true });
}

export function compareNumbers(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  const valA = a === null || a === undefined || isNaN(a) ? -Infinity : a;
  const valB = b === null || b === undefined || isNaN(b) ? -Infinity : b;
  if (valA === -Infinity && valB === -Infinity) return 0;
  if (valA === -Infinity) return 1;
  if (valB === -Infinity) return -1;
  return valA - valB;
}

export function compareDates(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined,
): number {
  const timeA = a ? new Date(a).getTime() : 0;
  const timeB = b ? new Date(b).getTime() : 0;
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeA - timeB;
}
