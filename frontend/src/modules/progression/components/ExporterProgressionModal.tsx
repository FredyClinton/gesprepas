"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import {
  trouverCouleurParHex,
  getCouleurBadgeStyle,
} from "@/modules/matieres";

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

function getQuotaForFormation(
  formationId: string,
  semaine: number,
  matiereId: string,
  defaut: number = 0,
): number {
  if (typeof window === "undefined") return defaut;
  try {
    const raw = localStorage.getItem(`excelis_quotas_${formationId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const key = `${semaine}_${matiereId}`;
      if (parsed[key] !== undefined) return parsed[key];
    }
  } catch {}
  return defaut;
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
  const [masquerNonProgrammes, setMasquerNonProgrammes] = useState<boolean>(true);

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
  const { data: affectationsToutesSemaines = [] } = useAffectationsMultiSemaines({
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
        ordrePerso ? reordonnerMatieres(toutesLesMatieres, ordrePerso) : toutesLesMatieres,
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
      className="printable-progression-modal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-brand-anthracite/60 backdrop-blur-xs animate-in fade-in duration-150 print:static print:block print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:max-h-none print:w-full print:inset-auto print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col w-full max-w-6xl h-[92vh] max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:static print:block print:max-h-none print:h-auto print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-none print:shadow-none print:m-0 print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de contrôle supérieure (Masquée à l'impression) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-white shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Aperçu avant impression — Progression Pédagogique
              </h3>
              <p className="text-xs text-slate-500">
                Prévisualisation haute fidélité au format officiel A4 Paysage ({feuillesAExporter.length} page{feuillesAExporter.length > 1 ? "s" : ""})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition-colors cursor-pointer active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Options de compilation et filtrage (Masquées à l'impression) */}
        <div className="border-b border-slate-200/80 bg-white px-6 py-3.5 space-y-3 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Choix de formation */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Formation à inclure
              </label>
              <select
                value={formationSelectionnee}
                onChange={(e) => setFormationSelectionnee(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Semaines à exporter
              </label>
              <select
                value={semaineSelectionnee}
                onChange={(e) =>
                  setSemaineSelectionnee(
                    e.target.value === "TOUTES" ? "TOUTES" : Number(e.target.value),
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
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
                className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 hover:text-brand-orange transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    masquerNonProgrammes
                      ? "bg-brand-orange border-brand-orange text-white"
                      : "bg-white border-slate-300 text-transparent"
                  }`}
                >
                  <CheckSquare size={14} />
                </div>
                <span>
                  Masquer les disciplines à quota 00 (gain de place)
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50/60 border border-amber-200/60 rounded-lg px-3 py-1.5">
            <AlertCircle size={13} className="text-amber-600 shrink-0" />
            <span>
              <strong>Aperçu fidèle :</strong> Chaque feuille ci-dessous correspond exactement à une page A4 paysage imprimée ({feuillesAExporter.length} page{feuillesAExporter.length > 1 ? "s" : ""} au total), avec son cartouche officiel, son tableau complet et ses visas de validation.
            </span>
          </div>
        </div>

        {/* Corps du document imprimable / Aperçu */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-8 print:bg-white print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block">
          <div className="space-y-8 print:space-y-0">
            {feuillesAExporter.map(({ formation, semaine }, index) => {
              const estDerniereFeuille = index === feuillesAExporter.length - 1;

              const progressionsSemaine = progressions.filter(
                (p) =>
                  p.formationId === formation.id &&
                  p.semaine === semaine,
              );
              const affectationsSemaine = toutesAffectations.filter(
                (a) =>
                  a.formationId === formation.id &&
                  a.semaine === semaine,
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
                const quota = getQuotaForFormation(
                  formation.id,
                  semaine,
                  m.id,
                  defaultQuota,
                );

                // Règle métier :
                // Les cours prévus mais pas documentés doivent quand même figurer dans le tableau.
                // C'est quand la matière n'a AUCUNE séance prévue qu'elle est considérée comme non programmée.
                const aDesCoursPrevus =
                  nbSeances > 0 || quota > 0 || progsMatiere.length > 0;
                const quotaEffectif = Math.max(nbSeances, quota, progsMatiere.length);

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
                  className="progression-sheet-page bg-white p-6 sm:p-8 mx-auto w-full max-w-5xl shadow-md border border-slate-300/80 rounded-sm print:max-w-none print:w-full print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none mb-8 print:mb-0 flex flex-col justify-between"
                  style={{
                    pageBreakAfter: estDerniereFeuille ? "auto" : "always",
                    breakAfter: estDerniereFeuille ? "auto" : "page",
                    pageBreakInside: "avoid",
                    breakInside: "avoid",
                  }}
                >
                  {/* Indicateur de page à l'écran (masqué à l'impression) */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-[11px] font-bold text-slate-400 print:hidden">
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} className="text-brand-orange" />
                      <span>
                        Page {index + 1} / {feuillesAExporter.length} — {formation.nom} (Semaine {semaine})
                      </span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">
                      Format A4 Paysage
                    </span>
                  </div>

                  {/* Cartouche officiel EXCELIS PRÉPAS pour cette feuille */}
                  <div className="mb-2.5 border-2 border-brand-orange rounded-xl bg-orange-50/20 p-2.5 print:p-2 print:mb-2">
                    <div className="flex items-start justify-between border-b border-orange-200 pb-1.5 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                            EXCELIS PRÉPAS
                          </span>
                          <span className="text-xs font-bold text-brand-orange">
                            — FICHE DE PROGRESSION PÉDAGOGIQUE
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Classes Préparatoires aux Grandes Écoles & Concours d'Excellence
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <p className="font-black text-slate-900">
                          SESSION {sessionAnnee}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Édité le {new Date().toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 uppercase text-[10px] font-bold">
                          FORMATION :
                        </span>{" "}
                        <span className="font-black text-slate-900 uppercase bg-white border border-slate-200 px-2 py-0.5 rounded-md text-xs">
                          {formation.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-orange text-white font-black text-[11px] px-2 py-0.5 rounded uppercase">
                          Semaine {semaine}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({matieresActives.length} discipline{matieresActives.length > 1 ? "s" : ""} active{matieresActives.length > 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tableau grille de la semaine */}
                  {matieresActives.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-lg border border-slate-200">
                      Aucune discipline active pour {formation.nom} en Semaine {semaine}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full table-fixed border-collapse text-left text-xs border border-slate-300">
                        <thead>
                          <tr className="bg-brand-orange text-white">
                            <th className="w-16 p-2 text-center font-black uppercase tracking-wider text-[11px] border-r border-orange-600/50">
                              COURS
                            </th>
                            {matieresActives.map(
                              ({ matiere, quota, progs }) => {
                                return (
                                  <th
                                    key={matiere.id}
                                    className="p-2 text-center font-black uppercase tracking-wider text-xs border-r border-orange-600/50 last:border-r-0"
                                  >
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      <span className="truncate">{matiere.nom}</span>
                                      <span className="font-mono text-[11px] opacity-95">
                                        ({String(quota).padStart(2, "0")})
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-normal opacity-85 normal-case mt-0.5">
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
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              {/* En-tête de ligne COURS 1, COURS 2... */}
                              <td className="p-2 text-center font-black bg-slate-50/80 text-slate-700 border-r border-slate-200 text-xs whitespace-nowrap align-middle">
                                COURS {numCours}
                              </td>

                              {/* Cellule pour chaque matière active */}
                              {matieresActives.map(
                                ({ matiere, quota, progs }) => {
                                  const prog = progs.find(
                                    (p) => p.numeroCours === numCours,
                                  );
                                  const estExcedentaire =
                                    numCours > quota;

                                  if (!prog && estExcedentaire) {
                                    return (
                                      <td
                                        key={matiere.id}
                                        className="p-2 text-center bg-slate-50/40 border-r border-slate-200 text-[10px] font-medium text-slate-300 italic last:border-r-0 align-middle"
                                      >
                                        —
                                      </td>
                                    );
                                  }

                                  if (!prog) {
                                    return (
                                      <td
                                        key={matiere.id}
                                        className="p-2 text-center border-r border-slate-200 bg-amber-50/15 last:border-r-0 align-middle"
                                      >
                                        <div className="inline-flex flex-col items-center justify-center py-1 px-2 rounded border border-dashed border-amber-300/80 bg-amber-50/40 text-amber-900 min-w-[100px]">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                            Cours prévu
                                          </span>
                                          <span className="text-[10px] italic text-slate-400">
                                            Non documenté
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  }

                                  const { type, titre } = decomposerTheme(prog.theme);
                                  const lines = parseContenuLines(prog.contenu);
                                  const couleur = trouverCouleurParHex(
                                    matiere.couleur,
                                  );
                                  const estRattrapage =
                                    prog.theme?.toUpperCase().includes("RATTRAPAGE");

                                  return (
                                    <td
                                      key={matiere.id}
                                      className="p-2 align-top border-r border-slate-200 space-y-1 last:border-r-0 break-words"
                                    >
                                      {/* Type de cours & Badge Rattrapage */}
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border leading-none inline-block"
                                          style={
                                            couleur?.hex
                                              ? getCouleurBadgeStyle(couleur.hex)
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
                                          <span className="text-[9px] font-black uppercase px-1 py-0.5 border border-purple-400 bg-purple-50 text-purple-900 rounded leading-none inline-block">
                                            [RATTRAPAGE]
                                          </span>
                                        )}
                                      </div>

                                      {/* Thème principal */}
                                      <p className="font-extrabold text-slate-900 text-[11px] leading-snug break-words">
                                        {titre || prog.theme || "Sans titre"}
                                      </p>

                                      {/* Points / Contenu de la séance */}
                                      {lines.filter((l) => l.trim().length > 0).length > 0 && (
                                        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 leading-tight">
                                          {lines
                                            .filter((l) => l.trim().length > 0)
                                            .map((line, idx) => (
                                              <li key={idx} className="break-words">
                                                {line}
                                              </li>
                                            ))}
                                        </ul>
                                      )}

                                      {/* Exercices associés */}
                                      {prog.exercices && prog.exercices.trim() && (
                                        <p className="text-[9px] text-slate-600 pt-0.5 border-t border-slate-100 break-words">
                                          <strong className="font-bold uppercase text-[8px] text-slate-500">
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
                    <div className="bg-slate-50 border border-t-0 border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 flex items-center gap-2 rounded-b-lg">
                      <span className="font-bold text-slate-700 shrink-0">
                        Disciplines non programmées cette semaine :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matieresNonProgrammes.map(({ matiere }) => (
                          <span
                            key={matiere.id}
                            className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
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
                    className="mt-6 pt-3 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs print:mt-3 print:pt-2"
                    style={{
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <div>
                      <p className="font-bold uppercase text-slate-700 mb-4 text-[11px]">
                        Visa du Chef de Département / Enseignants :
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Date et signature : ........................................
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold uppercase text-slate-700 mb-4 text-[11px]">
                        Visa de la Direction Académique :
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Cachet & Approbation : ........................................
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

