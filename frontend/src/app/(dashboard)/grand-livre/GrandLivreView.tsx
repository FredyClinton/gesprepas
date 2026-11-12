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

import {
  Card,
  Button,
  Modal,
  Pagination,
  SkeletonTable,
  SortableHeader,
} from "@/shared/ui";
import { type SortDirection } from "@/shared/lib/sort-utils";
import { bornesPeriode, type PeriodeFiltre } from "@/shared/lib/periode";
import {
  chargerToutesLesPages,
  TAILLE_PAGE_LISTE,
} from "@/shared/lib/pagination";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { usePageParCriteres } from "@/shared/hooks/usePageParCriteres";
import {
  useCentres,
  useSessionActive,
  useSessions,
} from "@/modules/centres-sessions";
import {
  rechercherMouvementsFinanciers,
  useRechercheMouvementsFinanciers,
  useMotifs,
  RecuPaiementModal,
  type CriteresRechercheMouvements,
  type DonneesRecuPaiement,
  type LigneMouvementFinancier,
  type StatutMouvement,
  type TriMouvements,
} from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

type ColonneTri =
  | "date"
  | "ref"
  | "centre"
  | "tiers"
  | "motif"
  | "debit"
  | "credit"
  | "solde"
  | "statut";

const TRI_BACKEND: Record<ColonneTri, TriMouvements> = {
  date: "DATE",
  ref: "REF",
  centre: "CENTRE",
  tiers: "TIERS",
  motif: "MOTIF",
  debit: "DEBIT",
  credit: "CREDIT",
  solde: "SOLDE",
  statut: "STATUT",
};

type LigneGrandLivre = LigneMouvementFinancier & {
  debit: number;
  credit: number;
};

// Débit/crédit affichés : un mouvement rejeté ne compte ni en débit ni en crédit.
function versLigneGrandLivre(m: LigneMouvementFinancier): LigneGrandLivre {
  return {
    ...m,
    debit: m.type === "ENTREE" && m.statut !== "REJETE" ? m.montant : 0,
    credit: m.type === "SORTIE" && m.statut !== "REJETE" ? m.montant : 0,
  };
}

