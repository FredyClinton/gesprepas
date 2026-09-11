import type { Affectation, Jour } from "@/modules/affectation";
import type { Progression } from "./types";

const JOUR_ORDRE: Record<Jour, number> = {
  LUNDI: 0,
  MARDI: 1,
  MERCREDI: 2,
  JEUDI: 3,
  VENDREDI: 4,
  SAMEDI: 5,
};

export interface InfoProgressionAffectation {
  progression?: Progression;
  numeroCours: number;
}

/**
 * Associe chaque créneau (Affectation) de l'emploi du temps à son numéro d'ordre
 * chronologique dans la semaine (1er cours, 2e cours, etc.) et à sa fiche de progression.
 *
 * Règle métier essentielle (Grille Publique) :
 * Le classement des cours de la semaine s'effectue au sein d'une MÊME SALLE
 * (formation + matière + semaine + salle), et non pas uniquement au niveau de la formation.
 * Ainsi, le 1er cours de la matière dans la Salle A reçoit le Cours N°1 du syllabus,
 * et le 1er cours de la même matière dans la Salle B reçoit également le Cours N°1 du syllabus.
 */
export function construireMappingAffectationsProgressions(
  affectations: Affectation[],
  progressions: Progression[],
): Map<string, InfoProgressionAffectation> {
  const result = new Map<string, InfoProgressionAffectation>();
  if (!affectations || affectations.length === 0) return result;

  // Grouper les affectations par filière, matière, semaine et salle
  const groupes = new Map<string, Affectation[]>();
  for (const a of affectations) {
    if (a.statut === "ANNULEE") continue;
    const key = `${a.formationId}:${a.matiereId}:${a.semaine}:${a.salleId}`;
    const list = groupes.get(key) ?? [];
    list.push(a);
    groupes.set(key, list);
  }

  groupes.forEach((list, key) => {
    // Trier chronologiquement dans la semaine : d'abord le jour (Lundi→Samedi), puis la séance (1→4)
    list.sort((a, b) => {
      const jDiff = (JOUR_ORDRE[a.jour] ?? 0) - (JOUR_ORDRE[b.jour] ?? 0);
      if (jDiff !== 0) return jDiff;
      return a.seance - b.seance;
    });

    const [formationId, matiereId, semaineStr] = key.split(":");
    const semaine = parseInt(semaineStr, 10);
    const sessionId = list[0]?.sessionId;

    const progsFiliere = progressions.filter(
      (p) =>
        (!sessionId || !p.sessionId || p.sessionId === sessionId) &&
        p.formationId === formationId &&
        p.matiereId === matiereId &&
        p.semaine === semaine,
    );

    // Assigner le n-ième cours chronologique de la matière
    list.forEach((aff, idx) => {
      const numeroCours = idx + 1;
      const prog = progsFiliere.find((p) => p.numeroCours === numeroCours);
      result.set(aff.id, {
        progression: prog,
        numeroCours,
      });
    });
  });

  return result;
}

