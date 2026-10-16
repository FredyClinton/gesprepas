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
  CreerPersonnelInput,
  ModifierPersonnelInput,
  CreerComptePersonnelInput,
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
  useCreerPersonnel,
  useModifierPersonnel,
  useSupprimerPersonnel,
  useCreerComptePourPersonnel,
} from "./data/queries";
export {
  getPersonnel,
  listPersonnel,
  getHistoriqueSalairePersonnel,
  definirSalairePersonnel,
  listAccesPersonnel,
  getAccesPersonnel,
  gererAccesPersonnel,
  creerPersonnel,
  modifierPersonnel,
  supprimerPersonnel,
  creerComptePourPersonnel,
} from "./data/client";
export { enseignantSchema, type EnseignantFormValues } from "./domain/schemas";
export type { CreerEnseignantInput } from "./data/client";
export { CreerPersonnelModal } from "./components/CreerPersonnelModal";
export { ModifierPersonnelModal } from "./components/ModifierPersonnelModal";
export { GestionCompteModal } from "./components/GestionCompteModal";
export { SupprimerPersonnelModal } from "./components/SupprimerPersonnelModal";



