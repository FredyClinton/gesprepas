"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Coins,
  TrendingUp,
  Search,
  Calendar,
  Building2,
  Printer,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  X,
} from "lucide-react";
import { Card, Button, Modal, SkeletonCard, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import { useApprenants } from "@/modules/apprenants";
import { useFormations } from "@/modules/academique";
import {
  useMouvementsFinanciers,
  useMotifs,
  useSupprimerEntree,
  useBilanDuJour,
  EnregistrerVersementModal,
  ModifierVersementModal,
  SaisirSortieModal,
  RecuPaiementModal,
  FicheBilanPrintModal,
  type VersementItem,
  type DonneesRecuPaiement,
} from "@/modules/financier";
import { useSession } from "next-auth/react";

const FCFA = new Intl.NumberFormat("fr-FR");

function getInitiales(prenom?: string, nom?: string) {
  const p = prenom?.charAt(0) || "";
  const n = nom?.charAt(0) || "";
  return (p + n).toUpperCase() || "EL";
}

type PeriodeFiltre = "AUJOURDHUI" | "HIER" | "7_JOURS" | "MOIS" | "DATE_SPECIFIQUE" | "TOUS";

export function FinancesCaissierView({ centreId }: { centreId: string }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const peutEncaisser = userRole === "CAISSIER";
  const peutModifierMouvement = userRole === "CAISSIER";

  // État filtres
  const [periode, setPeriode] = useState<PeriodeFiltre>("AUJOURDHUI");
  const [dateSpecifique, setDateSpecifique] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [filtreType, setFiltreType] = useState<"TOUS" | "ENTREE" | "SORTIE">("TOUS");
  const [filtreMotif, setFiltreMotif] = useState<string>("TOUS");
  const [recherche, setRecherche] = useState("");

  // Modals
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [modalSortieOuverte, setModalSortieOuverte] = useState(false);
  const [versementAModifier, setVersementAModifier] = useState<VersementItem | null>(null);
  const [versementASupprimer, setVersementASupprimer] = useState<{
    id: string;
    montant: number;
    libelle: string;
    date: string;
  } | null>(null);

  // Reçu & Fiche de Bilan
  const [recuSelectionne, setRecuSelectionne] = useState<DonneesRecuPaiement | null>(null);
  const [modalRecuOuverte, setModalRecuOuverte] = useState(false);
  const [modalBilanOuvert, setModalBilanOuvert] = useState(false);

  // Données
  const { data: centres = [] } = useCentres();
  const { data: sessionActive, isLoading: chargementSession } = useSessionActive();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [] } = useFormations();
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(
    sessionActive?.id,
    centreId,
  );
  const { data: motifs = [] } = useMotifs();
  const { data: bilan } = useBilanDuJour(centreId, sessionActive?.id);

  const supprimerEntreeMutation = useSupprimerEntree();
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  const centreCourant = useMemo(
    () => centres.find((c) => c.id === centreId),
    [centres, centreId],
  );

  const dateAujourdhuiIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Tri des écritures de caisse
  type ColonneTriMouvements = "date" | "tiers" | "type" | "motif" | "montant" | "statut";
  const [triColonne, setTriColonne] = useState<ColonneTriMouvements>("date");
  const [triDirection, setTriDirection] = useState<SortDirection>("desc");

  function handleTri(colonne: ColonneTriMouvements) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
  }

  // Filtrage temporel et critères
  const mouvementsFiltres = useMemo(() => {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);

    const septJoursAvant = new Date(aujourdhui);
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    const premierDuMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

    const list = mouvements.filter((m) => {
      if (filtreType !== "TOUS" && m.type !== filtreType) return false;
      if (filtreMotif !== "TOUS" && m.motifId !== filtreMotif) return false;

      const dateMvtStr = (m.date || "").split("T")[0];
      const dateMvt = new Date(dateMvtStr);
      dateMvt.setHours(0, 0, 0, 0);

      if (periode === "AUJOURDHUI") {
        if (dateMvtStr !== dateAujourdhuiIso) return false;
      } else if (periode === "HIER") {
        const hierStr = hier.toISOString().split("T")[0];
        if (dateMvtStr !== hierStr) return false;
      } else if (periode === "7_JOURS") {
        if (dateMvt < septJoursAvant) return false;
      } else if (periode === "MOIS") {
        if (dateMvt < premierDuMois) return false;
      } else if (periode === "DATE_SPECIFIQUE") {
        if (dateMvtStr !== dateSpecifique) return false;
      }

      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const motif = motifs.find((x) => x.id === m.motifId)?.nom || "";
        const app = apprenants.find((a) => a.id === m.apprenantId);
        const nomApp = app ? `${app.nom} ${app.prenom}` : "";
        const ord = m.ordonnateur || "";

        const match =
          motif.toLowerCase().includes(q) ||
          nomApp.toLowerCase().includes(q) ||
          ord.toLowerCase().includes(q) ||
          m.montant.toString().includes(q);

        if (!match) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "date") {
        cmp = compareDates(a.date, b.date);
      } else if (triColonne === "tiers") {
        const appA = apprenants.find((x) => x.id === a.apprenantId);
        const appB = apprenants.find((x) => x.id === b.apprenantId);
        const nomA = appA ? `${appA.nom} ${appA.prenom}` : a.ordonnateur || "";
        const nomB = appB ? `${appB.nom} ${appB.prenom}` : b.ordonnateur || "";
        cmp = compareStrings(nomA, nomB);
      } else if (triColonne === "type") {
        cmp = compareStrings(a.type, b.type);
      } else if (triColonne === "motif") {
        const motifA = motifs.find((x) => x.id === a.motifId)?.nom || "";
        const motifB = motifs.find((x) => x.id === b.motifId)?.nom || "";
        cmp = compareStrings(motifA, motifB);
      } else if (triColonne === "montant") {
        cmp = compareNumbers(a.montant, b.montant);
      } else if (triColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [
    mouvements,
    filtreType,
    filtreMotif,
    periode,
    dateSpecifique,
    dateAujourdhuiIso,
    recherche,
    motifs,
    apprenants,
    triColonne,
    triDirection,
  ]);

  // Totaux de la période filtrée
  const { totalEntrees, totalSorties, soldeNet, countEntrees, countSorties } = useMemo(() => {
    let entrees = 0;
    let sorties = 0;
    let nbE = 0;
    let nbS = 0;

    mouvementsFiltres.forEach((m) => {
      if (m.statut !== "REJETE") {
        if (m.type === "ENTREE") {
          entrees += m.montant;
          nbE++;
        } else if (m.type === "SORTIE") {
          sorties += m.montant;
          nbS++;
        }
      }
    });

    return {
      totalEntrees: entrees,
      totalSorties: sorties,
      soldeNet: entrees - sorties,
      countEntrees: nbE,
      countSorties: nbS,
    };
  }, [mouvementsFiltres]);



  // Ouverture du reçu de versement
  const ouvrirRecu = (m: (typeof mouvements)[0]) => {
    const motifLibelle = motifs.find((x) => x.id === m.motifId)?.nom || "Versement";
    const app = apprenants.find((a) => a.id === m.apprenantId);
    const nomApp = app ? `${app.nom} ${app.prenom}` : "Apprenant";
    const formationNom =
      formations.find((f) => f.id === (m.formationId || app?.formationId))?.nom || "";

    const isLivre =
      m.motifId === "00000000-0000-0000-0000-000000000012" ||
      motifLibelle.toLowerCase().includes("livre");

    const totalVerseApp = mouvements
      .filter((x) => x.type === "ENTREE" && x.statut !== "REJETE" && x.apprenantId === m.apprenantId)
      .reduce((s, x) => s + x.montant, 0);

    const reliquat = app?.montantContrat
      ? Math.max(0, app.montantContrat - totalVerseApp)
      : undefined;

    const userObj = session?.user as { prenom?: string; nom?: string } | undefined;
    const nomCaissier =
      userObj?.prenom && userObj?.nom
        ? `${userObj.prenom} ${userObj.nom}`
        : session?.user?.name || "Caissier en service";

    setRecuSelectionne({
      id: m.id,
      date: (m.date || "").split("T")[0],
      heure: m.date?.includes("T")
        ? new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : undefined,
      montant: m.montant,
      nomApprenant: nomApp,
      contactApprenant: app?.contactApprenant,
      nomFormation: formationNom,
      motif: isLivre && m.details ? `Livre : ${m.details}` : motifLibelle,
      nomCentre: centreCourant?.nom || "Centre EXCELIS",
      nomCaissier,
      montantContrat: isLivre ? undefined : app?.montantContrat,
      totalVerse: isLivre ? undefined : totalVerseApp,
      soldeRestant: isLivre ? undefined : reliquat,
    });
    setModalRecuOuverte(true);
  };

  const confirmerSuppression = async () => {
    if (!versementASupprimer) return;
    try {
      setActionEnCours(true);
      await supprimerEntreeMutation.mutateAsync(versementASupprimer.id);
      setVersementASupprimer(null);
    } catch (e: any) {
      setErreurAction(e?.message || "Erreur lors de la suppression du versement.");
    } finally {
      setActionEnCours(false);
    }
  };

  const caisseDuJourVerrouillee = bilan?.statut === "CLOTURE";
  const chargementGlobal = chargementSession || chargementApprenants || chargementMouvements;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── 1. EN-TÊTE OPÉRATIONNEL ERP ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Journal de Caisse
            </h1>
            {centreCourant && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Building2 size={12} className="text-slate-500" />
                {centreCourant.nom}
              </span>
            )}
            {sessionActive && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-slate-500" />
                Session {sessionActive.annee}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Historique des encaissements et décaissements, filtres comptables et réimpression des reçus officiels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {peutEncaisser && (
            <>
              <Button
                type="button"
                onClick={() => setModalVersementOuverte(true)}
                variant="primary"
                className="text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Nouveau versement</span>
              </Button>

              <Button
                type="button"
                onClick={() => setModalSortieOuverte(true)}
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-slate-800 transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-brand-orange" />
                <span>Nouvelle sortie</span>
              </Button>
            </>
          )}

          <Button
            type="button"
            onClick={() => setModalBilanOuvert(true)}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-slate-800 transition-all"
            title="Aperçu avant impression de la fiche de bilan journalier"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Fiche journalière</span>
          </Button>
        </div>
      </div>

      {erreurAction && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{erreurAction}</span>
          </div>
          <button
            onClick={() => setErreurAction(null)}
            className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 2. SYNTHÈSE COMPTABLE HORIZONTALE ── */}
      {chargementGlobal ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SkeletonCard className="h-20 rounded-xl" />
          <SkeletonCard className="h-20 rounded-xl" />
          <SkeletonCard className="h-20 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Recettes */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Recettes Totales (Entrées)
              </p>
              <div className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">
                +{FCFA.format(totalEntrees)} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                {countEntrees} versement{countEntrees > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Dépenses */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Dépenses Totales (Sorties)
              </p>
              <div className="mt-1 text-xl font-bold text-rose-700 tabular-nums">
                -{FCFA.format(totalSorties)} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/60">
                {countSorties} sortie{countSorties > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Solde Net */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Solde Net de Caisse
              </p>
              <div className={`mt-1 text-xl font-bold tabular-nums ${soldeNet >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                {FCFA.format(soldeNet)} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                soldeNet >= 0
                  ? "bg-slate-50 text-slate-700 border-slate-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {soldeNet >= 0 ? "Excédentaire" : "Déficitaire"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. BARRE DE FILTRES COMPTABLES ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Période */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Période :
            </span>
            {(["AUJOURDHUI", "HIER", "7_JOURS", "MOIS", "TOUS"] as const).map((p) => {
              const labelMap: Record<string, string> = {
                AUJOURDHUI: "Aujourd'hui",
                HIER: "Hier",
                "7_JOURS": "7 derniers jours",
                MOIS: "Ce mois",
                TOUS: "Tout",
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
              placeholder="Apprenant, motif, montant..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        {/* Ligne 2 : Type et Motif */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Type :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 font-medium">
              <button
                type="button"
                onClick={() => setFiltreType("TOUS")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  filtreType === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setFiltreType("ENTREE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  filtreType === "ENTREE"
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
              >
                Entrées (+)
              </button>
              <button
                type="button"
                onClick={() => setFiltreType("SORTIE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  filtreType === "SORTIE"
                    ? "bg-white text-rose-800 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-rose-800"
                }`}
              >
                Sorties (-)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Motif :</span>
            <select
              value={filtreMotif}
              onChange={(e) => setFiltreMotif(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange focus:outline-none px-2.5 py-1 text-xs text-slate-900 font-medium"
            >
              <option value="TOUS">Tous les motifs</option>
              {motifs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom} ({m.type})
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{mouvementsFiltres.length}</span> opération{mouvementsFiltres.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TABLEAU DÉTAILLÉ DU JOURNAL ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Coins className="text-brand-orange" size={16} />
              <span>Écritures Comptables &amp; Transactions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Historique complet trié par ordre chronologique avec accès direct aux reçus officiels.
            </p>
          </div>
        </div>

        {chargementGlobal ? (
          <div className="p-5">
            <SkeletonTable rows={6} />
          </div>
        ) : mouvementsFiltres.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Coins size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">Aucune écriture trouvée</h3>
            <p className="font-medium text-slate-500 max-w-sm">
              Aucune transaction financière ne correspond à votre filtre de période ou critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
                <tr>
                  <SortableHeader
                    columnKey="date"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Date &amp; Heure
                  </SortableHeader>
                  <SortableHeader
                    columnKey="tiers"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Tiers (Élève / Bénéficiaire)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="type"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Type
                  </SortableHeader>
                  <SortableHeader
                    columnKey="motif"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Motif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="montant"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Montant
                  </SortableHeader>
                  <SortableHeader
                    columnKey="statut"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Statut
                  </SortableHeader>
                  <th className="py-3.5 px-4 font-bold text-right text-[11px] uppercase tracking-wider text-slate-600">
                    Actions Caissier
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mouvementsFiltres.map((m) => {
                  const estEntree = m.type === "ENTREE";
                  const motif = motifs.find((x) => x.id === m.motifId)?.nom || (estEntree ? "Versement scolarité" : "Décaissement");
                  const apprenant = apprenants.find((a) => a.id === m.apprenantId);
                  const formation = formations.find((f) => f.id === (m.formationId || apprenant?.formationId));
                  const isLivre =
                    m.motifId === "00000000-0000-0000-0000-000000000012" ||
                    motif.toLowerCase().includes("livre");

                  const dateStr = m.date
                    ? new Date(m.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";

                  const heureStr = m.date?.includes("T")
                    ? new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  const estDateAujourdhui = (m.date || "").split("T")[0] === dateAujourdhuiIso;
                  const modifiable = estEntree && estDateAujourdhui && !caisseDuJourVerrouillee;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {dateStr}
                        </span>
                        {heureStr && (
                          <span className="text-slate-400 text-[10px] block">
                            à {heureStr}
                          </span>
                        )}
                        {estDateAujourdhui && (
                          <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 bg-emerald-100 text-[10px] font-black text-emerald-800">
                            Aujourd&apos;hui
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-7 w-7 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              estEntree
                                ? "bg-slate-100 border-slate-200 text-slate-700"
                                : "bg-rose-50 border-rose-200 text-rose-700"
                            }`}
                          >
                            {estEntree
                              ? getInitiales(apprenant?.prenom, apprenant?.nom)
                              : "SO"}
                          </div>
                          <div className="min-w-0">
                            {apprenant ? (
                              <Link
                                href={`/apprenants/${apprenant.id}`}
                                className="font-bold text-slate-900 hover:text-brand-orange transition-colors truncate block"
                              >
                                {apprenant.nom} {apprenant.prenom}
                              </Link>
                            ) : (
                              <span className="font-bold text-slate-900 block truncate">
                                {m.ordonnateur ? `Ord: ${m.ordonnateur}` : estEntree ? "Versement direct" : "Dépense centre"}
                              </span>
                            )}
                            {formation && (
                              <span className="text-[10px] text-slate-400 block truncate">
                                {formation.nom}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {estEntree ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            ENTRÉE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            SORTIE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1">
                            {isLivre && <BookOpen size={12} className="text-purple-600 shrink-0" />}
                            <span>{isLivre && m.details ? `Livre : ${m.details}` : motif}</span>
                          </span>
                          {isLivre && (
                            <span className="text-[9px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 px-1 py-0.2 rounded">
                              Hors contrat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono whitespace-nowrap text-sm">
                        <span className={estEntree ? "text-emerald-700" : "text-rose-700"}>
                          {estEntree ? "+" : "-"}
                          {FCFA.format(m.montant)} F
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Validé
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {estEntree && (
                            <button
                              type="button"
                              onClick={() => ouvrirRecu(m)}
                              title="Imprimer le reçu de paiement officiel"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:text-brand-orange hover:border-brand-orange/40 hover:bg-orange-50/50 shadow-2xs transition-all cursor-pointer"
                            >
                              <Printer size={12} />
                              <span>Reçu</span>
                            </button>
                          )}

                          {peutModifierMouvement && modifiable && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setVersementAModifier({
                                    id: m.id,
                                    montant: m.montant,
                                    date: (m.date || "").split("T")[0],
                                    motifId: m.motifId,
                                    apprenantId: m.apprenantId,
                                  });
                                }}
                                title="Modifier"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setVersementASupprimer({
                                    id: m.id,
                                    montant: m.montant,
                                    libelle: motif,
                                    date: (m.date || "").split("T")[0],
                                  });
                                }}
                                title="Supprimer"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-2xs transition cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {mouvementsFiltres.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-800">
                  <tr>
                    <td className="py-3.5 px-4" colSpan={2}>
                      <span className="font-extrabold text-slate-900 block">Total de la sélection</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {mouvementsFiltres.length} écriture(s) affichée(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center" colSpan={2}>
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <span className="text-emerald-700 font-bold">
                          +{FCFA.format(totalEntrees)} F
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-rose-700 font-bold">
                          -{FCFA.format(totalSorties)} F
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-sm">
                      <span className={soldeNet >= 0 ? "text-slate-900" : "text-rose-700"}>
                        {FCFA.format(soldeNet)} F
                      </span>
                    </td>
                    <td className="py-3.5 px-4" colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {sessionActive?.id && (
        <EnregistrerVersementModal
          isOpen={modalVersementOuverte}
          onClose={() => setModalVersementOuverte(false)}
          centreId={centreId}
          sessionId={sessionActive.id}
          onSuccessRecu={(donnees) => {
            setRecuSelectionne(donnees);
            setModalRecuOuverte(true);
          }}
        />
      )}

      {sessionActive?.id && (
        <SaisirSortieModal
          isOpen={modalSortieOuverte}
          onClose={() => setModalSortieOuverte(false)}
          centreId={centreId}
          sessionId={sessionActive.id}
        />
      )}

      {versementAModifier && (
        <ModifierVersementModal
          isOpen={!!versementAModifier}
          onClose={() => setVersementAModifier(null)}
          versement={versementAModifier}
        />
      )}

      {versementASupprimer && (
        <Modal
          isOpen={!!versementASupprimer}
          onClose={() => setVersementASupprimer(null)}
          title="Annuler le versement"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-medium">
              Êtes-vous certain de vouloir annuler ce versement de{" "}
              <strong className="text-slate-900 font-bold">{FCFA.format(versementASupprimer.montant)} FCFA</strong> ({versementASupprimer.libelle}) ?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setVersementASupprimer(null)}
                disabled={actionEnCours}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl"
              >
                Conserver
              </Button>
              <Button
                onClick={confirmerSuppression}
                disabled={actionEnCours}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs"
              >
                {actionEnCours ? "Suppression..." : "Confirmer l'annulation"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <RecuPaiementModal
        isOpen={modalRecuOuverte}
        onClose={() => {
          setModalRecuOuverte(false);
          setRecuSelectionne(null);
        }}
        recu={recuSelectionne}
      />

      <FicheBilanPrintModal
        isOpen={modalBilanOuvert}
        onClose={() => setModalBilanOuvert(false)}
        date={periode === "DATE_SPECIFIQUE" ? dateSpecifique : new Date().toISOString().split("T")[0]}
        nomCentre={centres.find((c) => c.id === centreId)?.nom || "Centre"}
        codeCentre={centres.find((c) => c.id === centreId)?.villeActuelle?.slice(0, 2).toUpperCase() || "YA"}
        bilan={bilan}
        mouvements={mouvements}
        motifs={motifs}
        formations={formations}
      />
    </div>
  );
}
