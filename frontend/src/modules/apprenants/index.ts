export type { Apprenant } from "./domain/types";
export { useApprenants, useApprenant, useCreerApprenant, useModifierApprenant } from "./data/queries";
export { apprenantSchema, type ApprenantFormValues } from "./domain/schemas";
export type { CreerApprenantInput, ModifierApprenantInput } from "./data/client";
export {
  useCursusApprenant,
  useCreerContratPhase,
  useChangerFormationPhase,
  type ContratApprenant,
  type InscriptionPhase,
  type CursusApprenant,
  type CreerContratPhasePayload,
} from "./data/cursus.api";
export { ModifierApprenantModal } from "./components/ModifierApprenantModal";
