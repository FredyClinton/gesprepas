export type StatutBilan = "EN_ATTENTE_CONTROLEUR" | "CLOTURE";

export type BilanApercu = {
  id: string;
  statut: StatutBilan;
  totalEntrees: number;
  totalSorties: number;
  netAVerser: number;
  effectifNouveauxEleves: number;
  effectifTotalCentre: number;
};

export type RepartitionFormation = {
  formationId: string;
  montant: number;
};
