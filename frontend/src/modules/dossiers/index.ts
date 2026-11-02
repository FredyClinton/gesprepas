export type {
  Dossier,
  StatutDossier,
  Concours,
  PieceRequise,
  DossierConcours,
  PieceDossier,
  StatutPieceDossier,
  SoldeDossierConcours,
  CreerConcoursInput,
  SelectionPieceInput,
  AjouterConcoursAuDossierInput,
  EnregistrerPaiementDossierInput,
  CreerPieceRequiseInput,
  ModifierPieceRequiseInput,
} from "./domain/types";

export {
  useDossiers,
  useDossier,
  useDossierParApprenant,
  useConcoursDuDossier,
  usePiecesDossierConcours,
  useSoldeDossierConcours,
  useConcours,
  useConcoursSession,
  usePiecesDuConcours,
  usePiecesRequises,
  useOuvrirDossier,
  useAjouterConcoursAuDossier,
  useValiderPieceDossier,
  useSignalerDossierComplet,
  useCloturerDossier,
  useRouvrirDossier,
  useModifierObservationDossier,
  useEnregistrerPaiementDossier,
  useCreerConcours,
  useAjouterPieceAuConcours,
  useRetirerPieceDuConcours,
  useCreerPieceRequise,
  useModifierPieceRequise,
  useDesactiverPieceRequise,
  useReactiverPieceRequise,
} from "./data/queries";

export { listConcoursDuDossier } from "./data/client";

export {
  useCreerDossierInscription,
  type CreerDossierInscriptionInput,
  type DossierInscription,
} from "./data/dossier-inscription.api";

export { SouscrireDossierModal } from "./components/SouscrireDossierModal";
export { EnregistrerPaiementDossierModal } from "./components/EnregistrerPaiementDossierModal";
export { CreerConcoursModal } from "./components/CreerConcoursModal";
export { CreerModifierPieceModal } from "./components/CreerModifierPieceModal";
export { GererPiecesConcoursModal } from "./components/GererPiecesConcoursModal";
export { ProgressionPiecesDossierCell } from "./components/ProgressionPiecesDossierCell";
export { DateLimiteDepotDossierCell } from "./components/DateLimiteDepotDossierCell";
export { calculerCompteARebours, type CompteARebours } from "./domain/countdown";
