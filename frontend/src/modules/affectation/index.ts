export type {
  Affectation,
  StatutAffectation,
  StatutPaiementAffectation,
  Jour,
  ConflitHoraireResponse,
} from "./domain/types";
export {
  JOURS,
  LABELS_JOUR,
  LABELS_STATUT_PAIEMENT,
  horaireDebutParDefaut,
  horaireFinParDefaut,
} from "./domain/types";
export {
  detecterConflitHoraire,
  verifierChevauchementHoraires,
  type ConflitDetecte,
} from "./domain/conflitHoraire";
export {
  useAffectations,
  useAffectationsMultiMatiere,
  useAffectationsMultiSemaines,
  useAssignerEnseignant,
  useCreerCreneau,
  useModifierMatiere,
  useAnnulerCreneau,
  useMarquerEffectuee,
  useAnnulerEffectuee,
  useSupprimerCreneau,
  useAffectationsParEnseignant,
  useAffectationsParCentre,
  useVerifierConflitHoraire,
} from "./data/queries";
export { verifierConflitHoraire } from "./data/client";
export type { CreerCreneauInput } from "./data/client";
