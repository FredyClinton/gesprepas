export type { Salle } from "./domain/types";
export {
  useSalles,
  useCreateSalle,
  useRenommerSalle,
  useReaffecterFormationSalle,
  useSupprimerSalle,
} from "./data/queries";
export { salleSchema, type SalleFormValues } from "./domain/schemas";
