"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  CalendarRange,
  Users,
  Coins,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ArrowRightLeft,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/shared/ui";
import type { Apprenant } from "@/modules/apprenants";
import type { MouvementFinancier } from "@/modules/financier";
import type { SessionAcademique } from "../domain/types";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

const FCFA = new Intl.NumberFormat("fr-FR");

export type TypeIndicateur = "EFFECTIF" | "SOUSCRIT" | "ENCAISSE";
export type ModeVue = "CUMUL" | "FLUX";
export type TypeGranularite = "SEMAINE" | "MOIS";

const COULEURS_SESSIONS = [
  {
    stroke: "#f7931e", // Brand Orange pour la session active / la plus récente
    fill: "rgba(247, 147, 30, 0.12)",
    text: "text-amber-800",
    pill: "bg-orange-50 text-brand-orange border-orange-200",
  },
  {
    stroke: "#2d2e80", // Brand Blue pour la session précédente
    fill: "rgba(45, 46, 128, 0.12)",
    text: "text-blue-900",
    pill: "bg-blue-50 text-blue-900 border-blue-200",
  },
  {
    stroke: "#10b981", // Emerald pour N-2
    fill: "rgba(16, 185, 129, 0.12)",
    text: "text-emerald-800",
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    stroke: "#8b5cf6", // Purple pour N-3
    fill: "rgba(139, 92, 246, 0.12)",
    text: "text-purple-800",
    pill: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    stroke: "#06b6d4", // Cyan pour N-4
    fill: "rgba(6, 182, 212, 0.12)",
    text: "text-cyan-800",
    pill: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  {
    stroke: "#f43f5e", // Rose pour N-5
    fill: "rgba(244, 63, 94, 0.12)",
    text: "text-rose-800",
    pill: "bg-rose-50 text-rose-800 border-rose-200",
  },
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

export interface ComparatifSessionsCentreGraphiqueProps {
  nomCentre?: string;
  centreId: string;
  sessions: SessionAcademique[];
  sessionActiveId?: string;
  allApprenants: Apprenant[];
  mouvementsParSession: Record<string, MouvementFinancier[]>;
  className?: string;
}

interface SerieSession {
  session: SessionAcademique;
  couleur: (typeof COULEURS_SESSIONS)[0];
  estActive: boolean;
  tagRelatif: string;
  semainePlafond: number;
  valeursCumul: (number | null)[];
  valeursNouveau: (number | null)[];
  valeurActuelle: number;
  valeurFinale: number;
}

export function ComparatifSessionsCentreGraphique({
  nomCentre,
  centreId,
  sessions,
  sessionActiveId,
  allApprenants,
  mouvementsParSession,
  className = "",
}: ComparatifSessionsCentreGraphiqueProps) {
  const [indicateur, setIndicateur] = useState<TypeIndicateur>("EFFECTIF");
  // Les vues par défaut doivent être "par période" (FLUX) et "en semaine" (SEMAINE)
  const [modeVue, setModeVue] = useState<ModeVue>("FLUX");
  const [granularite, setGranularite] = useState<TypeGranularite>("SEMAINE");

  // Sessions ordonnées par dateDebut décroissante (la plus récente d'abord)
  const sessionsOrdonnees = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
    );
  }, [sessions]);

  // Index de la session de référence N (session active si présente, ou statut EN_COURS, ou la plus récente)
  const indexSessionN = useMemo(() => {
    if (sessionActiveId) {
      const idx = sessionsOrdonnees.findIndex((s) => s.id === sessionActiveId);
      if (idx !== -1) return idx;
    }
    const idxEnCours = sessionsOrdonnees.findIndex((s) => s.statut === "EN_COURS");
    if (idxEnCours !== -1) return idxEnCours;
    return 0;
  }, [sessionsOrdonnees, sessionActiveId]);

  const defaultRefSession = sessionsOrdonnees[indexSessionN] || null;
  const defaultCompSession =
    indexSessionN + 1 < sessionsOrdonnees.length
      ? sessionsOrdonnees[indexSessionN + 1]
      : sessionsOrdonnees.find((s) => s.id !== defaultRefSession?.id) || null;

  // Calcul du tag relatif ("N", "N-1", "N-2", etc.)
  function getSessionTag(sId: string): string {
    const idx = sessionsOrdonnees.findIndex((s) => s.id === sId);
    if (idx === -1) return "Session";
    const diff = idx - indexSessionN;
    if (diff === 0) return "N";
    if (diff > 0) return `N-${diff}`;
    return `N+${Math.abs(diff)}`;
  }

  // Sélections pour le comparatif direct (Session de référence et Session comparée)
  const [sessionRefId, setSessionRefId] = useState<string>(() => defaultRefSession?.id || "");
  const [sessionCompId, setSessionCompId] = useState<string>(() => defaultCompSession?.id || "");

  // Sessions visibles sur la courbe (par défaut N et N-1)
  const [sessionsSelectionneesIds, setSessionsSelectionneesIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (defaultRefSession) initial.add(defaultRefSession.id);
    if (defaultCompSession) initial.add(defaultCompSession.id);
    return initial;
  });

  // Synchronisation lors de l'arrivée différée des sessions
  useEffect(() => {
    if (sessionsOrdonnees.length > 0) {
      setSessionRefId((prev) => {
        if (prev && sessionsOrdonnees.some((s) => s.id === prev)) return prev;
        return defaultRefSession?.id || sessionsOrdonnees[0].id;
      });
      setSessionCompId((prev) => {
        if (prev && sessionsOrdonnees.some((s) => s.id === prev) && prev !== defaultRefSession?.id) return prev;
        return defaultCompSession?.id || (sessionsOrdonnees.find((s) => s.id !== defaultRefSession?.id)?.id || "");
      });
      setSessionsSelectionneesIds((prev) => {
        if (prev.size > 0 && Array.from(prev).some((id) => sessionsOrdonnees.some((s) => s.id === id))) {
          return prev;
        }
        const initial = new Set<string>();
        if (defaultRefSession) initial.add(defaultRefSession.id);
        if (defaultCompSession) initial.add(defaultCompSession.id);
        return initial;
      });
    }
  }, [sessionsOrdonnees, defaultRefSession, defaultCompSession]);

  // Nombre maximum de périodes à tracer (Semaines ou Mois)
  const { maxPeriodes, periodesLabels } = useMemo(() => {
    let maxP = 1;
    sessionsOrdonnees.forEach((s) => {
      const debut = new Date(s.dateDebut);
      const fin = new Date(s.dateFin);
      if (granularite === "SEMAINE") {
        const sem = Math.max(
          1,
          Math.ceil((fin.getTime() - debut.getTime()) / (7 * 86400000)),
        );
        if (sem > maxP) maxP = sem;
      } else {
        const diffMois = Math.max(
          1,
          (fin.getFullYear() - debut.getFullYear()) * 12 +
            (fin.getMonth() - debut.getMonth()) +
            1,
        );
        if (diffMois > maxP) maxP = diffMois;
      }
    });

    if (granularite === "SEMAINE") {
      const totalSemaines = Math.min(36, Math.max(8, maxP));
      const labels = Array.from({ length: totalSemaines }, (_, i) => `Sem. ${i + 1}`);
      return { maxPeriodes: totalSemaines, periodesLabels: labels };
    } else {
      const totalMois = Math.min(12, Math.max(4, maxP));
      const labels = Array.from({ length: totalMois }, (_, i) => `Mois ${i + 1}`);
      return { maxPeriodes: totalMois, periodesLabels: labels };
    }
  }, [sessionsOrdonnees, granularite]);

  // Calcul des séries temporelles relatives pour chaque session
  const seriesSessions = useMemo<SerieSession[]>(() => {
    return sessionsOrdonnees.map((s, idx) => {
      const couleur = COULEURS_SESSIONS[idx % COULEURS_SESSIONS.length];
      const estActive = s.id === sessionActiveId || s.statut === "EN_COURS";
      const tagRelatif = getSessionTag(s.id);

      // Période plafond si la session est active
      let periodePlafond = maxPeriodes;
      if (estActive) {
        if (granularite === "SEMAINE") {
          periodePlafond = semaineCouranteDepuis(s.dateDebut, s.dateFin);
        } else {
          const jours = Math.max(0, (new Date().getTime() - new Date(s.dateDebut).getTime()) / (30.4375 * 86400000));
          periodePlafond = Math.max(1, Math.min(maxPeriodes, Math.ceil(jours)));
        }
      }

      const debutDate = new Date(s.dateDebut);
      const apprenantsDuCentre = allApprenants.filter(
        (a) => a.centreId === centreId && a.sessionId === s.id,
      );
      const entreesDuCentre = (mouvementsParSession[s.id] || []).filter(
        (m) => m.type === "ENTREE" && m.statut !== "REJETE",
      );

      const valeursCumul: (number | null)[] = [];
      const valeursNouveau: (number | null)[] = [];

      let cumul = 0;

      // Calcul des données enregistrées avant le début officiel de la session
      const debutStr = s.dateDebut;
      if (indicateur === "EFFECTIF") {
        cumul = apprenantsDuCentre.filter(
          (a) => a.dateInscription && a.dateInscription < debutStr,
        ).length;
      } else if (indicateur === "SOUSCRIT") {
        cumul = apprenantsDuCentre
          .filter((a) => a.dateInscription && a.dateInscription < debutStr)
          .reduce((sum, a) => sum + (a.montantContrat || 0), 0);
      } else {
        cumul = entreesDuCentre
          .filter((e) => e.date && e.date < debutStr)
          .reduce((sum, e) => sum + e.montant, 0);
      }

      for (let p = 1; p <= maxPeriodes; p++) {
        if (p > periodePlafond) {
          valeursCumul.push(null);
          valeursNouveau.push(null);
          continue;
        }

        let startStr = "";
        let endStr = "";

        if (granularite === "SEMAINE") {
          const dStart = new Date(debutDate.getTime() + (p - 1) * 7 * 86400000);
          const dEnd = new Date(debutDate.getTime() + (p * 7 - 1) * 86400000);
          startStr = dStart.toISOString().slice(0, 10);
          endStr = dEnd.toISOString().slice(0, 10);
        } else {
          const dStart = new Date(debutDate.getFullYear(), debutDate.getMonth() + (p - 1), debutDate.getDate());
          const dEnd = new Date(debutDate.getFullYear(), debutDate.getMonth() + p, debutDate.getDate() - 1);
          startStr = dStart.toISOString().slice(0, 10);
          endStr = dEnd.toISOString().slice(0, 10);
        }

        let nouveau = 0;
        if (indicateur === "EFFECTIF") {
          nouveau = apprenantsDuCentre.filter(
            (a) =>
              a.dateInscription &&
              a.dateInscription >= startStr &&
              a.dateInscription <= endStr,
          ).length;
        } else if (indicateur === "SOUSCRIT") {
          nouveau = apprenantsDuCentre
            .filter(
              (a) =>
                a.dateInscription &&
                a.dateInscription >= startStr &&
                a.dateInscription <= endStr,
            )
            .reduce((sum, a) => sum + (a.montantContrat || 0), 0);
        } else {
          nouveau = entreesDuCentre
            .filter((e) => e.date && e.date >= startStr && e.date <= endStr)
            .reduce((sum, e) => sum + e.montant, 0);
        }

        cumul += nouveau;
        valeursCumul.push(cumul);
        valeursNouveau.push(nouveau);
      }

      const pointsNonNuls = valeursCumul.filter((v): v is number => v !== null);
      const valeurActuelle = pointsNonNuls[pointsNonNuls.length - 1] || 0;
      const valeurFinale = cumul;

      return {
        session: s,
        couleur,
        estActive,
        tagRelatif,
        semainePlafond: periodePlafond,
        valeursCumul,
        valeursNouveau,
        valeurActuelle,
        valeurFinale,
      };
    });
  }, [
    sessionsOrdonnees,
    sessionActiveId,
    allApprenants,
    mouvementsParSession,
    centreId,
    maxPeriodes,
    granularite,
    indicateur,
    indexSessionN,
  ]);

  // Config de l'indicateur
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

  // Identification des séries pour le comparatif direct (Session Ref vs Session Comp)
  const serieRef = useMemo(() => {
    return (
      seriesSessions.find((s) => s.session.id === sessionRefId) ||
      seriesSessions.find((s) => s.estActive) ||
      seriesSessions[0] ||
      null
    );
  }, [seriesSessions, sessionRefId]);

  const serieComp = useMemo(() => {
    return (
      seriesSessions.find((s) => s.session.id === sessionCompId) ||
      seriesSessions.find((s) => s.session.id !== serieRef?.session.id) ||
      null
    );
  }, [seriesSessions, sessionCompId, serieRef]);

  // Synthèse d'écart au même stade d'avancement
  const syntheseComparaison = useMemo(() => {
    if (!serieRef || !serieComp) {
      return {
        valeurRef: serieRef?.valeurActuelle || 0,
        valeurCompStade: 0,
        ecart: 0,
        pctEcart: 0,
        periodeStade: 1,
        nomSessionRef: serieRef ? `Session ${serieRef.session.annee}` : "Session N",
        nomSessionComp: serieComp ? `Session ${serieComp.session.annee}` : "—",
        tagSessionRef: serieRef ? serieRef.tagRelatif : "N",
        tagSessionComp: serieComp ? serieComp.tagRelatif : "N-1",
      };
    }

    const periodeStade = Math.min(
      serieRef.semainePlafond,
      serieRef.valeursCumul.filter((v) => v !== null).length,
    );
    const idx = Math.max(0, periodeStade - 1);

    const valRef =
      (modeVue === "CUMUL"
        ? serieRef.valeursCumul[idx]
        : serieRef.valeursNouveau[idx]) || 0;
    const valComp =
      (modeVue === "CUMUL"
        ? serieComp.valeursCumul[idx]
        : serieComp.valeursNouveau[idx]) || 0;

    const ecart = valRef - valComp;
    const pctEcart = valComp > 0 ? Math.round((ecart / valComp) * 100) : valRef > 0 ? 100 : 0;

    return {
      valeurRef: valRef,
      valeurCompStade: valComp,
      ecart,
      pctEcart,
      periodeStade,
      nomSessionRef: `Session ${serieRef.session.annee}`,
      nomSessionComp: `Session ${serieComp.session.annee}`,
      tagSessionRef: serieRef.tagRelatif,
      tagSessionComp: serieComp.tagRelatif,
    };
  }, [serieRef, serieComp, modeVue]);

  // Gestion du choix de sessions
  function handleChangerSessionRef(nouveauId: string) {
    setSessionRefId(nouveauId);
    setSessionsSelectionneesIds((prev) => {
      const next = new Set(prev);
      next.add(nouveauId);
      return next;
    });
  }

  function handleChangerSessionComp(nouveauId: string) {
    setSessionCompId(nouveauId);
    setSessionsSelectionneesIds((prev) => {
      const next = new Set(prev);
      next.add(nouveauId);
      return next;
    });
  }

  function intervertirSessions() {
    if (!serieRef || !serieComp) return;
    const oldRefId = serieRef.session.id;
    const oldCompId = serieComp.session.id;
    setSessionRefId(oldCompId);
    setSessionCompId(oldRefId);
    setSessionsSelectionneesIds(new Set([oldCompId, oldRefId]));
  }

  function reinitialiserNVsNMoins1() {
    if (!defaultRefSession) return;
    const refId = defaultRefSession.id;
    const compId = defaultCompSession?.id || "";
    setSessionRefId(refId);
    setSessionCompId(compId);
    const s = new Set<string>();
    s.add(refId);
    if (compId) s.add(compId);
    setSessionsSelectionneesIds(s);
  }

  function toggleSession(id: string) {
    setSessionsSelectionneesIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
          // Si on désactive la session de référence ou comparée, réaligner
          if (id === sessionRefId) {
            const autre = Array.from(next)[0];
            if (autre) setSessionRefId(autre);
          } else if (id === sessionCompId) {
            const autre = Array.from(next).find((x) => x !== sessionRefId);
            if (autre) setSessionCompId(autre);
          }
        }
      } else {
        next.add(id);
        if (!sessionsSelectionneesIds.has(sessionCompId)) {
          setSessionCompId(id);
        }
      }
      return next;
    });
  }

  // Préparation des données pour Recharts
  const donneesRecharts = useMemo(() => {
    return Array.from({ length: maxPeriodes }, (_, i) => {
      const row: Record<string, string | number | null> = {
        periodeLabel: periodesLabels[i] || `P${i + 1}`,
        periodeCourt: granularite === "SEMAINE" ? `S${i + 1}` : `M${i + 1}`,
        index: i,
      };
      seriesSessions.forEach((s) => {
        if (sessionsSelectionneesIds.has(s.session.id)) {
          const vals = modeVue === "CUMUL" ? s.valeursCumul : s.valeursNouveau;
          row[s.session.id] = vals[i] ?? null;
        }
      });
      return row;
    });
  }, [
    maxPeriodes,
    periodesLabels,
    seriesSessions,
    sessionsSelectionneesIds,
    modeVue,
    granularite,
  ]);

  const activePeriodeIndex = Math.max(0, syntheseComparaison.periodeStade - 1);

  const labelPeriodeCourante =
    granularite === "SEMAINE"
      ? `Semaine ${activePeriodeIndex + 1}`
      : `Mois ${activePeriodeIndex + 1}`;

  return (
    <Card
      className={`border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}
    >
      {/* ── 1. En-tête du bloc comparatif ── */}
      <div className="border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-50 text-brand-orange">
              <CalendarRange size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Comparatif des performances inter-sessions
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mise en regard des trajectoires de croissance {nomCentre ? `du centre de ${nomCentre}` : "du centre"} au même stade d&rsquo;avancement académique.
          </p>
        </div>

        {/* Contrôles Mode de vue (Cumul / Par période) & Granularité (Semaine / Mois) */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Mode de vue : Par défaut 'Par période' (FLUX) */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
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
          </div>

          {/* Granularité temporelle : Par défaut 'Semaine' */}
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
          </div>
        </div>
      </div>

      {/* ── 2. Sélecteur d'Indicateur & Choix des sessions comparatives (N vs N-1) ── */}
      <div className="bg-slate-50/70 border-b border-slate-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Onglets des indicateurs */}
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

          {/* Boutons d'actions rapides */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={reinitialiserNVsNMoins1}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Réinitialiser la comparaison par défaut : Session N vs N-1"
            >
              <RotateCcw size={12} className="text-slate-400" />
              <span>Défaut N vs N-1</span>
            </button>
          </div>
        </div>

        {/* Barre de sélection explicite des 2 sessions comparatives (N et N-1) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          {/* Sélecteur Session Référence (Session N par défaut) */}
          <div className="md:col-span-5 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-brand-orange shrink-0 ring-2 ring-orange-200" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="select-comparatif-ref"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
              >
                Session de référence ({getSessionTag(sessionRefId)})
              </label>
              <select
                id="select-comparatif-ref"
                value={sessionRefId}
                onChange={(e) => handleChangerSessionRef(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange cursor-pointer"
              >
                {sessionsOrdonnees.map((s) => {
                  const tag = getSessionTag(s.id);
                  return (
                    <option
                      key={`ref-${s.id}`}
                      value={s.id}
                      disabled={s.id === sessionCompId}
                    >
                      Session {s.annee} ({tag}) {s.statut === "EN_COURS" ? "· En cours" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Bouton inversion */}
          <div className="md:col-span-2 flex justify-center">
            <button
              type="button"
              onClick={intervertirSessions}
              title="Inverser les deux sessions comparées"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-orange bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-brand-orange/40 rounded-lg px-3 py-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowRightLeft size={13} />
              <span className="hidden sm:inline">Inverser</span>
            </button>
          </div>

          {/* Sélecteur Session Comparée (Session N-1 par défaut) */}
          <div className="md:col-span-5 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-brand-blue shrink-0 ring-2 ring-blue-200" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="select-comparatif-comp"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
              >
                Session à comparer ({getSessionTag(sessionCompId)})
              </label>
              <select
                id="select-comparatif-comp"
                value={sessionCompId}
                onChange={(e) => handleChangerSessionComp(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue cursor-pointer"
              >
                {sessionsOrdonnees.map((s) => {
                  const tag = getSessionTag(s.id);
                  return (
                    <option
                      key={`comp-${s.id}`}
                      value={s.id}
                      disabled={s.id === sessionRefId}
                    >
                      Session {s.annee} ({tag}) {s.statut === "EN_COURS" ? "· En cours" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Badges de sessions pour inclure/exclure des courbes supplémentaires */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Courbes actives :
          </span>
          {seriesSessions.map((s) => {
            const active = sessionsSelectionneesIds.has(s.session.id);
            const estRef = s.session.id === sessionRefId;
            const estComp = s.session.id === sessionCompId;
            return (
              <button
                key={s.session.id}
                type="button"
                onClick={() => toggleSession(s.session.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? `${s.couleur.pill} shadow-2xs font-extrabold`
                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: active ? s.couleur.stroke : "#cbd5e1" }}
                />
                <span>Session {s.session.annee}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200/60 text-slate-700 font-bold">
                  {s.tagRelatif}
                </span>
                {estRef && (
                  <span className="text-[9px] uppercase px-1 rounded bg-brand-orange text-white">
                    Réf
                  </span>
                )}
                {estComp && (
                  <span className="text-[9px] uppercase px-1 rounded bg-brand-blue text-white">
                    Comp
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Synthèse d'Écart au même stade (Semaine X / Mois M) ── */}
      <div className="p-5 pb-3">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {syntheseComparaison.nomSessionRef} ({syntheseComparaison.tagSessionRef}) au stade relatif ({labelPeriodeCourante})
            </span>

            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {indicateur === "EFFECTIF"
                  ? `${syntheseComparaison.valeurRef} ${config.unite}`
                  : `${FCFA.format(syntheseComparaison.valeurRef)} F`}
              </span>

              {/* Écart vs session comparée au même stade */}
              {syntheseComparaison.nomSessionComp !== "—" && (
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${
                    syntheseComparaison.ecart === 0
                      ? "bg-slate-100 text-slate-600"
                      : syntheseComparaison.ecart > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-amber-50 text-amber-800 border border-amber-200/60"
                  }`}
                >
                  {syntheseComparaison.ecart === 0 ? (
                    <Minus size={12} />
                  ) : syntheseComparaison.ecart > 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  <span>
                    {syntheseComparaison.ecart > 0 ? "+" : ""}
                    {indicateur === "EFFECTIF"
                      ? `${syntheseComparaison.ecart} él.`
                      : `${FCFA.format(syntheseComparaison.ecart)} F`}
                    {syntheseComparaison.pctEcart !== 0 && (
                      <span className="opacity-80 ml-1">
                        ({syntheseComparaison.ecart > 0 ? "+" : ""}
                        {syntheseComparaison.pctEcart}%)
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-normal opacity-75">
                    vs {syntheseComparaison.nomSessionComp} ({syntheseComparaison.tagSessionComp})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <span>
              Au même point d&rsquo;avancement :{" "}
              <strong className="text-slate-900 font-bold">
                {indicateur === "EFFECTIF"
                  ? `${syntheseComparaison.valeurCompStade} élèves`
                  : `${FCFA.format(syntheseComparaison.valeurCompStade)} F`}
              </strong>{" "}
              en {syntheseComparaison.nomSessionComp} ({syntheseComparaison.tagSessionComp})
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Graphique Recharts Multi-Sessions ── */}
      <div className="px-5 pb-4">
        {seriesSessions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Calendar size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Pas assez de sessions pour établir un comparatif
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Au moins deux sessions académiques sont nécessaires pour tracer la comparaison de trajectoire.
            </p>
          </div>
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={donneesRecharts}
                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="periodeCourt"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) =>
                    indicateur === "EFFECTIF" ? `${val}` : formatCompactFCFA(val)
                  }
                  width={indicateur === "EFFECTIF" ? 40 : 65}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0]?.payload;
                    const fullLabel = item?.periodeLabel || label;
                    return (
                      <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl p-3 text-xs shadow-xl border border-slate-700/60 min-w-[210px] whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1.5 mb-2">
                          <span className="font-black text-amber-400">{fullLabel}</span>
                          <span className="text-[10px] text-slate-300">
                            {modeVue === "FLUX" ? "Flux de la période" : "Progression cumulée"}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {payload.map((entry) => {
                            const s = seriesSessions.find((ser) => ser.session.id === entry.dataKey);
                            if (!s) return null;
                            const estRef = s.session.id === sessionRefId;
                            const estComp = s.session.id === sessionCompId;
                            return (
                              <div key={s.session.id} className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-slate-300 font-semibold">
                                    Session {s.session.annee} ({s.tagRelatif})
                                    {estRef && " [Réf]"}
                                    {estComp && " [Comp]"} :
                                  </span>
                                </div>
                                <span className="text-white font-black tabular-nums">
                                  {entry.value !== undefined && entry.value !== null
                                    ? indicateur === "EFFECTIF"
                                      ? `${entry.value} él.`
                                      : `${FCFA.format(Number(entry.value))} F`
                                    : "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                {seriesSessions
                  .filter((s) => sessionsSelectionneesIds.has(s.session.id))
                  .map((s) => {
                    const estRef = s.session.id === sessionRefId;
                    return (
                      <Line
                        key={s.session.id}
                        type="monotone"
                        dataKey={s.session.id}
                        name={`Session ${s.session.annee}`}
                        stroke={s.couleur.stroke}
                        strokeWidth={estRef || s.estActive ? 3.5 : 2}
                        strokeDasharray={estRef || s.estActive ? undefined : "6 4"}
                        dot={{ r: 3, fill: s.couleur.stroke, stroke: "#ffffff", strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: s.couleur.stroke, stroke: "#ffffff", strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 5. Légende avec bilan final de chaque session ── */}
      <div className="bg-slate-50/70 border-t border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Bilan comparé :
            </span>
            {seriesSessions
              .filter((s) => sessionsSelectionneesIds.has(s.session.id))
              .map((s) => (
                <div key={s.session.id} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.couleur.stroke }}
                  />
                  <span className="font-bold text-slate-800">
                    Session {s.session.annee} ({s.tagRelatif}) :
                  </span>
                  <span className="tabular-nums font-black text-slate-900">
                    {indicateur === "EFFECTIF"
                      ? `${s.valeurFinale} él.`
                      : `${FCFA.format(s.valeurFinale)} F`}
                  </span>
                  {s.estActive && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      (en cours)
                    </span>
                  )}
                </div>
              ))}
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Alignement par {granularite === "SEMAINE" ? "semaine" : "mois"} d&rsquo;activité relative (1 à {maxPeriodes})
          </div>
        </div>
      </div>
    </Card>
  );
}
