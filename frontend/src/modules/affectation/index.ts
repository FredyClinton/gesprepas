export type { Affectation, StatutAffectation, Jour } from "./domain/types";
export { JOURS, LABELS_JOUR } from "./domain/types";
export {
  useAffectations,
  useAssignerEnseignant,
  useCreerCreneau,
  useModifierMatiere,
  useAnnulerCreneau,
  useMarquerEffectuee,
  useAnnulerEffectuee,
  useSupprimerCreneau,
  useAffectationsParEnseignant,
} from "./data/queries";
export type { CreerCreneauInput } from "./data/client";
