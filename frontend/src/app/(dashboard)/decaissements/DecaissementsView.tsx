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
import { TAILLE_PAGE_LISTE } from "@/shared/lib/pagination";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { usePageParCriteres } from "@/shared/hooks/usePageParCriteres";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import {
  useRechercheMouvementsFinanciers,
  useMotifs,
  useValiderMouvement,
  SaisirSortieModal,
  type CriteresRechercheMouvements,
  type MouvementFinancier,
  type StatutMouvement,
  type TriMouvements,
} from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

type CategorieFonctionnelle = "TOUS" | "PAIE" | "FONCTIONNEMENT" | "ACHATS";
// Identifiant qui ne correspond à aucun motif : une catégorie sans motif doit
// renvoyer une liste vide, pas "tous les motifs" (motifIds vide = pas de filtre).
const AUCUN_MOTIF = "00000000-0000-0000-0000-000000000000";

type ColonneTri =
  | "date"
  | "centre"
  | "ordonnateur"
  | "motif"
  | "categorie"
  | "montant"
  | "statut";

const TRI_BACKEND: Record<ColonneTri, TriMouvements> = {
  date: "DATE",
  centre: "CENTRE",
  ordonnateur: "ORDONNATEUR",
  motif: "MOTIF",
  categorie: "ORDRE_MOTIFS",
  montant: "MONTANT",
  statut: "STATUT",
};

