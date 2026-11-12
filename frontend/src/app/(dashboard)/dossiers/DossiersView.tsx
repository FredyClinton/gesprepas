"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FolderOpen,
  Award,
  Search,
  Plus,
  Clock,
  Building2,
  GraduationCap,
  Eye,
  FileText,
  Edit2,
  Power,
  RotateCcw,
  Sparkles,
  List,
  LayoutGrid,
  MoreVertical,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button, Pagination, SortableHeader } from "@/shared/ui";
import {
  compareStrings,
  compareNumbers,
  compareDates,
  type SortDirection,
} from "@/shared/lib/sort-utils";
import {
  useRechercheDossiers,
  useConcoursSession,
  usePiecesRequises,
  useDesactiverPieceRequise,
  useReactiverPieceRequise,
  useCreerPieceRequise,
  usePiecesDuConcours,
  SouscrireDossierModal,
  CreerConcoursModal,
  CreerModifierPieceModal,
  GererPiecesConcoursModal,
  ProgressionPiecesDossierCell,
  DateLimiteDepotDossierCell,
  calculerCompteARebours,
  type Concours,
  type CriteresRechercheDossiers,
  type StatutDossier,
  type TriDossiers,
  type PieceRequise,
} from "@/modules/dossiers";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { useApprenants } from "@/modules/apprenants";
import { TAILLE_PAGE_LISTE } from "@/shared/lib/pagination";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { usePageParCriteres } from "@/shared/hooks/usePageParCriteres";

const FCFA = new Intl.NumberFormat("fr-FR");

const TRI_DOSSIERS_BACKEND: Record<string, TriDossiers> = {
  apprenant: "APPRENANT",
  centre: "CENTRE",
  filiere: "FILIERE",
  date: "DATE",
  dateLimite: "DATE_LIMITE",
  statut: "STATUT",
};

const STATUT_BADGES: Record<
  StatutDossier,
  { label: string; dot: string; bg: string; text: string }
> = {
  OUVERT: {
    label: "En cours",
    dot: "bg-amber-600",
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-800",
  },
  COMPLET: {
    label: "Complet",
    dot: "bg-emerald-600",
    bg: "bg-emerald-50 border border-emerald-200",
    text: "text-emerald-800",
  },
  CLOTURE: {
    label: "Clôturé",
    dot: "bg-slate-400",
    bg: "bg-slate-100 border border-slate-200",
    text: "text-slate-700",
  },
};

const PIECES_STANDARDS_DEFAUT = [
  { nom: "Acte de naissance certifié conforme", montant: 1500 },
  { nom: "Certificat de nationalité légalisé", montant: 2000 },
  { nom: "Relevé de notes officiel du Baccalauréat", montant: 2000 },
  { nom: "Attestation de réussite ou Diplôme du Bac", montant: 2000 },
  { nom: "4 Photos d'identité 4x4 couleur récentes", montant: 1000 },
  { nom: "Certificat médical d'aptitude physique et mentale", montant: 3000 },
  { nom: "Extrait de casier judiciaire (Bulletin N°3)", montant: 2500 },
  { nom: "Fiche de candidature timbrée et légalisée", montant: 1500 },
  { nom: "Enveloppe timbrée A4 à l'adresse du candidat", montant: 500 },
];

/**
 * Nettoie le texte des observations pour supprimer les redondances éventuelles
 * avec la filière ou le statut, et identifier les libellés courts d'alerte.
 */
function nettoyerObservation(
  observation: string | null | undefined,
  filiereNom?: string,
  statutLabel?: string,
): { texte: string; estAlerte: boolean } | null {
  if (!observation) return null;
  let t = observation.trim();
  if (!t) return null;

  // Supprimer d'éventuelles redondances avec la filière
  if (filiereNom) {
    const escaped = filiereNom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexFiliere = new RegExp(
      `(^|\\s*[-|•/]\\s*)(Fili[èe]re\\s*:\\s*)?${escaped}\\s*([-|•/]\\s*)?`,
      "gi",
    );
    t = t.replace(regexFiliere, " ").trim();
  }

  // Supprimer d'éventuelles redondances avec le statut
  if (statutLabel) {
    const escaped = statutLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexStatut = new RegExp(
      `(^|\\s*[-|•/]\\s*)(Statut\\s*:\\s*)?${escaped}\\s*([-|•/]\\s*)?`,
      "gi",
    );
    t = t.replace(regexStatut, " ").trim();
  }

  // Nettoyer séparateurs orphelins au début ou à la fin
  t = t.replace(/^[-|•:/,\s]+|[-|•:/,\s]+$/g, "").trim();
  if (!t) return null;

  // Détection de mot-clé d'alerte / attention
  const motsClesAlerte = [
    "urgent",
    "attention",
    "retard",
    "incomplet",
    "manque",
    "alerte",
    "rejet",
    "bloqué",
    "bloque",
  ];
  const lower = t.toLowerCase();
  const estAlerte = motsClesAlerte.some((mot) => lower.includes(mot));

  return { texte: t, estAlerte };
}

/**
 * Menu d'actions compact pour une ligne de dossier (trois points)
 */
