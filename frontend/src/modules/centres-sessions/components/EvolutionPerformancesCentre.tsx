"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Coins,
  Wallet,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Minus,
  ReceiptText,
} from "lucide-react";
import { Card, Button } from "@/shared/ui";
import type { Apprenant } from "@/modules/apprenants";
import type { MouvementFinancier } from "@/modules/financier";
import type { SessionAcademique } from "../domain/types";

const FCFA = new Intl.NumberFormat("fr-FR");

export type TypeIndicateur = "EFFECTIF" | "SOUSCRIT" | "ENCAISSE";
export type TypeGranularite = "SEMAINE" | "MOIS" | "JOUR";
export type ModeVue = "CUMUL" | "FLUX";

interface PointEvolution {
  id: string;
  label: string;
  subLabel: string;
  dateDebut: string;
  dateFin: string;
  // Métriques
  effectifNouveau: number;
  effectifCumule: number;
  souscritNouveau: number;
  souscritCumule: number;
  encaisseNouveau: number;
  encaisseCumule: number;
}

export interface EvolutionPerformancesCentreProps {
  nomCentre?: string;
  centreId?: string;
  sessionActive?: SessionAcademique | null;
  apprenantsDuCentre: Apprenant[];
  entreesCentre: MouvementFinancier[];
  onOuvrirTransactions?: () => void;
  className?: string;
}

function getNiceTicks(maxVal: number, tickCount = 4): { max: number; ticks: number[] } {
  if (maxVal <= 0) return { max: 10, ticks: [0, 5, 10] };

  const rawStep = maxVal / tickCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;

  let niceNorm = 1;
  if (norm <= 1) niceNorm = 1;
  else if (norm <= 2) niceNorm = 2;
  else if (norm <= 2.5) niceNorm = 2.5;
  else if (norm <= 5) niceNorm = 5;
  else niceNorm = 10;

  const step = niceNorm * mag;
  const ticks: number[] = [];
  let curr = 0;
  while (curr <= maxVal || ticks.length <= 2) {
    ticks.push(curr);
    curr += step;
  }
  ticks.push(curr);
  const max = ticks[ticks.length - 1];

  return { max, ticks };
}

function formatCompactFCFA(val: number): string {
  if (val >= 1_000_000) {
    const m = (val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1);
    return `${m}M F`;
  }
  if (val >= 1_000) {
    const k = (val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 0);
    return `${k}k F`;
  }
  return `${val} F`;
}

