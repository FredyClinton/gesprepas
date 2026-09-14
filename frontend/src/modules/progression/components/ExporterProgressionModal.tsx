"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Calendar,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { Button } from "@/shared/ui";
import type { Formation } from "@/modules/academique";
import { useMatieres, type Matiere } from "@/modules/matieres";
import {
  type Affectation,
  useAffectationsMultiSemaines,
} from "@/modules/affectation";
import {
  decomposerTheme,
  type Progression,
  type TypeProgression,
} from "../domain/types";
import { reordonnerMatieres } from "../hooks/useOrdreColonnes";
import { quotaHebdomadaireQueryOptions } from "../data/queries";
import { trouverCouleurParHex, getCouleurBadgeStyle } from "@/modules/matieres";

interface ExporterProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formations: Formation[];
  formationIdActive?: string;
  semaineActive?: number | "TOUTES";
  matieres: Matiere[];
  sessionAnnee?: string;
  sessionId?: string;
  progressions: Progression[];
  affectations?: Affectation[];
}

function parseContenuLines(contenu?: string | null): string[] {
  if (!contenu) return [""];
  const lines = contenu
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 0);
  return lines.length > 0 ? lines : [""];
}

export function ExporterProgressionModal({
  isOpen,
  onClose,
  formations,
  formationIdActive,
  semaineActive = "TOUTES",
  matieres,
  sessionAnnee = "2026",
  sessionId,
  progressions,
  affectations = [],
}: ExporterProgressionModalProps) {
  // Sélection de la formation : "TOUTES" ou formationId
  const [formationSelectionnee, setFormationSelectionnee] = useState<string>(
    formationIdActive || (formations[0]?.id ?? "TOUTES"),
  );

  // Sélection de la semaine : "TOUTES" ou number
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<
    number | "TOUTES"
  >(semaineActive);

  // Masquer les disciplines non programmées (quota 00 et aucun cours)
  const [masquerNonProgrammes, setMasquerNonProgrammes] =
    useState<boolean>(true);

  // Liste ordonnée de toutes les semaines existantes dans les progressions ou affectations
  const toutesLesSemaines = useMemo(() => {
    const set = new Set<number>();
    progressions.forEach((p) => set.add(p.semaine));
    affectations.forEach((a) => set.add(a.semaine));
    if (set.size === 0) set.add(1);
    const maxS = Math.max(1, ...Array.from(set));
    return Array.from({ length: maxS }, (_, i) => i + 1);
  }, [progressions, affectations]);

  // Récupérer les affectations pour toutes les semaines pertinentes de la session
  const { data: affectationsToutesSemaines = [] } =
    useAffectationsMultiSemaines({
      sessionId,
      semaines: toutesLesSemaines,
    });

  const toutesAffectations = useMemo(() => {
    const map = new Map<string, Affectation>();
    affectations.forEach((a) => map.set(a.id, a));
    affectationsToutesSemaines.forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  }, [affectations, affectationsToutesSemaines]);

  const { data: catalogueMatieres = [] } = useMatieres();
  const toutesLesMatieres =
    catalogueMatieres.length > 0 ? catalogueMatieres : matieres;

  // Détermination stricte des matières enseignées dans chaque filière
  const matieresParFormationId = useMemo(() => {
    const map = new Map<string, Matiere[]>();

    formations.forEach((f) => {
      let ordrePerso: string[] | null = null;
      try {
        const raw = localStorage.getItem(`excelis_ordre_matieres_${f.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) ordrePerso = parsed;
        }
      } catch {
        // Ignorer l'erreur localStorage
      }

      // 1. Matières explicitement déclarées dans formation.matiereIds
      if (f.matiereIds && f.matiereIds.length > 0) {
        const parId = new Map(toutesLesMatieres.map((m) => [m.id, m]));
        const directes = f.matiereIds
          .map((id) => parId.get(id))
          .filter((m): m is Matiere => Boolean(m));
        if (directes.length > 0) {
          map.set(
            f.id,
            ordrePerso ? reordonnerMatieres(directes, ordrePerso) : directes,
          );
          return;
        }
      }

      // 2. Déduction automatique à partir des cours rédigés et séances affectées pour cette filière
      const mIds = new Set<string>();
      toutesAffectations
        .filter((a) => a.formationId === f.id)
        .forEach((a) => mIds.add(a.matiereId));
      progressions
        .filter((p) => p.formationId === f.id)
        .forEach((p) => mIds.add(p.matiereId));

      if (mIds.size > 0) {
        const deduites = toutesLesMatieres.filter((m) => mIds.has(m.id));
        map.set(
          f.id,
          ordrePerso ? reordonnerMatieres(deduites, ordrePerso) : deduites,
        );
        return;
      }

      // 3. Fallback sur les matières passées en prop si c'est la filière active
      if (f.id === formationIdActive && matieres.length > 0) {
        map.set(
          f.id,
          ordrePerso ? reordonnerMatieres(matieres, ordrePerso) : matieres,
        );
        return;
      }

      map.set(
        f.id,
        ordrePerso
          ? reordonnerMatieres(toutesLesMatieres, ordrePerso)
          : toutesLesMatieres,
      );
    });

    return map;
  }, [
    formations,
    toutesLesMatieres,
    toutesAffectations,
    progressions,
    formationIdActive,
    matieres,
  ]);

  // Formations à exporter
  const formationsAExporter = useMemo(() => {
    if (formationSelectionnee === "TOUTES") {
      return formations;
    }
    const f = formations.find((item) => item.id === formationSelectionnee);
    return f ? [f] : formations;
  }, [formations, formationSelectionnee]);

  // Quotas hebdomadaires réels (backend, plus de localStorage) des formations
  // exportées - useQueries plutôt que le hook useProgressionQuotas, qui ne peut
  // pas être appelé en boucle pour chaque formation.
  const quotasQueries = useQueries({
    queries: (sessionId ? formationsAExporter : []).map((formation) =>
      quotaHebdomadaireQueryOptions(formation.id, sessionId!),
    ),
  });

  // Pas de useMemo ici : quotasQueries (useQueries) est un nouveau tableau à
  // chaque rendu, donc le mémoriser n'apporterait rien - la reconstruction de
  // cette map reste de toute façon bornée (quelques formations x matières x
  // semaines), donc négligeable.
  const quotasParFormationSemaineMatiere = new Map<string, number>();
  quotasQueries.forEach((q) => {
    (q.data ?? []).forEach((quota) => {
      quotasParFormationSemaineMatiere.set(
        `${quota.formationId}_${quota.semaine}_${quota.matiereId}`,
        quota.quota,
      );
    });
  });

  // Semaines à exporter pour le document
  const semainesAExporter = useMemo(() => {
    if (semaineSelectionnee === "TOUTES") {
      return toutesLesSemaines;
    }
    return [semaineSelectionnee];
  }, [semaineSelectionnee, toutesLesSemaines]);

  // Liste ordonnée de toutes les feuilles à générer (1 feuille = 1 formation x 1 semaine)
  const feuillesAExporter = useMemo(() => {
    const list: {
      formation: Formation;
      semaine: number;
    }[] = [];

    formationsAExporter.forEach((formation) => {
      semainesAExporter.forEach((semaine) => {
        list.push({ formation, semaine });
      });
    });

    return list;
  }, [formationsAExporter, semainesAExporter]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.classList.add("progression-export-open");
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("progression-export-open");
    }
    return () => {
      document.body.classList.remove("progression-export-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      id="printable-progression-modal"
      className="printable-progression-modal bg-brand-anthracite/60 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-xs duration-150 sm:p-5 print:static print:inset-auto print:z-auto print:m-0 print:block print:h-auto print:max-h-none print:w-full print:overflow-visible print:bg-white print:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex h-[92vh] max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:static print:m-0 print:block print:h-auto print:max-h-none print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-none print:p-0 print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de contrôle supérieure (Masquée à l'impression) */}
        <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3.5 sm:flex-row sm:items-center print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Aperçu avant impression — Progression Pédagogique
              </h3>
              <p className="text-xs text-slate-500">
                Prévisualisation haute fidélité au format officiel A4 Paysage (
                {feuillesAExporter.length} page
                {feuillesAExporter.length > 1 ? "s" : ""})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-brand-orange inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-orange-600 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Fermer (Échap)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Options de compilation et filtrage (Masquées à l'impression) */}
        <div className="space-y-3 border-b border-slate-200/80 bg-white px-6 py-3.5 print:hidden">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
            {/* Choix de formation */}
            <div>
              <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Formation à inclure
              </label>
              <select
                value={formationSelectionnee}
                onChange={(e) => setFormationSelectionnee(e.target.value)}
                className="focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="TOUTES">
                  🌟 Toutes les formations ({formations.length})
                </option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Choix de semaine */}
            <div>
              <label className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Semaines à exporter
              </label>
              <select
                value={semaineSelectionnee}
                onChange={(e) =>
                  setSemaineSelectionnee(
                    e.target.value === "TOUTES"
                      ? "TOUTES"
                      : Number(e.target.value),
                  )
                }
                className="focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="TOUTES">
                  Toutes les semaines (S1 à S{toutesLesSemaines.length || 1})
                </option>
                {toutesLesSemaines.map((s) => (
                  <option key={s} value={s}>
                    Semaine {s} uniquement
                  </option>
                ))}
              </select>
            </div>

            {/* Option : Masquer les disciplines non programmées (00) */}
            <div className="flex items-center pt-5">
              <label
                onClick={() => setMasquerNonProgrammes(!masquerNonProgrammes)}
                className="hover:text-brand-orange flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 transition-colors select-none"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                    masquerNonProgrammes
                      ? "bg-brand-orange border-brand-orange text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <CheckSquare size={14} />
                </div>
                <span>Masquer les disciplines à quota 00 (gain de place)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/60 px-3 py-1.5 text-[11px] text-slate-500">
            <AlertCircle size={13} className="shrink-0 text-amber-600" />
            <span>
              <strong>Aperçu fidèle :</strong> Chaque feuille ci-dessous
              correspond exactement à une page A4 paysage imprimée (
              {feuillesAExporter.length} page
              {feuillesAExporter.length > 1 ? "s" : ""} au total), avec son
              cartouche officiel, son tableau complet et ses visas de
              validation.
            </span>
          </div>
        </div>

        {/* Corps du document imprimable / Aperçu */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-8 print:block print:h-auto print:max-h-none print:overflow-visible print:bg-white print:p-0">
          <div className="space-y-8 print:space-y-0">
            {feuillesAExporter.map(({ formation, semaine }, index) => {
              const estDerniereFeuille = index === feuillesAExporter.length - 1;

              const progressionsSemaine = progressions.filter(
                (p) => p.formationId === formation.id && p.semaine === semaine,
              );
              const affectationsSemaine = toutesAffectations.filter(
                (a) => a.formationId === formation.id && a.semaine === semaine,
              );

              // Analyser les matières actives et non programmées
              const matieresActives: {
                matiere: Matiere;
                quota: number;
                progs: Progression[];
              }[] = [];
              const matieresNonProgrammes: {
                matiere: Matiere;
                quota: number;
              }[] = [];

              const matieresFormation =
                matieresParFormationId.get(formation.id) || [];

              matieresFormation.forEach((m) => {
                const affectationsMatiere = affectationsSemaine.filter(
                  (a) => a.matiereId === m.id && a.statut !== "ANNULEE",
                );
                const progsMatiere = progressionsSemaine.filter(
                  (p) => p.matiereId === m.id,
                );
                const nbSeances = affectationsMatiere.length;
                const defaultQuota =
                  nbSeances > 0
                    ? nbSeances
                    : progsMatiere.length > 0
                      ? progsMatiere.length
                      : 0;
                const quota =
                  quotasParFormationSemaineMatiere.get(
                    `${formation.id}_${semaine}_${m.id}`,
                  ) ?? defaultQuota;

                // Règle métier :
                // Les cours prévus mais pas documentés doivent quand même figurer dans le tableau.
                // C'est quand la matière n'a AUCUNE séance prévue qu'elle est considérée comme non programmée.
                const aDesCoursPrevus =
                  nbSeances > 0 || quota > 0 || progsMatiere.length > 0;
                const quotaEffectif = Math.max(
                  nbSeances,
                  quota,
                  progsMatiere.length,
                );

                if (masquerNonProgrammes && !aDesCoursPrevus) {
                  matieresNonProgrammes.push({ matiere: m, quota: 0 });
                } else {
                  matieresActives.push({
                    matiere: m,
                    quota: quotaEffectif,
                    progs: progsMatiere,
                  });
                }
              });

              // Nombre maximal de cours à afficher (hauteur de grille)
              const maxLignes = Math.max(
                1,
                ...matieresActives.map((item) =>
                  Math.max(
                    item.quota,
                    ...item.progs.map((p) => p.numeroCours || 0),
                  ),
                ),
              );

              const numerosCours = Array.from(
                { length: maxLignes },
                (_, i) => i + 1,
              );

              return (
                <div
                  key={`${formation.id}_${semaine}`}
                  className="progression-sheet-page mx-auto mb-8 flex w-full max-w-5xl flex-col justify-between rounded-sm border border-slate-300/80 bg-white p-6 shadow-md sm:p-8 print:m-0 print:mb-0 print:w-full print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none"
                  style={{
                    pageBreakAfter: estDerniereFeuille ? "auto" : "always",
                    breakAfter: estDerniereFeuille ? "auto" : "page",
                    pageBreakInside: "avoid",
                    breakInside: "avoid",
                  }}
                >
                  {/* Indicateur de page à l'écran (masqué à l'impression) */}
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] font-bold text-slate-400 print:hidden">
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} className="text-brand-orange" />
                      <span>
                        Page {index + 1} / {feuillesAExporter.length} —{" "}
                        {formation.nom} (Semaine {semaine})
                      </span>
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                      Format A4 Paysage
                    </span>
                  </div>

                  {/* Cartouche officiel EXCELIS PRÉPAS pour cette feuille */}
                  <div className="border-brand-orange mb-2.5 rounded-xl border-2 bg-orange-50/20 p-2.5 print:mb-2 print:p-2">
                    <div className="mb-2 flex items-start justify-between border-b border-orange-200 pb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black tracking-tight text-slate-900 uppercase sm:text-lg">
                            EXCELIS PRÉPAS
                          </span>
                          <span className="text-brand-orange text-xs font-bold">
                            — FICHE DE PROGRESSION PÉDAGOGIQUE
                          </span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                          Classes Préparatoires aux Grandes Écoles & Concours
                          d'Excellence
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <p className="font-black text-slate-900">
                          SESSION {sessionAnnee}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">
                          Édité le {new Date().toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          FORMATION :
                        </span>{" "}
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black text-slate-900 uppercase">
                          {formation.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-orange rounded px-2 py-0.5 text-[11px] font-black text-white uppercase">
                          Semaine {semaine}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          ({matieresActives.length} discipline
                          {matieresActives.length > 1 ? "s" : ""} active
                          {matieresActives.length > 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tableau grille de la semaine */}
                  {matieresActives.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 py-8 text-center text-xs text-slate-500">
                      Aucune discipline active pour {formation.nom} en Semaine{" "}
                      {semaine}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full table-fixed border-collapse border border-slate-300 text-left text-xs">
                        <thead>
                          <tr className="bg-brand-orange text-white">
                            <th className="w-16 border-r border-orange-600/50 p-2 text-center text-[11px] font-black tracking-wider uppercase">
                              COURS
                            </th>
                            {matieresActives.map(
                              ({ matiere, quota, progs }) => {
                                return (
                                  <th
                                    key={matiere.id}
                                    className="border-r border-orange-600/50 p-2 text-center text-xs font-black tracking-wider uppercase last:border-r-0"
                                  >
                                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                                      <span className="truncate">
                                        {matiere.nom}
                                      </span>
                                      <span className="font-mono text-[11px] opacity-95">
                                        ({String(quota).padStart(2, "0")})
                                      </span>
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-normal normal-case opacity-85">
                                      {quota === 0
                                        ? "Dispensé"
                                        : progs.length === 0
                                          ? `${quota} séance${quota > 1 ? "s" : ""} prévue${quota > 1 ? "s" : ""}`
                                          : `${progs.length}/${quota} cours`}
                                    </div>
                                  </th>
                                );
                              },
                            )}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {numerosCours.map((numCours) => (
                            <tr
                              key={numCours}
                              className="transition-colors hover:bg-slate-50/50"
                            >
                              {/* En-tête de ligne COURS 1, COURS 2... */}
                              <td className="border-r border-slate-200 bg-slate-50/80 p-2 text-center align-middle text-xs font-black whitespace-nowrap text-slate-700">
                                COURS {numCours}
                              </td>

                              {/* Cellule pour chaque matière active */}
                              {matieresActives.map(
                                ({ matiere, quota, progs }) => {
                                  const prog = progs.find(
                                    (p) => p.numeroCours === numCours,
                                  );
                                  const estExcedentaire = numCours > quota;

                                  if (!prog && estExcedentaire) {
                                    return (
                                      <td
                                        key={matiere.id}
                                        className="border-r border-slate-200 bg-slate-50/40 p-2 text-center align-middle text-[10px] font-medium text-slate-300 italic last:border-r-0"
                                      >
                                        —
                                      </td>
                                    );
                                  }

                                  if (!prog) {
                                    return (
                                      <td
                                        key={matiere.id}
                                        className="border-r border-slate-200 bg-amber-50/15 p-2 text-center align-middle last:border-r-0"
                                      >
                                        <div className="inline-flex min-w-[100px] flex-col items-center justify-center rounded border border-dashed border-amber-300/80 bg-amber-50/40 px-2 py-1 text-amber-900">
                                          <span className="text-[9px] font-black tracking-wider text-amber-700 uppercase">
                                            Cours prévu
                                          </span>
                                          <span className="text-[10px] text-slate-400 italic">
                                            Non documenté
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  }

                                  const { type, titre } = decomposerTheme(
                                    prog.theme,
                                  );
                                  const lines = parseContenuLines(prog.contenu);
                                  const couleur = trouverCouleurParHex(
                                    matiere.couleur,
                                  );
                                  const estRattrapage = prog.theme
                                    ?.toUpperCase()
                                    .includes("RATTRAPAGE");

                                  return (
                                    <td
                                      key={matiere.id}
                                      className="space-y-1 border-r border-slate-200 p-2 align-top break-words last:border-r-0"
                                    >
                                      {/* Type de cours & Badge Rattrapage */}
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span
                                          className="inline-block rounded border px-1.5 py-0.5 text-[9px] leading-none font-black uppercase"
                                          style={
                                            couleur?.hex
                                              ? getCouleurBadgeStyle(
                                                  couleur.hex,
                                                )
                                              : {
                                                  backgroundColor: "#f1f5f9",
                                                  color: "#334155",
                                                  borderColor: "#cbd5e1",
                                                }
                                          }
                                        >
                                          {type}
                                        </span>
                                        {estRattrapage && (
                                          <span className="inline-block rounded border border-purple-400 bg-purple-50 px-1 py-0.5 text-[9px] leading-none font-black text-purple-900 uppercase">
                                            [RATTRAPAGE]
                                          </span>
                                        )}
                                      </div>

                                      {/* Thème principal */}
                                      <p className="text-[11px] leading-snug font-extrabold break-words text-slate-900">
                                        {titre || prog.theme || "Sans titre"}
                                      </p>

                                      {/* Points / Contenu de la séance */}
                                      {lines.filter((l) => l.trim().length > 0)
                                        .length > 0 && (
                                        <ul className="list-inside list-disc space-y-0.5 text-[10px] leading-tight text-slate-700">
                                          {lines
                                            .filter((l) => l.trim().length > 0)
                                            .map((line, idx) => (
                                              <li
                                                key={idx}
                                                className="break-words"
                                              >
                                                {line}
                                              </li>
                                            ))}
                                        </ul>
                                      )}

                                      {/* Exercices associés */}
                                      {prog.exercices &&
                                        prog.exercices.trim() && (
                                          <p className="border-t border-slate-100 pt-0.5 text-[9px] break-words text-slate-600">
                                            <strong className="text-[8px] font-bold text-slate-500 uppercase">
                                              Exercices :{" "}
                                            </strong>
                                            <span>{prog.exercices}</span>
                                          </p>
                                        )}
                                    </td>
                                  );
                                },
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Note de bas de tableau : Disciplines non programmées */}
                  {matieresNonProgrammes.length > 0 && (
                    <div className="flex items-center gap-2 rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
                      <span className="shrink-0 font-bold text-slate-700">
                        Disciplines non programmées cette semaine :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matieresNonProgrammes.map(({ matiere }) => (
                          <span
                            key={matiere.id}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            <span>{matiere.nom}</span>
                            <span className="font-mono text-slate-400">
                              (00)
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bloc de signature officiel EXCELIS pour cette feuille */}
                  <div
                    className="mt-6 grid grid-cols-2 gap-8 border-t-2 border-slate-200 pt-3 text-xs print:mt-3 print:pt-2"
                    style={{
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <div>
                      <p className="mb-4 text-[11px] font-bold text-slate-700 uppercase">
                        Visa du Chef de Département / Enseignants :
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Date et signature :
                        ........................................
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="mb-4 text-[11px] font-bold text-slate-700 uppercase">
                        Visa de la Direction Académique :
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Cachet & Approbation :
                        ........................................
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
