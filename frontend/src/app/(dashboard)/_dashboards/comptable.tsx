"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Banknote,
  ClipboardCheck,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  Download,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  PieChart as PieChartIcon,
  Activity,
  Users,
  Plus,
} from "lucide-react";

import { Card, Skeleton, SkeletonCard, SkeletonTable, Button } from "@/shared/ui";
import {
  useCentres,
  useSessionActive,
  useSessions,
  EvolutionPerformancesMultiCentres,
} from "@/modules/centres-sessions";
import { useApprenants } from "@/modules/apprenants";
import { useMouvementsFinanciers, useMotifs, SaisirSortieModal } from "@/modules/financier";
import {
  useBordereauxEnseignant,
  useBordereauxPaiePersonnel,
} from "@/modules/remuneration/data/queries";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const FCFA = new Intl.NumberFormat("fr-FR");

function formatCompactFCFA(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    const m = (val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1);
    return `${m}M FCFA`;
  }
  if (Math.abs(val) >= 1_000) {
    const k = (val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 0);
    return `${k}k FCFA`;
  }
  return `${FCFA.format(val)} FCFA`;
}

function formatCompactAxis(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    const m = (val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1);
    return `${m}M`;
  }
  if (Math.abs(val) >= 1_000) {
    const k = (val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 0);
    return `${k}k`;
  }
  return `${val}`;
}

// Catégorisation des motifs de dépenses
function categoriserMotif(nomMotif: string): "PAIE" | "FONCTIONNEMENT" | "ACHATS" {
  const nom = (nomMotif || "").toLowerCase();
  if (
    nom.includes("salaire") ||
    nom.includes("rémunération") ||
    nom.includes("remuneration") ||
    nom.includes("paie") ||
    nom.includes("vacataire") ||
    nom.includes("vacation") ||
    nom.includes("prime")
  ) {
    return "PAIE";
  }
  if (
    nom.includes("achat") ||
    nom.includes("materiel") ||
    nom.includes("matériel") ||
    nom.includes("mobilier") ||
    nom.includes("ordinateur") ||
    nom.includes("investissement")
  ) {
    return "ACHATS";
  }
  return "FONCTIONNEMENT";
}

