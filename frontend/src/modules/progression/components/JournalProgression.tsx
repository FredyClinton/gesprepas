"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";

import type { Progression } from "../domain/types";

interface JournalProgressionProps {
  // Déjà filtrée par l'appelant (par département, par formation, etc.) - ce
  // composant se contente de trier (le plus récent d'abord) et de paginer.
  progressions: Progression[];
  formationsParId: Map<string, string>;
  // Colonne Département affichée seulement si fournie (vue Directeur Académique,
  // où plusieurs matières se côtoient - inutile côté Chef de Département, qui n'a
  // qu'une seule matière).
  departementsParMatiereId?: Map<string, string>;
  onModifier?: (progression: Progression) => void;
  onSupprimer?: (progression: Progression) => void;
  pageSize?: number;
}

export function JournalProgression({
  progressions,
  formationsParId,
  departementsParMatiereId,
  onModifier,
  onSupprimer,
  pageSize = 8,
}: JournalProgressionProps) {
  const [limite, setLimite] = useState(pageSize);

  // Pas de date de création en base : la semaine + le n° de cours sont le seul
  // repère chronologique disponible (voir modèle Progression, backend).
  const triees = useMemo(
    () =>
      [...progressions].sort(
        (a, b) => b.semaine - a.semaine || b.numeroCours - a.numeroCours,
      ),
    [progressions],
  );
  const visibles = triees.slice(0, limite);

  if (progressions.length === 0) {
    return (
      <div className="space-y-2 p-12 text-center text-slate-400">
        <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">
          Aucune fiche de progression enregistrée
        </p>
        <p className="mx-auto max-w-sm text-xs text-slate-400">
          Les thèmes et exercices dispensés apparaîtront ici au fur et à mesure
          des séances.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-100 text-xs">
        {visibles.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-start"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {p.theme}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                  Semaine {p.semaine} • Cours {p.numeroCours}
                </span>
                {departementsParMatiereId && (
                  <span className="text-brand-orange rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold">
                    {departementsParMatiereId.get(p.matiereId) ?? "Matière"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-slate-600">{p.contenu}</p>
              {p.exercices && (
                <p className="font-mono text-[11px] text-slate-500">
                  Exercices : {p.exercices}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                {formationsParId.get(p.formationId) || "Formation"}
              </span>
              {onModifier && (
                <button
                  type="button"
                  onClick={() => onModifier(p)}
                  title="Modifier le contenu"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil size={13} />
                </button>
              )}
              {onSupprimer && (
                <button
                  type="button"
                  onClick={() => onSupprimer(p)}
                  title="Supprimer cette entrée"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {limite < triees.length && (
        <div className="border-t border-slate-100 p-3 text-center">
          <button
            type="button"
            onClick={() => setLimite((l) => l + pageSize)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Voir plus ({triees.length - limite} restant
            {triees.length - limite > 1 ? "s" : ""})
          </button>
        </div>
      )}
    </div>
  );
}
