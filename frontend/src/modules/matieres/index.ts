export type { Matiere } from "./domain/types";
export {
  useMatieres,
  useModifierMatiere,
  useChangerCouleurMatiere,
  useCreerMatiere,
  useSupprimerMatiere,
} from "./data/queries";
export {
  construireCouleursMatieres,
  trouverCouleurParHex,
  isCouleurClaire,
  getContrastingTextColor,
  getCouleurBadgeStyle,
  getCouleurCardStyle,
  PALETTE_COULEURS_SELECTION,
  type CouleurMatiere,
} from "./couleurs";
export { CatalogueMatieresModal } from "./components/CatalogueMatieresModal";
export { GoogleSheetColorPicker } from "./components/GoogleSheetColorPicker";



