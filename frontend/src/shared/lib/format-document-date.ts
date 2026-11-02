/**
 * Utilitaire de formatage standardisé pour les documents imprimés et exportés EXCELIS PRÉPAS.
 * Garantit une cohérence stricte de la date et de l'heure de génération à travers tous les documents.
 */

export function formaterDateHeureGeneration(date?: Date | string | null): string {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  const dateValide = isNaN(d.getTime()) ? new Date() : d;

  const dateLisible = dateValide.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const heureLisible = dateValide.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Généré le ${dateLisible} à ${heureLisible}`;
}

export function formaterDateDocument(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

