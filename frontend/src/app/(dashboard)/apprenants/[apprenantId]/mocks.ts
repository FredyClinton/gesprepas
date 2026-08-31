import type { StatutMouvement } from "@/modules/financier";

// Données de démonstration pour les champs pas encore exposés par l'API backend.
// Chaque export ici correspond à un point d'intégration futur — supprimer la
// fonction/constante et la remplacer par le vrai hook/champ dès que le backend
// l'expose (voir les commentaires "MOCK —" à chaque site d'utilisation).

export const MOCK_COORDONNEES = {
  email: "jpkamgang@email.com",
  telephone: "+237 6 90 00 00 00",
  adresseResidence: "Quartier Biyem-Assi, Yaoundé",
  lieuNaissance: "Douala, Cameroun",
};

export const MOCK_TUTEUR = {
  nom: "M. Paul KAMGANG (Père)",
  contact: "+237 6 77 11 22 33",
  profession: "Ingénieur Civil",
};

const MODES_VERSEMENT = ["Espèces", "Virement", "Mobile Money"] as const;

// Déterministe (basé sur l'id) plutôt qu'aléatoire, pour ne pas changer de valeur
// à chaque re-rendu tant que le vrai champ "mode" n'existe pas côté Entree.
export function modeVersementMock(entreeId: string): string {
  let hash = 0;
  for (let i = 0; i < entreeId.length; i++) {
    hash = (hash * 31 + entreeId.charCodeAt(i)) % MODES_VERSEMENT.length;
  }
  return MODES_VERSEMENT[Math.abs(hash) % MODES_VERSEMENT.length];
}

export type VersementMock = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  mode: string;
  statut: StatutMouvement;
};

// Utilisé quand l'apprenant affiché n'a pas encore de versement réel en base
// (environnement de dev vide) — permet de voir le tableau "Historique des
// versements" dans son état final attendu. Voir ContratEtPaiementsTab.
export const MOCK_VERSEMENTS: VersementMock[] = [
  {
    id: "mock-versement-1",
    date: "2026-08-01",
    libelle: "Frais d'inscription",
    montant: 250000,
    mode: "Espèces",
    statut: "VALIDE",
  },
  {
    id: "mock-versement-2",
    date: "2026-08-15",
    libelle: "Tranche 1",
    montant: 300000,
    mode: "Virement",
    statut: "VALIDE",
  },
  {
    id: "mock-versement-3",
    date: "2026-08-27",
    libelle: "Tranche 2",
    montant: 300000,
    mode: "Mobile Money",
    statut: "EN_ATTENTE",
  },
];

export type TypeSeance = "PRESENT" | "ABSENCE" | "RETARD";
export type StatutJustification = "NON_JUSTIFIE" | "ACCEPTEE" | "EN_ATTENTE";

export type LigneSeanceMock = {
  date: string;
  seance: string;
  type: TypeSeance;
  // Sans objet pour une séance PRESENT — pas de justification à donner.
  justification: StatutJustification | null;
};

export const MOCK_PRESENCE = {
  tauxPresence: 92,
  seancesSuivies: 68,
  seancesTotal: 74,
  presences: 62,
  absences: 8,
  retards: 4,
  historique: [
    {
      date: "2026-08-24",
      seance: "Mathématiques - Algèbre",
      type: "PRESENT",
      justification: null,
    },
    {
      date: "2026-08-21",
      seance: "Physique - Optique",
      type: "PRESENT",
      justification: null,
    },
    {
      date: "2026-08-20",
      seance: "Mathématiques - Algèbre",
      type: "ABSENCE",
      justification: "NON_JUSTIFIE",
    },
    {
      date: "2026-08-17",
      seance: "Physique - Optique",
      type: "RETARD",
      justification: "ACCEPTEE",
    },
    {
      date: "2026-08-14",
      seance: "Anglais Technique",
      type: "PRESENT",
      justification: null,
    },
    {
      date: "2026-08-12",
      seance: "Anglais Technique",
      type: "ABSENCE",
      justification: "EN_ATTENTE",
    },
    {
      date: "2026-08-05",
      seance: "Chimie Organique",
      type: "RETARD",
      justification: "ACCEPTEE",
    },
    {
      date: "2026-07-29",
      seance: "Mathématiques - Algèbre",
      type: "ABSENCE",
      justification: "NON_JUSTIFIE",
    },
  ] satisfies LigneSeanceMock[],
};

export type StatutPieceMock = "EN_ATTENTE" | "VALIDEE";

export type ConcoursRattacheMock = {
  nom: string;
  centreNom: string;
  sessionAnnee: string;
  dateAjout: string;
  montantPaye: number;
  soldeRestant: number;
  pieces: { nom: string; quantite: number; statut: StatutPieceMock }[];
};

// Utilisé quand l'apprenant affiché n'a pas encore de dossier réel en base
// (environnement de dev vide) — permet de voir l'onglet dans son état final
// attendu. Voir DossierAdministratifTab.
export const MOCK_DOSSIER = {
  statut: "OUVERT" as const,
  dateOuverture: "2026-08-01",
  observation: null as string | null,
  concours: [
    {
      nom: "Concours Polytechnique",
      centreNom: "Yaoundé 1",
      sessionAnnee: "2024",
      dateAjout: "2026-08-03",
      montantPaye: 45000,
      soldeRestant: 15000,
      pieces: [
        { nom: "Acte de naissance", quantite: 1, statut: "VALIDEE" },
        { nom: "Diplôme (Baccalauréat)", quantite: 1, statut: "VALIDEE" },
        { nom: "Photos d'identité", quantite: 4, statut: "EN_ATTENTE" },
      ],
    },
    {
      nom: "Concours FGCI",
      centreNom: "Douala",
      sessionAnnee: "2024",
      dateAjout: "2026-08-10",
      montantPaye: 12000,
      soldeRestant: 33000,
      pieces: [
        { nom: "Acte de naissance", quantite: 1, statut: "VALIDEE" },
        { nom: "Diplôme (Baccalauréat)", quantite: 1, statut: "EN_ATTENTE" },
        { nom: "Quittance de paiement", quantite: 1, statut: "EN_ATTENTE" },
      ],
    },
  ] satisfies ConcoursRattacheMock[],
};
