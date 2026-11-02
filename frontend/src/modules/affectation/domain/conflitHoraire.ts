import type { Affectation } from "./types";
import { horaireDebutParDefaut, horaireFinParDefaut } from "./types";

export type ConflitDetecte = {
  enConflit: boolean;
  message?: string;
  affectationExistante?: Affectation;
  details?: {
    dateStr: string;
    debutStr: string;
    finStr: string;
    centreNom: string;
    formationNom: string;
    matiereNom?: string;
  };
};

function normaliserDate(date: Date | string): string {
  if (typeof date === "string") {
    // Si format ISO ou YYYY-MM-DD
    return date.split("T")[0];
  }
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function formaterDateFr(dateIso: string): string {
  const parties = dateIso.split("-");
  if (parties.length === 3) {
    return `${parties[2]}/${parties[1]}/${parties[0]}`;
  }
  return dateIso;
}

function formaterHeureFr(heure: string): string {
  // Entrée "08:00" ou "08:00:00" -> "08h00"
  const parties = heure.split(":");
  if (parties.length >= 2) {
    return `${parties[0]}h${parties[1]}`;
  }
  return heure;
}

function normaliserHeure(heure: string): string {
  // Assure le format HH:mm pour comparaison lexicale
  const parties = heure.split(":");
  return `${parties[0].padStart(2, "0")}:${parties[1].padStart(2, "0")}`;
}

/**
 * Règle mathématique stricte de détection des chevauchements d'horaires :
 * nouveauDebut < seanceExistanteFin AND nouveauFin > seanceExistanteDebut
 *
 * Fonctionne avec des intervalles semi-ouverts [debut, fin[ :
 * une séance qui se termine à 10h00 ne chevauche pas une séance qui commence à 10h00.
 */
export function verifierChevauchementHoraires(
  debutA: string,
  finA: string,
  debutB: string,
  finB: string,
): boolean {
  const dA = normaliserHeure(debutA);
  const fA = normaliserHeure(finA);
  const dB = normaliserHeure(debutB);
  const fB = normaliserHeure(finB);

  return dA < fB && fA > dB;
}

export function detecterConflitHoraire({
  affectations,
  candidat,
  nomsCentres = {},
  nomsFormations = {},
  nomsMatieres = {},
  dateDebutSession,
}: {
  affectations: Affectation[] | undefined;
  candidat: {
    enseignantId: string;
    dateSeance?: Date | string | null;
    semaine?: number;
    jourIndex?: number; // 0 = Lundi ... 5 = Samedi
    heureDebut?: string | null;
    heureFin?: string | null;
    seance: number;
    affectationId?: string;
  };
  nomsCentres?: Record<string, string>;
  nomsFormations?: Record<string, string>;
  nomsMatieres?: Record<string, string>;
  dateDebutSession?: string;
}): ConflitDetecte {
  if (!affectations || !candidat.enseignantId) {
    return { enConflit: false };
  }

  // Résolution de la date de la séance candidate
  let dateCandidateIso: string | undefined;
  if (candidat.dateSeance) {
    dateCandidateIso = normaliserDate(candidat.dateSeance);
  } else if (
    dateDebutSession &&
    candidat.semaine !== undefined &&
    candidat.jourIndex !== undefined
  ) {
    const debutSession = new Date(dateDebutSession);
    const decalageJours = (candidat.semaine - 1) * 7 + candidat.jourIndex;
    const dateCalculee = new Date(debutSession.getTime() + decalageJours * 86_400_000);
    dateCandidateIso = normaliserDate(dateCalculee);
  }

  if (!dateCandidateIso) {
    return { enConflit: false };
  }

  const debutCandidat =
    candidat.heureDebut || horaireDebutParDefaut(candidat.seance);
  const finCandidat =
    candidat.heureFin || horaireFinParDefaut(candidat.seance);

  for (const existante of affectations) {
    // Ne concerne que cet enseignant
    if (existante.enseignantId !== candidat.enseignantId) {
      continue;
    }
    // Exclure la séance actuellement modifiée
    if (candidat.affectationId && existante.id === candidat.affectationId) {
      continue;
    }
    // Exclure les séances annulées
    if (existante.statut === "ANNULEE") {
      continue;
    }

    // Résolution de la date de la séance existante
    let dateExistanteIso: string | undefined;
    if (existante.dateSeance) {
      dateExistanteIso = normaliserDate(existante.dateSeance);
    } else if (dateDebutSession) {
      const indexJour = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"].indexOf(
        existante.jour,
      );
      if (indexJour >= 0) {
        const debutSession = new Date(dateDebutSession);
        const decalageJours = (existante.semaine - 1) * 7 + indexJour;
        const dateCalculee = new Date(debutSession.getTime() + decalageJours * 86_400_000);
        dateExistanteIso = normaliserDate(dateCalculee);
      }
    }

    if (!dateExistanteIso || dateExistanteIso !== dateCandidateIso) {
      continue;
    }

    const debutExistant =
      existante.heureDebut || horaireDebutParDefaut(existante.seance);
    const finExistant =
      existante.heureFin || horaireFinParDefaut(existante.seance);

    if (
      verifierChevauchementHoraires(
        debutCandidat,
        finCandidat,
        debutExistant,
        finExistant,
      )
    ) {
      const centreNom =
        nomsCentres[existante.centreId] || "Centre inconnu";
      const formationNom =
        nomsFormations[existante.formationId] || "Classe inconnue";
      const matiereNom = nomsMatieres[existante.matiereId];

      const dateStr = formaterDateFr(dateExistanteIso);
      const debutStr = formaterHeureFr(debutExistant);
      const finStr = formaterHeureFr(finExistant);

      const message = `Impossible d'affecter cet enseignant : il est déjà programmé le ${dateStr} de ${debutStr} à ${finStr} au centre ${centreNom}, classe ${formationNom}.`;

      return {
        enConflit: true,
        message,
        affectationExistante: existante,
        details: {
          dateStr,
          debutStr,
          finStr,
          centreNom,
          formationNom,
          matiereNom,
        },
      };
    }
  }

  return { enConflit: false };
}