export function ComptableDashboard() {
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive, isLoading: chargementSessionActive } = useSessionActive();
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<string | null>(null);
  const [modalSortieOuverte, setModalSortieOuverte] = useState(false);

  const sessionCourante = useMemo(() => {
    if (sessionIdSelectionnee) {
      return sessions.find((s) => s.id === sessionIdSelectionnee) ?? sessionActive ?? sessions[0];
    }
    return sessionActive ?? sessions[0];
  }, [sessionIdSelectionnee, sessions, sessionActive]);

  const activeSessionId = sessionCourante?.id;

  // Données financières
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: motifs = [] } = useMotifs();
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(activeSessionId);

  // Rémunérations & Paie
  const { data: bordereauxEnseignants = [], isLoading: chargementBordereauxEnseignants } =
    useBordereauxEnseignant(activeSessionId);
  const { data: bordereauxPersonnel = [], isLoading: chargementBordereauxPersonnel } =
    useBordereauxPaiePersonnel(activeSessionId);

  // Filtrage des apprenants sur la session courante
  const apprenantsSession = useMemo(() => {
    if (!activeSessionId) return apprenants;
    return apprenants.filter((a) => !a.sessionId || a.sessionId === activeSessionId);
  }, [apprenants, activeSessionId]);

  // Map des motifs
  const mapMotifs = useMemo(() => {
    const map = new Map<string, string>();
    motifs.forEach((m) => map.set(m.id, m.nom));
    return map;
  }, [motifs]);

  // Entrées et sorties réelles
  const entrees = useMemo(
    () => mouvements.filter((m) => m.type === "ENTREE" && m.statut !== "REJETE"),
    [mouvements],
  );
  const sorties = useMemo(
    () => mouvements.filter((m) => m.type === "SORTIE" && m.statut !== "REJETE"),
    [mouvements],
  );

  // KPI 1 : Trésorerie
  const totalRecettes = useMemo(
    () => entrees.reduce((acc, m) => acc + m.montant, 0),
    [entrees],
  );
  const totalDepenses = useMemo(
    () => sorties.reduce((acc, m) => acc + m.montant, 0),
    [sorties],
  );
  const tresorerieDisponible = totalRecettes - totalDepenses;

  // KPI 2 : Facturation & Recouvrement
  const totalContrats = useMemo(
    () => apprenantsSession.reduce((acc, a) => acc + (a.montantContrat || 0), 0),
    [apprenantsSession],
  );
  const resteARecouvrer = Math.max(0, totalContrats - totalRecettes);
  const tauxRecouvrement = totalContrats > 0 ? Math.min(100, Math.round((totalRecettes / totalContrats) * 100)) : 100;

  // KPI 3 : Masse salariale engagée et payée
  const masseSalarialeEnseignants = useMemo(
    () => bordereauxEnseignants.reduce((acc, b) => acc + (b.montantTotalGlobal || 0), 0),
    [bordereauxEnseignants],
  );
  const masseSalarialePersonnel = useMemo(
    () => bordereauxPersonnel.reduce((acc, b) => acc + (b.montantTotalGlobal || 0), 0),
    [bordereauxPersonnel],
  );
  const masseSalarialeTotale = masseSalarialeEnseignants + masseSalarialePersonnel;

  // KPI 4 : Bilans journaliers
  const bilansResume = useMemo(() => {
    const datesCentres = new Set<string>();
    let enAttente = 0;
    let clotures = 0;

    mouvements.forEach((m) => {
      if (!m.centreId || !m.date) return;
      const d = m.date.split("T")[0];
      const cle = `${m.centreId}__${d}`;
      if (!datesCentres.has(cle)) {
        datesCentres.add(cle);
        if (m.statut === "VALIDE") {
          clotures++;
        } else {
          enAttente++;
        }
      }
    });

    return { total: datesCentres.size, enAttente, clotures };
  }, [mouvements]);

  // Ventilation des dépenses par catégorie
  const ventilationDepenses = useMemo(() => {
    let paie = 0;
    let fonctionnement = 0;
    let achats = 0;

    sorties.forEach((s) => {
      const nomMotif = mapMotifs.get(s.motifId) || "";
      const cat = categoriserMotif(nomMotif);
      if (cat === "PAIE") paie += s.montant;
      else if (cat === "ACHATS") achats += s.montant;
      else fonctionnement += s.montant;
    });

    const tot = paie + fonctionnement + achats;
    return {
      paie,
      fonctionnement,
      achats,
      total: tot,
      pctPaie: tot > 0 ? Math.round((paie / tot) * 100) : 0,
      pctFonctionnement: tot > 0 ? Math.round((fonctionnement / tot) * 100) : 0,
      pctAchats: tot > 0 ? Math.round((achats / tot) * 100) : 0,
    };
  }, [sorties, mapMotifs]);

  // Données chronologiques pour les courbes d'évolution financière
  const pointsChronologiques = useMemo(() => {
    const mapDates = new Map<string, { recettes: number; depenses: number }>();

    mouvements.forEach((m) => {
      if (!m.date || m.statut === "REJETE") return;
      const d = m.date.split("T")[0];
      if (!mapDates.has(d)) {
        mapDates.set(d, { recettes: 0, depenses: 0 });
      }
      const entry = mapDates.get(d)!;
      if (m.type === "ENTREE") entry.recettes += m.montant;
      else if (m.type === "SORTIE") entry.depenses += m.montant;
    });

    const datesTriees = Array.from(mapDates.keys()).sort();
    let soldeCumule = 0;

    return datesTriees.map((d) => {
      const data = mapDates.get(d)!;
      soldeCumule += data.recettes - data.depenses;
      const [year, month, day] = d.split("-");
      return {
        date: d,
        label: `${day}/${month}`,
        recettes: data.recettes,
        depenses: data.depenses,
        soldeJour: data.recettes - data.depenses,
        tresorerieCumulee: soldeCumule,
      };
    });
  }, [mouvements]);

  // État des courbes d'évolution
  const [modeCourbe, setModeCourbe] = useState<"FLUX" | "TRESORERIE">("FLUX");

  // Synthèse comparée par centre
  const syntheseCentres = useMemo(() => {
    return centres.map((centre) => {
      const eleves = apprenantsSession.filter((a) => a.centreId === centre.id);
      const ca = eleves.reduce((acc, a) => acc + (a.montantContrat || 0), 0);
      const enc = entrees
        .filter((m) => m.centreId === centre.id)
        .reduce((acc, m) => acc + m.montant, 0);
      const dec = sorties
        .filter((m) => m.centreId === centre.id)
        .reduce((acc, m) => acc + m.montant, 0);
      const net = enc - dec;
      const taux = ca > 0 ? Math.min(100, Math.round((enc / ca) * 100)) : 100;

      return {
        id: centre.id,
        nom: centre.nom,
        ville: centre.villeActuelle,
        effectif: eleves.length,
        facture: ca,
        encaisse: enc,
        decaisse: dec,
        soldeNet: net,
        tauxRecouvrement: taux,
      };
    }).sort((a, b) => b.encaisse - a.encaisse);
  }, [centres, apprenantsSession, entrees, sorties]);

  // Export CSV de la situation financière consolidée
  const exporterSyntheseCSV = () => {
    const enTetes = [
      "Centre",
      "Ville",
      "Effectif",
      "Montant Facture FCFA",
      "Recettes Encaissees FCFA",
      "Depenses Decaissees FCFA",
      "Solde Net FCFA",
      "Taux Recouvrement %",
    ];

    const lignes = syntheseCentres.map((c) => [
      `"${c.nom}"`,
      `"${c.ville || ""}"`,
      c.effectif,
      c.facture,
      c.encaisse,
      c.decaisse,
      c.soldeNet,
      `${c.tauxRecouvrement}%`,
    ]);

    lignes.push([
      `"TOTAL CONSOLIDE"`,
      `""`,
      apprenantsSession.length,
      totalContrats,
      totalRecettes,
      totalDepenses,
      tresorerieDisponible,
      `${tauxRecouvrement}%`,
    ]);

    const contenuCSV = [enTetes.join(";"), ...lignes.map((l) => l.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + contenuCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    const anneeSession = sessionCourante?.annee ? `_${sessionCourante.annee}` : "";
    lien.setAttribute("href", url);
    lien.setAttribute(
      "download",
      `synthese_financiere_excelis${anneeSession}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  };

  const chargementGlobal =
    chargementSessions ||
    chargementSessionActive ||
    chargementCentres ||
    chargementApprenants ||
    chargementMouvements ||
    chargementBordereauxEnseignants ||
    chargementBordereauxPersonnel;

  // Données pour le donut Recharts des dépenses
  const donneesDonutDepenses = useMemo(
    () =>
      [
        { name: "Masse salariale", valeur: ventilationDepenses.paie, color: "#6b21a8" },
        { name: "Fonctionnement", valeur: ventilationDepenses.fonctionnement, color: "#2d2e80" },
        { name: "Achats & Matériel", valeur: ventilationDepenses.achats, color: "#f7931e" },
      ].filter((d) => d.valeur > 0),
    [ventilationDepenses],
  );

  if (chargementGlobal) {
    return (
      <div className="w-full space-y-6 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={6} columns={6} />
      </div>
    );
  }

  // Calcul ratio recettes / total flux pour la jauge de trésorerie
  const totalFlux = totalRecettes + totalDepenses;
  const pctRecettes = totalFlux > 0 ? Math.round((totalRecettes / totalFlux) * 100) : 50;

  // Calcul ratio enseignants / masse totale
  const pctEnseignants =
    masseSalarialeTotale > 0
      ? Math.round((masseSalarialeEnseignants / masseSalarialeTotale) * 100)
      : 50;

  const pointActif = pointsChronologiques[pointsChronologiques.length - 1] || null;

  return (
    <div className="w-full space-y-6 pb-16">
      {/* ── 1. EN-TÊTE EXÉCUTIF COMPACT ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Tableau de Bord Financier
            </h1>
            {sessionCourante && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Session {sessionCourante.annee}
              </span>
            )}
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {centres.length} centres consolidés
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Supervision consolidée de la trésorerie, suivi des recouvrements et clôture des bilans journaliers.
          </p>
        </div>

        {/* Commandes exécutives */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Raccourci vers les centres et apprenants */}
          <Link
            href="/centres"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Building2 size={14} className="text-brand-orange" />
            <span>Centres</span>
          </Link>
          <Link
            href="/apprenants"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Users size={14} className="text-brand-orange" />
            <span>Apprenants</span>
          </Link>

          <div className="relative">
            <select
              value={sessionCourante?.id || ""}
              onChange={(e) => setSessionIdSelectionnee(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:border-brand-orange focus:outline-none cursor-pointer"
              aria-label="Sélectionner la session académique"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.annee} {s.statut === "EN_COURS" ? "(En cours)" : `(${s.statut.toLowerCase()})`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <Button
            onClick={() => setModalSortieOuverte(true)}
            className="rounded-xl shadow-xs text-xs font-bold py-2 cursor-pointer bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Nouveau décaissement</span>
          </Button>

          <Button
            onClick={exporterSyntheseCSV}
            variant="secondary"
            className="rounded-xl shadow-xs text-xs font-bold py-2 cursor-pointer"
          >
            <Download size={14} />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* ── 2. BENTO GRID DE KPIS EXÉCUTIFS (4 CARTES MAJEURES) ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARTE 1 : Trésorerie Nette Disponible */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Trésorerie Disponible
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {FCFA.format(tresorerieDisponible)}{" "}
                <span className="text-xs font-bold text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Solde net consolidé de l&apos;ensemble des caisses
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700">
                +{FCFA.format(totalRecettes)} F
              </span>
              <span className="font-bold text-rose-700">
                -{FCFA.format(totalDepenses)} F
              </span>
            </div>
            {/* Jauge bicolore Recettes vs Dépenses */}
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${pctRecettes}%` }}
                title={`${pctRecettes}% d'encaissements`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${100 - pctRecettes}%` }}
                title="Décaissements"
              />
            </div>
          </div>
        </Card>

        {/* CARTE 2 : Recouvrement des Frais */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Recouvrement Global
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-brand-orange">
                <Receipt size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {tauxRecouvrement}%
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Facturé : <strong className="text-slate-800">{FCFA.format(totalContrats)} FCFA</strong>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Reste à recouvrer :</span>
              <span className="font-bold text-slate-900">{FCFA.format(resteARecouvrer)} FCFA</span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-500 ${
                  tauxRecouvrement >= 75
                    ? "bg-emerald-600"
                    : tauxRecouvrement >= 50
                      ? "bg-brand-orange"
                      : "bg-rose-600"
                }`}
                style={{ width: `${tauxRecouvrement}%` }}
              />
            </div>
          </div>
        </Card>

        {/* CARTE 3 : Masse Salariale Engagée */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Masse Salariale
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <Banknote size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {FCFA.format(masseSalarialeTotale)}{" "}
                <span className="text-xs font-bold text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Engagements paie enseignants & personnel
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Vacataires : {formatCompactFCFA(masseSalarialeEnseignants)}
              </span>
              <span className="font-semibold text-slate-500">
                Staff : {formatCompactFCFA(masseSalarialePersonnel)}
              </span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${pctEnseignants}%` }}
                title={`${pctEnseignants}% Enseignants`}
              />
              <div
                className="h-full bg-purple-300 transition-all duration-500"
                style={{ width: `${100 - pctEnseignants}%` }}
                title="Personnel administratif"
              />
            </div>
          </div>
        </Card>

        {/* CARTE 4 : Contrôle des Bilans Journaliers */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Bilans Journaliers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ClipboardCheck size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {bilansResume.clotures}{" "}
                <span className="text-xs font-bold text-slate-500">clôturés</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Sur {bilansResume.total} journées de caisse enregistrées
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700">
                {bilansResume.clotures} validés
              </span>
              <span className={`font-bold ${bilansResume.enAttente > 0 ? "text-amber-700" : "text-slate-500"}`}>
                {bilansResume.enAttente} à viser
              </span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${
                    bilansResume.total > 0
                      ? Math.round((bilansResume.clotures / bilansResume.total) * 100)
                      : 100
                  }%`,
                }}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{
                  width: `${
                    bilansResume.total > 0
                      ? Math.round((bilansResume.enAttente / bilansResume.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. BANNIÈRE D'ALERTE DE GESTION (Si bilans en attente de visa) ── */}
      {bilansResume.enAttente > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-amber-900">
                {bilansResume.enAttente} bilan{bilansResume.enAttente > 1 ? "s" : ""} journalier{bilansResume.enAttente > 1 ? "s" : ""} en attente de contrôle et visa
              </span>
              <p className="text-amber-800/80 mt-0.5">
                Certaines journées de caisse transmises par les centres attendent votre vérification comptable pour verrouillage définitif.
              </p>
            </div>
          </div>
          <Link href="/bilan-journalier">
            <Button variant="secondary" className="text-xs font-semibold py-1.5 px-3 whitespace-nowrap">
              Accéder aux bilans
            </Button>
          </Link>
        </div>
      )}

      {/* ── 4. COURBES D'ÉVOLUTION FINANCIÈRE (RECETTES, DÉPENSES & TRÉSORERIE) ── */}
      <Card className="rounded-2xl border-slate-200/90 p-5 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Activity size={18} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Évolution Chronologique des Flux & Trésorerie
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Trajectoire des encaissements, décaissements et du solde net progressif sur la session.
            </p>
          </div>

          {/* Sélecteur de mode de courbe */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setModeCourbe("FLUX")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                modeCourbe === "FLUX"
                  ? "bg-white text-slate-900 shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Recettes vs Dépenses
            </button>
            <button
              type="button"
              onClick={() => setModeCourbe("TRESORERIE")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                modeCourbe === "TRESORERIE"
                  ? "bg-white text-slate-900 shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Trésorerie Cumulée
            </button>
          </div>
        </div>

        {/* Détail instantané du point survolé */}
        {pointActif && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-slate-500">Date : <strong className="text-slate-900">{pointActif.date}</strong></span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
              Recettes : +{FCFA.format(pointActif.recettes)} F
            </span>
            <span className="text-rose-700 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-600 inline-block" />
              Dépenses : -{FCFA.format(pointActif.depenses)} F
            </span>
            <span className="text-blue-900 flex items-center gap-1 ml-auto">
              <span className="h-2 w-2 rounded-full bg-[#2d2e80] inline-block" />
              Trésorerie cumulée : <strong className="tabular-nums">{FCFA.format(pointActif.tresorerieCumulee)} FCFA</strong>
            </span>
          </div>
        )}

        {/* Tracé Recharts responsive */}
        {pointsChronologiques.length > 0 ? (
          <div>
            <div className="mt-4 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {modeCourbe === "FLUX" ? (
                <AreaChart
                  data={pointsChronologiques}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradRecettes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.0} />
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
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCompactAxis}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0]?.payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xs p-3 shadow-lg text-xs">
                          <p className="font-bold text-slate-800 mb-1.5">{pt?.date}</p>
                          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            <span>Recettes : +{FCFA.format(pt?.recettes || 0)} FCFA</span>
                          </div>
                          <div className="flex items-center gap-2 text-rose-700 font-semibold mt-1">
                            <span className="h-2 w-2 rounded-full bg-rose-600" />
                            <span>Dépenses : -{FCFA.format(pt?.depenses || 0)} FCFA</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 font-medium mt-1 pt-1 border-t border-slate-100">
                            <span>Solde du jour : {FCFA.format(pt?.soldeJour || 0)} FCFA</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="recettes"
                    stroke="#2d6a4f"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradRecettes)"
                    name="Recettes"
                  />
                  <Area
                    type="monotone"
                    dataKey="depenses"
                    stroke="#b91c1c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradDepenses)"
                    name="Dépenses"
                  />
                </AreaChart>
              ) : (
                <AreaChart
                  data={pointsChronologiques}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTresorerie" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d2e80" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2d2e80" stopOpacity={0.0} />
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
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCompactAxis}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0]?.payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xs p-3 shadow-lg text-xs">
                          <p className="font-bold text-slate-800 mb-1">{pt?.date}</p>
                          <div className="flex items-center gap-2 text-blue-900 font-bold">
                            <span className="h-2 w-2 rounded-full bg-[#2d2e80]" />
                            <span>Trésorerie disponible : {FCFA.format(pt?.tresorerieCumulee || 0)} FCFA</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tresorerieCumulee"
                    stroke="#2d2e80"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradTresorerie)"
                    name="Trésorerie disponible"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Légende du graphique */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4">
                {modeCourbe === "FLUX" ? (
                  <>
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2d6a4f]" /> Recettes encaissées (FCFA)
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#b91c1c]" /> Dépenses décaissées (FCFA)
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2d2e80]" /> Solde cumulé de trésorerie disponible (FCFA)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Survolez les points pour afficher le détail à date
              </span>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            Aucun mouvement financier enregistré pour tracer la courbe chronologique.
          </div>
        )}
      </Card>

      {/* ── 5. COURBES D'ÉVOLUTION COMPARATIVE DES CENTRES (COMPOSANT OFFICIEL) ── */}
      <EvolutionPerformancesMultiCentres
        sessionActive={sessionCourante}
        centres={centres}
        apprenantsSession={apprenantsSession}
        entreesValides={entrees}
      />

      {/* ── 6. DEUX PANNEAUX COMPLÉMENTAIRES (RÉPARTITION PAR CATÉGORIE & COMPARAISON CENTRES) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PANNEAU A : Graphique de Répartition des Dépenses par Catégorie (Donut / Anneau SVG) */}
        <Card className="rounded-2xl border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="text-brand-orange" size={18} />
                <h2 className="text-sm font-bold text-slate-900">
                  Répartition des Dépenses par Catégorie
                </h2>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {FCFA.format(totalDepenses)} FCFA
              </span>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center gap-6">
              {/* Donut Recharts des dépenses */}
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <ResponsiveContainer width={144} height={144}>
                  <PieChart>
                    <Pie
                      data={
                        donneesDonutDepenses.length > 0
                          ? donneesDonutDepenses
                          : [{ name: "Aucune", valeur: 1, color: "#f1f5f9" }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={64}
                      paddingAngle={donneesDonutDepenses.length > 1 ? 3 : 0}
                      dataKey="valeur"
                      isAnimationActive={true}
                    >
                      {(donneesDonutDepenses.length > 0
                        ? donneesDonutDepenses
                        : [{ name: "Aucune", valeur: 1, color: "#f1f5f9" }]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => [
                        `${FCFA.format(typeof val === "number" ? val : 0)} FCFA`,
                        "Montant",
                      ]}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.75rem",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
                  <span className="text-xs font-black tabular-nums text-slate-900">
                    {formatCompactFCFA(totalDepenses)}
                  </span>
                </div>
              </div>

              {/* Détail analytique des 3 catégories */}
              <div className="flex-1 space-y-3.5 w-full">
                {/* Paie */}
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-700" />
                      Rémunérations & Paie
                    </span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {FCFA.format(ventilationDepenses.paie)} F ({ventilationDepenses.pctPaie}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-purple-700 rounded-full"
                      style={{ width: `${ventilationDepenses.pctPaie}%` }}
                    />
                  </div>
                </div>

                {/* Fonctionnement */}
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
                      Fonctionnement & Exploitation
                    </span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {FCFA.format(ventilationDepenses.fonctionnement)} F ({ventilationDepenses.pctFonctionnement}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-blue-700 rounded-full"
                      style={{ width: `${ventilationDepenses.pctFonctionnement}%` }}
                    />
                  </div>
                </div>

                {/* Achats */}
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                      Achats & Investissements
                    </span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {FCFA.format(ventilationDepenses.achats)} F ({ventilationDepenses.pctAchats}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-brand-orange rounded-full"
                      style={{ width: `${ventilationDepenses.pctAchats}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {sorties.length} écritures de sortie enregistrées
            </span>
            <Link
              href="/decaissements"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              <span>Consulter le registre des décaissements</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </Card>

        {/* PANNEAU B : Comparaison des Recettes par Centre (Graphique en barres) */}
        <Card className="rounded-2xl border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="text-brand-orange" size={18} />
                <h2 className="text-sm font-bold text-slate-900">
                  Comparaison des Recettes par Centre
                </h2>
              </div>
              <Link
                href="/analyse-centres"
                className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
              >
                <span>Analyse détaillée</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Barres comparatives de recettes */}
            <div className="mt-4 space-y-3">
              {syntheseCentres.slice(0, 5).map((c) => {
                const maxEncaisse = Math.max(...syntheseCentres.map((x) => x.encaisse), 1);
                const pctBar = Math.round((c.encaisse / maxEncaisse) * 100);

                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/centres/${c.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                          className="font-bold text-slate-900 hover:text-brand-orange transition-colors"
                        >
                          {c.nom}
                        </Link>
                        {c.ville && (
                          <span className="text-[10px] text-slate-400">• {c.ville}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-700 tabular-nums">
                          +{FCFA.format(c.encaisse)} F
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-semibold">{c.tauxRecouvrement}% recouvré</span>
                      </div>
                    </div>
                    {/* Barre de comparaison visuelle */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${pctBar}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{centres.length} centres dans le réseau</span>
            <Link
              href="/centres"
              className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900"
            >
              <span>Accéder à la liste des campus</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

      {modalSortieOuverte && (
        <SaisirSortieModal
          isOpen={modalSortieOuverte}
          onClose={() => setModalSortieOuverte(false)}
          centreId=""
          sessionId={sessionCourante?.id || ""}
        />
      )}
    </div>
  );
}
