export type {
  Affectation,
  StatutAffectation,
  StatutPaiementAffectation,
  Jour,
} from "./domain/types";
export { JOURS, LABELS_JOUR, LABELS_STATUT_PAIEMENT } from "./domain/types";
export {
  useAffectations,
  useAffectationsMultiMatiere,
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