function DossierActionMenu({
  dossierId,
  apprenantId,
  onRattacherConcours,
}: {
  dossierId: string;
  apprenantId: string;
  /** Absent : l'utilisateur ne peut pas souscrire, l'entrée est masquée. */
  onRattacherConcours?: (apprenantId: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative inline-flex items-center justify-end">
      {/* Menu contextuel trois points */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOuvert((v) => !v);
        }}
        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        title="Options du dossier"
        aria-label="Options du dossier"
      >
        <MoreVertical size={16} />
      </button>

      {ouvert && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setOuvert(false);
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in slide-in-from-top-1 absolute top-full right-0 z-40 mt-1 w-48 rounded-xl border border-slate-200/90 bg-white p-1.5 text-left shadow-xl"
          >
            <Link
              href={`/dossiers/${dossierId}`}
              onClick={() => setOuvert(false)}
              className="hover:text-brand-orange flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <FolderOpen size={13} className="text-slate-400" />
              <span>Gérer le dossier</span>
            </Link>

            {onRattacherConcours && (
              <button
                type="button"
                onClick={() => {
                  setOuvert(false);
                  onRattacherConcours?.(apprenantId);
                }}
                className="hover:text-brand-orange flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-orange-50"
              >
                <Plus size={13} className="text-brand-orange" />
                <span>Rattacher un concours</span>
              </button>
            )}

            <Link
              href={`/apprenants/${apprenantId}`}
              onClick={() => setOuvert(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Eye size={13} className="text-slate-400" />
              <span>Fiche de l&rsquo;élève</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function DossiersView() {
  const { data: authSession } = useSession();
  const role = authSession?.user?.role;
  const userCentreId = authSession?.user?.centreId;

  const isSuperviseur =
    role === "SUPERVISEUR_DOSSIERS" ||
    role === "DIRECTEUR" ||
    role === "DIRECTEUR_ACADEMIQUE";
  // DOSSIER_GERER côté backend : le Directeur supervise en lecture seule (pas d'inscription).
  const peutGererDossier = role !== "DIRECTEUR";

  // Navigation par 3 onglets au même niveau : suivi, campagnes, catalogue pièces
  const [onglet, setOnglet] = useState<"suivi" | "campagnes" | "pieces">(
    "suivi",
  );

  // Données transverses
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id || "";

  const { data: centres = [] } = useCentres();
  const { data: formations = [] } = useFormations();

  // Centre filtré (verrouillé si chef de centre ou chargé de dossier)
  const [centreSelectionne, setCentreSelectionne] = useState<string>(
    !isSuperviseur && userCentreId ? userCentreId : "",
  );

  // Filtres onglet suivi
  const [recherche, setRecherche] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<string>("TOUS");
  const [formationFiltre, setFormationFiltre] = useState<string>("");

  // Données dossiers & concours

  const {
    data: concoursList = [],
    isLoading: chargementConcours,
    refetch: refetchConcours,
  } = useConcoursSession(sessionId || undefined);
  const { data: cataloguePieces = [], refetch: refetchPieces } =
    usePiecesRequises();

  // Mutations
  const desactiverPieceMutation = useDesactiverPieceRequise();
  const reactiverPieceMutation = useReactiverPieceRequise();
  const creerPieceMutation = useCreerPieceRequise();

  // Modals
  const [modalSouscrireOuverte, setModalSouscrireOuverte] = useState(false);
  // Liste complète des apprenants : seulement pour le sélecteur de la modale.
  const { data: apprenants = [] } = useApprenants({
    sessionId: sessionId || undefined,
    enabled: modalSouscrireOuverte,
  });
  const [apprenantPourNouveauConcoursId, setApprenantPourNouveauConcoursId] =
    useState<string | null>(null);
  const [modalCreerConcoursOuverte, setModalCreerConcoursOuverte] =
    useState(false);
  const [modalPieceOuverte, setModalPieceOuverte] = useState(false);
  const [pieceAEditer, setPieceAEditer] = useState<PieceRequise | null>(null);
  const [concoursPourPieces, setConcoursPourPieces] = useState<Concours | null>(
    null,
  );
  const [isInitializingPieces, setIsInitializingPieces] = useState(false);
  const [recherchePieceCatalogue, setRecherchePieceCatalogue] = useState("");

  // Tri du catalogue de pièces
  type ColonneTriPieces = "nom" | "montant" | "actif";
  const [triPieceColonne, setTriPieceColonne] =
    useState<ColonneTriPieces>("nom");
  const [triPieceDirection, setTriPieceDirection] =
    useState<SortDirection>("asc");

  function handleTriPiece(colonne: string) {
    const col = colonne as ColonneTriPieces;
    if (triPieceColonne === col) {
      setTriPieceDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriPieceColonne(col);
      setTriPieceDirection("asc");
    }
  }

  // Catalogue trié et filtré par recherche
  const cataloguePiecesTriees = useMemo(() => {
    const q = recherchePieceCatalogue.toLowerCase().trim();
    const filtered = cataloguePieces.filter((p) =>
      !q ? true : p.nom.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (triPieceColonne === "nom") {
        cmp = compareStrings(a.nom, b.nom);
      } else if (triPieceColonne === "montant") {
        cmp = compareNumbers(a.montant, b.montant);
      } else if (triPieceColonne === "actif") {
        cmp = Number(b.actif) - Number(a.actif);
      }
      return triPieceDirection === "asc" ? cmp : -cmp;
    });
  }, [
    cataloguePieces,
    recherchePieceCatalogue,
    triPieceColonne,
    triPieceDirection,
  ]);

  // Mode d'affichage et filtres pour les campagnes de concours (Tableau par défaut pour grand volume)
  const [vueConcours, setVueConcours] = useState<"table" | "cards">("table");
  const [filtreStatutConcours, setFiltreStatutConcours] = useState<
    "TOUS" | "OUVERT" | "URGENT" | "CLOS"
  >("TOUS");

  const statsConcours = useMemo(() => {
    let ouverts = 0;
    let urgents = 0;
    let clos = 0;
    concoursList.forEach((c) => {
      const cd = calculerCompteARebours(c.dateLimiteDepot);
      if (cd.estPasse) {
        clos++;
      } else {
        ouverts++;
        if (cd.estUrgent) urgents++;
      }
    });
    return { total: concoursList.length, ouverts, urgents, clos };
  }, [concoursList]);

  // Recherche et filtrage des concours
  type ColonneTriConcours =
    "nom" | "statut" | "recevabilite" | "depot" | "cout";
  const [triConcoursColonne, setTriConcoursColonne] =
    useState<ColonneTriConcours>("nom");
  const [triConcoursDirection, setTriConcoursDirection] =
    useState<SortDirection>("asc");

  function handleTriConcours(colonne: string) {
    const col = colonne as ColonneTriConcours;
    if (triConcoursColonne === col) {
      setTriConcoursDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriConcoursColonne(col);
      setTriConcoursDirection("asc");
    }
  }

  const [rechercheConcours, setRechercheConcours] = useState("");
  const concoursFiltres = useMemo(() => {
    const q = rechercheConcours.toLowerCase().trim();
    const list = concoursList.filter((c) => {
      if (q && !c.nom.toLowerCase().includes(q)) return false;
      if (filtreStatutConcours !== "TOUS") {
        const cd = calculerCompteARebours(c.dateLimiteDepot);
        if (filtreStatutConcours === "CLOS" && !cd.estPasse) return false;
        if (filtreStatutConcours === "OUVERT" && cd.estPasse) return false;
        if (filtreStatutConcours === "URGENT" && (!cd.estUrgent || cd.estPasse))
          return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triConcoursColonne === "nom") {
        cmp = compareStrings(a.nom, b.nom);
      } else if (triConcoursColonne === "statut") {
        const cdA = calculerCompteARebours(a.dateLimiteDepot);
        const cdB = calculerCompteARebours(b.dateLimiteDepot);
        cmp = compareNumbers(cdA.jours, cdB.jours);
      } else if (triConcoursColonne === "recevabilite") {
        cmp = compareDates(
          a.dateLimiteRecevabiliteCentre,
          b.dateLimiteRecevabiliteCentre,
        );
      } else if (triConcoursColonne === "depot") {
        cmp = compareDates(a.dateLimiteDepot, b.dateLimiteDepot);
      }
      return triConcoursDirection === "asc" ? cmp : -cmp;
    });
  }, [
    concoursList,
    rechercheConcours,
    filtreStatutConcours,
    triConcoursColonne,
    triConcoursDirection,
  ]);

  // Tri des dossiers
  type ColonneTriDossiers =
    "apprenant" | "centre" | "filiere" | "date" | "dateLimite" | "statut";
  const [triColonne, setTriColonne] = useState<ColonneTriDossiers>("apprenant");
  const [triDirection, setTriDirection] = useState<SortDirection>("asc");

  function handleTri(colonne: string) {
    const col = colonne as ColonneTriDossiers;
    if (triColonne === col) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(col);
      setTriDirection("asc");
    }
  }

  // Filtrage, tri (dont l'échéance de dépôt la plus proche), pagination et
  // compteurs par statut faits par le backend.
  const rechercheStable = useDebouncedValue(recherche);
  const criteresDossiers = useMemo<CriteresRechercheDossiers>(
    () => ({
      sessionId: sessionId || undefined,
      centreId: centreSelectionne || undefined,
      statut:
        statutFiltre !== "TOUS" ? (statutFiltre as StatutDossier) : undefined,
      formationId: formationFiltre || undefined,
      recherche: rechercheStable.trim() || undefined,
      tri: TRI_DOSSIERS_BACKEND[triColonne],
      sens: triDirection === "asc" ? "ASC" : "DESC",
    }),
    [
      sessionId,
      centreSelectionne,
      statutFiltre,
      formationFiltre,
      rechercheStable,
      triColonne,
      triDirection,
    ],
  );
  const [pageDossiers, setPageDossiers] = usePageParCriteres(
    JSON.stringify(criteresDossiers),
  );
  const {
    data: resultatDossiers,
    isLoading: chargementDossiers,
    refetch: refetchDossiers,
  } = useRechercheDossiers(
    criteresDossiers,
    pageDossiers - 1,
    TAILLE_PAGE_LISTE,
  );
  const dossiersPage = resultatDossiers?.page.contenu ?? [];
  const nbDossiersFiltres = resultatDossiers?.page.totalElements ?? 0;

  // KPIs du périmètre session/centre (indépendants des autres filtres).
  const kpis = {
    total: resultatDossiers?.total ?? 0,
    ouverts: resultatDossiers?.ouverts ?? 0,
    complets: resultatDossiers?.complets ?? 0,
    clotures: resultatDossiers?.clotures ?? 0,
  };

  // Handler pour initialiser le catalogue standard
  async function handleInitialiserPiecesStandard() {
    setIsInitializingPieces(true);
    try {
      const existantes = new Set(
        cataloguePieces.map((p) => p.nom.toLowerCase().trim()),
      );
      const aCreer = PIECES_STANDARDS_DEFAUT.filter(
        (p) => !existantes.has(p.nom.toLowerCase().trim()),
      );

      for (const piece of aCreer) {
        await creerPieceMutation.mutateAsync(piece);
      }
      refetchPieces();
    } finally {
      setIsInitializingPieces(false);
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── En-tête Sobre & Compact ── */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Dossiers de Concours
          </h1>
          <p className="text-xs text-slate-500">
            {isSuperviseur
              ? `Supervision des candidatures, catalogues de pièces et campagnes · Session ${sessionActive?.annee || "active"}`
              : `Suivi des souscriptions et dépôts de pièces · ${centres.find((c) => c.id === userCentreId)?.nom || "Mon centre"}`}
          </p>
        </div>

        {/* Actions principales contextuelles selon l'onglet actif */}
        <div className="flex flex-wrap items-center gap-2">
          {onglet === "campagnes" && isSuperviseur && (
            <button
              type="button"
              onClick={() => setModalCreerConcoursOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              <Award size={14} />
              <span>Programmer un concours</span>
            </button>
          )}

          {onglet === "pieces" && isSuperviseur && (
            <div className="flex items-center gap-2">
              {cataloguePieces.length === 0 && (
                <button
                  type="button"
                  onClick={handleInitialiserPiecesStandard}
                  disabled={isInitializingPieces}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Sparkles size={13} className="text-brand-orange" />
                  <span>
                    {isInitializingPieces
                      ? "Chargement..."
                      : "Initialiser pièces types"}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPieceAEditer(null);
                  setModalPieceOuverte(true);
                }}
                className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
              >
                <Plus size={14} />
                <span>Ajouter une pièce</span>
              </button>
            </div>
          )}

          {onglet === "suivi" && peutGererDossier && (
            <button
              type="button"
              onClick={() => setModalSouscrireOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              <Plus size={15} />
              <span>Inscrire un apprenant</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3 Onglets de Navigation au Même Niveau ── */}
      <div className="flex flex-wrap gap-4 border-b border-slate-200 text-xs font-semibold sm:gap-6">
        <button
          type="button"
          onClick={() => setOnglet("suivi")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 py-2 transition-colors ${
            onglet === "suivi"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FolderOpen size={14} />
          <span>Suivi des Dossiers</span>
          <span className="py-0.2 rounded bg-slate-100 px-1.5 font-mono text-[10px] text-slate-600">
            {kpis.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOnglet("campagnes")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 py-2 transition-colors ${
            onglet === "campagnes"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award size={14} />
          <span>Campagnes de Concours</span>
          <span className="py-0.2 rounded bg-slate-100 px-1.5 font-mono text-[10px] text-slate-600">
            {concoursList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOnglet("pieces")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 py-2 transition-colors ${
            onglet === "pieces"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText size={14} />
          <span>Catalogue des Pièces</span>
          <span className="py-0.2 rounded bg-slate-100 px-1.5 font-mono text-[10px] text-slate-600">
            {cataloguePieces.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 1 : SUIVI DES DOSSIERS SOUSCRITS                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {onglet === "suivi" && (
        <div className="space-y-4">
          {/* ── 1. Barre de Synthèse Horizontale Épurée & Interactive ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs sm:p-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setStatutFiltre("TOUS")}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  statutFiltre === "TOUS"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <span>Total dossiers</span>
                <span
                  className={`py-0.2 rounded-md px-1.5 font-mono text-[11px] font-bold ${
                    statutFiltre === "TOUS"
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-700 shadow-2xs"
                  }`}
                >
                  {kpis.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatutFiltre(statutFiltre === "OUVERT" ? "TOUS" : "OUVERT")
                }
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  statutFiltre === "OUVERT"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-500/10 text-amber-800 hover:bg-amber-500/15"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>En cours</span>
                <span
                  className={`py-0.2 rounded-md px-1.5 font-mono text-[11px] font-bold ${
                    statutFiltre === "OUVERT"
                      ? "bg-white/20 text-white"
                      : "bg-white text-amber-800 shadow-2xs"
                  }`}
                >
                  {kpis.ouverts}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatutFiltre(
                    statutFiltre === "COMPLET" ? "TOUS" : "COMPLET",
                  )
                }
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  statutFiltre === "COMPLET"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>Complets</span>
                <span
                  className={`py-0.2 rounded-md px-1.5 font-mono text-[11px] font-bold ${
                    statutFiltre === "COMPLET"
                      ? "bg-white/20 text-white"
                      : "bg-white text-emerald-800 shadow-2xs"
                  }`}
                >
                  {kpis.complets}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatutFiltre(
                    statutFiltre === "CLOTURE" ? "TOUS" : "CLOTURE",
                  )
                }
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  statutFiltre === "CLOTURE"
                    ? "bg-slate-600 text-white shadow-2xs"
                    : "bg-slate-500/10 text-slate-700 hover:bg-slate-500/15"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                <span>Clôturés</span>
                <span
                  className={`py-0.2 rounded-md px-1.5 font-mono text-[11px] font-bold ${
                    statutFiltre === "CLOTURE"
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-700 shadow-2xs"
                  }`}
                >
                  {kpis.clotures}
                </span>
              </button>
            </div>

            {/* Progression globale discrète */}
            <div className="hidden items-center gap-2 pr-2 text-xs text-slate-500 lg:flex">
              <span className="font-medium text-slate-400">Complétion :</span>
              <span className="font-mono font-bold text-slate-800">
                {kpis.total > 0
                  ? Math.round((kpis.complets / kpis.total) * 100)
                  : 0}
                %
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${kpis.total > 0 ? (kpis.complets / kpis.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── 2. Barre de Filtres Unifiée & Extensible ── */}
          <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
            {/* Recherche intégrée avec bouton de nettoyage */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par élève, reçu, note..."
                className="focus:ring-brand-orange/30 focus:border-brand-orange w-full rounded-xl border border-slate-200/90 bg-white py-2 pr-8 pl-9 text-xs transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none"
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600"
                  title="Effacer la recherche"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filtres contextuels compacts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Centre (sélectionnable pour superviseur, fixe pour chef/chargé) */}
              {isSuperviseur ? (
                <div className="relative shrink-0">
                  <Building2
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={centreSelectionne}
                    onChange={(e) => setCentreSelectionne(e.target.value)}
                    className="focus:ring-brand-orange/30 focus:border-brand-orange cursor-pointer appearance-none rounded-xl border border-slate-200/90 bg-white py-2 pr-7 pl-8 text-xs font-medium text-slate-700 focus:ring-2 focus:outline-none"
                  >
                    <option value="">
                      Tous les centres ({centres.length})
                    </option>
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400"
                  />
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/90 px-3 py-2 text-xs font-semibold text-slate-700">
                  <Building2 size={13} className="text-brand-orange" />
                  <span className="max-w-[140px] truncate">
                    {centres.find((c) => c.id === userCentreId)?.nom ||
                      "Mon centre"}
                  </span>
                </div>
              )}

              {/* Filtre Filière */}
              <div className="relative shrink-0">
                <GraduationCap
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={formationFiltre}
                  onChange={(e) => setFormationFiltre(e.target.value)}
                  className="focus:ring-brand-orange/30 focus:border-brand-orange cursor-pointer appearance-none rounded-xl border border-slate-200/90 bg-white py-2 pr-7 pl-8 text-xs font-medium text-slate-700 focus:ring-2 focus:outline-none"
                >
                  <option value="">Toutes les filières</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Réinitialisation rapide si des filtres sont actifs */}
              {(recherche ||
                formationFiltre ||
                (isSuperviseur && centreSelectionne) ||
                statutFiltre !== "TOUS") && (
                <button
                  type="button"
                  onClick={() => {
                    setRecherche("");
                    setFormationFiltre("");
                    setStatutFiltre("TOUS");
                    if (isSuperviseur) setCentreSelectionne("");
                  }}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw size={12} />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {/* ── 3. Tableau de Suivi Aéré & Lignes Épurées ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            {chargementDossiers ? (
              <div className="space-y-3 p-12 text-center">
                <div className="border-brand-orange inline-block h-6 w-6 animate-spin rounded-full border-2 border-r-transparent" />
                <p className="text-xs text-slate-400">
                  Chargement des dossiers souscrits...
                </p>
              </div>
            ) : dossiersPage.length === 0 ? (
              <div className="space-y-3 p-12 text-center">
                <div className="text-brand-orange mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                  <FolderOpen size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Aucun dossier trouvé
                </h3>
                <p className="mx-auto max-w-sm text-xs text-slate-400">
                  Aucun apprenant n&rsquo;a encore de dossier correspondant à
                  ces filtres.
                  {peutGererDossier &&
                    " Cliquez sur « Inscrire un apprenant » pour initier une première souscription."}
                </p>
                {peutGererDossier && (
                  <Button
                    type="button"
                    onClick={() => setModalSouscrireOuverte(true)}
                    className="bg-brand-orange mt-2 text-xs text-white"
                  >
                    <Plus size={14} className="mr-1" /> Inscrire un apprenant
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      <SortableHeader
                        label="Apprenant"
                        sortKey="apprenant"
                        currentSortKey={triColonne}
                        direction={triDirection}
                        onSort={handleTri}
                        className={isSuperviseur ? "w-[20%]" : "w-[22%]"}
                      />
                      {isSuperviseur && (
                        <SortableHeader
                          label="Centre"
                          sortKey="centre"
                          currentSortKey={triColonne}
                          direction={triDirection}
                          onSort={handleTri}
                          className="w-[11%]"
                        />
                      )}
                      <SortableHeader
                        label="Filière"
                        sortKey="filiere"
                        currentSortKey={triColonne}
                        direction={triDirection}
                        onSort={handleTri}
                        className="w-[12%]"
                      />
                      <th className="w-[16%] min-w-[135px] px-3.5 py-3">
                        Progression pièces
                      </th>
                      <SortableHeader
                        label="Date ouverture"
                        sortKey="date"
                        currentSortKey={triColonne}
                        direction={triDirection}
                        onSort={handleTri}
                        className="w-[10%] whitespace-nowrap"
                      />
                      <SortableHeader
                        label="Date limite dépôt"
                        sortKey="dateLimite"
                        currentSortKey={triColonne}
                        direction={triDirection}
                        onSort={handleTri}
                        className="w-[13%] whitespace-nowrap"
                      />
                      <SortableHeader
                        label="Statut"
                        sortKey="statut"
                        currentSortKey={triColonne}
                        direction={triDirection}
                        onSort={handleTri}
                        className="w-[10%] whitespace-nowrap"
                      />
                      <th className="w-[14%] px-3.5 py-3">Observation</th>
                      <th className="w-[60px] px-3.5 py-3 text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {dossiersPage.map((dossier) => {
                      const apprenant =
                        dossier.apprenantNom !== null ||
                        dossier.apprenantPrenom !== null
                          ? {
                              nom: dossier.apprenantNom ?? "",
                              prenom: dossier.apprenantPrenom ?? "",
                              formationId: dossier.apprenantFormationId,
                              referenceRecu: dossier.apprenantReferenceRecu,
                            }
                          : undefined;
                      const centre = centres.find(
                        (c) => c.id === dossier.centreId,
                      );
                      const formation = formations.find(
                        (f) => f.id === apprenant?.formationId,
                      );
                      const badge = STATUT_BADGES[dossier.statut];
                      const initiales =
                        `${apprenant?.nom?.[0] || ""}${apprenant?.prenom?.[0] || ""}`.toUpperCase() ||
                        "E";
                      const obsInfo = nettoyerObservation(
                        dossier.observation,
                        formation?.nom,
                        badge.label,
                      );

                      return (
                        <tr
                          key={dossier.id}
                          className="group transition-colors hover:bg-slate-50/60"
                        >
                          {/* 1. Apprenant : compact et unifié */}
                          <td className="px-3.5 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-100 text-[11px] font-bold text-slate-700"
                                title={
                                  apprenant
                                    ? `${apprenant.nom} ${apprenant.prenom}`
                                    : "Élève inconnu"
                                }
                              >
                                {initiales}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/dossiers/${dossier.id}`}
                                  className="hover:text-brand-orange block truncate text-xs font-bold text-slate-900 transition-colors hover:underline"
                                  title={
                                    apprenant
                                      ? `${apprenant.nom} ${apprenant.prenom}`
                                      : "Élève inconnu"
                                  }
                                >
                                  {apprenant
                                    ? `${apprenant.nom} ${apprenant.prenom}`
                                    : "Élève inconnu"}
                                </Link>
                                {apprenant?.referenceRecu && (
                                  <span
                                    className="block truncate font-mono text-[10px] text-slate-400"
                                    title={`Reçu: ${apprenant.referenceRecu}`}
                                  >
                                    Reçu: {apprenant.referenceRecu}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Centre (si superviseur) */}
                          {isSuperviseur && (
                            <td className="px-3.5 py-3">
                              <span className="flex items-center gap-1.5 truncate font-semibold text-slate-700">
                                <Building2
                                  size={13}
                                  className="shrink-0 text-slate-400"
                                />
                                <span className="truncate">
                                  {centre?.nom || "—"}
                                </span>
                              </span>
                            </td>
                          )}

                          {/* Formation / Filière */}
                          <td className="px-3.5 py-3">
                            <span
                              className="block truncate font-medium text-slate-600"
                              title={formation?.nom || "—"}
                            >
                              {formation?.nom || "—"}
                            </span>
                          </td>

                          {/* 2. Progression pièces : composant graphique uniforme */}
                          <td className="px-3.5 py-3">
                            <ProgressionPiecesDossierCell
                              dossierId={dossier.id}
                              statut={dossier.statut}
                            />
                          </td>

                          {/* Date ouverture */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-slate-500">
                              {new Date(
                                dossier.dateOuverture,
                              ).toLocaleDateString("fr-FR")}
                            </span>
                          </td>

                          {/* 3. Date limite de dépôt pour chaque concours */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <DateLimiteDepotDossierCell
                              dossierId={dossier.id}
                              concoursCatalogue={concoursList}
                            />
                          </td>

                          {/* Statut avec Soft Badge */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}
                              />
                              {badge.label}
                            </span>
                          </td>

                          {/* 4. Observation : allégée, sans redondances */}
                          <td className="max-w-[180px] px-3.5 py-3">
                            {obsInfo ? (
                              <div
                                className="flex min-w-0 items-center gap-1.5"
                                title={obsInfo.texte}
                              >
                                {obsInfo.estAlerte ? (
                                  <span className="inline-flex items-center gap-1 truncate rounded border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                    <AlertCircle
                                      size={10}
                                      className="shrink-0 text-amber-600"
                                    />
                                    <span className="truncate">
                                      {obsInfo.texte}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="block truncate text-xs font-medium text-slate-600">
                                    {obsInfo.texte}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="block text-[11px] text-slate-400 italic">
                                Aucune note
                              </span>
                            )}
                          </td>

                          {/* 5. Actions : harmonisées (Gérer + Menu contextuel) */}
                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <DossierActionMenu
                              dossierId={dossier.id}
                              apprenantId={dossier.apprenantId}
                              onRattacherConcours={
                                peutGererDossier
                                  ? (appId) => {
                                      setApprenantPourNouveauConcoursId(appId);
                                      setModalSouscrireOuverte(true);
                                    }
                                  : undefined
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  page={pageDossiers}
                  totalPages={Math.max(
                    1,
                    resultatDossiers?.page.totalPages ?? 1,
                  )}
                  totalItems={nbDossiersFiltres}
                  pageSize={TAILLE_PAGE_LISTE}
                  onChange={setPageDossiers}
                  label="dossier"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 2 : CAMPAGNES DE CONCOURS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {onglet === "campagnes" && (
        <div className="space-y-4">
          {/* Barre d'outils et de filtrage adaptée aux volumes importants */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Award size={17} className="text-brand-orange" />
                  Campagnes de concours &middot; Session{" "}
                  {sessionActive?.annee || ""}
                </h3>
                <p className="text-xs text-slate-500">
                  {concoursList.length} concours répertorié
                  {concoursList.length > 1 ? "s" : ""}. Vue optimisée pour grand
                  catalogue avec dates et coûts.
                </p>
              </div>

              {/* Commutateur de vue : Tableau (par défaut) vs Cartes */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setVueConcours("table")}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      vueConcours === "table"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="Vue ergonomique en tableau (recommandée pour grand volume)"
                  >
                    <List
                      size={14}
                      className={
                        vueConcours === "table" ? "text-brand-orange" : ""
                      }
                    />
                    <span>Tableau</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVueConcours("cards")}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      vueConcours === "cards"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="Vue en cartes"
                  >
                    <LayoutGrid
                      size={14}
                      className={
                        vueConcours === "cards" ? "text-brand-orange" : ""
                      }
                    />
                    <span>Cartes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filtres rapides et recherche */}
            {concoursList.length > 0 && (
              <div className="flex flex-col justify-between gap-3 pt-1 md:flex-row md:items-center">
                {/* Pastilles de statut rapides */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFiltreStatutConcours("TOUS")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      filtreStatutConcours === "TOUS"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tous ({statsConcours.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreStatutConcours("OUVERT")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      filtreStatutConcours === "OUVERT"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    Ouverts ({statsConcours.ouverts})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreStatutConcours("URGENT")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      filtreStatutConcours === "URGENT"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    Urgents ≤ 7j ({statsConcours.urgents})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreStatutConcours("CLOS")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      filtreStatutConcours === "CLOS"
                        ? "bg-slate-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    Clos ({statsConcours.clos})
                  </button>
                </div>

                {/* Recherche d'un concours */}
                <div className="relative w-full sm:w-64">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un concours..."
                    value={rechercheConcours}
                    onChange={(e) => setRechercheConcours(e.target.value)}
                    className="focus:ring-brand-orange/30 focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-xs transition-all focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {chargementConcours ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Chargement des concours...
            </div>
          ) : concoursList.length === 0 ? (
            <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
              <Award size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">
                Aucun concours programmé pour cette session
              </p>
              <p className="mx-auto max-w-sm text-[11px] text-slate-400">
                Le superviseur ou directeur peut programmer les concours lancés
                cette année en définissant les délais et les pièces requises.
              </p>
              {isSuperviseur && (
                <Button
                  type="button"
                  onClick={() => setModalCreerConcoursOuverte(true)}
                  className="bg-brand-orange mt-2 text-xs text-white"
                >
                  Programmer le premier concours
                </Button>
              )}
            </div>
          ) : concoursFiltres.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-xs text-slate-400">
              Aucun concours ne correspond à vos filtres &laquo;{" "}
              {rechercheConcours || "Sélection actuelle"} &raquo;.
            </div>
          ) : vueConcours === "table" ? (
            /* ── VUE TABLEAU : Haute ergonomie pour grand volume de concours ── */
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      <th className="w-12 px-4 py-3 text-center">#</th>
                      <SortableHeader
                        label="Concours officiel"
                        sortKey="nom"
                        currentSortKey={triConcoursColonne}
                        direction={triConcoursDirection}
                        onSort={handleTriConcours}
                      />
                      <SortableHeader
                        label="Statut"
                        sortKey="statut"
                        currentSortKey={triConcoursColonne}
                        direction={triConcoursDirection}
                        onSort={handleTriConcours}
                        align="center"
                      />
                      <SortableHeader
                        label="Recevabilité centre"
                        sortKey="recevabilite"
                        currentSortKey={triConcoursColonne}
                        direction={triConcoursDirection}
                        onSort={handleTriConcours}
                      />
                      <SortableHeader
                        label="Dépôt officiel"
                        sortKey="depot"
                        currentSortKey={triConcoursColonne}
                        direction={triConcoursDirection}
                        onSort={handleTriConcours}
                      />
                      <th className="px-4 py-3 text-center">Pièces</th>
                      <SortableHeader
                        label="Coût dossier"
                        sortKey="cout"
                        currentSortKey={triConcoursColonne}
                        direction={triConcoursDirection}
                        onSort={handleTriConcours}
                        align="right"
                      />
                      <th className="w-44 px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {concoursFiltres.map((concours, index) => (
                      <ConcoursTableRow
                        key={concours.id}
                        concours={concours}
                        index={index}
                        isSuperviseur={isSuperviseur}
                        onGererPieces={() => setConcoursPourPieces(concours)}
                        onSouscrire={
                          peutGererDossier
                            ? () => setModalSouscrireOuverte(true)
                            : undefined
                        }
                      />
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-100 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                    <tr>
                      <td colSpan={8} className="px-4 py-3">
                        Total affiché :{" "}
                        <strong className="font-bold text-slate-800">
                          {concoursFiltres.length} concours
                        </strong>
                        {concoursFiltres.length !== concoursList.length &&
                          ` (sur ${concoursList.length} au total)`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* ── VUE GRILLE / CARTES BENTO STYLE ── */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {concoursFiltres.map((concours) => (
                <ConcoursCampagneCard
                  key={concours.id}
                  concours={concours}
                  isSuperviseur={isSuperviseur}
                  onGererPieces={() => setConcoursPourPieces(concours)}
                  onSouscrire={
                    peutGererDossier
                      ? () => setModalSouscrireOuverte(true)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 3 : CATALOGUE DES PIÈCES REQUIRES & TARIFS                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {onglet === "pieces" && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FileText size={17} className="text-brand-orange" />
                Catalogue des Pièces Administratives & Tarifs
              </h3>
              <p className="text-xs text-slate-500">
                Référentiel standard des pièces administratives et leurs tarifs
                applicables.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {cataloguePieces.length > 0 && (
                <div className="relative w-48 sm:w-60">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Filtrer les pièces..."
                    value={recherchePieceCatalogue}
                    onChange={(e) => setRecherchePieceCatalogue(e.target.value)}
                    className="focus:ring-brand-orange/30 focus:border-brand-orange w-full rounded-xl border border-slate-200/90 bg-white py-1.5 pr-3 pl-8 text-xs transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none"
                  />
                  {recherchePieceCatalogue && (
                    <button
                      type="button"
                      onClick={() => setRecherchePieceCatalogue("")}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {isSuperviseur && cataloguePieces.length === 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleInitialiserPiecesStandard}
                  disabled={isInitializingPieces}
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  <Sparkles size={13} className="text-brand-orange" />
                  <span>
                    {isInitializingPieces
                      ? "Chargement..."
                      : "Initialiser pièces types"}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Tableau du catalogue de pièces épuré */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="w-12 px-4 py-3 text-center">#</th>
                  <SortableHeader
                    label="Libellé de la pièce exigible"
                    sortKey="nom"
                    currentSortKey={triPieceColonne}
                    direction={triPieceDirection}
                    onSort={handleTriPiece}
                  />
                  <SortableHeader
                    label="Tarif standard"
                    sortKey="montant"
                    currentSortKey={triPieceColonne}
                    direction={triPieceDirection}
                    onSort={handleTriPiece}
                    align="right"
                  />
                  <SortableHeader
                    label="Statut"
                    sortKey="actif"
                    currentSortKey={triPieceColonne}
                    direction={triPieceDirection}
                    onSort={handleTriPiece}
                    align="right"
                  />
                  {isSuperviseur && (
                    <th className="w-24 px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {cataloguePieces.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperviseur ? 5 : 4}
                      className="p-10 text-center text-slate-400"
                    >
                      Aucune pièce dans le catalogue. Cliquez sur &laquo;
                      Initialiser pièces types &raquo; pour charger la liste
                      standard.
                    </td>
                  </tr>
                ) : cataloguePiecesTriees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperviseur ? 5 : 4}
                      className="p-10 text-center text-slate-400"
                    >
                      Aucune pièce ne correspond à votre recherche &laquo;{" "}
                      {recherchePieceCatalogue} &raquo;.
                    </td>
                  </tr>
                ) : (
                  cataloguePiecesTriees.map((piece, index) => {
                    return (
                      <tr
                        key={piece.id}
                        className="group transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3.5 text-center font-mono text-[11px] font-semibold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="text-brand-orange flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                              <FileText size={15} />
                            </div>
                            <span className="text-xs font-semibold text-slate-900">
                              {piece.nom}
                            </span>
                          </div>
                        </td>
                        {/* Tarif en police semi-bold avec hiérarchie claire */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            {FCFA.format(piece.montant)} FCFA
                          </span>
                        </td>
                        {/* Statut aligné proprement sur la droite avec soft badge */}
                        <td className="px-4 py-3.5 pr-6 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              piece.actif
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-slate-500/10 text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                piece.actif ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {piece.actif ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {/* Actions directes au survol de la ligne */}
                        {isSuperviseur && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setPieceAEditer(piece);
                                  setModalPieceOuverte(true);
                                }}
                                className="hover:text-brand-orange cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-orange-50"
                                title="Modifier libellé ou tarif"
                              >
                                <Edit2 size={14} />
                              </button>

                              {piece.actif ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    desactiverPieceMutation.mutate(piece.id)
                                  }
                                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Désactiver cette pièce"
                                >
                                  <Power size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    reactiverPieceMutation.mutate(piece.id)
                                  }
                                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                  title="Réactiver cette pièce"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {cataloguePiecesTriees.length > 0 && (
                <tfoot className="border-t border-slate-100 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <tr>
                    <td colSpan={2} className="px-4 py-3">
                      Total répertorié :{" "}
                      <strong className="font-bold text-slate-800">
                        {cataloguePiecesTriees.length} pièce
                        {cataloguePiecesTriees.length > 1 ? "s" : ""}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {FCFA.format(
                        cataloguePiecesTriees.reduce(
                          (acc, p) => acc + (p.montant || 0),
                          0,
                        ),
                      )}{" "}
                      FCFA
                    </td>
                    <td
                      colSpan={isSuperviseur ? 2 : 1}
                      className="px-4 py-3 pr-6 text-right text-slate-400"
                    >
                      {cataloguePiecesTriees.filter((p) => p.actif).length}{" "}
                      active(s) sur {cataloguePiecesTriees.length}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Modals Partagées ── */}
      {/* 1. Souscrire un apprenant ou rattacher un concours supplémentaire */}
      <SouscrireDossierModal
        isOpen={modalSouscrireOuverte}
        onClose={() => {
          setModalSouscrireOuverte(false);
          setApprenantPourNouveauConcoursId(null);
        }}
        apprenants={apprenants}
        sessionId={sessionId}
        centreId={!isSuperviseur && userCentreId ? userCentreId : undefined}
        apprenantPreselectionneId={apprenantPourNouveauConcoursId || undefined}
        onSuccess={() => {
          refetchDossiers();
          setModalSouscrireOuverte(false);
          setApprenantPourNouveauConcoursId(null);
        }}
      />

      {/* 2. Programmer un concours */}
      <CreerConcoursModal
        isOpen={modalCreerConcoursOuverte}
        onClose={() => setModalCreerConcoursOuverte(false)}
        sessionId={sessionId}
        onSuccess={() => {
          refetchConcours();
          setModalCreerConcoursOuverte(false);
        }}
      />

      {/* 4. Créer / Modifier une pièce standard */}
      <CreerModifierPieceModal
        isOpen={modalPieceOuverte}
        onClose={() => {
          setModalPieceOuverte(false);
          setPieceAEditer(null);
        }}
        pieceAEditer={pieceAEditer}
        onSuccess={() => {
          refetchPieces();
        }}
      />

      {/* 5. Gérer les pièces d'un concours */}
      {concoursPourPieces && (
        <GererPiecesConcoursModal
          isOpen={Boolean(concoursPourPieces)}
          onClose={() => setConcoursPourPieces(null)}
          concours={concoursPourPieces}
          peutModifier={isSuperviseur}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT MENU D'ACTIONS SIMPLIFIÉ (Action principale + Menu contextuel)
// ─────────────────────────────────────────────────────────────────────────────

function ConcoursActionMenu({
  isSuperviseur,
  estEncoreOuvert,
  onGererPieces,
  onSouscrire,
}: {
  isSuperviseur: boolean;
  estEncoreOuvert: boolean;
  onGererPieces: () => void;
  /** Absent : l'utilisateur ne peut pas souscrire. */
  onSouscrire?: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Action principale prioritaire */}
      {estEncoreOuvert && onSouscrire ? (
        <button
          type="button"
          onClick={onSouscrire}
          className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all"
          title="Souscrire un candidat à ce concours"
        >
          <Plus size={13} />
          <span>Souscrire</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onGererPieces}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200"
          title={
            isSuperviseur ? "Gérer les pièces exigées" : "Consulter les pièces"
          }
        >
          <FileText size={13} />
          <span>Pièces</span>
        </button>
      )}

      {/* Menu contextuel pour désengorger la ligne */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOuvert((v) => !v);
          }}
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Options contextuelles"
        >
          <MoreVertical size={15} />
        </button>

        {ouvert && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={(e) => {
                e.stopPropagation();
                setOuvert(false);
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-in fade-in slide-in-from-top-1 absolute top-full right-0 z-40 mt-1 w-52 rounded-xl border border-slate-200/90 bg-white p-1.5 text-left shadow-xl"
            >
              <button
                type="button"
                onClick={() => {
                  setOuvert(false);
                  onGererPieces();
                }}
                className="hover:text-brand-orange flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-orange-50"
              >
                <FileText size={14} className="text-slate-400" />
                <span>
                  {isSuperviseur
                    ? "Gérer les pièces exigées"
                    : "Consulter les pièces requises"}
                </span>
              </button>

              {estEncoreOuvert && onSouscrire && (
                <button
                  type="button"
                  onClick={() => {
                    setOuvert(false);
                    onSouscrire?.();
                  }}
                  className="hover:text-brand-orange mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-t border-slate-100/70 px-3 py-2 pt-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-orange-50"
                >
                  <Plus size={14} className="text-slate-400" />
                  <span>Inscrire un apprenant</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT LIGNE DE TABLEAU ERGONOMIQUE POUR GRAND VOLUME DE CONCOURS
// ─────────────────────────────────────────────────────────────────────────────

function ConcoursTableRow({
  concours,
  index,
  isSuperviseur,
  onGererPieces,
  onSouscrire,
}: {
  concours: Concours;
  index: number;
  isSuperviseur: boolean;
  onGererPieces: () => void;
  /** Absent : l'utilisateur ne peut pas souscrire. */
  onSouscrire?: () => void;
}) {
  const { data: pieces = [], isLoading: chargementPieces } =
    usePiecesDuConcours(concours.id);

  const coutTotal = useMemo(() => {
    return pieces.reduce((sum, p) => sum + (p.montant || 0), 0);
  }, [pieces]);

  const compteAReboursCentre = useMemo(
    () => calculerCompteARebours(concours.dateLimiteRecevabiliteCentre),
    [concours.dateLimiteRecevabiliteCentre],
  );

  const compteAReboursOfficiel = useMemo(
    () => calculerCompteARebours(concours.dateLimiteDepot),
    [concours.dateLimiteDepot],
  );

  const dateCentre = new Date(concours.dateLimiteRecevabiliteCentre);
  const dateOfficielle = new Date(concours.dateLimiteDepot);
  const estEncoreOuvert = !compteAReboursOfficiel.estPasse;

  return (
    <tr
      key={concours.id}
      className="group transition-colors hover:bg-slate-50/70"
    >
      <td className="px-4 py-3.5 text-center font-mono text-[11px] font-semibold text-slate-400">
        {String(index + 1).padStart(2, "0")}
      </td>

      <td className="px-4 py-3.5">
        <div className="space-y-0.5">
          <span className="block text-xs font-bold text-slate-900">
            {concours.nom}
          </span>
          <span className="block text-[10px] font-normal text-slate-400">
            Session officielle
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            !estEncoreOuvert
              ? "bg-slate-500/10 text-slate-500"
              : compteAReboursCentre.estPasse
                ? "bg-amber-500/10 text-amber-700"
                : compteAReboursCentre.estUrgent
                  ? "bg-amber-500/10 text-amber-800"
                  : "bg-emerald-500/10 text-emerald-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              !estEncoreOuvert
                ? "bg-slate-400"
                : compteAReboursCentre.estPasse
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
          />
          {!estEncoreOuvert
            ? "Clos"
            : compteAReboursCentre.estPasse
              ? "Clos centre"
              : "Ouvert"}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-semibold text-slate-800">
            {dateCentre.toLocaleDateString("fr-FR")}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {compteAReboursCentre.court || compteAReboursCentre.texte}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-semibold text-slate-800">
            {dateOfficielle.toLocaleDateString("fr-FR")}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {compteAReboursOfficiel.court || compteAReboursOfficiel.texte}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5 text-center">
        <span className="text-xs font-medium text-slate-600">
          {chargementPieces
            ? "..."
            : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""}`}
        </span>
      </td>

      <td className="px-4 py-3.5 text-right">
        <span className="font-mono text-xs font-semibold text-slate-900">
          {chargementPieces ? "..." : `${FCFA.format(coutTotal)} FCFA`}
        </span>
      </td>

      {/* Actions épurées : bouton principal et menu contextuel */}
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end">
          <ConcoursActionMenu
            isSuperviseur={isSuperviseur}
            estEncoreOuvert={estEncoreOuvert}
            onGererPieces={onGererPieces}
            onSouscrire={onSouscrire}
          />
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT CARTE BENTO GRID CONCOURS (Léger, moderne et aéré)
// ─────────────────────────────────────────────────────────────────────────────

function ConcoursCampagneCard({
  concours,
  isSuperviseur,
  onGererPieces,
  onSouscrire,
}: {
  concours: Concours;
  isSuperviseur: boolean;
  onGererPieces: () => void;
  onSouscrire?: () => void;
}) {
  const { data: pieces = [], isLoading: chargementPieces } =
    usePiecesDuConcours(concours.id);

  const coutTotal = useMemo(() => {
    return pieces.reduce((sum, p) => sum + (p.montant || 0), 0);
  }, [pieces]);

  const compteAReboursCentre = useMemo(
    () => calculerCompteARebours(concours.dateLimiteRecevabiliteCentre),
    [concours.dateLimiteRecevabiliteCentre],
  );

  const compteAReboursOfficiel = useMemo(
    () => calculerCompteARebours(concours.dateLimiteDepot),
    [concours.dateLimiteDepot],
  );

  const dateCentre = new Date(concours.dateLimiteRecevabiliteCentre);
  const dateOfficielle = new Date(concours.dateLimiteDepot);
  const estEncoreOuvert = !compteAReboursOfficiel.estPasse;

  return (
    <div className="hover:border-brand-orange/40 group flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:shadow-md">
      <div className="space-y-3.5">
        {/* En-tête Bento : Titre & Statut soft badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="truncate text-sm leading-snug font-bold text-slate-900">
              {concours.nom}
            </h4>
            <span className="block text-[11px] text-slate-400">
              {chargementPieces
                ? "Calcul des pièces..."
                : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""} exigée${pieces.length > 1 ? "s" : ""}`}
            </span>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              !estEncoreOuvert
                ? "bg-slate-500/10 text-slate-500"
                : compteAReboursCentre.estPasse
                  ? "bg-amber-500/10 text-amber-700"
                  : compteAReboursCentre.estUrgent
                    ? "bg-amber-500/10 text-amber-800"
                    : "bg-emerald-500/10 text-emerald-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                !estEncoreOuvert
                  ? "bg-slate-400"
                  : compteAReboursCentre.estPasse
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            {!estEncoreOuvert
              ? "Clos"
              : compteAReboursCentre.estPasse
                ? "Clos centre"
                : "Ouvert"}
          </span>
        </div>

        {/* ── Bento Grid Intérieure : Coût et Délais légers sans bordures épaisses ── */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Bento Cellule 1 : Coût total */}
          <div className="flex flex-col justify-between rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Coût dossier
            </span>
            <div className="mt-1">
              <span className="text-brand-orange block font-mono text-sm font-bold">
                {chargementPieces ? "..." : `${FCFA.format(coutTotal)} FCFA`}
              </span>
              <span className="text-[10px] text-slate-400">
                Frais standards
              </span>
            </div>
          </div>

          {/* Bento Cellule 2 : Pièces exigées */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Pièces requises
            </span>
            <div className="mt-1">
              <span className="block font-mono text-sm font-bold text-slate-800">
                {chargementPieces
                  ? "..."
                  : `${pieces.length} document${pieces.length > 1 ? "s" : ""}`}
              </span>
              <button
                type="button"
                onClick={onGererPieces}
                className="text-brand-orange cursor-pointer text-[10px] font-semibold hover:underline"
              >
                {isSuperviseur ? "Configurer" : "Consulter"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Calendrier & Délais avec indicateurs textuels discrets ── */}
        <div className="space-y-2 rounded-xl border border-slate-100/90 bg-slate-50/70 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <Clock size={12} className="shrink-0 text-slate-400" />
              Recevabilité centre :
            </span>
            <div className="text-right">
              <span className="block font-mono text-[11px] font-bold text-slate-800">
                {dateCentre.toLocaleDateString("fr-FR")}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {compteAReboursCentre.court || compteAReboursCentre.texte}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 text-slate-600">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <Clock size={12} className="shrink-0 text-slate-400" />
              Dépôt officiel :
            </span>
            <div className="text-right">
              <span className="block font-mono text-[11px] font-bold text-slate-800">
                {dateOfficielle.toLocaleDateString("fr-FR")}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {compteAReboursOfficiel.court || compteAReboursOfficiel.texte}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de carte avec actions unifiées */}
      <div className="flex items-center justify-between border-t border-slate-100/80 pt-2">
        <button
          type="button"
          onClick={onGererPieces}
          className="hover:text-brand-orange flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors"
        >
          <FileText size={13} className="text-slate-400" />
          <span>
            {isSuperviseur ? "Gérer les pièces" : "Pièces du dossier"}
          </span>
        </button>

        {onSouscrire && (
          <ConcoursActionMenu
            isSuperviseur={isSuperviseur}
            estEncoreOuvert={estEncoreOuvert}
            onGererPieces={onGererPieces}
            onSouscrire={onSouscrire}
          />
        )}
      </div>
    </div>
  );
}
