"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Receipt,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  Eye,
  Check,
  X,
  AlertCircle,
  Plus,
} from "lucide-react";

import { Card, Button, Modal, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import {
  useMouvementsFinanciers,
  useMotifs,
  useValiderMouvement,
  SaisirSortieModal,
  type MouvementFinancier,
} from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

type CategorieFonctionnelle = "TOUS" | "PAIE" | "FONCTIONNEMENT" | "ACHATS";
type PeriodeFiltre = "AUJOURDHUI" | "HIER" | "7_JOURS" | "MOIS" | "DATE_SPECIFIQUE" | "TOUS";

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

export function DecaissementsView() {
  const { data: sessionAuth } = useSession();
  const user = sessionAuth?.user;
  const peutValider = user?.role === "COMPTABLE" || user?.role === "DIRECTEUR";

  const { data: sessionActive, isLoading: chargementSession } = useSessionActive();
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: motifs = [] } = useMotifs();
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(sessionActive?.id);

  const validerMouvementMutation = useValiderMouvement();

  // Filtres
  const [categorie, setCategorie] = useState<CategorieFonctionnelle>("TOUS");
  const [centreFiltre, setCentreFiltre] = useState<string>("TOUS");
  const [statutFiltre, setStatutFiltre] = useState<string>("TOUS");
  const [periode, setPeriode] = useState<PeriodeFiltre>("TOUS");
  const [dateSpecifique, setDateSpecifique] = useState(new Date().toISOString().split("T")[0]);
  const [recherche, setRecherche] = useState("");

  // Tri
  type ColonneTri = "date" | "centre" | "ordonnateur" | "motif" | "categorie" | "montant" | "statut";
  const [triColonne, setTriColonne] = useState<ColonneTri>("date");
  const [triDirection, setTriDirection] = useState<SortDirection>("desc");

  function handleTri(colonne: ColonneTri) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("desc");
    }
  }

  // Modale de détail d'une opération
  const [operationDetail, setOperationDetail] = useState<MouvementFinancier | null>(null);
  const [messageNotification, setMessageNotification] = useState<{ type: "succes" | "erreur"; message: string } | null>(null);
  const [enCoursId, setEnCoursId] = useState<string | null>(null);
  const [modalSortieOuverte, setModalSortieOuverte] = useState(false);

  // Map des motifs
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

  // Filtrage exclusif des dépenses (SORTIES)
  const sortiesFiltrees = useMemo(() => {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);

    const septJoursAvant = new Date(aujourdhui);
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    const premierDuMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

    return mouvements.filter((m) => {
      if (m.type !== "SORTIE") return false;
      if (centreFiltre !== "TOUS" && m.centreId !== centreFiltre) return false;
      if (statutFiltre !== "TOUS" && m.statut !== statutFiltre) return false;

      const nomMotif = mapMotifs.get(m.motifId) || "";
      const cat = categoriserMotif(nomMotif);
      if (categorie !== "TOUS" && cat !== categorie) return false;

      const dateMvt = new Date(m.date);
      dateMvt.setHours(0, 0, 0, 0);

      const dIso = m.date ? m.date.split("T")[0] : "";
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
        const ord = (m.ordonnateur || "").toLowerCase();
        const motif = nomMotif.toLowerCase();
        const centre = (mapCentres.get(m.centreId || "") || "").toLowerCase();
        const montantStr = (m.montant || 0).toString();
        if (!ord.includes(q) && !motif.includes(q) && !centre.includes(q) && !montantStr.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    mouvements,
    centreFiltre,
    statutFiltre,
    categorie,
    periode,
    dateSpecifique,
    recherche,
    mapMotifs,
    mapCentres,
  ]);

  // Tri des données
  const sortiesTriees = useMemo(() => {
    return [...sortiesFiltrees].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "date") cmp = compareDates(a.date, b.date);
      else if (triColonne === "centre") {
        const cA = a.centreId ? mapCentres.get(a.centreId) || "" : "National";
        const cB = b.centreId ? mapCentres.get(b.centreId) || "" : "National";
        cmp = compareStrings(cA, cB);
      } else if (triColonne === "ordonnateur") {
        cmp = compareStrings(a.ordonnateur || "", b.ordonnateur || "");
      } else if (triColonne === "motif") {
        const mA = mapMotifs.get(a.motifId) || "";
        const mB = mapMotifs.get(b.motifId) || "";
        cmp = compareStrings(mA, mB);
      } else if (triColonne === "categorie") {
        const cA = categoriserMotif(mapMotifs.get(a.motifId) || "");
        const cB = categoriserMotif(mapMotifs.get(b.motifId) || "");
        cmp = compareStrings(cA, cB);
      } else if (triColonne === "montant") {
        cmp = compareNumbers(a.montant, b.montant);
      } else if (triColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [sortiesFiltrees, triColonne, triDirection, mapCentres, mapMotifs]);

  // Totaux statistiques sur la sélection
  const totalDecaisse = useMemo(() => {
    return sortiesFiltrees.reduce((acc, s) => acc + (s.montant || 0), 0);
  }, [sortiesFiltrees]);

  const totalPaie = useMemo(() => {
    return sortiesFiltrees
      .filter((s) => categoriserMotif(mapMotifs.get(s.motifId) || "") === "PAIE")
      .reduce((acc, s) => acc + (s.montant || 0), 0);
  }, [sortiesFiltrees, mapMotifs]);

  const totalFonctionnement = useMemo(() => {
    return sortiesFiltrees
      .filter((s) => categoriserMotif(mapMotifs.get(s.motifId) || "") === "FONCTIONNEMENT")
      .reduce((acc, s) => acc + (s.montant || 0), 0);
  }, [sortiesFiltrees, mapMotifs]);

  const totalAchats = useMemo(() => {
    return sortiesFiltrees
      .filter((s) => categoriserMotif(mapMotifs.get(s.motifId) || "") === "ACHATS")
      .reduce((acc, s) => acc + (s.montant || 0), 0);
  }, [sortiesFiltrees, mapMotifs]);

  // Actions de validation ou rejet
  const handleDecision = async (mouvementId: string, decision: "VALIDE" | "REJETE") => {
    try {
      setEnCoursId(mouvementId);
      await validerMouvementMutation.mutateAsync({
        mouvementId,
        decision,
        validateurUtilisateurId: user?.id,
      });
      setMessageNotification({
        type: "succes",
        message: decision === "VALIDE" ? "Décaissement validé avec succès." : "Décaissement rejeté.",
      });
      if (operationDetail?.id === mouvementId) {
        setOperationDetail(null);
      }
    } catch {
      setMessageNotification({
        type: "erreur",
        message: "Une erreur est survenue lors de l'enregistrement de la décision.",
      });
    } finally {
      setEnCoursId(null);
    }
  };

  const chargement = chargementSession || chargementCentres || chargementMouvements;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── 1. EN-TÊTE OPÉRATIONNEL ERP ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Décaissements & Dépenses
            </h1>
            {sessionActive && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-slate-500" />
                Session {sessionActive.annee}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Supervision des dépenses par catégorie fonctionnelle, contrôle et ordonnancement de trésorerie.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => setModalSortieOuverte(true)}
            className="rounded-xl shadow-xs text-xs font-bold py-2 cursor-pointer bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Nouveau décaissement</span>
          </Button>
        </div>
      </div>

      {/* Notification de feedback */}
      {messageNotification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3 text-xs font-medium border ${
            messageNotification.type === "succes"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {messageNotification.type === "succes" ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
            )}
            <span>{messageNotification.message}</span>
          </div>
          <button
            onClick={() => setMessageNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 2. SYNTHÈSE COMPTABLE HORIZONTALE ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Décaissements */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Décaissements
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <TrendingDown className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-rose-700 tabular-nums">
              -{FCFA.format(totalDecaisse)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {sortiesFiltrees.length} opération{sortiesFiltrees.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Rémunérations & Paie */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Rémunérations & Paie
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <Receipt className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalPaie)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {totalDecaisse > 0 ? Math.round((totalPaie / totalDecaisse) * 100) : 0}% des dépenses
            </p>
          </div>
        </div>

        {/* Fonctionnement */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Fonctionnement
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Building2 className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalFonctionnement)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {totalDecaisse > 0 ? Math.round((totalFonctionnement / totalDecaisse) * 100) : 0}% des dépenses
            </p>
          </div>
        </div>

        {/* Achats & Investissements */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Achats & Investissements
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-brand-orange">
              <Receipt className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalAchats)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {totalDecaisse > 0 ? Math.round((totalAchats / totalDecaisse) * 100) : 0}% des dépenses
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
              placeholder="Ordonnateur, motif, montant..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        {/* Ligne 2 : Catégorie, Centre, Statut */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Catégories fonctionnelles */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Catégorie :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 font-medium">
              <button
                type="button"
                onClick={() => setCategorie("TOUS")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  categorie === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={() => setCategorie("PAIE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  categorie === "PAIE"
                    ? "bg-white text-purple-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-purple-900"
                }`}
              >
                Paie
              </button>
              <button
                type="button"
                onClick={() => setCategorie("FONCTIONNEMENT")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  categorie === "FONCTIONNEMENT"
                    ? "bg-white text-blue-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-blue-900"
                }`}
              >
                Fonctionnement
              </button>
              <button
                type="button"
                onClick={() => setCategorie("ACHATS")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  categorie === "ACHATS"
                    ? "bg-white text-amber-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-amber-900"
                }`}
              >
                Achats
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

          {/* Statut */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Statut :</span>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange focus:outline-none px-2.5 py-1 text-xs text-slate-900 font-medium"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente de visa</option>
              <option value="VALIDE">Validé / Clôturé</option>
              <option value="REJETE">Rejeté</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{sortiesFiltrees.length}</span> dépense{sortiesFiltrees.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TABLEAU DES OPÉRATIONS DE DÉPENSE ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="text-brand-orange" size={16} />
              <span>Registre des Décaissements</span>
            </h2>
            <p className="text-xs text-slate-500">
              Détail chronologique des sorties de fonds et statuts de validation.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-5">
            <SkeletonTable rows={6} />
          </div>
        ) : sortiesTriees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Receipt size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">Aucun décaissement trouvé</h3>
            <p className="font-medium text-slate-500 max-w-sm">
              Aucune dépense ne correspond aux critères de filtre sélectionnés.
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
                    Date
                  </SortableHeader>
                  <SortableHeader
                    columnKey="centre"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Centre
                  </SortableHeader>
                  <SortableHeader
                    columnKey="ordonnateur"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Bénéficiaire / Ordonnateur
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
                    columnKey="categorie"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Catégorie
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
                  <th className="py-3.5 px-4 text-center text-slate-700 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortiesTriees.map((m) => {
                  const nomMotif = mapMotifs.get(m.motifId) || "Dépense";
                  const cat = categoriserMotif(nomMotif);
                  const nomCentre = m.centreId ? mapCentres.get(m.centreId) || "Centre" : "National";
                  const dateStr = m.date ? m.date.split("T")[0] : "-";
                  const estEnAttente = m.statut === "EN_ATTENTE";

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{nomCentre}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{m.ordonnateur || "Non spécifié"}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {nomMotif}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cat === "PAIE" ? (
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200/60">
                            Paie
                          </span>
                        ) : cat === "ACHATS" ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-brand-orange border border-amber-200/60">
                            Achats
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200/60">
                            Fonctionnement
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700 tabular-nums">
                        -{FCFA.format(m.montant)} F
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.statut === "VALIDE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 size={12} />
                            Validé
                          </span>
                        ) : m.statut === "EN_ATTENTE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                            <Clock size={12} />
                            À viser
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/60">
                            <XCircle size={12} />
                            Rejeté
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="secondary"
                            onClick={() => setOperationDetail(m)}
                            className="h-7 px-2 text-xs font-semibold"
                            title="Voir le détail"
                          >
                            <Eye size={13} className="text-slate-500" />
                          </Button>

                          {peutValider && estEnAttente && (
                            <>
                              <Button
                                variant="primary"
                                onClick={() => handleDecision(m.id, "VALIDE")}
                                disabled={enCoursId === m.id}
                                className="h-7 px-2 text-xs font-bold"
                                title="Valider ce décaissement"
                              >
                                <Check size={13} />
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDecision(m.id, "REJETE")}
                                disabled={enCoursId === m.id}
                                className="h-7 px-2 text-xs font-bold"
                                title="Rejeter ce décaissement"
                              >
                                <X size={13} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. MODALE DE DÉTAIL D'UN DÉCAISSEMENT ── */}
      {operationDetail && (
        <Modal
          isOpen={true}
          onClose={() => setOperationDetail(null)}
          title="Fiche du Décaissement"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <span className="text-slate-500 font-medium">Montant décaissé :</span>
                <span className="text-lg font-black text-rose-700 tabular-nums">
                  -{FCFA.format(operationDetail.montant)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Motif opération :</span>
                <span className="font-bold text-slate-900">
                  {mapMotifs.get(operationDetail.motifId) || "Non renseigné"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Catégorie :</span>
                <span className="font-bold text-slate-800">
                  {categoriserMotif(mapMotifs.get(operationDetail.motifId) || "")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Bénéficiaire :</span>
                <span className="font-bold text-slate-900">
                  {operationDetail.ordonnateur || "Non spécifié"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Centre :</span>
                <span className="font-semibold text-slate-800">
                  {operationDetail.centreId ? mapCentres.get(operationDetail.centreId) || "Centre" : "National"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Date d&apos;enregistrement :</span>
                <span className="font-semibold text-slate-800">
                  {operationDetail.date ? operationDetail.date.split("T")[0] : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Statut actuel :</span>
                <span className="font-bold">
                  {operationDetail.statut === "VALIDE" ? (
                    <span className="text-emerald-700">Validé / Clôturé</span>
                  ) : operationDetail.statut === "EN_ATTENTE" ? (
                    <span className="text-amber-700">En attente de visa</span>
                  ) : (
                    <span className="text-rose-700">Rejeté</span>
                  )}
                </span>
              </div>
            </div>

            {/* Décisions possibles */}
            {peutValider && operationDetail.statut === "EN_ATTENTE" && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="danger"
                  onClick={() => handleDecision(operationDetail.id, "REJETE")}
                  disabled={enCoursId === operationDetail.id}
                  className="text-xs"
                >
                  <X size={14} />
                  <span>Rejeter</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleDecision(operationDetail.id, "VALIDE")}
                  disabled={enCoursId === operationDetail.id}
                  className="text-xs font-bold"
                >
                  <Check size={14} />
                  <span>Valider le décaissement</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {modalSortieOuverte && (
        <SaisirSortieModal
          isOpen={modalSortieOuverte}
          onClose={() => setModalSortieOuverte(false)}
          centreId={centreFiltre !== "TOUS" ? centreFiltre : ""}
          sessionId={sessionActive?.id || ""}
        />
      )}
    </div>
  );
}
