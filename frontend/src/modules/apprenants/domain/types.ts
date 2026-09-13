export type Apprenant = {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateInscription: string;
  montantContrat: number;
  dateDefinitionContrat?: string;
  centreId: string;
  sessionId: string;
  formationId: string;
  etablissementOrigine?: string;
  contactApprenant?: string;
  nomParent?: string;
  contactParent?: string;
  preInscrit?: boolean;
  referenceRecu?: string;
};

