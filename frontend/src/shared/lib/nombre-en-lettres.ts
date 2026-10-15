/**
 * Convertit un montant entier en toutes lettres en français (grammaire usuelle d'Afrique centrale / francophonie).
 * Exemple : 150000 -> "Cent cinquante mille francs CFA"
 */

const UNITES = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const DIZAINES = [
  "",
  "dix",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingt",
  "quatre-vingt-dix",
];

function convertirMoinsDeCent(n: number): string {
  if (n < 20) return UNITES[n];

  const dizaine = Math.floor(n / 10);
  const reste = n % 10;

  if (dizaine === 7) {
    if (reste === 1) return "soixante-et-onze";
    return `soixante-${UNITES[10 + reste]}`;
  }

  if (dizaine === 8) {
    if (reste === 0) return "quatre-vingts";
    return `quatre-vingt-${UNITES[reste]}`;
  }

  if (dizaine === 9) {
    return `quatre-vingt-${UNITES[10 + reste]}`;
  }

  if (reste === 1) {
    return `${DIZAINES[dizaine]}-et-un`;
  }

  if (reste === 0) {
    return DIZAINES[dizaine];
  }

  return `${DIZAINES[dizaine]}-${UNITES[reste]}`;
}

function convertirMoinsDeMille(n: number): string {
  if (n === 0) return "";
  if (n < 100) return convertirMoinsDeCent(n);

  const centaine = Math.floor(n / 100);
  const reste = n % 100;

  let prefix = "";
  if (centaine === 1) {
    prefix = "cent";
  } else if (centaine > 1) {
    prefix = reste === 0 ? `${UNITES[centaine]} cents` : `${UNITES[centaine]} cent`;
  }

  if (reste === 0) return prefix;
  return `${prefix} ${convertirMoinsDeCent(reste)}`;
}

export function nombreEnLettres(montant: number): string {
  if (!montant || isNaN(montant) || montant === 0) {
    return "Zéro franc CFA";
  }

  const positif = Math.abs(Math.round(montant));
  if (positif === 0) return "Zéro franc CFA";

  const milliards = Math.floor(positif / 1_000_000_000);
  const millions = Math.floor((positif % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((positif % 1_000_000) / 1_000);
  const unites = positif % 1_000;

  const morceaux: string[] = [];

  if (milliards > 0) {
    const txt = convertirMoinsDeMille(milliards);
    morceaux.push(milliards > 1 ? `${txt} milliards` : `${txt} milliard`);
  }

  if (millions > 0) {
    const txt = convertirMoinsDeMille(millions);
    morceaux.push(millions > 1 ? `${txt} millions` : `${txt} million`);
  }

  if (milliers > 0) {
    if (milliers === 1) {
      morceaux.push("mille");
    } else {
      morceaux.push(`${convertirMoinsDeMille(milliers)} mille`);
    }
  }

  if (unites > 0) {
    morceaux.push(convertirMoinsDeMille(unites));
  }

  let texte = morceaux.join(" ").trim();
  // Mettre la première lettre en majuscule
  texte = texte.charAt(0).toUpperCase() + texte.slice(1);

  return `${texte} francs CFA`;
}
