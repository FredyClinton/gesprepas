"use client";

import { useCallback, useMemo, useState } from "react";
import {
  LineChart,
  Users,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRightLeft,
  Info,
} from "lucide-react";

import { Card } from "@/shared/ui";
import type { SessionAcademique } from "@/modules/centres-sessions";
import type { Apprenant } from "@/modules/apprenants";
import type { MouvementFinancier } from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

export type IndicateurCle = "effectifs" | "souscriptions" | "encaissements";
export type GranulariteCle = "semaine" | "mois";

interface GraphiqueComparatifTemporelProps {
  sessions: SessionAcademique[];
  sessionActiveId?: string;
  centreId: string;
  centreNom?: string;
  allApprenants: Apprenant[];
  mouvementsParSession: Record<string, MouvementFinancier[]>;
}

interface PointSerie {
  periode: number;
  labelPeriode: string;
  dateFinIso: string;
  valeurCumulee: number;
}

interface SerieSession {
  session: SessionAcademique;
  points: PointSerie[];
  aDesDonnees: boolean;
  estEnCours: boolean;
  dernierePeriodeDisponible: number;
  valeurFinale: number;
}

// Analyse d'une date ISO "YYYY-MM-DD" sans décalage de fuseau horaire
function parseDateIso(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formatage court pour les tooltips (ex: "12 oct. 2025")
function formaterDateCourte(dateStr: string): string {
  try {
    const d = parseDateIso(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Ajoute un nombre de jours à une date
function ajouterJours(date: Date, jours: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + jours);
  return d;
}

// Formate une date en chaîne ISO YYYY-MM-DD
function versIsoString(d: Date): string {
  const annee = d.getFullYear();
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

export function GraphiqueComparatifTemporel({
  sessions,
  sessionActiveId,
  centreId,
  centreNom,
  allApprenants,
  mouvementsParSession,
}: GraphiqueComparatifTemporelProps) {
  // ── 1. État des sélecteurs et options ──
  const [indicateur, setIndicateur] = useState<IndicateurCle>("effectifs");
  const [granularite, setGranularite] = useState<GranulariteCle>("semaine");
  const [pointSurvoleIndex, setPointSurvoleIndex] = useState<number | null>(null);

  // Trier les sessions par date de début décroissante (les plus récentes en premier)
  const sessionsOrdonnees = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
    );
  }, [sessions]);

  // Initialisation par défaut : Session active (ou la plus récente) et Session précédente (N-1)
  const defaultRefId = useMemo(() => {
    if (sessionActiveId && sessionsOrdonnees.some((s) => s.id === sessionActiveId)) {
      return sessionActiveId;
    }
    return sessionsOrdonnees[0]?.id || "";
  }, [sessionActiveId, sessionsOrdonnees]);

  const defaultCompId = useMemo(() => {
    const autre = sessionsOrdonnees.find((s) => s.id !== defaultRefId);
    return autre ? autre.id : "";
  }, [defaultRefId, sessionsOrdonnees]);

  const [sessionRefId, setSessionRefId] = useState<string>(defaultRefId);
  const [sessionCompId, setSessionCompId] = useState<string>(defaultCompId);

  // Synchroniser si la liste de sessions change ou si vide
  const effectiveRefId = sessionRefId || defaultRefId;
  const effectiveCompId =
    sessionCompId && sessionCompId !== effectiveRefId
      ? sessionCompId
      : sessionsOrdonnees.find((s) => s.id !== effectiveRefId)?.id || "";

  // Inverser facilement session de référence et session comparée
  function intervertirSessions() {
    if (!effectiveRefId || !effectiveCompId) return;
    setSessionRefId(effectiveCompId);
    setSessionCompId(effectiveRefId);
    setPointSurvoleIndex(null);
  }

  // Empêcher de sélectionner deux fois la même session
  function handleChangementRef(nouveauId: string) {
    setSessionRefId(nouveauId);
    setPointSurvoleIndex(null);
    if (nouveauId === effectiveCompId) {
      const alternative = sessionsOrdonnees.find((s) => s.id !== nouveauId);
      if (alternative) setSessionCompId(alternative.id);
    }
  }

  function handleChangementComp(nouveauId: string) {
    setSessionCompId(nouveauId);
    setPointSurvoleIndex(null);
    if (nouveauId === effectiveRefId) {
      const alternative = sessionsOrdonnees.find((s) => s.id !== nouveauId);
      if (alternative) setSessionRefId(alternative.id);
    }
  }

  const sessionRef = sessionsOrdonnees.find((s) => s.id === effectiveRefId);
  const sessionComp = sessionsOrdonnees.find((s) => s.id === effectiveCompId);

  // ── 2. Calcul et agrégation temporelle pour une session donnée ──
  const calculerSerieSession = useMemo(() => {
    return (session: SessionAcademique | undefined): SerieSession | null => {
      if (!session) return null;

      const dateDebut = parseDateIso(session.dateDebut);
      const dateFin = parseDateIso(session.dateFin);
      const estEnCours = session.statut === "EN_COURS";

      // Récupérer les apprenants du centre pour cette session
      const apprenantsDuCentre = allApprenants.filter(
        (a) => a.centreId === centreId && a.sessionId === session.id,
      );

      // Récupérer les encaissements réels (mouvements validés/en attente de type ENTREE)
      const mouvementsSession = mouvementsParSession[session.id] || [];
      const encaissementsValides = mouvementsSession.filter(
        (m) => m.type === "ENTREE" && m.statut !== "REJETE",
      );

      const aDesDonnees =
        apprenantsDuCentre.length > 0 || encaissementsValides.length > 0;

      // Calcul du nombre total de périodes dans la session
      const diffJoursSession = Math.max(
        1,
        Math.floor((dateFin.getTime() - dateDebut.getTime()) / (24 * 3600 * 1000)),
      );

      const totalPeriodesMax =
        granularite === "semaine"
          ? Math.max(1, Math.ceil(diffJoursSession / 7))
          : Math.max(
              1,
              (dateFin.getFullYear() - dateDebut.getFullYear()) * 12 +
                (dateFin.getMonth() - dateDebut.getMonth()) +
                1,
            );

      // Déterminer la dernière période active pour cette session :
      // - Si la session est en cours : s'arrête à la période correspondant à aujourd'hui
      // - Si la session est clôturée : s'étend sur toute sa durée ou jusqu'à la dernière période
      let dernierePeriodeDisponible = totalPeriodesMax;
      if (estEnCours) {
        const maintenant = new Date();
        if (maintenant < dateDebut) {
          dernierePeriodeDisponible = 1;
        } else if (maintenant > dateFin) {
          dernierePeriodeDisponible = totalPeriodesMax;
        } else {
          const joursEcoules = Math.floor(
            (maintenant.getTime() - dateDebut.getTime()) / (24 * 3600 * 1000),
          );
          if (granularite === "semaine") {
            dernierePeriodeDisponible = Math.min(
              totalPeriodesMax,
              Math.max(1, Math.floor(joursEcoules / 7) + 1),
            );
          } else {
            const moisEcoules =
              (maintenant.getFullYear() - dateDebut.getFullYear()) * 12 +
              (maintenant.getMonth() - dateDebut.getMonth()) +
              1;
            dernierePeriodeDisponible = Math.min(
              totalPeriodesMax,
              Math.max(1, moisEcoules),
            );
          }
        }
      }

      // Si aucune donnée n'a jamais été enregistrée pour cette session dans le système
      if (!aDesDonnees) {
        return {
          session,
          points: [],
          aDesDonnees: false,
          estEnCours,
          dernierePeriodeDisponible: 0,
          valeurFinale: 0,
        };
      }

      // Construction des points cumulés période par période
      const points: PointSerie[] = [];

      for (let p = 1; p <= dernierePeriodeDisponible; p++) {
        let dateFinPeriode: Date;
        if (granularite === "semaine") {
          dateFinPeriode = ajouterJours(dateDebut, p * 7 - 1);
        } else {
          // Mode mois : fin du mois p depuis dateDebut
          const d = new Date(dateDebut.getTime());
          d.setMonth(d.getMonth() + p);
          d.setDate(d.getDate() - 1);
          dateFinPeriode = d;
        }

        // Bornage à dateFin de session pour la dernière période
        if (dateFinPeriode > dateFin) {
          dateFinPeriode = dateFin;
        }

        const dateFinIso = versIsoString(dateFinPeriode);

        let valeurCumulee = 0;
        if (indicateur === "effectifs") {
          // Nombre d'élèves inscrits à cette date ou avant (incluant les pré-inscriptions avant rentrée)
          valeurCumulee = apprenantsDuCentre.filter((a) => {
            return a.dateInscription <= dateFinIso;
          }).length;
        } else if (indicateur === "souscriptions") {
          // Volume contractuel souscrit cumulé
          valeurCumulee = apprenantsDuCentre
            .filter((a) => a.dateInscription <= dateFinIso)
            .reduce((somme, a) => somme + (a.montantContrat || 0), 0);
        } else if (indicateur === "encaissements") {
          // Total des versements validés reçus à cette date ou avant
          valeurCumulee = encaissementsValides
            .filter((m) => m.date <= dateFinIso)
            .reduce((somme, m) => somme + m.montant, 0);
        }

        points.push({
          periode: p,
          labelPeriode: granularite === "semaine" ? `S${p}` : `M${p}`,
          dateFinIso,
          valeurCumulee,
        });
      }

      const valeurFinale =
        points.length > 0 ? points[points.length - 1].valeurCumulee : 0;

      return {
        session,
        points,
        aDesDonnees,
        estEnCours,
        dernierePeriodeDisponible,
        valeurFinale,
      };
    };
  }, [allApprenants, centreId, mouvementsParSession, granularite, indicateur]);

  const serieRef = useMemo(
    () => calculerSerieSession(sessionRef),
    [calculerSerieSession, sessionRef],
  );
  const serieComp = useMemo(
    () => calculerSerieSession(sessionComp),
    [calculerSerieSession, sessionComp],
  );

  // ── 3. Synthèse comparative à période équivalente ──
  // La comparaison équivalente s'évalue à la dernière période commune disponible
  const periodeEquivalenteCommune = useMemo(() => {
    if (!serieRef || !serieComp) return 0;
    if (!serieRef.aDesDonnees || !serieComp.aDesDonnees) return 0;
    return Math.min(
      serieRef.dernierePeriodeDisponible,
      serieComp.dernierePeriodeDisponible,
    );
  }, [serieRef, serieComp]);

  const kpisComparatifs = useMemo(() => {
    if (periodeEquivalenteCommune === 0 || !serieRef || !serieComp) {
      return null;
    }

    const pointRefEq = serieRef.points.find(
      (p) => p.periode === periodeEquivalenteCommune,
    );
    const pointCompEq = serieComp.points.find(
      (p) => p.periode === periodeEquivalenteCommune,
    );

    const valRef = pointRefEq ? pointRefEq.valeurCumulee : 0;
    const valComp = pointCompEq ? pointCompEq.valeurCumulee : 0;

    const ecartAbsolu = valRef - valComp;
    const evolutionPct =
      valComp > 0 ? Math.round((ecartAbsolu / valComp) * 1000) / 10 : null;

    return {
      periodeIndex: periodeEquivalenteCommune,
      labelPeriode:
        granularite === "semaine"
          ? `Semaine ${periodeEquivalenteCommune}`
          : `Mois ${periodeEquivalenteCommune}`,
      valRef,
      valComp,
      ecartAbsolu,
      evolutionPct,
    };
  }, [periodeEquivalenteCommune, serieRef, serieComp, granularite]);

  // Nombre de périodes maximum à afficher sur l'axe X
  const nbPeriodesMaxX = useMemo(() => {
    const maxRef = serieRef?.dernierePeriodeDisponible || 0;
    const maxComp = serieComp?.dernierePeriodeDisponible || 0;
    return Math.max(maxRef, maxComp, 1);
  }, [serieRef, serieComp]);

  // Valeur maximale pour dimensionner l'axe Y (avec marge de 10% au-dessus)
  const maxValeurY = useMemo(() => {
    const pointsRef = serieRef?.points || [];
    const pointsComp = serieComp?.points || [];
    const maxR = pointsRef.length > 0 ? Math.max(...pointsRef.map((p) => p.valeurCumulee)) : 0;
    const maxC = pointsComp.length > 0 ? Math.max(...pointsComp.map((p) => p.valeurCumulee)) : 0;
    const brut = Math.max(maxR, maxC);
    if (brut === 0) return indicateur === "effectifs" ? 10 : 1000000;
    return brut * 1.12;
  }, [serieRef, serieComp, indicateur]);

  // ── 4. Dessin SVG des courbes et axes ──
  const SVG_WIDTH = 840;
  const SVG_HEIGHT = 320;
  const PAD_LEFT = 75;
  const PAD_RIGHT = 30;
  const PAD_TOP = 25;
  const PAD_BOTTOM = 45;

  const plotWidth = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coordX = useCallback(
    (periode: number): number => {
      if (nbPeriodesMaxX <= 1) return PAD_LEFT + plotWidth / 2;
      return PAD_LEFT + ((periode - 1) / (nbPeriodesMaxX - 1)) * plotWidth;
    },
    [nbPeriodesMaxX, plotWidth],
  );

  const coordY = useCallback(
    (valeur: number): number => {
      const clampVal = Math.max(0, valeur);
      return PAD_TOP + plotHeight - (clampVal / maxValeurY) * plotHeight;
    },
    [maxValeurY, plotHeight],
  );

  // Génération des chemins SVG (polyline / surface)
  const dRefLigne = useMemo(() => {
    if (!serieRef?.points.length) return "";
    return serieRef.points
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${coordX(pt.periode)} ${coordY(pt.valeurCumulee)}`)
      .join(" ");
  }, [serieRef, coordX, coordY]);

  const dRefSurface = useMemo(() => {
    if (!serieRef?.points.length) return "";
    const premierX = coordX(serieRef.points[0].periode);
    const dernierX = coordX(serieRef.points[serieRef.points.length - 1].periode);
    const ligneBaseY = coordY(0);
    return `${dRefLigne} L ${dernierX} ${ligneBaseY} L ${premierX} ${ligneBaseY} Z`;
  }, [dRefLigne, serieRef, coordX, coordY]);

  const dCompLigne = useMemo(() => {
    if (!serieComp?.points.length) return "";
    return serieComp.points
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${coordX(pt.periode)} ${coordY(pt.valeurCumulee)}`)
      .join(" ");
  }, [serieComp, coordX, coordY]);

  // Période actuellement survolée (ou période équivalente par défaut si non survolé)
  const periodeActiveSurvol =
    pointSurvoleIndex !== null ? pointSurvoleIndex : null;

  const donneesSurvol = useMemo(() => {
    if (periodeActiveSurvol === null) return null;
    const ptRef = serieRef?.points.find((p) => p.periode === periodeActiveSurvol);
    const ptComp = serieComp?.points.find((p) => p.periode === periodeActiveSurvol);

    const valR = ptRef ? ptRef.valeurCumulee : null;
    const valC = ptComp ? ptComp.valeurCumulee : null;
    const diff = valR !== null && valC !== null ? valR - valC : null;
    const diffPct =
      diff !== null && valC !== null && valC > 0
        ? Math.round((diff / valC) * 1000) / 10
        : null;

    return {
      periode: periodeActiveSurvol,
      label:
        granularite === "semaine"
          ? `Semaine ${periodeActiveSurvol}`
          : `Mois ${periodeActiveSurvol}`,
      dateRef: ptRef ? formaterDateCourte(ptRef.dateFinIso) : null,
      valRef: valR,
      dateComp: ptComp ? formaterDateCourte(ptComp.dateFinIso) : null,
      valComp: valC,
      diff,
      diffPct,
    };
  }, [periodeActiveSurvol, serieRef, serieComp, granularite]);

  // Formatage des étiquettes Y de l'axe
  function formaterAxeY(val: number): string {
    if (indicateur === "effectifs") {
      return `${Math.round(val)}`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
    }
    if (val >= 1_000) {
      return `${Math.round(val / 1_000)}k`;
    }
    return `${Math.round(val)}`;
  }

  // Formatage complet pour l'indicateur actif
  function formaterValeur(val: number): string {
    if (indicateur === "effectifs") {
      return `${val} élève${val > 1 ? "s" : ""}`;
    }
    return `${FCFA.format(val)} FCFA`;
  }

  // Ticks de l'axe X (évite le chevauchement si trop de semaines)
  const ticksX = useMemo(() => {
    const ticks: number[] = [];
    const pas =
      nbPeriodesMaxX <= 12
        ? 1
        : nbPeriodesMaxX <= 24
        ? 2
        : nbPeriodesMaxX <= 40
        ? 4
        : 5;

    for (let p = 1; p <= nbPeriodesMaxX; p++) {
      if (p === 1 || p === nbPeriodesMaxX || (p - 1) % pas === 0) {
        ticks.push(p);
      }
    }
    return ticks;
  }, [nbPeriodesMaxX]);

  // Si le centre n'a pas au moins deux sessions au total
  if (sessions.length < 2) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 shadow-xs p-8 bg-white text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto">
          <LineChart size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Comparatif temporel non disponible
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Ce centre est rattaché à une seule session académique. Il est nécessaire de disposer
          d&rsquo;au moins deux sessions (active et archivées) pour générer une visualisation comparative.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-xs bg-white p-6 space-y-6">
      {/* ── Entête & Commandes de contrôle ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
              <LineChart size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Comparatif Temporel des Performances
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suivi de l&rsquo;évolution comparative à périodes équivalentes depuis le démarrage de chaque session{centreNom ? ` · ${centreNom}` : ""}.
          </p>
        </div>

        {/* Contrôles : Granularité temporelle + Sélecteur d'indicateur */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Granularité : Semaine / Mois */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setGranularite("semaine");
                setPointSurvoleIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                granularite === "semaine"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Par semaine
            </button>
            <button
              type="button"
              onClick={() => {
                setGranularite("mois");
                setPointSurvoleIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                granularite === "mois"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Par mois
            </button>
          </div>

          {/* Onglets des 3 indicateurs comparables */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIndicateur("effectifs");
                setPointSurvoleIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                indicateur === "effectifs"
                  ? "bg-brand-orange text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={14} />
              <span>Effectifs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIndicateur("souscriptions");
                setPointSurvoleIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                indicateur === "souscriptions"
                  ? "bg-brand-blue text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wallet size={14} />
              <span>Souscriptions</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIndicateur("encaissements");
                setPointSurvoleIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                indicateur === "encaissements"
                  ? "bg-emerald-700 text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins size={14} />
              <span>Encaissements</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sélecteurs de sessions & Légende active ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
        {/* Sélecteur Session Référence */}
        <div className="md:col-span-5 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-brand-orange shrink-0 ring-2 ring-orange-200" />
          <div className="flex-1 min-w-0">
            <label
              htmlFor="select-session-ref"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
            >
              Session de référence
            </label>
            <select
              id="select-session-ref"
              value={effectiveRefId}
              onChange={(e) => handleChangementRef(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange cursor-pointer"
            >
              {sessionsOrdonnees.map((s) => (
                <option
                  key={`ref-${s.id}`}
                  value={s.id}
                  disabled={s.id === effectiveCompId}
                >
                  Session {s.annee} {s.statut === "EN_COURS" ? "(En cours)" : "(Clôturée)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bouton inversion */}
        <div className="md:col-span-2 flex justify-center">
          <button
            type="button"
            onClick={intervertirSessions}
            title="Inverser les deux sessions comparées"
            className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-brand-orange bg-white hover:bg-orange-50 border border-slate-200 hover:border-brand-orange/40 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowRightLeft size={13} />
            <span className="hidden sm:inline">Inverser</span>
          </button>
        </div>

        {/* Sélecteur Session Comparée */}
        <div className="md:col-span-5 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-brand-blue shrink-0 ring-2 ring-blue-200" />
          <div className="flex-1 min-w-0">
            <label
              htmlFor="select-session-comp"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
            >
              Session à comparer
            </label>
            <select
              id="select-session-comp"
              value={effectiveCompId}
              onChange={(e) => handleChangementComp(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue cursor-pointer"
            >
              {sessionsOrdonnees.map((s) => (
                <option
                  key={`comp-${s.id}`}
                  value={s.id}
                  disabled={s.id === effectiveRefId}
                >
                  Session {s.annee} {s.statut === "EN_COURS" ? "(En cours)" : "(Clôturée)"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Alerte fiabilité si une session historique n'a pas de données enregistrées ── */}
      {(!serieRef?.aDesDonnees || !serieComp?.aDesDonnees) && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Données historiques partielles ou absentes :</span>
            <p className="text-amber-800">
              {!serieRef?.aDesDonnees && (
                <span>
                  La session <strong>{sessionRef?.annee}</strong> ne dispose d&rsquo;aucun enregistrement chronologique pour ce centre.{" "}
                </span>
              )}
              {!serieComp?.aDesDonnees && (
                <span>
                  La session <strong>{sessionComp?.annee}</strong> ne dispose d&rsquo;aucun enregistrement chronologique pour ce centre.{" "}
                </span>
              )}
              Conformément à la politique de fiabilité EXCELIS, les données ne sont pas reconstruites artificiellement et les périodes manquantes ne sont pas simulées.
            </p>
          </div>
        </div>
      )}

      {/* ── Zone Graphique Interactive SVG ── */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-b from-slate-50/40 to-white p-2 sm:p-4">
        {/* Légende rapide et unité */}
        <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 mb-2 px-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-brand-orange inline-block" />
              <strong className="text-slate-900">
                {sessionRef?.annee} (Réf.)
              </strong>
              {serieRef?.estEnCours && (
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  En cours ({serieRef.points.length > 0 ? serieRef.points[serieRef.points.length - 1].labelPeriode : "S0"})
                </span>
              )}
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-brand-blue inline-block" />
              <strong className="text-slate-900">
                {sessionComp?.annee} (Comp.)
              </strong>
              {serieComp?.estEnCours ? (
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  En cours
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                  Clôturée
                </span>
              )}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-semibold">
            Unité :{" "}
            <strong className="text-slate-700">
              {indicateur === "effectifs" ? "Élèves inscrits (cumul)" : "Francs CFA (FCFA cumulés)"}
            </strong>
          </span>
        </div>

        {/* SVG vectoriel responsive */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto min-w-[620px] select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="gradient-ref-orange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f7931e" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f7931e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Quadrillage horizontal et labels Y */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = maxValeurY * (1 - pct);
              const yPos = PAD_TOP + pct * plotHeight;
              return (
                <g key={`grid-y-${idx}`}>
                  <line
                    x1={PAD_LEFT}
                    y1={yPos}
                    x2={SVG_WIDTH - PAD_RIGHT}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray={pct === 1 ? undefined : "3 3"}
                    strokeWidth={pct === 1 ? 1.5 : 1}
                  />
                  <text
                    x={PAD_LEFT - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#64748b"
                  >
                    {formaterAxeY(yVal)}
                  </text>
                </g>
              );
            })}

            {/* Ligne repère de comparaison équivalente si active */}
            {periodeEquivalenteCommune > 0 && (
              <g>
                <line
                  x1={coordX(periodeEquivalenteCommune)}
                  y1={PAD_TOP}
                  x2={coordX(periodeEquivalenteCommune)}
                  y2={PAD_TOP + plotHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={coordX(periodeEquivalenteCommune)}
                  y={PAD_TOP - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#64748b"
                >
                  Point équivalent ({granularite === "semaine" ? `S${periodeEquivalenteCommune}` : `M${periodeEquivalenteCommune}`})
                </text>
              </g>
            )}

            {/* Surface dégradée sous la courbe de référence */}
            {dRefSurface && (
              <path d={dRefSurface} fill="url(#gradient-ref-orange)" />
            )}

            {/* Courbe Session Comparée (Bleu EXCELIS) */}
            {dCompLigne && (
              <path
                d={dCompLigne}
                fill="none"
                stroke="#2d2e80"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Courbe Session Référence (Orange EXCELIS) */}
            {dRefLigne && (
              <path
                d={dRefLigne}
                fill="none"
                stroke="#f7931e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points sur la courbe Session Comparée */}
            {serieComp?.points.map((pt) => {
              const cx = coordX(pt.periode);
              const cy = coordY(pt.valeurCumulee);
              const estSurvole = periodeActiveSurvol === pt.periode;
              return (
                <circle
                  key={`pt-comp-${pt.periode}`}
                  cx={cx}
                  cy={cy}
                  r={estSurvole ? 5.5 : 3.5}
                  fill="#2d2e80"
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-all duration-150"
                />
              );
            })}

            {/* Points sur la courbe Session Référence */}
            {serieRef?.points.map((pt, idx) => {
              const cx = coordX(pt.periode);
              const cy = coordY(pt.valeurCumulee);
              const estSurvole = periodeActiveSurvol === pt.periode;
              const estDernier = idx === serieRef.points.length - 1;

              return (
                <g key={`pt-ref-${pt.periode}`}>
                  {estDernier && serieRef.estEnCours && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="#f7931e"
                      fillOpacity="0.25"
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={estSurvole ? 6 : 4}
                    fill="#f7931e"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* Ligne verticale au survol */}
            {periodeActiveSurvol !== null && (
              <line
                x1={coordX(periodeActiveSurvol)}
                y1={PAD_TOP}
                x2={coordX(periodeActiveSurvol)}
                y2={PAD_TOP + plotHeight}
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}

            {/* Labels de l'axe X (Périodes S1..Sn ou M1..Mn) */}
            {ticksX.map((p) => {
              const xPos = coordX(p);
              const label = granularite === "semaine" ? `S${p}` : `M${p}`;
              return (
                <g key={`tick-x-${p}`}>
                  <line
                    x1={xPos}
                    y1={PAD_TOP + plotHeight}
                    x2={xPos}
                    y2={PAD_TOP + plotHeight + 5}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={xPos}
                    y={PAD_TOP + plotHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={periodeActiveSurvol === p ? "#ea580c" : "#64748b"}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Zones transparentes d'interaction au survol pour chaque période */}
            {Array.from({ length: nbPeriodesMaxX }, (_, i) => i + 1).map((p) => {
              const xCentre = coordX(p);
              const largCol = plotWidth / Math.max(1, nbPeriodesMaxX - 1);
              return (
                <rect
                  key={`hover-zone-${p}`}
                  x={xCentre - largCol / 2}
                  y={PAD_TOP}
                  width={largCol}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setPointSurvoleIndex(p)}
                />
              );
            })}
          </svg>
        </div>

        {/* ── Popover Tooltip Interactif au survol ── */}
        {donneesSurvol && (
          <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-orange-100 text-brand-orange font-black flex items-center justify-center shrink-0">
                {donneesSurvol.label.replace("Semaine ", "S").replace("Mois ", "M")}
              </span>
              <div>
                <span className="font-bold text-slate-900 block">
                  Progression à {donneesSurvol.label}
                </span>
                <span className="text-[11px] text-slate-400">
                  {donneesSurvol.dateRef && `Réf : ${donneesSurvol.dateRef}`}
                  {donneesSurvol.dateRef && donneesSurvol.dateComp && " · "}
                  {donneesSurvol.dateComp && `Comp : ${donneesSurvol.dateComp}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-bold">
              {/* Valeur Session Réf */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
                <span className="text-slate-500">{sessionRef?.annee} :</span>
                <span className="text-slate-900 font-extrabold">
                  {donneesSurvol.valRef !== null
                    ? formaterValeur(donneesSurvol.valRef)
                    : "Non échue"}
                </span>
              </div>

              {/* Valeur Session Comp */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-blue" />
                <span className="text-slate-500">{sessionComp?.annee} :</span>
                <span className="text-slate-900 font-extrabold">
                  {donneesSurvol.valComp !== null
                    ? formaterValeur(donneesSurvol.valComp)
                    : "Non enregistrée"}
                </span>
              </div>

              {/* Écart ponctuel */}
              {donneesSurvol.diff !== null && (
                <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                  <span className="text-slate-500">Écart :</span>
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                      donneesSurvol.diff >= 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {donneesSurvol.diff >= 0 ? "+" : ""}
                    {formaterValeur(donneesSurvol.diff)}
                    {donneesSurvol.diffPct !== null && (
                      <span className="ml-1 opacity-90">
                        ({donneesSurvol.diffPct >= 0 ? `+${donneesSurvol.diffPct}%` : `${donneesSurvol.diffPct}%`})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Informations complémentaires & Écart à période équivalente ── */}
      {kpisComparatifs ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          {/* KPI 1 : Écart absolu */}
          <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Écart Absolu ({kpisComparatifs.labelPeriode})
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-black tabular-nums ${
                  kpisComparatifs.ecartAbsolu >= 0
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {kpisComparatifs.ecartAbsolu >= 0 ? "+" : ""}
                {formaterValeur(kpisComparatifs.ecartAbsolu)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {sessionRef?.annee} ({formaterValeur(kpisComparatifs.valRef)}) vs {sessionComp?.annee} ({formaterValeur(kpisComparatifs.valComp)})
            </p>
          </div>

          {/* KPI 2 : Évolution en pourcentage */}
          <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Évolution Relative ({kpisComparatifs.labelPeriode})
            </span>
            <div className="flex items-center gap-1.5">
              {kpisComparatifs.evolutionPct !== null ? (
                <>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-black ${
                      kpisComparatifs.evolutionPct >= 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {kpisComparatifs.evolutionPct >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {kpisComparatifs.evolutionPct >= 0 ? `+${kpisComparatifs.evolutionPct}%` : `${kpisComparatifs.evolutionPct}%`}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">de croissance</span>
                </>
              ) : (
                <span className="text-sm font-bold text-slate-400">
                  Base nulle (N/A)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Calculé à durée d&rsquo;exécution strictement identique
            </p>
          </div>

          {/* KPI 3 : Dernières périodes disponibles */}
          <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Dernière Période Disponible
            </span>
            <div className="space-y-1 text-xs font-bold">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-brand-orange" />
                  {sessionRef?.annee} :
                </span>
                <span className="text-slate-900">
                  {granularite === "semaine"
                    ? `Semaine ${serieRef?.dernierePeriodeDisponible || 0}`
                    : `Mois ${serieRef?.dernierePeriodeDisponible || 0}`}{" "}
                  {serieRef?.estEnCours ? "(En cours)" : "(Terminée)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" />
                  {sessionComp?.annee} :
                </span>
                <span className="text-slate-900">
                  {granularite === "semaine"
                    ? `Semaine ${serieComp?.dernierePeriodeDisponible || 0}`
                    : `Mois ${serieComp?.dernierePeriodeDisponible || 0}`}{" "}
                  {serieComp?.estEnCours ? "(En cours)" : "(Clôturée)"}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">
              Arrêtée à la dernière période d&rsquo;activité réelle
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
          <Info size={14} className="shrink-0 text-slate-400" />
          <span>
            Sélectionnez deux sessions ayant des données enregistrées pour afficher les écarts et indicateurs à période équivalente.
          </span>
        </div>
      )}
    </Card>
  );
}
