export type { Enseignant, StatutEnseignant } from "./domain/types";
export {
  useEnseignants,
  useEnseignant,
  useCreerEnseignant,
  useRenommerEnseignant,
  useModifierCoutParSeance,
  useSuspendreEnseignant,
  useReactiverEnseignant,
  useSupprimerEnseignant,
} from "./data/queries";
export { enseignantSchema, type EnseignantFormValues } from "./domain/schemas";
export type { CreerEnseignantInput } from "./data/client";
