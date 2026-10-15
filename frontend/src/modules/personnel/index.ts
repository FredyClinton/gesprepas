export type {
  Enseignant,
  StatutEnseignant,
  FicheAncienneteEnseignant,
  ResumeSessionEnseignant,
  PersonnelMembre,
  HistoriqueSalairePersonnel,
  StatutAcces,
  AccesPersonnel,
  GererAccesInput,
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
  useAccesPersonnelList,
  useAccesPersonnelMembre,
  useGererAccesPersonnel,
} from "./data/queries";
export {
  getPersonnel,
  listPersonnel,
  getHistoriqueSalairePersonnel,
  definirSalairePersonnel,
  listAccesPersonnel,
  getAccesPersonnel,
  gererAccesPersonnel,
} from "./data/client";
export { enseignantSchema, type EnseignantFormValues } from "./domain/schemas";
export type { CreerEnseignantInput } from "./data/client";

