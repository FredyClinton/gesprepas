export type StatutCentre = "OUVERT" | "FERME";


export type Centre = {
    id: string;
    nom: string;
    statut: StatutCentre;
    adresseActuelle: string;
    villeActuelle: string;
    sessionIds: string[];
};


export type StatutSession = "PLANIFIEE" | "EN_COURS" | "CLOTUREE";


export type SessionAcademique = {
    id: string;
    annee: string;
    dateDebut: string;
    dateFin: string;
    statut: StatutSession;
};