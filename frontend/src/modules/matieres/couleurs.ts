import { Matiere } from "./domain/types";

export const PALETTE_COULEURS_SELECTION = [
  {
    hex: "#10B981",
    label: "Émeraude",
    bg: "bg-emerald-500",
    texte: "text-white",
    legende: "bg-emerald-500",
    border: "border-emerald-600",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-400",
    point: "bg-emerald-500",
  },
  {
    hex: "#3B82F6",
    label: "Bleu",
    bg: "bg-blue-500",
    texte: "text-white",
    legende: "bg-blue-500",
    border: "border-blue-600",
    badge: "bg-blue-50 text-blue-800 border-blue-400",
    point: "bg-blue-500",
  },
  {
    hex: "#EF4444",
    label: "Rouge",
    bg: "bg-red-500",
    texte: "text-white",
    legende: "bg-red-500",
    border: "border-red-600",
    badge: "bg-red-50 text-red-800 border-red-400",
    point: "bg-red-500",
  },
  {
    hex: "#F59E0B",
    label: "Ambre",
    bg: "bg-amber-500",
    texte: "text-white",
    legende: "bg-amber-500",
    border: "border-amber-600",
    badge: "bg-amber-50 text-amber-800 border-amber-400",
    point: "bg-amber-500",
  },
  {
    hex: "#14B8A6",
    label: "Teal",
    bg: "bg-teal-500",
    texte: "text-white",
    legende: "bg-teal-500",
    border: "border-teal-600",
    badge: "bg-teal-50 text-teal-800 border-teal-400",
    point: "bg-teal-500",
  },
  {
    hex: "#8B5CF6",
    label: "Violet",
    bg: "bg-purple-500",
    texte: "text-white",
    legende: "bg-purple-500",
    border: "border-purple-600",
    badge: "bg-purple-50 text-purple-800 border-purple-400",
    point: "bg-purple-500",
  },
  {
    hex: "#EC4899",
    label: "Rose",
    bg: "bg-pink-500",
    texte: "text-white",
    legende: "bg-pink-500",
    border: "border-pink-600",
    badge: "bg-pink-50 text-pink-800 border-pink-400",
    point: "bg-pink-500",
  },
  {
    hex: "#6366F1",
    label: "Indigo",
    bg: "bg-indigo-500",
    texte: "text-white",
    legende: "bg-indigo-500",
    border: "border-indigo-600",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-400",
    point: "bg-indigo-500",
  },
  {
    hex: "#06B6D4",
    label: "Cyan",
    bg: "bg-cyan-500",
    texte: "text-white",
    legende: "bg-cyan-500",
    border: "border-cyan-600",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-400",
    point: "bg-cyan-500",
  },
  {
    hex: "#F97316",
    label: "Orange",
    bg: "bg-orange-500",
    texte: "text-white",
    legende: "bg-orange-500",
    border: "border-orange-600",
    badge: "bg-orange-50 text-orange-800 border-orange-400",
    point: "bg-orange-500",
  },
  {
    hex: "#84CC16",
    label: "Lime",
    bg: "bg-lime-500",
    texte: "text-white",
    legende: "bg-lime-500",
    border: "border-lime-600",
    badge: "bg-lime-50 text-lime-800 border-lime-400",
    point: "bg-lime-500",
  },
  {
    hex: "#0EA5E9",
    label: "Ciel",
    bg: "bg-sky-500",
    texte: "text-white",
    legende: "bg-sky-500",
    border: "border-sky-600",
    badge: "bg-sky-50 text-sky-800 border-sky-400",
    point: "bg-sky-500",
  },
  {
    hex: "#D946EF",
    label: "Fuchsia",
    bg: "bg-fuchsia-500",
    texte: "text-white",
    legende: "bg-fuchsia-500",
    border: "border-fuchsia-600",
    badge: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-400",
    point: "bg-fuchsia-500",
  },
  {
    hex: "#64748B",
    label: "Ardoise",
    bg: "bg-slate-600",
    texte: "text-white",
    legende: "bg-slate-600",
    border: "border-slate-700",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    point: "bg-slate-600",
  },
] as const;

export type CouleurMatiere = {
  bg: string;
  texte: string;
  legende: string;
  border: string;
  badge: string;
  point: string;
  hex?: string;
};

export function trouverCouleurParHex(hex?: string): CouleurMatiere | undefined {
  if (!hex) return undefined;
  const standard = PALETTE_COULEURS_SELECTION.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase(),
  );
  if (standard) return standard;

  // Fallback avec style générique si hex inconnu
  return {
    bg: "bg-slate-700",
    texte: "text-white",
    legende: "bg-slate-700",
    border: "border-slate-800",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    point: "bg-slate-600",
    hex,
  };
}

export function construireCouleursMatieres(
  matieres: Matiere[],
): Map<string, CouleurMatiere> {
  const triees = [...matieres].sort((a, b) => a.id.localeCompare(b.id));
  const map = new Map<string, CouleurMatiere>();

  triees.forEach((matiere, index) => {
    if (matiere.couleur) {
      const resolue = trouverCouleurParHex(matiere.couleur);
      if (resolue) {
        map.set(matiere.id, resolue);
        return;
      }
    }
    map.set(matiere.id, PALETTE_COULEURS_SELECTION[index % PALETTE_COULEURS_SELECTION.length]);
  });

  return map;
}
