export type StatutEnseignant = "ACTIF" | "SUSPENDU";

export type Enseignant = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  coutParSeance: number;
  statut: StatutEnseignant;
};
