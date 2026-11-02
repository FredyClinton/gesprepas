/**
 * Utilitaire de conversion des nombres entiers en toutes lettres (Français)
 * Conçu pour les montants financiers en Francs CFA (XAF).
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
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingts",
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

  if (dizaine === 9) {
    return `quatre-vingt-${UNITES[10 + reste]}`;
  }

  if (dizaine === 8 && reste === 0) {
    return "quatre-vingts";
  }

  if (reste === 0) {
    return DIZAINES[dizaine];
  }

  if (reste === 1 && dizaine < 8) {
    return `${DIZAINES[dizaine]}-et-un`;
  }

  return `${DIZAINES[dizaine]}-${UNITES[reste]}`;
}

function convertirMoinsDeMille(n: number): string {
  if (n === 0) return "";
  if (n < 100) return convertirMoinsDeCent(n);

  const centaine = Math.floor(n / 100);
  const reste = n % 100;

  let prefixe = "";
  if (centaine === 1) {
    prefixe = "cent";
  } else if (centaine > 1) {
    prefixe = `${UNITES[centaine]} cent${reste === 0 ? "s" : ""}`;
  }

  if (reste === 0) return prefixe;
  return `${prefixe} ${convertirMoinsDeCent(reste)}`;
}

export function nombreEnLettres(montant: number): string {
  if (isNaN(montant) || montant === 0) return "zéro";

  const n = Math.floor(Math.abs(montant));
  if (n === 0) return "zéro";

  const milliards = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1_000);
  const unites = n % 1_000;

  const parties: string[] = [];

  if (milliards > 0) {
    parties.push(
      milliards === 1 ? "un milliard" : `${convertirMoinsDeMille(milliards)} milliards`,
    );
  }

  if (millions > 0) {
    parties.push(
      millions === 1 ? "un million" : `${convertirMoinsDeMille(millions)} millions`,
    );
  }

  if (milliers > 0) {
    if (milliers === 1) {
      parties.push("mille");
    } else {
      parties.push(`${convertirMoinsDeMille(milliers)} mille`);
    }
  }

  if (unites > 0) {
    parties.push(convertirMoinsDeMille(unites));
  }

  return parties.join(" ").trim();
}

/**
 * Formate un montant en toutes lettres avec devise Francs CFA
 * Ex: 75000 -> "Soixante-quinze mille Francs CFA"
 */
export function montantEnLettresFCFA(montant: number): string {
  const texte = nombreEnLettres(montant);
  const premiereLettre = texte.charAt(0).toUpperCase();
  return `${premiereLettre}${texte.slice(1)} Francs CFA`;
}
