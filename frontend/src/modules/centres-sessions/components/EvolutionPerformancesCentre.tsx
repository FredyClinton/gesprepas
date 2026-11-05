"use client";

import { useMemo, useState } from "react";
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
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

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

  // 5. Données formatées pour Recharts
  const donneesRecharts = useMemo(() => {
    return series.map((s, i) => {
      let valeur = 0;
      let valeurPeriode = 0;
      if (indicateur === "EFFECTIF") {
        valeur = modeVue === "CUMUL" ? s.effectifCumule : s.effectifNouveau;
        valeurPeriode = s.effectifNouveau;
      } else if (indicateur === "SOUSCRIT") {
        valeur = modeVue === "CUMUL" ? s.souscritCumule : s.souscritNouveau;
        valeurPeriode = s.souscritNouveau;
      } else {
        valeur = modeVue === "CUMUL" ? s.encaisseCumule : s.encaisseNouveau;
        valeurPeriode = s.encaisseNouveau;
      }
      return {
        label: s.label,
        subLabel: s.subLabel,
        valeur,
        valeurPeriode,
        index: i,
      };
    });
  }, [series, indicateur, modeVue]);

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
          <div className="h-[270px] w-full select-none mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donneesRecharts} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id={`gradient-${indicateur}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={config.colorStroke} stopOpacity="0.28" />
                    <stop offset="85%" stopColor={config.colorStroke} stopOpacity="0.04" />
                    <stop offset="100%" stopColor={config.colorStroke} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    indicateur === "EFFECTIF" ? String(val) : formatCompactFCFA(val)
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const pt = payload[0]?.payload;
                    return (
                      <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl p-3 text-xs shadow-xl border border-slate-700/60 min-w-[190px] whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1.5 mb-2">
                          <span className="font-black text-amber-400">{label}</span>
                          <span className="text-[10px] text-slate-300">{pt?.subLabel}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-slate-300 font-medium">{config.label} :</span>
                          <span className="text-white font-black tabular-nums">
                            {indicateur === "EFFECTIF"
                              ? `${pt?.valeur || 0} él.`
                              : `${FCFA.format(pt?.valeur || 0)} F`}
                          </span>
                        </div>
                        {modeVue === "CUMUL" && (
                          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                            <span>Sur la période :</span>
                            <span className="text-emerald-400 font-semibold tabular-nums">
                              {indicateur === "EFFECTIF"
                                ? `+${pt?.valeurPeriode || 0} él.`
                                : `+${FCFA.format(pt?.valeurPeriode || 0)} F`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valeur"
                  stroke={config.colorStroke}
                  strokeWidth={2.75}
                  fill={`url(#gradient-${indicateur})`}
                  dot={{ r: 3, fill: config.colorStroke }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
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
