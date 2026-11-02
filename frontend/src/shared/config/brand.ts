// Tokens de la charte graphique EXCELIS PRÉPAS.
// Source de vérité unique pour ces couleurs : elles sont déclarées ici puis reprises
// comme tokens Tailwind (`brand.*`) dans `src/app/globals.css` (@theme). Ne jamais
// utiliser ces valeurs hexadécimales directement dans le code - passer par les classes
// Tailwind `bg-brand-orange`, `text-brand-anthracite`, etc.
export const brandColors = {
  // Charte principale officielle EXCELIS PRÉPAS
  orange: "#F7931E", // Actions principales, éléments actifs et accents visuels
  blue: "#2D2E80", // Bleu pourpre secondaire : navigation, actions secondaires, accents institutionnels
  anthracite: "#1A1A1A", // Textes principaux, en-têtes et éléments structurels
  black: "#000000", // Usages spécifiques et stricts de la charte
  white: "#FFFFFF", // Surfaces de contenu, cartes et fond principal
  gray: "#606060", // Textes secondaires, sous-titres et états discrets

  // Variantes secondaires et de bordures humaines (warm stone / grès)
  border: "#E7E5E4", // bordure standard chaude et discrète
  borderLight: "#F5F5F4", // bordure subtile
  surfaceMuted: "#FAFAF9", // fond secondaire chaleureux

  // Validation humaine (tonalités nobles, végétales et minérales - non fluorescentes)
  success: "#2D6A4F", // vert laurier / forêt
  successBg: "#F0F7F3",
  successBorder: "#C0DEC8",
  successText: "#1B4332",

  warning: "#B45309", // ocre miel chaleureux
  warningBg: "#FCF8EF",
  warningBorder: "#F4DCB1",
  warningText: "#78350F",

  danger: "#991B1B", // bordeaux / terre cuite
  dangerBg: "#FDF3F3",
  dangerBorder: "#F6CFCF",
  dangerText: "#7F1D1D",

  info: "#1E3A8A", // bleu nuit ardoise
  infoBg: "#F0F4F9",
  infoBorder: "#D2E0F4",
  infoText: "#1E3A5F",
} as const;
