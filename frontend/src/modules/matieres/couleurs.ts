// Aucune couleur n'est définie pour une matière côté backend — on ne peut donc pas
// afficher "la bonne" couleur, seulement une couleur STABLE pour la durée de la
// session : palette cyclique fixe, assignée en triant les matières par id. Le même

import { Matiere } from "./domain/types";

// matiereId aura toujours la même couleur tant que la liste de matières ne change pas.
const PALETTE = [
  { bg: "bg-green-400", texte: "text-white", legende: "bg-green-400" },
  { bg: "bg-blue-500", texte: "text-white", legende: "bg-blue-500" },
  { bg: "bg-red-500", texte: "text-white", legende: "bg-red-500" },
  { bg: "bg-orange-300", texte: "text-black", legende: "bg-orange-300" },
  { bg: "bg-yellow-300", texte: "text-black", legende: "bg-yellow-300" },
  { bg: "bg-teal-400", texte: "text-black", legende: "bg-teal-400" },
  { bg: "bg-purple-500", texte: "text-white", legende: "bg-purple-500" },
  { bg: "bg-pink-500", texte: "text-white", legende: "bg-pink-500" },
] as const;

export type CouleurMatiere = (typeof PALETTE)[number];

export function construireCouleursMatieres(
  matieres: Matiere[],
): Map<string, CouleurMatiere> {
  const triees = [...matieres].sort((a, b) => a.id.localeCompare(b.id));
  const map = new Map<string, CouleurMatiere>();
  triees.forEach((matiere, index) => {
    map.set(matiere.id, PALETTE[index % PALETTE.length]);
  });
  return map;
}
