export type {
  Enseignant,
  StatutEnseignant,
  FicheAncienneteEnseignant,
  ResumeSessionEnseignant,
  PersonnelMembre,
  HistoriqueSalairePersonnel,
} from "./domain/types";
export {
  useEnseignants,
  useEnseignant,
  useAncienneteEnseignant,
  useCreerEnseignant,
  useRenommerEnseignant,
  useModifierCoutParSeance,
  useSuspendreEnseignant,
  useReactiverEnseignant,
  useSupprimerEnseignant,
  usePersonnel,
  usePersonnelList,
  useHistoriqueSalairePersonnel,
  useDefinirSalairePersonnel,
} from "./data/queries";
export {
  getPersonnel,
  listPersonnel,
  getHistoriqueSalairePersonnel,
  definirSalairePersonnel,
} from "./data/client";
export { enseignantSchema, type EnseignantFormValues } from "./domain/schemas";
export type { CreerEnseignantInput } from "./data/client";

