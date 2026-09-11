export type { Departement } from "./domain/types";
export {
  useDepartement,
  useDepartements,
  useCreerDepartement,
  useRenommerDepartement,
  useSupprimerDepartement,
  useAssignerChefDepartement,
} from "./data/queries";
export { assignerChefDepartement } from "./data/client";
