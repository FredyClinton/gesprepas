"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`;
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

  return linePath;
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
  const [hoverPeriodeIndex, setHoverPeriodeIndex] = useState<number | null>(null);

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

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Dimensions SVG
  const svgWidth = 840;
  const svgHeight = 280;
  const padLeft = indicateur === "EFFECTIF" ? 44 : 72;
  const padRight = 32;
  const padTop = 26;
  const padBottom = 42;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const baselineY = padTop + chartH;

  const { pathsSessions, ticksInfo, xCoords } = useMemo(() => {
    const xCoords = Array.from({ length: maxPeriodes }, (_, i) =>
      maxPeriodes === 1
        ? padLeft + chartW / 2
        : padLeft + (i / (maxPeriodes - 1)) * chartW,
    );

    // Valeur max parmi les sessions sélectionnées
    let maxVal = 0;
    seriesSessions.forEach((s) => {
      if (sessionsSelectionneesIds.has(s.session.id)) {
        const vals = modeVue === "CUMUL" ? s.valeursCumul : s.valeursNouveau;
        vals.forEach((v) => {
          if (v !== null && v > maxVal) maxVal = v;
        });
      }
    });

    const ticksInfo = getNiceTicks(maxVal, 4);
    const topY = ticksInfo.max;

    const pathsSessions = seriesSessions.map((s) => {
      if (!sessionsSelectionneesIds.has(s.session.id)) {
        return {
          session: s.session,
          couleur: s.couleur,
          estActive: s.estActive,
          tagRelatif: s.tagRelatif,
          path: "",
          points: [],
        };
      }

      const vals = modeVue === "CUMUL" ? s.valeursCumul : s.valeursNouveau;
      const points: { x: number; y: number; val: number; index: number }[] = [];

      vals.forEach((v, i) => {
        if (v !== null) {
          const x = xCoords[i];
          const y = baselineY - (topY > 0 ? (v / topY) * chartH : 0);
          points.push({ x, y, val: v, index: i });
        }
      });

      const path = generateSmoothPath(points);
      return {
        session: s.session,
        couleur: s.couleur,
        estActive: s.estActive,
        tagRelatif: s.tagRelatif,
        path,
        points,
      };
    });

    return { pathsSessions, ticksInfo, xCoords };
  }, [
    maxPeriodes,
    seriesSessions,
    sessionsSelectionneesIds,
    modeVue,
    chartW,
    chartH,
    padLeft,
    baselineY,
  ]);

  const activePeriodeIndex =
    hoverPeriodeIndex !== null && hoverPeriodeIndex >= 0 && hoverPeriodeIndex < maxPeriodes
      ? hoverPeriodeIndex
      : syntheseComparaison.periodeStade - 1;

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
              onClick={() => {
                setGranularite("SEMAINE");
                setHoverPeriodeIndex(null);
              }}
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
              onClick={() => {
                setGranularite("MOIS");
                setHoverPeriodeIndex(null);
              }}
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

      {/* ── 4. Graphique SVG Multi-Sessions ── */}
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
          <div
            ref={containerRef}
            className="relative w-full select-none"
            onMouseLeave={() => setHoverPeriodeIndex(null)}
          >
            {/* Tooltip de comparaison relative */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-150 ease-out -translate-x-1/2 -top-1"
              style={{
                left: `${((xCoords[activePeriodeIndex] || padLeft) / svgWidth) * 100}%`,
              }}
            >
              <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl p-3 text-xs shadow-xl border border-slate-700/60 min-w-[200px] whitespace-nowrap">
                <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1.5 mb-2">
                  <span className="font-black text-amber-400">
                    {granularite === "SEMAINE"
                      ? `Semaine ${activePeriodeIndex + 1}`
                      : `Mois ${activePeriodeIndex + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {modeVue === "FLUX" ? "Flux de la période" : "Progression cumulée"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {pathsSessions
                    .filter((p) => p.path)
                    .map((p) => {
                      const pt = p.points.find(
                        (pt) => pt.index === activePeriodeIndex,
                      );
                      const estRef = p.session.id === sessionRefId;
                      const estComp = p.session.id === sessionCompId;
                      return (
                        <div
                          key={p.session.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: p.couleur.stroke }}
                            />
                            <span className="text-slate-300 font-semibold">
                              Session {p.session.annee} ({p.tagRelatif})
                              {estRef && " [Réf]"}
                              {estComp && " [Comp]"} :
                            </span>
                          </div>
                          <span className="text-white font-black tabular-nums">
                            {pt !== undefined
                              ? indicateur === "EFFECTIF"
                                ? `${pt.val} él.`
                                : `${FCFA.format(pt.val)} F`
                              : "—"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Canevas SVG */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[300px] overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Lignes horizontales Y */}
              {ticksInfo.ticks.map((tickVal) => {
                const y =
                  baselineY -
                  (ticksInfo.max > 0 ? (tickVal / ticksInfo.max) * chartH : 0);
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

              {/* Courbes des sessions */}
              {pathsSessions.map((p) => {
                if (!p.path) return null;
                const estRef = p.session.id === sessionRefId;
                return (
                  <path
                    key={p.session.id}
                    d={p.path}
                    fill="none"
                    stroke={p.couleur.stroke}
                    strokeWidth={estRef || p.estActive ? "3" : "2.25"}
                    strokeDasharray={estRef || p.estActive ? undefined : "6 3"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Repère vertical au survol */}
              <g>
                <line
                  x1={xCoords[activePeriodeIndex]}
                  y1={padTop}
                  x2={xCoords[activePeriodeIndex]}
                  y2={baselineY}
                  stroke="#1c1917"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-60"
                />
                {pathsSessions.map((p) => {
                  const pt = p.points.find(
                    (pt) => pt.index === activePeriodeIndex,
                  );
                  if (!pt) return null;
                  return (
                    <circle
                      key={`pt-${p.session.id}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="5.5"
                      fill={p.couleur.stroke}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-xs"
                    />
                  );
                })}
              </g>

              {/* Tranches invisibles pour la détection hover */}
              {Array.from({ length: maxPeriodes }).map((_, i) => (
                <rect
                  key={`hover-col-per-${i}`}
                  x={
                    i === 0
                      ? padLeft
                      : xCoords[i] - chartW / (maxPeriodes * 2)
                  }
                  y={padTop}
                  width={chartW / (maxPeriodes - 1 || 1)}
                  height={chartH + padBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverPeriodeIndex(i)}
                  onTouchStart={() => setHoverPeriodeIndex(i)}
                />
              ))}

              {/* Labels temporels X (Semaine 1, Semaine 2, ... ou Mois 1, Mois 2, ...) */}
              {periodesLabels.map((lbl, i) => {
                let afficher = true;
                if (maxPeriodes > 16) afficher = i % 3 === 0 || i === maxPeriodes - 1;
                else if (maxPeriodes > 10) afficher = i % 2 === 0 || i === maxPeriodes - 1;

                if (!afficher) return null;

                return (
                  <g key={`lbl-per-${i}`}>
                    <text
                      x={xCoords[i]}
                      y={baselineY + 18}
                      textAnchor="middle"
                      className={`text-[10px] select-none tabular-nums ${
                        activePeriodeIndex === i
                          ? "fill-slate-900 font-black"
                          : "fill-slate-500 font-semibold"
                      }`}
                    >
                      {lbl}
                    </text>
                  </g>
                );
              })}
            </svg>
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