function generateSmoothPath(
  points: { x: number; y: number }[],
  baselineY: number,
): { linePath: string; areaPath: string } {
  if (points.length === 0) return { linePath: "", areaPath: "" };
  if (points.length === 1) {
    const p = points[0];
    return {
      linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
      areaPath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${baselineY} L ${p.x - 20} ${baselineY} Z`,
    };
  }

  let linePath = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const tension = 0.2;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x + (p1.x - p3.x) * tension;
    const cp2y = p2.y + (p1.y - p3.y) * tension;

    linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath = `${linePath} L ${lastPt.x.toFixed(2)} ${baselineY} L ${firstPt.x.toFixed(2)} ${baselineY} Z`;

  return { linePath, areaPath };
}

export function EvolutionPerformancesCentre({
  nomCentre,
  sessionActive,
  apprenantsDuCentre,
  entreesCentre,
  onOuvrirTransactions,
  className = "",
}: EvolutionPerformancesCentreProps) {
  const [indicateur, setIndicateur] = useState<TypeIndicateur>("EFFECTIF");
  const [granularite, setGranularite] = useState<TypeGranularite>("SEMAINE");
  const [modeVue, setModeVue] = useState<ModeVue>("FLUX");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Détermination de la date de dernière mise à jour réelle
  const derniereDateMAJ = useMemo(() => {
    let maxTimestamp = 0;
    apprenantsDuCentre.forEach((a) => {
      if (a.dateInscription) {
        const t = new Date(a.dateInscription).getTime();
        if (t > maxTimestamp) maxTimestamp = t;
      }
    });
    entreesCentre.forEach((e) => {
      if (e.date) {
        const t = new Date(e.date).getTime();
        if (t > maxTimestamp) maxTimestamp = t;
      }
    });

    if (maxTimestamp === 0) return null;
    return new Date(maxTimestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [apprenantsDuCentre, entreesCentre]);

  // 2. Calcul des séries chronologiques
  const series = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const debut = sessionActive?.dateDebut || "2026-09-01";
    const fin =
      sessionActive?.dateFin && sessionActive.dateFin < todayStr
        ? sessionActive.dateFin
        : todayStr;

    const debutDate = new Date(debut);
    const finDate = new Date(fin);

    const buckets: PointEvolution[] = [];

    if (granularite === "SEMAINE") {
      const diffJours = Math.max(
        1,
        Math.floor((finDate.getTime() - debutDate.getTime()) / 86400000),
      );
      const totalSemaines = Math.max(1, Math.ceil(diffJours / 7));

      for (let w = 1; w <= totalSemaines; w++) {
        const dStart = new Date(debutDate.getTime() + (w - 1) * 7 * 86400000);
        const dEnd = new Date(debutDate.getTime() + (w * 7 - 1) * 86400000);
        const startStr = dStart.toISOString().slice(0, 10);
        const endStr = dEnd.toISOString().slice(0, 10);

        const label = `Sem. ${w}`;
        const subLabel = `${dStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${dEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;

        buckets.push({
          id: `semaine-${w}`,
          label,
          subLabel,
          dateDebut: startStr,
          dateFin: endStr,
          effectifNouveau: 0,
          effectifCumule: 0,
          souscritNouveau: 0,
          souscritCumule: 0,
          encaisseNouveau: 0,
          encaisseCumule: 0,
        });
      }
    } else if (granularite === "MOIS") {
      let curr = new Date(debutDate.getFullYear(), debutDate.getMonth(), 1);
      const endTarget = new Date(finDate.getFullYear(), finDate.getMonth(), 1);

      while (curr <= endTarget) {
        const year = curr.getFullYear();
        const month = curr.getMonth();
        const nextMonth = new Date(year, month + 1, 0);

        const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endStr = nextMonth.toISOString().slice(0, 10);

        const label = curr.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        });
        const subLabel = curr.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });

        buckets.push({
          id: `mois-${year}-${month + 1}`,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          subLabel: subLabel.charAt(0).toUpperCase() + subLabel.slice(1),
          dateDebut: startStr,
          dateFin: endStr,
          effectifNouveau: 0,
          effectifCumule: 0,
          souscritNouveau: 0,
          souscritCumule: 0,
          encaisseNouveau: 0,
          encaisseCumule: 0,
        });

        curr = new Date(year, month + 1, 1);
      }
    } else if (granularite === "JOUR") {
      // 30 derniers jours actifs
      const nbJours = Math.min(
        30,
        Math.max(
          7,
          Math.floor((finDate.getTime() - debutDate.getTime()) / 86400000) + 1,
        ),
      );
      const startJours = new Date(finDate.getTime() - (nbJours - 1) * 86400000);

      for (let i = 0; i < nbJours; i++) {
        const d = new Date(startJours.getTime() + i * 86400000);
        const dStr = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        const subLabel = d.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "long",
        });

        buckets.push({
          id: `jour-${dStr}`,
          label,
          subLabel,
          dateDebut: dStr,
          dateFin: dStr,
          effectifNouveau: 0,
          effectifCumule: 0,
          souscritNouveau: 0,
          souscritCumule: 0,
          encaisseNouveau: 0,
          encaisseCumule: 0,
        });
      }
    }

    if (buckets.length === 0) return [];

    // Accumulation initiale antérieure au premier bucket
    let cumulEleves = 0;
    let cumulSouscrit = 0;
    let cumulEncaisse = 0;

    const premierDebut = buckets[0].dateDebut;
    apprenantsDuCentre.forEach((a) => {
      if (a.dateInscription && a.dateInscription < premierDebut) {
        cumulEleves++;
        cumulSouscrit += a.montantContrat || 0;
      }
    });

    entreesCentre.forEach((e) => {
      if (e.date && e.date < premierDebut) {
        cumulEncaisse += e.montant || 0;
      }
    });

    // Remplissage des buckets
    buckets.forEach((b) => {
      apprenantsDuCentre.forEach((a) => {
        if (
          a.dateInscription &&
          a.dateInscription >= b.dateDebut &&
          a.dateInscription <= b.dateFin
        ) {
          b.effectifNouveau++;
          b.souscritNouveau += a.montantContrat || 0;
        }
      });

      entreesCentre.forEach((e) => {
        if (e.date && e.date >= b.dateDebut && e.date <= b.dateFin) {
          b.encaisseNouveau += e.montant || 0;
        }
      });

      cumulEleves += b.effectifNouveau;
      cumulSouscrit += b.souscritNouveau;
      cumulEncaisse += b.encaisseNouveau;

      b.effectifCumule = cumulEleves;
      b.souscritCumule = cumulSouscrit;
      b.encaisseCumule = cumulEncaisse;
    });

    return buckets;
  }, [sessionActive, granularite, apprenantsDuCentre, entreesCentre]);

  // 3. Synthèse concise pour l'indicateur sélectionné
  const synthese = useMemo(() => {
    if (series.length === 0) {
      return {
        valeurActuelle: 0,
        variationAbsolue: 0,
        variationPourcent: 0,
        estProgression: true,
        estEgal: true,
        aPeriodePrecedente: false,
        dernierLabel: "—",
      };
    }

    const dernier = series[series.length - 1];
    const precedent = series.length > 1 ? series[series.length - 2] : null;

    let valeurActuelle = 0;
    let valeurPrecedente = 0;

    if (indicateur === "EFFECTIF") {
      valeurActuelle = modeVue === "CUMUL" ? dernier.effectifCumule : dernier.effectifNouveau;
      valeurPrecedente = precedent
        ? modeVue === "CUMUL"
          ? precedent.effectifCumule
          : precedent.effectifNouveau
        : 0;
    } else if (indicateur === "SOUSCRIT") {
      valeurActuelle = modeVue === "CUMUL" ? dernier.souscritCumule : dernier.souscritNouveau;
      valeurPrecedente = precedent
        ? modeVue === "CUMUL"
          ? precedent.souscritCumule
          : precedent.souscritNouveau
        : 0;
    } else if (indicateur === "ENCAISSE") {
      valeurActuelle = modeVue === "CUMUL" ? dernier.encaisseCumule : dernier.encaisseNouveau;
      valeurPrecedente = precedent
        ? modeVue === "CUMUL"
          ? precedent.encaisseCumule
          : precedent.encaisseNouveau
        : 0;
    }

    const variationAbsolue = valeurActuelle - valeurPrecedente;
    const variationPourcent =
      valeurPrecedente > 0
        ? Math.round((variationAbsolue / valeurPrecedente) * 100)
        : valeurActuelle > 0
        ? 100
        : 0;

    return {
      valeurActuelle,
      variationAbsolue,
      variationPourcent,
      estProgression: variationAbsolue > 0,
      estEgal: variationAbsolue === 0,
      aPeriodePrecedente: precedent !== null,
      dernierLabel: dernier.label,
    };
  }, [series, indicateur, modeVue]);

  // 4. Configuration thématique selon l'indicateur
  const config = useMemo(() => {
    switch (indicateur) {
      case "EFFECTIF":
        return {
          label: "Effectif des élèves",
          court: "Élèves",
          unite: "élèves",
          unitePluriel: "élèves",
          uniteSingulier: "élève",
          colorStroke: "#f7931e",
          colorFill: "rgba(247, 147, 30, 0.15)",
          colorLight: "rgba(247, 147, 30, 0.0)",
          colorBadge: "bg-orange-50 text-brand-orange border border-orange-200/60",
          icon: Users,
        };
      case "SOUSCRIT":
        return {
          label: "Montants souscrits",
          court: "Souscriptions",
          unite: "FCFA",
          unitePluriel: "FCFA",
          uniteSingulier: "FCFA",
          colorStroke: "#2d2e80",
          colorFill: "rgba(45, 46, 128, 0.15)",
          colorLight: "rgba(45, 46, 128, 0.0)",
          colorBadge: "bg-indigo-50 text-indigo-900 border border-indigo-200/60",
          icon: Coins,
        };
      case "ENCAISSE":
        return {
          label: "Encaissements réels",
          court: "Encaissements",
          unite: "FCFA",
          unitePluriel: "FCFA",
          uniteSingulier: "FCFA",
          colorStroke: "#2d6a4f",
          colorFill: "rgba(45, 106, 79, 0.18)",
          colorLight: "rgba(45, 106, 79, 0.0)",
          colorBadge: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
          icon: Wallet,
        };
    }
  }, [indicateur]);

  // 5. Calcul des coordonnées SVG
  const svgWidth = 840;
  const svgHeight = 270;
  const padLeft = indicateur === "EFFECTIF" ? 44 : 70;
  const padRight = 32;
  const padTop = 26;
  const padBottom = 42;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const baselineY = padTop + chartH;

  const { points, ticksInfo } = useMemo(() => {
    if (series.length === 0) {
      return {
        points: [],
        ticksInfo: { max: 10, ticks: [0, 5, 10] },
      };
    }

    const valeurs = series.map((s) => {
      if (indicateur === "EFFECTIF") {
        return modeVue === "CUMUL" ? s.effectifCumule : s.effectifNouveau;
      }
      if (indicateur === "SOUSCRIT") {
        return modeVue === "CUMUL" ? s.souscritCumule : s.souscritNouveau;
      }
      return modeVue === "CUMUL" ? s.encaisseCumule : s.encaisseNouveau;
    });

    const maxVal = Math.max(...valeurs, 0);
    const ticksInfo = getNiceTicks(maxVal, 4);
    const topY = ticksInfo.max;

    const n = series.length;
    const pts = series.map((item, i) => {
      const val = valeurs[i];
      const x = n === 1 ? padLeft + chartW / 2 : padLeft + (i / (n - 1)) * chartW;
      const y = baselineY - (topY > 0 ? (val / topY) * chartH : 0);
      return { x, y, val, item, index: i };
    });

    return { points: pts, ticksInfo };
  }, [series, indicateur, modeVue, chartW, chartH, padLeft, baselineY]);

  const { linePath, areaPath } = useMemo(() => {
    return generateSmoothPath(points, baselineY);
  }, [points, baselineY]);

  // Point actif survolé ou dernier point par défaut
  const activePoint = useMemo(() => {
    if (points.length === 0) return null;
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length) {
      return points[hoverIndex];
    }
    return points[points.length - 1];
  }, [points, hoverIndex]);

  // Nombre total d'apprenants et d'encaissements réels pour vérifier l'état vide
  const aDesDonnees =
    apprenantsDuCentre.length > 0 || entreesCentre.length > 0;

  return (
    <Card
      className={`border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}
    >
      {/* ── 1. En-tête du bloc graphique ── */}
      <div className="border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-50 text-brand-orange">
              <TrendingUp size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Évolution des performances — Session active
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trajectoire chronologique des effectifs, engagements contractuels et encaissements réels.
          </p>
        </div>

        {/* Action secondaire : Consultation des dernières transactions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOuvrirTransactions ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onOuvrirTransactions}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <ReceiptText size={14} className="text-slate-500" />
              <span>Voir les dernières transactions</span>
            </Button>
          ) : (
            <Link href="/finances">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <ReceiptText size={14} className="text-slate-500" />
                <span>Voir les dernières transactions</span>
              </Button>
            </Link>
          )}

          <Link
            href="/finances"
            className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 ml-1"
            title="Consulter le journal financier complet"
          >
            <span>Journal</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── 2. Barre de commandes : Sélecteur d'Indicateur & Granularité ── */}
      <div className="bg-slate-50/70 border-b border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sélecteur d'indicateur (1 seul à la fois, sans échelle mixte) */}
        <div className="flex items-center rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setIndicateur("EFFECTIF")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              indicateur === "EFFECTIF"
                ? "bg-brand-orange text-white shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Users size={14} />
            <span>Effectifs</span>
          </button>

          <button
            type="button"
            onClick={() => setIndicateur("SOUSCRIT")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              indicateur === "SOUSCRIT"
                ? "bg-brand-blue text-white shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Coins size={14} />
            <span>Montants souscrits</span>
          </button>

          <button
            type="button"
            onClick={() => setIndicateur("ENCAISSE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              indicateur === "ENCAISSE"
                ? "bg-emerald-700 text-white shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Wallet size={14} />
            <span>Encaissements</span>
          </button>
        </div>

        {/* Contrôles secondaires : Granularité & Mode de vue */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de mode : Cumulé / Nouveaux */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setModeVue("CUMUL")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                modeVue === "CUMUL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Cumulatif
            </button>
            <button
              type="button"
              onClick={() => setModeVue("FLUX")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                modeVue === "FLUX"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Par période
            </button>
          </div>

          {/* Granularité : Semaine / Mois / Jour */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setGranularite("SEMAINE")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                granularite === "SEMAINE"
                  ? "bg-brand-orange/10 text-brand-orange font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setGranularite("MOIS")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                granularite === "MOIS"
                  ? "bg-brand-orange/10 text-brand-orange font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setGranularite("JOUR")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                granularite === "JOUR"
                  ? "bg-brand-orange/10 text-brand-orange font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Jour
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Synthèse concise au-dessus du graphique ── */}
      <div className="p-5 pb-3">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {modeVue === "CUMUL" ? "Valeur cumulée actuelle" : "Dernier flux enregistré"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.colorBadge}`}>
                {config.court}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {indicateur === "EFFECTIF"
                  ? `${synthese.valeurActuelle} ${synthese.valeurActuelle > 1 ? config.unitePluriel : config.uniteSingulier}`
                  : `${FCFA.format(synthese.valeurActuelle)} ${config.unite}`}
              </span>

              {/* Variation par rapport à la période précédente */}
              {synthese.aPeriodePrecedente ? (
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${
                    synthese.estEgal
                      ? "bg-slate-100 text-slate-600"
                      : synthese.estProgression
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-amber-50 text-amber-800 border border-amber-200/60"
                  }`}
                  title={`Évolution par rapport à la période précédente (${series.length > 1 ? series[series.length - 2].label : ""})`}
                >
                  {synthese.estEgal ? (
                    <Minus size={12} />
                  ) : synthese.estProgression ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  <span>
                    {synthese.estProgression ? "+" : ""}
                    {indicateur === "EFFECTIF"
                      ? `${synthese.variationAbsolue} élève${Math.abs(synthese.variationAbsolue) > 1 ? "s" : ""}`
                      : `${FCFA.format(synthese.variationAbsolue)} F`}
                    {synthese.variationPourcent !== 0 && (
                      <span className="opacity-80 ml-1">
                        ({synthese.estProgression ? "+" : ""}
                        {synthese.variationPourcent}%)
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-normal opacity-75">
                    vs {granularite === "SEMAINE" ? "sem. préc." : granularite === "MOIS" ? "mois préc." : "veille"}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  {series.length === 1 ? "Première période" : "—"}
                </span>
              )}
            </div>
          </div>

          {/* Date de dernière mise à jour des données */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium self-start md:self-auto">
            <Clock size={13} className="text-slate-400" />
            <span>
              {derniereDateMAJ
                ? `Dernière mise à jour : ${derniereDateMAJ}`
                : "En attente des premières opérations"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Graphique SVG Interactif ── */}
      <div className="px-5 pb-6">
        {!aDesDonnees || series.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Calendar size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Aucun historique disponible pour cette session
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Les courbes d&rsquo;évolution se construiront automatiquement dès que les premières inscriptions ou règlements financiers seront enregistrés au centre.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative w-full select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Infobulle de survol (Tooltip) */}
            {activePoint && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-150 ease-out -translate-x-1/2 -top-1"
                style={{
                  left: `${(activePoint.x / svgWidth) * 100}%`,
                }}
              >
                <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl px-3 py-2 text-xs shadow-lg border border-slate-700/60 min-w-[170px] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1 mb-1.5">
                    <span className="font-black text-amber-400">
                      {activePoint.item.label}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      {activePoint.item.subLabel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-xs font-bold">
                      <span className="text-slate-300">
                        {modeVue === "CUMUL" ? "Cumul :" : "Flux :"}
                      </span>
                      <span className="text-white font-black tabular-nums">
                        {indicateur === "EFFECTIF"
                          ? `${activePoint.val} ${activePoint.val > 1 ? config.unitePluriel : config.uniteSingulier}`
                          : `${FCFA.format(activePoint.val)} ${config.unite}`}
                      </span>
                    </div>

                    {modeVue === "CUMUL" && (
                      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                        <span>Période :</span>
                        <span className="text-emerald-400 font-semibold tabular-nums">
                          {indicateur === "EFFECTIF"
                            ? `+${activePoint.item.effectifNouveau} élève${activePoint.item.effectifNouveau > 1 ? "s" : ""}`
                            : indicateur === "SOUSCRIT"
                            ? `+${FCFA.format(activePoint.item.souscritNouveau)} F`
                            : `+${FCFA.format(activePoint.item.encaisseNouveau)} F`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rendu SVG responsive */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[290px] overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`gradient-${indicateur}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.colorStroke} stopOpacity="0.28" />
                  <stop offset="85%" stopColor={config.colorStroke} stopOpacity="0.04" />
                  <stop offset="100%" stopColor={config.colorStroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Lignes de repère horizontales (Y Ticks) */}
              {ticksInfo.ticks.map((tickVal) => {
                const y = baselineY - (ticksInfo.max > 0 ? (tickVal / ticksInfo.max) * chartH : 0);
                return (
                  <g key={tickVal} className="text-slate-200">
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-bold select-none tabular-nums"
                    >
                      {indicateur === "EFFECTIF"
                        ? tickVal
                        : formatCompactFCFA(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* Surface sous la courbe (Area Gradient Fill) */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#gradient-${indicateur})`}
                  className="transition-all duration-300"
                />
              )}

              {/* Ligne principale de la courbe */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={config.colorStroke}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Repère vertical lors du survol */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1={padTop}
                    x2={activePoint.x}
                    y2={baselineY}
                    stroke={config.colorStroke}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                  {/* Point actif en halo */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="6.5"
                    fill={config.colorStroke}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="drop-shadow-sm"
                  />
                </g>
              )}

              {/* Points de données sur la courbe */}
              {points.map((pt, i) => {
                const estSurvole = activePoint && activePoint.index === i;
                return (
                  <g key={pt.item.id}>
                    {/* Point discret */}
                    {!estSurvole && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#ffffff"
                        stroke={config.colorStroke}
                        strokeWidth="2"
                        className="transition-transform duration-150"
                      />
                    )}

                    {/* Zone d'interaction invisible plus large */}
                    <rect
                      x={i === 0 ? padLeft : pt.x - chartW / (points.length * 2)}
                      y={padTop}
                      width={
                        points.length === 1
                          ? chartW
                          : chartW / (points.length - 1)
                      }
                      height={chartH + padBottom}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIndex(i)}
                      onTouchStart={() => setHoverIndex(i)}
                    />
                  </g>
                );
              })}

              {/* Axe X (Labels temporels) */}
              {points.map((pt, i) => {
                // Affiche les labels pour éviter la surcharge visuelle
                const total = points.length;
                let afficher = true;
                if (total > 16) afficher = i % 3 === 0 || i === total - 1;
                else if (total > 10) afficher = i % 2 === 0 || i === total - 1;

                if (!afficher) return null;

                return (
                  <g key={`lbl-${pt.item.id}`}>
                    <text
                      x={pt.x}
                      y={baselineY + 18}
                      textAnchor="middle"
                      className={`text-[10px] select-none tabular-nums transition-colors ${
                        activePoint && activePoint.index === i
                          ? "fill-slate-900 font-black"
                          : "fill-slate-500 font-semibold"
                      }`}
                    >
                      {pt.item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* ── 5. Légende & Contexte Opérationnel en pied de carte ── */}
      <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: config.colorStroke }}
            />
            <span className="font-semibold text-slate-700">
              {config.label}
            </span>
          </div>

          <span className="text-slate-300">·</span>

          <span className="text-[11px]">
            Unité d&rsquo;affichage :{" "}
            <strong className="text-slate-700 font-bold">{config.unite}</strong>
          </span>

          <span className="text-slate-300">·</span>

          <span className="text-[11px]">
            Cadence :{" "}
            <strong className="text-slate-700 font-bold">
              {granularite === "SEMAINE"
                ? "Hebdomadaire"
                : granularite === "MOIS"
                ? "Mensuelle"
                : "Journalière"}
            </strong>
          </span>
        </div>

        {nomCentre && (
          <div className="text-[11px] font-medium text-slate-400 self-start sm:self-auto">
            Données certifiées · {nomCentre}
          </div>
        )}
      </div>
    </Card>
  );
}
