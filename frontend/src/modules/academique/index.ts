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

