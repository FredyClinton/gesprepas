export type StatutEnseignant = "ACTIF" | "SUSPENDU";

// Miroir de `EnseignantResponse` (backend, module personnel).
export type Enseignant = {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    coutParSeance: number;
    statut: StatutEnseignant;
};