function categoriserMotif(
  nomMotif: string,
): "PAIE" | "FONCTIONNEMENT" | "ACHATS" {
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

  const { data: sessionActive, isLoading: chargementSession } =
    useSessionActive();
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: motifs = [] } = useMotifs();

  const validerMouvementMutation = useValiderMouvement();

  // Filtres
  const [categorie, setCategorie] = useState<CategorieFonctionnelle>("TOUS");
  const [centreFiltre, setCentreFiltre] = useState<string>("TOUS");
  const [statutFiltre, setStatutFiltre] = useState<string>("TOUS");
  const [periode, setPeriode] = useState<PeriodeFiltre>("TOUS");
  const [dateSpecifique, setDateSpecifique] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [recherche, setRecherche] = useState("");

  // Tri
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
  const [operationDetail, setOperationDetail] =
    useState<MouvementFinancier | null>(null);
  const [messageNotification, setMessageNotification] = useState<{
    type: "succes" | "erreur";
    message: string;
  } | null>(null);
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

  // La catégorie est déduite du nom du motif (categoriserMotif) : on la traduit en
  // liste de motifs pour le filtre serveur, et en ordre de motifs pour le tri.
  const motifsParCategorie = useMemo(() => {
    const map = new Map<string, string[]>();
    motifs.forEach((m) => {
      const cat = categoriserMotif(m.nom);
      map.set(cat, [...(map.get(cat) ?? []), m.id]);
    });
    return map;
  }, [motifs]);

  const ordreMotifsParCategorie = useMemo(
    () =>
      [...motifs]
        .sort((a, b) =>
          categoriserMotif(a.nom).localeCompare(categoriserMotif(b.nom)),
        )
        .map((m) => m.id),
    [motifs],
  );

  const rechercheStable = useDebouncedValue(recherche);
  const sessionActiveId = sessionActive?.id;
  const criteres = useMemo<CriteresRechercheMouvements | undefined>(() => {
    if (!sessionActiveId) return undefined;
    const bornes = bornesPeriode(periode, dateSpecifique);
    const motifsCategorie = motifsParCategorie.get(categorie) ?? [];
    return {
      sessionId: sessionActiveId,
      type: "SORTIE",
      centreId: centreFiltre !== "TOUS" ? centreFiltre : undefined,
      statut:
        statutFiltre !== "TOUS" ? (statutFiltre as StatutMouvement) : undefined,
      motifIds:
        categorie === "TOUS"
          ? undefined
          : motifsCategorie.length > 0
            ? motifsCategorie
            : [AUCUN_MOTIF],
      dateDebut: bornes.dateDebut,
      dateFin: bornes.dateFin,
      recherche: rechercheStable.trim() || undefined,
      tri: TRI_BACKEND[triColonne],
      ordreMotifIds:
        triColonne === "categorie" ? ordreMotifsParCategorie : undefined,
      sens: triDirection === "asc" ? "ASC" : "DESC",
    };
  }, [
    sessionActiveId,
    centreFiltre,
    statutFiltre,
    categorie,
    motifsParCategorie,
    periode,
    dateSpecifique,
    rechercheStable,
    triColonne,
    triDirection,
    ordreMotifsParCategorie,
  ]);

  const [page, setPage] = usePageParCriteres(JSON.stringify(criteres ?? null));
  const { data: resultat, isLoading: chargementMouvements } =
    useRechercheMouvementsFinanciers(criteres, page - 1, TAILLE_PAGE_LISTE);

  const sortiesPage = resultat?.page.contenu ?? [];
  const nbSorties = resultat?.page.totalElements ?? 0;
  const totalPages = Math.max(1, resultat?.page.totalPages ?? 1);

  // Totaux de toute la sélection filtrée (rejetés compris, comme avant), ventilés
  // par catégorie à partir des totaux par motif renvoyés par le backend.
  const totauxCategories = useMemo(() => {
    const totaux = { TOTAL: 0, PAIE: 0, FONCTIONNEMENT: 0, ACHATS: 0 };
    (resultat?.totauxParMotif ?? [])
      .filter((t) => t.type === "SORTIE")
      .forEach((t) => {
        totaux.TOTAL += t.total;
        totaux[categoriserMotif(mapMotifs.get(t.motifId) || "")] += t.total;
      });
    return totaux;
  }, [resultat, mapMotifs]);
  const totalDecaisse = totauxCategories.TOTAL;
  const totalPaie = totauxCategories.PAIE;
  const totalFonctionnement = totauxCategories.FONCTIONNEMENT;
  const totalAchats = totauxCategories.ACHATS;

  // Actions de validation ou rejet
  const handleDecision = async (
    mouvementId: string,
    decision: "VALIDE" | "REJETE",
  ) => {
    try {
      setEnCoursId(mouvementId);
      await validerMouvementMutation.mutateAsync({
        mouvementId,
        decision,
        validateurUtilisateurId: user?.id,
      });
      setMessageNotification({
        type: "succes",
        message:
          decision === "VALIDE"
            ? "Décaissement validé avec succès."
            : "Décaissement rejeté.",
      });
      if (operationDetail?.id === mouvementId) {
        setOperationDetail(null);
      }
    } catch {
      setMessageNotification({
        type: "erreur",
        message:
          "Une erreur est survenue lors de l'enregistrement de la décision.",
      });
    } finally {
      setEnCoursId(null);
    }
  };

  const chargement =
    chargementSession || chargementCentres || chargementMouvements;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── 1. EN-TÊTE OPÉRATIONNEL ERP ── */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Décaissements & Dépenses
            </h1>
            {sessionActive && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-slate-500" />
                Session {sessionActive.annee}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500">
            Supervision des dépenses par catégorie fonctionnelle, contrôle et
            ordonnancement de trésorerie.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => setModalSortieOuverte(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700"
          >
            <Plus size={14} />
            <span>Nouveau décaissement</span>
          </Button>
        </div>
      </div>

      {/* Notification de feedback */}
      {messageNotification && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3 text-xs font-medium ${
            messageNotification.type === "succes"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {messageNotification.type === "succes" ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
            )}
            <span>{messageNotification.message}</span>
          </div>
          <button
            onClick={() => setMessageNotification(null)}
            className="cursor-pointer p-1 text-slate-400 hover:text-slate-600"
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
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
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
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {nbSorties} opération{nbSorties > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Rémunérations & Paie */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
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
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {totalDecaisse > 0
                ? Math.round((totalPaie / totalDecaisse) * 100)
                : 0}
              % des dépenses
            </p>
          </div>
        </div>

        {/* Fonctionnement */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
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
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {totalDecaisse > 0
                ? Math.round((totalFonctionnement / totalDecaisse) * 100)
                : 0}
              % des dépenses
            </p>
          </div>
        </div>

        {/* Achats & Investissements */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Achats & Investissements
            </span>
            <div className="text-brand-orange flex h-5 w-5 items-center justify-center rounded-full bg-amber-50">
              <Receipt className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalAchats)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {totalDecaisse > 0
                ? Math.round((totalAchats / totalDecaisse) * 100)
                : 0}
              % des dépenses
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
              placeholder="Ordonnateur, motif, montant..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="focus:border-brand-orange focus:ring-brand-orange w-full rounded-md border border-slate-200 bg-slate-50 py-1 pr-2.5 pl-8 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Ligne 2 : Catégorie, Centre, Statut */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-xs">
          {/* Catégories fonctionnelles */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Catégorie :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 font-medium">
              <button
                type="button"
                onClick={() => setCategorie("TOUS")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  categorie === "TOUS"
                    ? "bg-white font-semibold text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={() => setCategorie("PAIE")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  categorie === "PAIE"
                    ? "bg-white font-semibold text-purple-900 shadow-2xs"
                    : "text-slate-500 hover:text-purple-900"
                }`}
              >
                Paie
              </button>
              <button
                type="button"
                onClick={() => setCategorie("FONCTIONNEMENT")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  categorie === "FONCTIONNEMENT"
                    ? "bg-white font-semibold text-blue-900 shadow-2xs"
                    : "text-slate-500 hover:text-blue-900"
                }`}
              >
                Fonctionnement
              </button>
              <button
                type="button"
                onClick={() => setCategorie("ACHATS")}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 text-xs transition-colors ${
                  categorie === "ACHATS"
                    ? "bg-white font-semibold text-amber-900 shadow-2xs"
                    : "text-slate-500 hover:text-amber-900"
                }`}
              >
                Achats
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

          {/* Statut */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Statut :</span>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              className="focus:border-brand-orange rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente de visa</option>
              <option value="VALIDE">Validé / Clôturé</option>
              <option value="REJETE">Rejeté</option>
            </select>
          </div>

          <div className="ml-auto text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{nbSorties}</span> dépense
              {nbSorties > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TABLEAU DES OPÉRATIONS DE DÉPENSE ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Receipt className="text-brand-orange" size={16} />
              <span>Registre des Décaissements</span>
            </h2>
            <p className="text-xs text-slate-500">
              Détail chronologique des sorties de fonds et statuts de
              validation.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-5">
            <SkeletonTable rows={6} />
          </div>
        ) : sortiesPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-xs text-slate-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Receipt size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">
              Aucun décaissement trouvé
            </h3>
            <p className="max-w-sm font-medium text-slate-500">
              Aucune dépense ne correspond aux critères de filtre sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                <tr>
                  <SortableHeader
                    columnKey="date"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-4 py-3.5"
                  >
                    Date
                  </SortableHeader>
                  <SortableHeader
                    columnKey="centre"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-4 py-3.5"
                  >
                    Centre
                  </SortableHeader>
                  <SortableHeader
                    columnKey="ordonnateur"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-4 py-3.5"
                  >
                    Bénéficiaire / Ordonnateur
                  </SortableHeader>
                  <SortableHeader
                    columnKey="motif"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-4 py-3.5"
                  >
                    Motif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="categorie"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="px-4 py-3.5 text-center"
                  >
                    Catégorie
                  </SortableHeader>
                  <SortableHeader
                    columnKey="montant"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="px-4 py-3.5 text-right"
                  >
                    Montant
                  </SortableHeader>
                  <SortableHeader
                    columnKey="statut"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="px-4 py-3.5 text-center"
                  >
                    Statut
                  </SortableHeader>
                  <th className="px-4 py-3.5 text-center font-bold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortiesPage.map((m) => {
                  const nomMotif = mapMotifs.get(m.motifId) || "Dépense";
                  const cat = categoriserMotif(nomMotif);
                  const nomCentre = m.centreId
                    ? mapCentres.get(m.centreId) || "Centre"
                    : "National";
                  const dateStr = m.date ? m.date.split("T")[0] : "-";
                  const estEnAttente = m.statut === "EN_ATTENTE";

                  return (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-semibold whitespace-nowrap text-slate-900">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900">
                          {nomCentre}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">
                          {m.ordonnateur || "Non spécifié"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {nomMotif}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cat === "PAIE" ? (
                          <span className="inline-flex items-center rounded-md border border-purple-200/60 bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                            Paie
                          </span>
                        ) : cat === "ACHATS" ? (
                          <span className="text-brand-orange inline-flex items-center rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[11px] font-bold">
                            Achats
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            Fonctionnement
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700 tabular-nums">
                        -{FCFA.format(m.montant)} F
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.statut === "VALIDE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 size={12} />
                            Validé
                          </span>
                        ) : m.statut === "EN_ATTENTE" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                            <Clock size={12} />À viser
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                            <XCircle size={12} />
                            Rejeté
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
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
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={nbSorties}
              pageSize={TAILLE_PAGE_LISTE}
              onChange={setPage}
              label="dépense"
            />
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
            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <span className="font-medium text-slate-500">
                  Montant décaissé :
                </span>
                <span className="text-lg font-black text-rose-700 tabular-nums">
                  -{FCFA.format(operationDetail.montant)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">
                  Motif opération :
                </span>
                <span className="font-bold text-slate-900">
                  {mapMotifs.get(operationDetail.motifId) || "Non renseigné"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">Catégorie :</span>
                <span className="font-bold text-slate-800">
                  {categoriserMotif(
                    mapMotifs.get(operationDetail.motifId) || "",
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">
                  Bénéficiaire :
                </span>
                <span className="font-bold text-slate-900">
                  {operationDetail.ordonnateur || "Non spécifié"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">Centre :</span>
                <span className="font-semibold text-slate-800">
                  {operationDetail.centreId
                    ? mapCentres.get(operationDetail.centreId) || "Centre"
                    : "National"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">
                  Date d&apos;enregistrement :
                </span>
                <span className="font-semibold text-slate-800">
                  {operationDetail.date
                    ? operationDetail.date.split("T")[0]
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">
                  Statut actuel :
                </span>
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
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
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
