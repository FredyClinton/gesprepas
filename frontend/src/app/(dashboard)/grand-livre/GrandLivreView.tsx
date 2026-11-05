"use client";

import { useMemo, useState } from "react";
import {
  Scale,
  Download,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  CheckSquare,
  Square,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";

import { Card, Button, Modal, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import { useCentres, useSessionActive, useSessions } from "@/modules/centres-sessions";
import { useApprenants } from "@/modules/apprenants";
import {
  useMouvementsFinanciers,
  useMotifs,
  RecuPaiementModal,
  type MouvementFinancier,
  type DonneesRecuPaiement,
} from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

type PeriodeFiltre = "AUJOURDHUI" | "HIER" | "7_JOURS" | "MOIS" | "DATE_SPECIFIQUE" | "TOUS";

export function GrandLivreView() {
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive, isLoading: chargementSessionActive } = useSessionActive();
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<string | null>(null);

  const sessionCourante = useMemo(() => {
    if (sessionIdSelectionnee) {
      return sessions.find((s) => s.id === sessionIdSelectionnee) ?? sessionActive ?? sessions[0];
    }
    return sessionActive ?? sessions[0];
  }, [sessionIdSelectionnee, sessions, sessionActive]);

  const activeSessionId = sessionCourante?.id;

  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: motifs = [] } = useMotifs();
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(activeSessionId);

  // Filtres
  const [centreFiltre, setCentreFiltre] = useState<string>("TOUS");
  const [typeFiltre, setTypeFiltre] = useState<"TOUS" | "ENTREE" | "SORTIE">("TOUS");
  const [motifFiltre, setMotifFiltre] = useState<string>("TOUS");
  const [statutFiltre, setStatutFiltre] = useState<string>("TOUS");
  const [periode, setPeriode] = useState<PeriodeFiltre>("TOUS");
  const [dateSpecifique, setDateSpecifique] = useState(new Date().toISOString().split("T")[0]);
  const [recherche, setRecherche] = useState("");

  // Pointage / Rapprochement (IDs des écritures pointées en mémoire locale)
  const [rapproches, setRapproches] = useState<Set<string>>(() => new Set());
  const [filtrePointage, setFiltrePointage] = useState<"TOUS" | "POINTE" | "NON_POINTE">("TOUS");

  // Modale de reçu
  const [recuDonnees, setRecuDonnees] = useState<DonneesRecuPaiement | null>(null);
  const [modalRecuOuverte, setModalRecuOuverte] = useState(false);

  // Tri
  type ColonneTri = "date" | "ref" | "centre" | "tiers" | "motif" | "debit" | "credit" | "solde" | "statut";
  const [triColonne, setTriColonne] = useState<ColonneTri>("date");
  const [triDirection, setTriDirection] = useState<SortDirection>("asc"); // Chronologique par défaut pour le grand livre

  function handleTri(colonne: ColonneTri) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
  }

  // Dictionnaires
  const mapMotifs = useMemo(() => {
    const map = new Map<string, string>();
    motifs.forEach((m) => map.set(m.id, m.nom));
    return map;
  }, [motifs]);

  const mapCentres = useMemo(() => {
    const map = new Map<string, string>();
    centres.forEach((c) => map.set(c.id, `${c.nom} (${c.villeActuelle})`));
    return map;
  }, [centres]);

  const mapApprenants = useMemo(() => {
    const map = new Map<string, string>();
    apprenants.forEach((a) => map.set(a.id, `${a.nom} ${a.prenom}`));
    return map;
  }, [apprenants]);

  // Toggle du pointage d'une ligne
  const togglePointage = (id: string) => {
    setRapproches((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  // 1. Calcul du solde progressif cumulé au fil de l'eau
  const mouvementsAvecSolde = useMemo(() => {
    const chronologique = [...mouvements].sort((a, b) => compareDates(a.date, b.date));

    let soldeCumule = 0;
    return chronologique.map((m) => {
      const debit = m.type === "ENTREE" && m.statut !== "REJETE" ? m.montant : 0;
      const credit = m.type === "SORTIE" && m.statut !== "REJETE" ? m.montant : 0;
      soldeCumule += debit - credit;

      const tiers = m.apprenantId
        ? mapApprenants.get(m.apprenantId) || "Apprenant"
        : m.ordonnateur || "Divers";

      return {
        ...m,
        debit,
        credit,
        soldeProgressif: soldeCumule,
        tiers,
      };
    });
  }, [mouvements, mapApprenants]);

  // 2. Filtrage des écritures
  const mouvementsFiltres = useMemo(() => {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);

    const septJoursAvant = new Date(aujourdhui);
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    const premierDuMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

    return mouvementsAvecSolde.filter((m) => {
      if (typeFiltre !== "TOUS" && m.type !== typeFiltre) return false;
      if (centreFiltre !== "TOUS" && m.centreId !== centreFiltre) return false;
      if (motifFiltre !== "TOUS" && m.motifId !== motifFiltre) return false;
      if (statutFiltre !== "TOUS" && m.statut !== statutFiltre) return false;

      const isPointe = rapproches.has(m.id);
      if (filtrePointage === "POINTE" && !isPointe) return false;
      if (filtrePointage === "NON_POINTE" && isPointe) return false;

      const dIso = m.date ? m.date.split("T")[0] : "";
      const dateMvt = new Date(m.date);
      dateMvt.setHours(0, 0, 0, 0);

      if (periode === "AUJOURDHUI") {
        if (dIso !== new Date().toISOString().split("T")[0]) return false;
      } else if (periode === "HIER") {
        if (dIso !== hier.toISOString().split("T")[0]) return false;
      } else if (periode === "7_JOURS") {
        if (dateMvt < septJoursAvant) return false;
      } else if (periode === "MOIS") {
        if (dateMvt < premierDuMois) return false;
      } else if (periode === "DATE_SPECIFIQUE") {
        if (dIso !== dateSpecifique) return false;
      }

      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const tiers = (m.tiers || "").toLowerCase();
        const motif = (mapMotifs.get(m.motifId) || "").toLowerCase();
        const ref = (m.id || "").toLowerCase();
        const centre = (mapCentres.get(m.centreId || "") || "").toLowerCase();
        const match = tiers.includes(q) || motif.includes(q) || ref.includes(q) || centre.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    mouvementsAvecSolde,
    typeFiltre,
    centreFiltre,
    motifFiltre,
    statutFiltre,
    filtrePointage,
    periode,
    dateSpecifique,
    recherche,
    rapproches,
    mapMotifs,
    mapCentres,
  ]);

  // 3. Appliquer le tri sélectionné par l'utilisateur
  const mouvementsTries = useMemo(() => {
    return [...mouvementsFiltres].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "date") cmp = compareDates(a.date, b.date);
      else if (triColonne === "ref") cmp = compareStrings(a.id, b.id);
      else if (triColonne === "centre") {
        const cA = a.centreId ? mapCentres.get(a.centreId) || "" : "National";
        const cB = b.centreId ? mapCentres.get(b.centreId) || "" : "National";
        cmp = compareStrings(cA, cB);
      } else if (triColonne === "tiers") cmp = compareStrings(a.tiers, b.tiers);
      else if (triColonne === "motif") {
        const mA = mapMotifs.get(a.motifId) || "";
        const mB = mapMotifs.get(b.motifId) || "";
        cmp = compareStrings(mA, mB);
      } else if (triColonne === "debit") cmp = compareNumbers(a.debit, b.debit);
      else if (triColonne === "credit") cmp = compareNumbers(a.credit, b.credit);
      else if (triColonne === "solde") cmp = compareNumbers(a.soldeProgressif, b.soldeProgressif);
      else if (triColonne === "statut") cmp = compareStrings(a.statut, b.statut);
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [mouvementsFiltres, triColonne, triDirection, mapCentres, mapMotifs]);

  // Totaux statistiques sur la sélection
  const totalDebits = useMemo(() => {
    return mouvementsFiltres.reduce((acc, m) => acc + m.debit, 0);
  }, [mouvementsFiltres]);

  const totalCredits = useMemo(() => {
    return mouvementsFiltres.reduce((acc, m) => acc + m.credit, 0);
  }, [mouvementsFiltres]);

  const soldeNetSelection = totalDebits - totalCredits;

  const nbLignesPointees = useMemo(() => {
    return mouvementsFiltres.filter((m) => rapproches.has(m.id)).length;
  }, [mouvementsFiltres, rapproches]);

  // Fonction d'export CSV
  const exporterCsv = () => {
    const lignesCsv: string[] = [];
    lignesCsv.push("Date;Reference;Centre;Type;Motif;Tiers;Debit_FCFA;Credit_FCFA;Solde_Progressif_FCFA;Statut;Pointe");

    mouvementsTries.forEach((m) => {
      const dateStr = m.date || "";
      const refStr = m.id || "";
      const centreStr = m.centreId ? mapCentres.get(m.centreId) || "Centre" : "National";
      const typeStr = m.type;
      const motifStr = mapMotifs.get(m.motifId) || "";
      const tiersStr = (m.tiers || "").replace(/;/g, ",");
      const debitStr = m.debit.toString();
      const creditStr = m.credit.toString();
      const soldeStr = m.soldeProgressif.toString();
      const statutStr = m.statut;
      const pointeStr = rapproches.has(m.id) ? "OUI" : "NON";

      lignesCsv.push(
        `"${dateStr}";"${refStr}";"${centreStr}";"${typeStr}";"${motifStr}";"${tiersStr}";${debitStr};${creditStr};${soldeStr};"${statutStr}";"${pointeStr}"`,
      );
    });

    const contenuCsv = "\uFEFF" + lignesCsv.join("\r\n");
    const blob = new Blob([contenuCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateJour = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Grand_Livre_EXCELIS_${sessionCourante?.annee || "Session"}_${dateJour}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ouvrir le reçu pour une entrée
  const ouvrirRecu = (m: (typeof mouvementsAvecSolde)[0]) => {
    if (m.type !== "ENTREE") return;
    const eleve = apprenants.find((a) => a.id === m.apprenantId);
    const centre = centres.find((c) => c.id === m.centreId);
    setRecuDonnees({
      id: m.id,
      date: m.date,
      montant: m.montant,
      motif: mapMotifs.get(m.motifId) || "Versement scolarité",
      nomApprenant: eleve ? `${eleve.nom} ${eleve.prenom}` : m.livreTitre || "Externe",
      nomCentre: centre?.nom || "Centre EXCELIS PRÉPAS",
      nomFormation: "Prépa Concours",
      nomCaissier: "Caisse",
    });
    setModalRecuOuverte(true);
  };

  const chargement = chargementSessions || chargementCentres || chargementMouvements;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── 1. EN-TÊTE OPÉRATIONNEL ERP ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Grand Livre & Trésorerie
            </h1>
            {sessionCourante && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-slate-500" />
                Session {sessionCourante.annee}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Journal continu des écritures consolidées, solde progressif et pointage de rapprochement bancaire.
          </p>
        </div>

        {/* Boutons d'export et sélection de session */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={exporterCsv}
            disabled={mouvementsTries.length === 0}
            className="text-xs font-bold py-1.5 px-3 rounded-xl shadow-2xs cursor-pointer"
          >
            <Download size={13} />
            <span>Exporter CSV</span>
          </Button>

          <div className="relative">
            <select
              value={activeSessionId || ""}
              onChange={(e) => setSessionIdSelectionnee(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:border-brand-orange focus:outline-none cursor-pointer"
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
        </div>
      </div>

      {/* ── 2. SYNTHÈSE COMPTABLE HORIZONTALE ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Débits (Encaissements) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Débits (Encaissements)
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-emerald-700 tabular-nums">
              +{FCFA.format(totalDebits)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Recettes réelles sur la sélection
            </p>
          </div>
        </div>

        {/* Crédits (Décaissements) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Crédits (Décaissements)
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-rose-700 tabular-nums">
              -{FCFA.format(totalCredits)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Dépenses réelles sur la sélection
            </p>
          </div>
        </div>

        {/* Solde Net Consolidé */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Solde Net Consolidé
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Scale className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className={`text-xl font-bold tracking-tight tabular-nums ${soldeNetSelection >= 0 ? "text-slate-900" : "text-rose-700"}`}>
              {FCFA.format(soldeNetSelection)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Équilibre Débits – Crédits
            </p>
          </div>
        </div>

        {/* Pointage & Rapprochement */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pointage Bancaire
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <CheckSquare className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-purple-700 tabular-nums">
              {nbLignesPointees} / {mouvementsFiltres.length}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Écritures pointées avec le relevé
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. BARRE DE FILTRES COMPTABLES ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Période pills */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Période :
            </span>
            {(["TOUS", "AUJOURDHUI", "HIER", "7_JOURS", "MOIS"] as const).map((p) => {
              const labelMap: Record<string, string> = {
                TOUS: "Tout",
                AUJOURDHUI: "Aujourd'hui",
                HIER: "Hier",
                "7_JOURS": "7 derniers jours",
                MOIS: "Ce mois",
              };
              const active = periode === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriode(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-orange text-white font-semibold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}

            {periode === "DATE_SPECIFIQUE" ? (
              <input
                type="date"
                value={dateSpecifique}
                onChange={(e) => setDateSpecifique(e.target.value)}
                className="rounded-md border border-brand-orange bg-white px-2 py-0.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPeriode("DATE_SPECIFIQUE")}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 cursor-pointer"
              >
                Date précise...
              </button>
            )}
          </div>

          {/* Recherche */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tiers, motif, référence..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        {/* Ligne 2 : Type (Flux), Centre, Statut, Pointage */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Flux */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Flux :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 font-medium">
              <button
                type="button"
                onClick={() => setTypeFiltre("TOUS")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  typeFiltre === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setTypeFiltre("ENTREE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  typeFiltre === "ENTREE"
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
              >
                Débits (+)
              </button>
              <button
                type="button"
                onClick={() => setTypeFiltre("SORTIE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  typeFiltre === "SORTIE"
                    ? "bg-white text-rose-800 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-rose-800"
                }`}
              >
                Crédits (-)
              </button>
            </div>
          </div>

          {/* Centre */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Centre :</span>
            <select
              value={centreFiltre}
              onChange={(e) => setCentreFiltre(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange focus:outline-none px-2.5 py-1 text-xs text-slate-900 font-medium"
            >
              <option value="TOUS">Tous les centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.villeActuelle})
                </option>
              ))}
            </select>
          </div>

          {/* Pointage */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Rapprochement :</span>
            <select
              value={filtrePointage}
              onChange={(e) => setFiltrePointage(e.target.value as typeof filtrePointage)}
              className="rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange focus:outline-none px-2.5 py-1 text-xs text-slate-900 font-medium"
            >
              <option value="TOUS">Toutes les écritures</option>
              <option value="POINTE">Pointées uniquement</option>
              <option value="NON_POINTE">Non pointées</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{mouvementsFiltres.length}</span> écriture{mouvementsFiltres.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TABLEAU DU GRAND LIVRE (ÉCRITURES CONTINUES) ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="text-brand-orange" size={16} />
              <span>Journal Général des Écritures</span>
            </h2>
            <p className="text-xs text-slate-500">
              Mouvements financiers continus avec calcul du solde progressif et pointage bancaire.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-5">
            <SkeletonTable rows={8} />
          </div>
        ) : mouvementsTries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Scale size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">Aucune écriture trouvée</h3>
            <p className="font-medium text-slate-500 max-w-sm">
              Aucun mouvement ne correspond aux filtres de période ou critères sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
                <tr>
                  <th className="py-3.5 px-3 w-8 text-center">Pt.</th>
                  <SortableHeader
                    columnKey="date"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-3"
                  >
                    Date
                  </SortableHeader>
                  <SortableHeader
                    columnKey="centre"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-3"
                  >
                    Centre
                  </SortableHeader>
                  <SortableHeader
                    columnKey="tiers"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-3"
                  >
                    Tiers (Élève / Bénéficiaire)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="motif"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-3"
                  >
                    Motif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="debit"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-3 text-right"
                  >
                    Débit (Entrée)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="credit"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-3 text-right"
                  >
                    Crédit (Sortie)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="solde"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-3 text-right"
                  >
                    Solde Progressif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="statut"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-3 text-center"
                  >
                    Statut
                  </SortableHeader>
                  <th className="py-3.5 px-3 text-center text-slate-700 font-bold">Pièce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mouvementsTries.map((m) => {
                  const estPointe = rapproches.has(m.id);
                  const nomMotif = mapMotifs.get(m.motifId) || "Opération";
                  const nomCentre = m.centreId ? mapCentres.get(m.centreId) || "Centre" : "National";
                  const dateStr = m.date ? m.date.split("T")[0] : "-";

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${estPointe ? "bg-purple-50/30 hover:bg-purple-50/50" : "hover:bg-slate-50/80"}`}
                    >
                      {/* Checkbox pointage */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePointage(m.id)}
                          className="cursor-pointer text-slate-400 hover:text-purple-700 transition-colors"
                          title={estPointe ? "Dépointer cette écriture" : "Pointer cette écriture (rapprochement)"}
                        >
                          {estPointe ? (
                            <CheckSquare size={15} className="text-purple-700 stroke-[2.5]" />
                          ) : (
                            <Square size={15} className="text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{nomCentre}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {m.tiers}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {nomMotif}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700 tabular-nums">
                        {m.debit > 0 ? `+${FCFA.format(m.debit)} F` : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-rose-700 tabular-nums">
                        {m.credit > 0 ? `-${FCFA.format(m.credit)} F` : "-"}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold tabular-nums ${m.soldeProgressif >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                        {FCFA.format(m.soldeProgressif)} F
                      </td>
                      <td className="py-3 px-3 text-center">
                        {m.statut === "VALIDE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            Validé
                          </span>
                        ) : m.statut === "EN_ATTENTE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                            À viser
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                            Rejeté
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {m.type === "ENTREE" ? (
                          <Button
                            variant="secondary"
                            onClick={() => ouvrirRecu(m)}
                            className="h-7 px-2 text-xs font-semibold"
                            title="Consulter le reçu officiel"
                          >
                            <Eye size={13} className="text-slate-500" />
                          </Button>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. MODALE DE REÇU OFFICIEL ── */}
      {modalRecuOuverte && recuDonnees && (
        <RecuPaiementModal
          isOpen={modalRecuOuverte}
          onClose={() => {
            setModalRecuOuverte(false);
            setRecuDonnees(null);
          }}
          recu={recuDonnees}
        />
      )}
    </div>
  );
}
