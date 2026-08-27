// Tokens de la charte graphique EXCELIS PRÉPAS.
// Source de vérité unique pour ces couleurs : elles sont déclarées ici puis reprises
// comme tokens Tailwind (`brand.*`) dans `src/app/globals.css` (@theme). Ne jamais
// utiliser ces valeurs hexadécimales directement dans le code — passer par les classes
// Tailwind `bg-brand-orange`, `text-brand-anthracite`, etc.
export const brandColors = {
  orange: "#F7931E", // actions principales
  anthracite: "#1A1A1A", // navigation, en-têtes, texte fort
  blue: "#2D2E80", // accent secondaire
  white: "#FFFFFF", // fonds
  gray: "#606060", // texte secondaire, désactivé
  black: "#000000", // texte fort
} as const;
