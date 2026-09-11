export type {
  Progression,
  CreerProgressionPayload,
  MettreAJourContenuPayload,
  TypeProgression,
} from "./domain/types";
export { decomposerTheme, recomposerTheme } from "./domain/types";
export {
  useProgressions,
  useCreerProgression,
  useMettreAJourContenuProgression,
  useSupprimerProgression,
  useCreerProgressionsLot,
} from "./data/queries";
export { ProgressionFormModal } from "./components/ProgressionFormModal";
export type { PrefillProgression } from "./components/ProgressionFormModal";
export { JournalProgression } from "./components/JournalProgression";
export { SyllabusFiliereView } from "./components/SyllabusFiliereView";
export { SyllabusMultiMatieresView } from "./components/SyllabusMultiMatieresView";
export { SaisieLotModal } from "./components/SaisieLotModal";
export { DupliquerSyllabusModal } from "./components/DupliquerSyllabusModal";
export {
  construireMappingAffectationsProgressions,
  type InfoProgressionAffectation,
} from "./domain/mapping";
export { useProgressionQuotas } from "./hooks/useProgressionQuotas";
