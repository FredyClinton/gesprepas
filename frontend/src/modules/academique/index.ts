export type { Formation } from "./domain/types";
export {
  useFormations,
  useCreateFormation,
  useRenommerFormation,
  useSupprimerFormation,
} from "./data/queries";
export { formationSchema, type FormationFormValues } from "./domain/schemas";
