"use client";

import React, { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useConcoursDuDossier } from "../data/queries";
import { listPiecesDossierConcours } from "../data/client";
import type { StatutDossier } from "../domain/types";

interface ProgressionPiecesDossierCellProps {
  dossierId: string;
  statut?: StatutDossier;
}

export function ProgressionPiecesDossierCell({
  dossierId,
  statut,
}: ProgressionPiecesDossierCellProps) {
  // 1. Récupération des concours associés au dossier
  const { data: concours = [], isLoading: chargementConcours } =
    useConcoursDuDossier(dossierId);

  // 2. Récupération en parallèle des pièces pour chaque concours rattaché
  const piecesQueries = useQueries({
    queries: concours.map((c) => ({
      queryKey: ["pieces-dossier-concours", c.id],
      queryFn: () => listPiecesDossierConcours(c.id),
      enabled: Boolean(c.id),
      staleTime: 30000,
    })),
  });

  const isLoadingPieces = piecesQueries.some((q) => q.isLoading);
  const isLoading = chargementConcours || (concours.length > 0 && isLoadingPieces);

  // 3. Agrégation des pièces
  const { total, validees, restantes, pct } = useMemo(() => {
    const piecesToutes = piecesQueries.flatMap((q) => q.data || []);
    const tot = piecesToutes.length;
    const val = piecesToutes.filter((p) => p.statut === "VALIDEE").length;
    const rest = Math.max(0, tot - val);
    const p = tot > 0 ? Math.round((val / tot) * 100) : statut === "COMPLET" ? 100 : 0;

    return {
      total: tot,
      validees: val,
      restantes: rest,
      pct: p,
    };
  }, [piecesQueries, statut]);

  // État de chargement discret et calibré à la même hauteur
  if (isLoading) {
    return (
      <div className="space-y-1.5 py-0.5 min-w-[120px] max-w-[145px] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-10 bg-slate-100 rounded" />
          <div className="h-3 w-12 bg-slate-100 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 bg-slate-100 rounded-full" />
          <div className="h-2 w-6 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Cas 1 : Aucun concours rattaché au dossier
  if (concours.length === 0) {
    return (
      <div
        className="space-y-1 min-w-[120px] max-w-[145px]"
        title="Aucun concours rattaché pour cet élève"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 tabular-nums">0/0</span>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100/80 px-1.5 py-0.2 rounded-full">
            0 concours
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-slate-200 rounded-full w-0" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold tabular-nums shrink-0">
            0%
          </span>
        </div>
      </div>
    );
  }

  // Cas 2 : Concours présent mais 0 pièce configurée
  if (total === 0) {
    const estComplet = statut === "COMPLET";
    return (
      <div
        className="space-y-1 min-w-[120px] max-w-[145px]"
        title={estComplet ? "Dossier marqué complet" : "Aucune pièce exigible configurée"}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 tabular-nums">
            {estComplet ? "—" : "0/0"}
          </span>
          {estComplet ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/80">
              <CheckCircle2 size={9} className="text-emerald-600" />
              100%
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100/80 px-1.5 py-0.2 rounded-full">
              0 pièce
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                estComplet ? "bg-emerald-500 w-full" : "bg-slate-200 w-0"
              }`}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-bold tabular-nums shrink-0">
            {estComplet ? "100%" : "0%"}
          </span>
        </div>
      </div>
    );
  }

  // Cas 3 : Progression normale avec ratio et jauge
  const estComplet = restantes === 0;

  return (
    <div
      className="space-y-1 min-w-[120px] max-w-[145px]"
      title={`${validees} pièce(s) validée(s) sur ${total} requise(s) · ${restantes} restante(s) (${pct}%)`}
    >
      {/* Ratio & Badge pièces restantes */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-slate-800 tabular-nums">
            {validees}/{total}
          </span>
          <span className="text-slate-400 text-[10px]">pièces</span>
        </div>

        {estComplet ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/80">
            <CheckCircle2 size={9} className="text-emerald-600" />
            100%
          </span>
        ) : (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200/80 tabular-nums">
            {restantes} rest.
          </span>
        )}
      </div>

      {/* Barre de progression visuelle */}
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              estComplet
                ? "bg-emerald-500"
                : pct >= 50
                ? "bg-brand-orange"
                : "bg-amber-500"
            }`}
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 font-bold tabular-nums shrink-0">
          {pct}%
        </span>
      </div>
    </div>
  );
}
