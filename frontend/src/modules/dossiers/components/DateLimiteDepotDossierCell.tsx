"use client";

import React, { useMemo } from "react";
import { Calendar } from "lucide-react";
import { useConcoursDuDossier } from "../data/queries";
import { calculerCompteARebours } from "../domain/countdown";
import type { Concours } from "../domain/types";

interface DateLimiteDepotDossierCellProps {
  dossierId: string;
  concoursCatalogue?: Concours[];
}

export function DateLimiteDepotDossierCell({
  dossierId,
  concoursCatalogue = [],
}: DateLimiteDepotDossierCellProps) {
  // 1. Récupération des concours rattachés au dossier
  const { data: concoursDuDossier = [], isLoading } = useConcoursDuDossier(dossierId);

  // 2. Résolution des informations complètes du concours (avec dateLimiteDepot)
  const concoursAssocies = useMemo(() => {
    if (concoursDuDossier.length === 0) return [];
    const catalogueMap = new Map(concoursCatalogue.map((c) => [c.id, c]));

    return concoursDuDossier
      .map((dc) => catalogueMap.get(dc.concoursId))
      .filter((c): c is Concours => Boolean(c));
  }, [concoursDuDossier, concoursCatalogue]);

  // État de chargement discret
  if (isLoading) {
    return (
      <div className="space-y-1 py-0.5 animate-pulse">
        <div className="h-3.5 w-16 bg-slate-100 rounded" />
        <div className="h-2.5 w-12 bg-slate-100 rounded-full" />
      </div>
    );
  }

  // Aucun concours rattaché
  if (concoursDuDossier.length === 0 || concoursAssocies.length === 0) {
    return (
      <span className="text-[11px] text-slate-400 italic block">
        —
      </span>
    );
  }

  // Trier par échéance la plus proche
  const concoursTries = [...concoursAssocies].sort(
    (a, b) => new Date(a.dateLimiteDepot).getTime() - new Date(b.dateLimiteDepot).getTime(),
  );

  const principal = concoursTries[0];
  const cd = calculerCompteARebours(principal.dateLimiteDepot);
  const dateStr = new Date(principal.dateLimiteDepot).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const aPlusieursConcours = concoursTries.length > 1;
  const tooltip = aPlusieursConcours
    ? concoursTries
        .map(
          (c) =>
            `${c.nom} : ${new Date(c.dateLimiteDepot).toLocaleDateString("fr-FR")} (${
              calculerCompteARebours(c.dateLimiteDepot).court
            })`,
        )
        .join(" • ")
    : `${principal.nom} : Date limite au ${dateStr} (${cd.texte})`;

  return (
    <div className="space-y-0.5 min-w-0" title={tooltip}>
      {/* Date formatée + compteur si multiple */}
      <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-700">
        <Calendar size={12} className="text-slate-400 shrink-0" />
        <span className="tabular-nums">{dateStr}</span>
        {aPlusieursConcours && (
          <span
            className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-sans"
            title={`${concoursTries.length} concours rattachés`}
          >
            +{concoursTries.length - 1}
          </span>
        )}
      </div>

      {/* Badge statut échéance */}
      <div>
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium ${cd.badge}`}
        >
          <span className={`w-1 h-1 rounded-full ${cd.dot}`} />
          {cd.court}
        </span>
      </div>
    </div>
  );
}