export function GrandLivreView() {
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive, isLoading: chargementSessionActive } =
    useSessionActive();
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<
    string | null
  >(null);

  const sessionCourante = useMemo(() => {
    if (sessionIdSelectionnee) {
      return (
        sessions.find((s) => s.id === sessionIdSelectionnee) ??
        sessionActive ??
        sessions[0]
      );
    }
    return sessionActive ?? sessions[0];
  }, [sessionIdSelectionnee, sessions, sessionActive]);

  const activeSessionId = sessionCourante?.id;

  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: motifs = [] } = useMotifs();

  // Filtres
  const [centreFiltre, setCentreFiltre] = useState<string>("TOUS");
  const [typeFiltre, setTypeFiltre] = useState<"TOUS" | "ENTREE" | "SORTIE">(
    "TOUS",
  );
  const [motifFiltre, setMotifFiltre] = useState<string>("TOUS");
  const [statutFiltre, setStatutFiltre] = useState<string>("TOUS");
  const [periode, setPeriode] = useState<PeriodeFiltre>("TOUS");
  const [dateSpecifique, setDateSpecifique] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [recherche, setRecherche] = useState("");

  // Pointage / Rapprochement (IDs des écritures pointées en mémoire locale)
  const [rapproches, setRapproches] = useState<Set<string>>(() => new Set());
  const [filtrePointage, setFiltrePointage] = useState<
    "TOUS" | "POINTE" | "NON_POINTE"
  >("TOUS");

  // Modale de reçu
  const [recuDonnees, setRecuDonnees] = useState<DonneesRecuPaiement | null>(
    null,
  );
  const [modalRecuOuverte, setModalRecuOuverte] = useState(false);

  // Tri
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

  // Toggle du pointage d'une ligne
  const togglePointage = (id: string) => {
    setRapproches((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  // Filtrage, tri, solde progressif et totaux calculés par le backend. Le solde
  // progressif porte sur toute la session : il ne dépend ni des filtres ni de la page.
  const rechercheStable = useDebouncedValue(recherche);
  const idsPointes = useMemo(() => Array.from(rapproches), [rapproches]);
  const criteres = useMemo<CriteresRechercheMouvements | undefined>(() => {
    if (!activeSessionId) return undefined;
    const bornes = bornesPeriode(periode, dateSpecifique);
    return {
      sessionId: activeSessionId,
      centreId: centreFiltre !== "TOUS" ? centreFiltre : undefined,
      type: typeFiltre !== "TOUS" ? typeFiltre : undefined,
      motifIds: motifFiltre !== "TOUS" ? [motifFiltre] : undefined,
      statut:
        statutFiltre !== "TOUS" ? (statutFiltre as StatutMouvement) : undefined,
      dateDebut: bornes.dateDebut,
      dateFin: bornes.dateFin,
      recherche: rechercheStable.trim() || undefined,
      pointage: filtrePointage,
      // Le pointage n'est envoyé que s'il filtre : cocher une ligne ne recharge pas la page sinon.
      idsPointes: filtrePointage !== "TOUS" ? idsPointes : undefined,
      tri: TRI_BACKEND[triColonne],
      sens: triDirection === "asc" ? "ASC" : "DESC",
    };
  }, [
    activeSessionId,
    centreFiltre,
    typeFiltre,
    motifFiltre,
    statutFiltre,
    periode,
    dateSpecifique,
    rechercheStable,
    filtrePointage,
    idsPointes,
    triColonne,
    triDirection,
  ]);

  const [page, setPage] = usePageParCriteres(JSON.stringify(criteres ?? null));
  const { data: resultat, isLoading: chargementMouvements } =
    useRechercheMouvementsFinanciers(criteres, page - 1, TAILLE_PAGE_LISTE);

  // Nombre d'écritures pointées dans la sélection filtrée (compte seul, page de 1).
  const criteresPointes = useMemo<CriteresRechercheMouvements | undefined>(
    () =>
      criteres && idsPointes.length > 0 && filtrePointage !== "NON_POINTE"
        ? { ...criteres, pointage: "POINTE", idsPointes }
        : undefined,
    [criteres, idsPointes, filtrePointage],
  );
  const { data: resultatPointes } = useRechercheMouvementsFinanciers(
    criteresPointes,
    0,
    1,
  );

  const mouvementsPage = useMemo(
    () => (resultat?.page.contenu ?? []).map(versLigneGrandLivre),
    [resultat],
  );
  const nbMouvementsFiltres = resultat?.page.totalElements ?? 0;
  const totalPages = Math.max(1, resultat?.page.totalPages ?? 1);
  const totalDebits = resultat?.totalEntrees ?? 0;
  const totalCredits = resultat?.totalSorties ?? 0;
  const soldeNetSelection = totalDebits - totalCredits;
  const nbLignesPointees = criteresPointes
    ? (resultatPointes?.page.totalElements ?? 0)
    : 0;
  const [exportEnCours, setExportEnCours] = useState(false);

  // Fonction d'export CSV
  const exporterCsv = async () => {
    if (!criteres) return;
    setExportEnCours(true);
    let toutes: LigneGrandLivre[];
    try {
      toutes = (
        await chargerToutesLesPages((p, t) =>
          rechercherMouvementsFinanciers(criteres, p, t).then((r) => r.page),
        )
      ).map(versLigneGrandLivre);
    } finally {
      setExportEnCours(false);
    }

    const lignesCsv: string[] = [];
    lignesCsv.push(
      "Date;Reference;Centre;Type;Motif;Tiers;Debit_FCFA;Credit_FCFA;Solde_Progressif_FCFA;Statut;Pointe",
    );

    toutes.forEach((m) => {
      const dateStr = m.date || "";
      const refStr = m.id || "";
      const centreStr = m.centreId
        ? mapCentres.get(m.centreId) || "Centre"
        : "National";
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
    link.setAttribute(
      "download",
      `Grand_Livre_EXCELIS_${sessionCourante?.annee || "Session"}_${dateJour}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ouvrir le reçu pour une entrée
  const ouvrirRecu = (m: LigneGrandLivre) => {
    if (m.type !== "ENTREE") return;
    const centre = centres.find((c) => c.id === m.centreId);
    setRecuDonnees({
      id: m.id,
      date: m.date,
      montant: m.montant,
      motif: mapMotifs.get(m.motifId) || "Versement scolarité",
      nomApprenant: m.apprenantId
        ? m.tiers
        : m.details || m.livreTitre || "Externe",
      nomCentre: centre?.nom || "Centre EXCELIS PRÉPAS",
      nomFormation: "Prépa Concours",
      nomCaissier: "Caisse",
    });
    setModalRecuOuverte(true);
  };

  const chargement =
    chargementSessions || chargementCentres || chargementMouvements;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── 1. EN-TÊTE OPÉRATIONNEL ERP ── */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Grand Livre & Trésorerie
            </h1>
            {sessionCourante && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-slate-500" />
                Session {sessionCourante.annee}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500">
            Journal continu des écritures consolidées, solde progressif et
            pointage de rapprochement bancaire.
          </p>
        </div>

        {/* Boutons d'export et sélection de session */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={exporterCsv}
            disabled={nbMouvementsFiltres === 0 || exportEnCours}
            className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs"
          >
            <Download size={13} />
            <span>Exporter CSV</span>
          </Button>

          <div className="relative">
            <select
              value={activeSessionId || ""}
              onChange={(e) => setSessionIdSelectionnee(e.target.value)}
              className="focus:border-brand-orange cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pr-8 pl-3 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:outline-none"
              aria-label="Sélectionner la session académique"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.annee}{" "}
                  {s.statut === "EN_COURS"
                    ? "(En cours)"
                    : `(${s.statut.toLowerCase()})`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* ── 2. SYNTHÈSE COMPTABLE HORIZONTALE ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Débits (Encaissements) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
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
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Recettes réelles sur la sélection
            </p>
          </div>
        </div>

        {/* Crédits (Décaissements) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
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
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Dépenses réelles sur la sélection
            </p>
          </div>
        </div>

        {/* Solde Net Consolidé */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Solde Net Consolidé
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Scale className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div
              className={`text-xl font-bold tracking-tight tabular-nums ${soldeNetSelection >= 0 ? "text-slate-900" : "text-rose-700"}`}
            >
              {FCFA.format(soldeNetSelection)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Équilibre Débits – Crédits
            </p>
          </div>
        </div>

        {/* Pointage & Rapprochement */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Pointage Bancaire
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <CheckSquare className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-purple-700 tabular-nums">
              {nbLignesPointees} / {nbMouvementsFiltres}
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Écritures pointées avec le relevé
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. BARRE DE FILTRES COMPTABLES ── */}
      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Période pills */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="mr-1 flex items-center gap-1 font-semibold text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Période :
            </span>
            {(["TOUS", "AUJOURDHUI", "HIER", "7_JOURS", "MOIS"] as const).map(
              (p) => {
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
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-brand-orange font-semibold text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    {labelMap[p]}
                  </button>
                );
              },
            )}

            {periode === "DATE_SPECIFIQUE" ? (
              <input
                type="date"
                value={dateSpecifique}
                onChange={(e) => setDateSpecifique(e.target.value)}
                className="border-brand-orange focus:ring-brand-orange rounded-md border bg-white px-2 py-0.5 text-xs font-medium text-slate-900 focus:ring-1 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPeriode("DATE_SPECIFIQUE")}
                className="cursor-pointer rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              >
                Date précise...
              </button>
            )}
          </div>

          {/* Recherche */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tiers, motif, référence..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="focus:border-brand-orange focus:ring-brand-orange w-full rounded-md border border-slate-200 bg-slate-50 py-1 pr-2.5 pl-8 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Ligne 2 : Type (Flux), Centre, Statut, Pointage */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-xs">
          {/* Flux */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Flux :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 font-medium">
              <button
                type="button"
                onClick={() => setTypeFiltre("TOUS")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  typeFiltre === "TOUS"
                    ? "bg-white font-semibold text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setTypeFiltre("ENTREE")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  typeFiltre === "ENTREE"
                    ? "bg-white font-semibold text-emerald-800 shadow-2xs"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
              >
                Débits (+)
              </button>
              <button
                type="button"
                onClick={() => setTypeFiltre("SORTIE")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  typeFiltre === "SORTIE"
                    ? "bg-white font-semibold text-rose-800 shadow-2xs"
                    : "text-slate-500 hover:text-rose-800"
                }`}
              >
                Crédits (-)
              </button>
            </div>
          </div>

          {/* Centre */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Centre :</span>
            <select
              value={centreFiltre}
              onChange={(e) => setCentreFiltre(e.target.value)}
              className="focus:border-brand-orange rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
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
            <span className="font-medium text-slate-500">Rapprochement :</span>
            <select
              value={filtrePointage}
              onChange={(e) =>
                setFiltrePointage(e.target.value as typeof filtrePointage)
              }
              className="focus:border-brand-orange rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="TOUS">Toutes les écritures</option>
              <option value="POINTE">Pointées uniquement</option>
              <option value="NON_POINTE">Non pointées</option>
            </select>
          </div>

          <div className="ml-auto text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{nbMouvementsFiltres}</span>{" "}
              écriture{nbMouvementsFiltres > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TABLEAU DU GRAND LIVRE (ÉCRITURES CONTINUES) ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Scale className="text-brand-orange" size={16} />
              <span>Journal Général des Écritures</span>
            </h2>
            <p className="text-xs text-slate-500">
              Mouvements financiers continus avec calcul du solde progressif et
              pointage bancaire.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-5">
            <SkeletonTable rows={8} />
          </div>
        ) : mouvementsPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-xs text-slate-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Scale size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">
              Aucune écriture trouvée
            </h3>
            <p className="max-w-sm font-medium text-slate-500">
              Aucun mouvement ne correspond aux filtres de période ou critères
              sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                <tr>
                  <th className="w-8 px-3 py-3.5 text-center">Pt.</th>
                  <SortableHeader
                    columnKey="date"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-3 py-3.5"
                  >
                    Date
                  </SortableHeader>
                  <SortableHeader
                    columnKey="centre"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-3 py-3.5"
                  >
                    Centre
                  </SortableHeader>
                  <SortableHeader
                    columnKey="tiers"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-3 py-3.5"
                  >
                    Tiers (Élève / Bénéficiaire)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="motif"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-3 py-3.5"
                  >
                    Motif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="debit"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="px-3 py-3.5 text-right"
                  >
                    Débit (Entrée)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="credit"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="px-3 py-3.5 text-right"
                  >
                    Crédit (Sortie)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="solde"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="px-3 py-3.5 text-right"
                  >
                    Solde Progressif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="statut"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="px-3 py-3.5 text-center"
                  >
                    Statut
                  </SortableHeader>
                  <th className="px-3 py-3.5 text-center font-bold text-slate-700">
                    Pièce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mouvementsPage.map((m) => {
                  const estPointe = rapproches.has(m.id);
                  const nomMotif = mapMotifs.get(m.motifId) || "Opération";
                  const nomCentre = m.centreId
                    ? mapCentres.get(m.centreId) || "Centre"
                    : "National";
                  const dateStr = m.date ? m.date.split("T")[0] : "-";

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${estPointe ? "bg-purple-50/30 hover:bg-purple-50/50" : "hover:bg-slate-50/80"}`}
                    >
                      {/* Checkbox pointage */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePointage(m.id)}
                          className="cursor-pointer text-slate-400 transition-colors hover:text-purple-700"
                          title={
                            estPointe
                              ? "Dépointer cette écriture"
                              : "Pointer cette écriture (rapprochement)"
                          }
                        >
                          {estPointe ? (
                            <CheckSquare
                              size={15}
                              className="stroke-[2.5] text-purple-700"
                            />
                          ) : (
                            <Square size={15} className="text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-semibold whitespace-nowrap text-slate-900">
                        {dateStr}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-slate-900">
                          {nomCentre}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {m.tiers}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{nomMotif}</td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-700 tabular-nums">
                        {m.debit > 0 ? `+${FCFA.format(m.debit)} F` : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-rose-700 tabular-nums">
                        {m.credit > 0 ? `-${FCFA.format(m.credit)} F` : "-"}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-bold tabular-nums ${m.soldeProgressif >= 0 ? "text-slate-900" : "text-rose-700"}`}
                      >
                        {FCFA.format(m.soldeProgressif)} F
                      </td>
                      <td className="px-3 py-3 text-center">
                        {m.statut === "VALIDE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Validé
                          </span>
                        ) : m.statut === "EN_ATTENTE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            À viser
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            Rejeté
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
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
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={nbMouvementsFiltres}
              pageSize={TAILLE_PAGE_LISTE}
              onChange={setPage}
              label="écriture"
            />
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
