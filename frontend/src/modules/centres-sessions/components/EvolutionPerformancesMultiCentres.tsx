"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  Coins,
  Wallet,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Trophy,
} from "lucide-react";
import { Card } from "@/shared/ui";
import type { Apprenant } from "@/modules/apprenants";
import type { MouvementFinancier } from "@/modules/financier";
import type { Centre, SessionAcademique } from "../domain/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const FCFA = new Intl.NumberFormat("fr-FR");

export type TypeIndicateur = "EFFECTIF" | "SOUSCRIT" | "ENCAISSE";
export type TypeGranularite = "SEMAINE" | "MOIS" | "JOUR";
export type ModeVue = "CUMUL" | "FLUX";

const COULEURS_CENTRES = [
  { stroke: "#f7931e", bg: "bg-[#f7931e]", text: "text-[#f7931e]", pill: "bg-orange-50 text-brand-orange border-orange-200" },
  { stroke: "#2d2e80", bg: "bg-[#2d2e80]", text: "text-[#2d2e80]", pill: "bg-blue-50 text-blue-900 border-blue-200" },
  { stroke: "#10b981", bg: "bg-[#10b981]", text: "text-[#10b981]", pill: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { stroke: "#8b5cf6", bg: "bg-[#8b5cf6]", text: "text-[#8b5cf6]", pill: "bg-purple-50 text-purple-800 border-purple-200" },
  { stroke: "#f59e0b", bg: "bg-[#f59e0b]", text: "text-[#f59e0b]", pill: "bg-amber-50 text-amber-900 border-amber-200" },
  { stroke: "#06b6d4", bg: "bg-[#06b6d4]", text: "text-[#06b6d4]", pill: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  { stroke: "#f43f5e", bg: "bg-[#f43f5e]", text: "text-[#f43f5e]", pill: "bg-rose-50 text-rose-800 border-rose-200" },
  { stroke: "#0d9488", bg: "bg-[#0d9488]", text: "text-[#0d9488]", pill: "bg-teal-50 text-teal-800 border-teal-200" },
];

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

export interface EvolutionPerformancesMultiCentresProps {
  sessionActive?: SessionAcademique | null;
  centres: Centre[];
  apprenantsSession: Apprenant[];
  entreesValides: MouvementFinancier[];
  className?: string;
}

interface PeriodeBucket {
  id: string;
  label: string;
  subLabel: string;
  dateDebut: string;
  dateFin: string;
}

interface SerieCentre {
  centre: Centre;
  couleur: (typeof COULEURS_CENTRES)[0];
  valeursCumul: number[];
  valeursNouveau: number[];
  valeurActuelle: number;
}

export function EvolutionPerformancesMultiCentres({
  sessionActive,
  centres,
  apprenantsSession,
  entreesValides,
  className = "",
}: EvolutionPerformancesMultiCentresProps) {
  const [indicateur, setIndicateur] = useState<TypeIndicateur>("EFFECTIF");
  const [granularite, setGranularite] = useState<TypeGranularite>("SEMAINE");
  const [modeVue, setModeVue] = useState<ModeVue>("FLUX");
  const [centresMasques, setCentresMasques] = useState<Set<string>>(new Set());
  const [afficherTotalReseau, setAfficherTotalReseau] = useState(true);

  // Filtrer les centres ouverts
  const centresActifs = useMemo(() => {
    return centres.filter((c) => c.statut === "OUVERT");
  }, [centres]);

  // Date de dernière mise à jour
  const derniereDateMAJ = useMemo(() => {
    let maxTimestamp = 0;
    apprenantsSession.forEach((a) => {
      if (a.dateInscription) {
        const t = new Date(a.dateInscription).getTime();
        if (t > maxTimestamp) maxTimestamp = t;
      }
    });
    entreesValides.forEach((e) => {
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
  }, [apprenantsSession, entreesValides]);

  // Génération des buckets temporels
  const buckets = useMemo<PeriodeBucket[]>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const debut = sessionActive?.dateDebut || "2026-09-01";
    const fin =
      sessionActive?.dateFin && sessionActive.dateFin < todayStr
        ? sessionActive.dateFin
        : todayStr;

    const debutDate = new Date(debut);
    const finDate = new Date(fin);

    const res: PeriodeBucket[] = [];

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

        res.push({
          id: `semaine-${w}`,
          label: `Sem. ${w}`,
          subLabel: `${dStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${dEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
          dateDebut: startStr,
          dateFin: endStr,
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

        res.push({
          id: `mois-${year}-${month + 1}`,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          subLabel: subLabel.charAt(0).toUpperCase() + subLabel.slice(1),
          dateDebut: startStr,
          dateFin: endStr,
        });

        curr = new Date(year, month + 1, 1);
      }
    } else if (granularite === "JOUR") {
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

        res.push({
          id: `jour-${dStr}`,
          label: d.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          }),
          subLabel: d.toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "long",
          }),
          dateDebut: dStr,
          dateFin: dStr,
        });
      }
    }

    return res;
  }, [sessionActive, granularite]);

  // Séries par centre
  const seriesParCentre = useMemo<SerieCentre[]>(() => {
    if (buckets.length === 0) return [];
    const premierDebut = buckets[0].dateDebut;

    return centresActifs.map((centre, index) => {
      const couleur = COULEURS_CENTRES[index % COULEURS_CENTRES.length];

      const apprenantsDuCentre = apprenantsSession.filter(
        (a) => a.centreId === centre.id,
      );
      const entreesDuCentre = entreesValides.filter(
        (e) => e.centreId === centre.id,
      );

      // Calcul préalable initial (avant premier bucket)
      let cumul = 0;
      if (indicateur === "EFFECTIF") {
        cumul = apprenantsDuCentre.filter(
          (a) => a.dateInscription && a.dateInscription < premierDebut,
        ).length;
      } else if (indicateur === "SOUSCRIT") {
        cumul = apprenantsDuCentre
          .filter((a) => a.dateInscription && a.dateInscription < premierDebut)
          .reduce((sum, a) => sum + (a.montantContrat || 0), 0);
      } else {
        cumul = entreesDuCentre
          .filter((e) => e.date && e.date < premierDebut)
          .reduce((sum, e) => sum + e.montant, 0);
      }

      const valeursCumul: number[] = [];
      const valeursNouveau: number[] = [];

      buckets.forEach((b) => {
        let nouveau = 0;
        if (indicateur === "EFFECTIF") {
          nouveau = apprenantsDuCentre.filter(
            (a) =>
              a.dateInscription &&
              a.dateInscription >= b.dateDebut &&
              a.dateInscription <= b.dateFin,
          ).length;
        } else if (indicateur === "SOUSCRIT") {
          nouveau = apprenantsDuCentre
            .filter(
              (a) =>
                a.dateInscription &&
                a.dateInscription >= b.dateDebut &&
                a.dateInscription <= b.dateFin,
            )
            .reduce((sum, a) => sum + (a.montantContrat || 0), 0);
        } else {
          nouveau = entreesDuCentre
            .filter((e) => e.date && e.date >= b.dateDebut && e.date <= b.dateFin)
            .reduce((sum, e) => sum + e.montant, 0);
        }

        cumul += nouveau;
        valeursCumul.push(cumul);
        valeursNouveau.push(nouveau);
      });

      const valeurActuelle =
        modeVue === "CUMUL"
          ? valeursCumul[valeursCumul.length - 1] || 0
          : valeursNouveau[valeursNouveau.length - 1] || 0;

      return {
        centre,
        couleur,
        valeursCumul,
        valeursNouveau,
        valeurActuelle,
      };
    });
  }, [
    buckets,
    centresActifs,
    apprenantsSession,
    entreesValides,
    indicateur,
    modeVue,
  ]);

  // Série consolidée réseau (Total)
  const serieTotalReseau = useMemo(() => {
    if (buckets.length === 0 || seriesParCentre.length === 0) return null;

    const valeursCumul: number[] = [];
    const valeursNouveau: number[] = [];

    for (let i = 0; i < buckets.length; i++) {
      let sumCumul = 0;
      let sumNouveau = 0;
      seriesParCentre.forEach((s) => {
        sumCumul += s.valeursCumul[i] || 0;
        sumNouveau += s.valeursNouveau[i] || 0;
      });
      valeursCumul.push(sumCumul);
      valeursNouveau.push(sumNouveau);
    }

    const valeurActuelle =
      modeVue === "CUMUL"
        ? valeursCumul[valeursCumul.length - 1] || 0
        : valeursNouveau[valeursNouveau.length - 1] || 0;

    return {
      valeursCumul,
      valeursNouveau,
      valeurActuelle,
    };
  }, [buckets, seriesParCentre, modeVue]);

  // Configuration thématique de l'indicateur
  const config = useMemo(() => {
    switch (indicateur) {
      case "EFFECTIF":
        return {
          label: "Effectif des élèves",
          unite: "élèves",
          uniteSingulier: "élève",
          colorStroke: "#f7931e",
          icon: Users,
        };
      case "SOUSCRIT":
        return {
          label: "Montants souscrits",
          unite: "FCFA",
          uniteSingulier: "FCFA",
          colorStroke: "#2d2e80",
          icon: Coins,
        };
      case "ENCAISSE":
        return {
          label: "Encaissements réels",
          unite: "FCFA",
          uniteSingulier: "FCFA",
          colorStroke: "#2d6a4f",
          icon: Wallet,
        };
    }
  }, [indicateur]);

  // Centre leader actuel
  const centreLeader = useMemo(() => {
    if (seriesParCentre.length === 0) return null;
    return [...seriesParCentre].sort(
      (a, b) => b.valeurActuelle - a.valeurActuelle,
    )[0];
  }, [seriesParCentre]);

  // Variation consolidée réseau vs période précédente
  const syntheseReseau = useMemo(() => {
    if (!serieTotalReseau || buckets.length === 0) {
      return { total: 0, variation: 0, pct: 0, aPrecedent: false };
    }
    const n = buckets.length;
    const vals =
      modeVue === "CUMUL"
        ? serieTotalReseau.valeursCumul
        : serieTotalReseau.valeursNouveau;
    const actu = vals[n - 1] || 0;
    const prec = n > 1 ? vals[n - 2] || 0 : 0;
    const diff = actu - prec;
    const pct = prec > 0 ? Math.round((diff / prec) * 100) : actu > 0 ? 100 : 0;

    return {
      total: actu,
      variation: diff,
      pct,
      aPrecedent: n > 1,
    };
  }, [serieTotalReseau, buckets, modeVue]);

  // Basculer l'affichage d'un centre
  function toggleCentre(id: string) {
    setCentresMasques((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Empêcher de masquer tous les centres
        if (next.size < centresActifs.length - 1) {
          next.add(id);
        }
      }
      return next;
    });
  }

  // Données structurées pour Recharts
  const donneesRecharts = useMemo(() => {
    return buckets.map((b, i) => {
      const row: Record<string, any> = {
        label: b.label,
        subLabel: b.subLabel,
        index: i,
      };
      seriesParCentre.forEach((s) => {
        const vals = modeVue === "CUMUL" ? s.valeursCumul : s.valeursNouveau;
        row[s.centre.id] = vals[i] || 0;
      });
      if (serieTotalReseau) {
        const valsTotal =
          modeVue === "CUMUL"
            ? serieTotalReseau.valeursCumul
            : serieTotalReseau.valeursNouveau;
        row["totalReseau"] = valsTotal[i] || 0;
      }
      return row;
    });
  }, [buckets, seriesParCentre, serieTotalReseau, modeVue]);

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
              Évolution comparative des centres — Session active
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trajectoires comparées de l&rsquo;ensemble des centres du réseau sur un repère temporel unique.
          </p>
        </div>

        {/* Contrôles de granularité et mode */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Mode de vue */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setModeVue("CUMUL")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                modeVue === "CUMUL"
                  ? "bg-slate-900 text-white shadow-2xs font-extrabold"
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
                  ? "bg-slate-900 text-white shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Par période
            </button>
          </div>

          {/* Granularité */}
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

      {/* ── 2. Sélecteur d'Indicateur (Mono-échelle) ── */}
      <div className="bg-slate-50/70 border-b border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setIndicateur("EFFECTIF")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              indicateur === "ENCAISSE"
                ? "bg-emerald-700 text-white shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Wallet size={14} />
            <span>Encaissements</span>
          </button>
        </div>

        {/* Option Courbe Consolidée Réseau */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAfficherTotalReseau((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              afficherTotalReseau
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {afficherTotalReseau ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Total Réseau Consolidé</span>
          </button>
        </div>
      </div>

      {/* ── 3. Synthèse concise Réseau & Leader ── */}
      <div className="p-5 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
          {/* Total Réseau */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Réseau Consolidé
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                {indicateur === "EFFECTIF"
                  ? `${syntheseReseau.total} ${config.unite}`
                  : `${FCFA.format(syntheseReseau.total)} F`}
              </span>

              {syntheseReseau.aPrecedent && (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                    syntheseReseau.variation >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {syntheseReseau.variation >= 0 ? "+" : ""}
                  {indicateur === "EFFECTIF"
                    ? `${syntheseReseau.variation} él.`
                    : `${FCFA.format(syntheseReseau.variation)} F`}
                  {syntheseReseau.pct !== 0 && (
                    <span className="text-[10px] font-normal opacity-80">
                      ({syntheseReseau.variation >= 0 ? "+" : ""}
                      {syntheseReseau.pct}%)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Centre Leader */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Trophy size={12} className="text-amber-500" />
              <span>Centre Leader</span>
            </span>
            <div className="mt-1">
              {centreLeader ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black text-slate-900">
                    {centreLeader.centre.nom}
                  </span>
                  <span className="text-xs font-bold text-slate-600 tabular-nums">
                    {indicateur === "EFFECTIF"
                      ? `${centreLeader.valeurActuelle} él.`
                      : `${FCFA.format(centreLeader.valeurActuelle)} F`}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>

          {/* Date de mise à jour */}
          <div className="md:text-right flex md:flex-col justify-between md:justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Actualisation
            </span>
            <div className="flex md:justify-end items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
              <Clock size={13} className="text-slate-400" />
              <span>
                {derniereDateMAJ ? `${derniereDateMAJ}` : "En attente de flux"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Graphique Multi-Courbes SVG Interactif ── */}
      <div className="px-5 pb-4">
        {buckets.length === 0 || seriesParCentre.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Calendar size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Aucun historique disponible pour cette session
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Les courbes comparatives des centres s&rsquo;afficheront dès les premiers enregistrements.
            </p>
          </div>
        ) : (
          <div className="h-[280px] w-full select-none mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donneesRecharts} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
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
                    const itemData = payload[0]?.payload;
                    return (
                      <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl p-3 text-xs shadow-xl border border-slate-700/60 min-w-[210px] whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1.5 mb-2">
                          <span className="font-black text-amber-400">{label}</span>
                          <span className="text-[10px] text-slate-300">{itemData?.subLabel}</span>
                        </div>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {seriesParCentre
                            .filter((s) => !centresMasques.has(s.centre.id))
                            .map((s) => {
                              const val = itemData?.[s.centre.id] || 0;
                              return (
                                <div
                                  key={s.centre.id}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="h-2 w-2 rounded-full shrink-0"
                                      style={{ backgroundColor: s.couleur.stroke }}
                                    />
                                    <span className="text-slate-300 font-medium truncate max-w-[120px]">
                                      {s.centre.nom}
                                    </span>
                                  </div>
                                  <span className="text-white font-black tabular-nums">
                                    {indicateur === "EFFECTIF"
                                      ? `${val} él.`
                                      : `${FCFA.format(val)} F`}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                        {afficherTotalReseau && serieTotalReseau && (
                          <div className="pt-2 mt-2 border-t border-slate-700/60 flex items-center justify-between gap-3 text-xs font-black">
                            <span className="text-amber-300">Total Réseau :</span>
                            <span className="text-white tabular-nums">
                              {indicateur === "EFFECTIF"
                                ? `${itemData?.totalReseau || 0} élèves`
                                : `${FCFA.format(itemData?.totalReseau || 0)} F`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                {seriesParCentre.map((s) => {
                  if (centresMasques.has(s.centre.id)) return null;
                  return (
                    <Line
                      key={s.centre.id}
                      type="monotone"
                      dataKey={s.centre.id}
                      name={s.centre.nom}
                      stroke={s.couleur.stroke}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: s.couleur.stroke }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  );
                })}
                {afficherTotalReseau && serieTotalReseau && (
                  <Line
                    type="monotone"
                    dataKey="totalReseau"
                    name="Total Réseau"
                    stroke="#1c1917"
                    strokeWidth={2.75}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: "#1c1917" }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 5. Légende Interactive Multi-Centres ── */}
      <div className="bg-slate-50/70 border-t border-slate-100 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">
            Centres ({centresActifs.length}) :
          </span>

          {seriesParCentre.map((s) => {
            const masque = centresMasques.has(s.centre.id);
            return (
              <button
                key={s.centre.id}
                type="button"
                onClick={() => toggleCentre(s.centre.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  masque
                    ? "bg-slate-100 text-slate-400 border-slate-200 opacity-60 line-through"
                    : `${s.couleur.pill} shadow-2xs`
                }`}
                title={masque ? `Afficher ${s.centre.nom}` : `Masquer ${s.centre.nom}`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: masque ? "#94a3b8" : s.couleur.stroke }}
                />
                <span>{s.centre.nom}</span>
                <span className="tabular-nums font-black opacity-80">
                  {indicateur === "EFFECTIF"
                    ? `${s.valeurActuelle}`
                    : formatCompactFCFA(s.valeurActuelle)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
