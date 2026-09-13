export type { Formation } from "./domain/types";
export {
  useFormations,
  useFormation,
  useCreateFormation,
  useRenommerFormation,
  useSupprimerFormation,
  useAssocierMatiereFormation,
  useDissocierMatiereFormation,
  useMatieresFormation,
} from "./data/queries";
export { formationSchema, type FormationFormValues } from "./domain/schemas";
export type { Phase } from "./data/phases";
export { usePhases, listPhases } from "./data/phases";
export { SelecteurEtablissement } from "./components/SelecteurEtablissement";
export {
  useEtablissements,
  useEnregistrerEtablissement,
  listEtablissements,
  creerEtablissement,
  type Etablissement,
} from "./data/etablissements";

