"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQueries } from "@tanstack/react-query";
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
import { Button, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import {
  useDossiers,
  useConcoursSession,
  usePiecesRequises,
  useDesactiverPieceRequise,
  useReactiverPieceRequise,
  useCreerPieceRequise,
  usePiecesDuConcours,
  listConcoursDuDossier,
  SouscrireDossierModal,
  CreerConcoursModal,
  CreerModifierPieceModal,
  GererPiecesConcoursModal,
  ProgressionPiecesDossierCell,
  DateLimiteDepotDossierCell,
  calculerCompteARebours,
  type Dossier,
  type Concours,
  type PieceRequise,
} from "@/modules/dossiers";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { useApprenants, type Apprenant } from "@/modules/apprenants";

const FCFA = new Intl.NumberFormat("fr-FR");

const STATUT_BADGES: Record<Dossier["statut"], { label: string; dot: string; bg: string; text: string }> = {
  OUVERT: { label: "En cours", dot: "bg-amber-600", bg: "bg-amber-50 border border-amber-200", text: "text-amber-800" },
  COMPLET: { label: "Complet", dot: "bg-emerald-600", bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-800" },
  CLOTURE: { label: "Clôturé", dot: "bg-slate-400", bg: "bg-slate-100 border border-slate-200", text: "text-slate-700" },
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
  onRattacherConcours: (apprenantId: string) => void;
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
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
            className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200/90 z-40 text-left animate-in fade-in slide-in-from-top-1"
          >
            <Link
              href={`/dossiers/${dossierId}`}
              onClick={() => setOuvert(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-orange rounded-lg transition-colors"
            >
              <FolderOpen size={13} className="text-slate-400" />
              <span>Gérer le dossier</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setOuvert(false);
                onRattacherConcours(apprenantId);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-brand-orange rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={13} className="text-brand-orange" />
              <span>Rattacher un concours</span>
            </button>

            <Link
              href={`/apprenants/${apprenantId}`}
              onClick={() => setOuvert(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
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

  const isSuperviseur = role === "SUPERVISEUR_DOSSIERS" || role === "DIRECTEUR" || role === "DIRECTEUR_ACADEMIQUE";

  // Navigation par 3 onglets au même niveau : suivi, campagnes, catalogue pièces
  const [onglet, setOnglet] = useState<"suivi" | "campagnes" | "pieces">("suivi");

  // Données transverses
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id || "";

  const { data: centres = [] } = useCentres();
  const { data: formations = [] } = useFormations();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();

  // Centre filtré (verrouillé si chef de centre ou chargé de dossier)
  const [centreSelectionne, setCentreSelectionne] = useState<string>(
    !isSuperviseur && userCentreId ? userCentreId : "",
  );

  // Filtres onglet suivi
  const [recherche, setRecherche] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<string>("TOUS");
  const [formationFiltre, setFormationFiltre] = useState<string>("");

  // Données dossiers & concours
  const { data: dossiers = [], isLoading: chargementDossiers, refetch: refetchDossiers } = useDossiers(
    sessionId || undefined,
    centreSelectionne || undefined,
  );
  const { data: concoursList = [], isLoading: chargementConcours, refetch: refetchConcours } = useConcoursSession(
    sessionId || undefined,
  );
  const { data: cataloguePieces = [], refetch: refetchPieces } = usePiecesRequises();

  // Mutations
  const desactiverPieceMutation = useDesactiverPieceRequise();
  const reactiverPieceMutation = useReactiverPieceRequise();
  const creerPieceMutation = useCreerPieceRequise();

  // Modals
  const [modalSouscrireOuverte, setModalSouscrireOuverte] = useState(false);
  const [apprenantPourNouveauConcoursId, setApprenantPourNouveauConcoursId] = useState<string | null>(null);
  const [modalCreerConcoursOuverte, setModalCreerConcoursOuverte] = useState(false);
  const [modalPieceOuverte, setModalPieceOuverte] = useState(false);
  const [pieceAEditer, setPieceAEditer] = useState<PieceRequise | null>(null);
  const [concoursPourPieces, setConcoursPourPieces] = useState<Concours | null>(null);
  const [isInitializingPieces, setIsInitializingPieces] = useState(false);
  const [recherchePieceCatalogue, setRecherchePieceCatalogue] = useState("");

  // Tri du catalogue de pièces
  type ColonneTriPieces = "nom" | "montant" | "actif";
  const [triPieceColonne, setTriPieceColonne] = useState<ColonneTriPieces>("nom");
  const [triPieceDirection, setTriPieceDirection] = useState<SortDirection>("asc");

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
    const filtered = cataloguePieces.filter((p) => (!q ? true : p.nom.toLowerCase().includes(q)));
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
  }, [cataloguePieces, recherchePieceCatalogue, triPieceColonne, triPieceDirection]);

  // Mode d'affichage et filtres pour les campagnes de concours (Tableau par défaut pour grand volume)
  const [vueConcours, setVueConcours] = useState<"table" | "cards">("table");
  const [filtreStatutConcours, setFiltreStatutConcours] = useState<"TOUS" | "OUVERT" | "URGENT" | "CLOS">("TOUS");

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
  type ColonneTriConcours = "nom" | "statut" | "recevabilite" | "depot" | "cout";
  const [triConcoursColonne, setTriConcoursColonne] = useState<ColonneTriConcours>("nom");
  const [triConcoursDirection, setTriConcoursDirection] = useState<SortDirection>("asc");

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
        if (filtreStatutConcours === "URGENT" && (!cd.estUrgent || cd.estPasse)) return false;
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
        cmp = compareDates(a.dateLimiteRecevabiliteCentre, b.dateLimiteRecevabiliteCentre);
      } else if (triConcoursColonne === "depot") {
        cmp = compareDates(a.dateLimiteDepot, b.dateLimiteDepot);
      }
      return triConcoursDirection === "asc" ? cmp : -cmp;
    });
  }, [concoursList, rechercheConcours, filtreStatutConcours, triConcoursColonne, triConcoursDirection]);

  // Apprenants mappés par ID pour enrichir les lignes du tableau
  const apprenantsParId = useMemo(() => {
    const map = new Map<string, Apprenant>();
    apprenants.forEach((a) => map.set(a.id, a));
    return map;
  }, [apprenants]);

  // Tri des dossiers
  type ColonneTriDossiers = "apprenant" | "centre" | "filiere" | "date" | "dateLimite" | "statut";
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

  // Requêtes en parallèle pour obtenir les concours de chaque dossier (partage le cache avec les cellules du tableau)
  const concoursDossiersQueries = useQueries({
    queries: dossiers.map((d) => ({
      queryKey: ["dossier-concours", d.id],
      queryFn: () => listConcoursDuDossier(d.id),
      enabled: Boolean(d.id),
      staleTime: 30000,
    })),
  });

  // Map dossierId -> date limite la plus proche (string ISO)
  const datesLimitesParDossier = useMemo(() => {
    const map = new Map<string, string>();
    if (concoursList.length === 0 || dossiers.length === 0) return map;

    const catalogueMap = new Map(concoursList.map((c) => [c.id, c]));

    dossiers.forEach((dossier, idx) => {
      const concoursDuDossier = concoursDossiersQueries[idx]?.data;
      if (!concoursDuDossier || concoursDuDossier.length === 0) return;

      const concoursAssocies = concoursDuDossier
        .map((dc) => catalogueMap.get(dc.concoursId))
        .filter((c): c is Concours => Boolean(c));

      if (concoursAssocies.length === 0) return;

      // Trier par échéance la plus proche
      concoursAssocies.sort(
        (a, b) => new Date(a.dateLimiteDepot).getTime() - new Date(b.dateLimiteDepot).getTime(),
      );

      map.set(dossier.id, concoursAssocies[0].dateLimiteDepot);
    });

    return map;
  }, [dossiers, concoursDossiersQueries, concoursList]);

  // Dossiers filtrés et triés
  const dossiersFiltres = useMemo(() => {
    const list = dossiers.filter((dossier) => {
      // Filtre statut
      if (statutFiltre !== "TOUS" && dossier.statut !== statutFiltre) {
        return false;
      }

      // Apprenant associé
      const app = apprenantsParId.get(dossier.apprenantId);

      // Filtre formation
      if (formationFiltre && app && app.formationId !== formationFiltre) {
        return false;
      }

      // Filtre recherche
      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const nom = app?.nom?.toLowerCase() || "";
        const prenom = app?.prenom?.toLowerCase() || "";
        const recu = app?.referenceRecu?.toLowerCase() || "";
        const obs = dossier.observation?.toLowerCase() || "";
        if (!nom.includes(q) && !prenom.includes(q) && !recu.includes(q) && !obs.includes(q)) {
          return false;
        }
      }

      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "apprenant") {
        const appA = apprenantsParId.get(a.apprenantId);
        const appB = apprenantsParId.get(b.apprenantId);
        const nomA = appA ? `${appA.nom} ${appA.prenom}` : "";
        const nomB = appB ? `${appB.nom} ${appB.prenom}` : "";
        cmp = compareStrings(nomA, nomB);
      } else if (triColonne === "centre") {
        const centreA = centres.find((c) => c.id === a.centreId)?.nom || "";
        const centreB = centres.find((c) => c.id === b.centreId)?.nom || "";
        cmp = compareStrings(centreA, centreB);
      } else if (triColonne === "filiere") {
        const appA = apprenantsParId.get(a.apprenantId);
        const appB = apprenantsParId.get(b.apprenantId);
        const formA = formations.find((f) => f.id === appA?.formationId)?.nom || "";
        const formB = formations.find((f) => f.id === appB?.formationId)?.nom || "";
        cmp = compareStrings(formA, formB);
      } else if (triColonne === "date") {
        cmp = compareDates(a.dateOuverture, b.dateOuverture);
      } else if (triColonne === "dateLimite") {
        const dateA = datesLimitesParDossier.get(a.id);
        const dateB = datesLimitesParDossier.get(b.id);
        if (!dateA && !dateB) {
          cmp = 0;
        } else if (!dateA) {
          return 1;
        } else if (!dateB) {
          return -1;
        } else {
          cmp = compareDates(dateA, dateB);
        }
      } else if (triColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [
    dossiers,
    statutFiltre,
    formationFiltre,
    recherche,
    apprenantsParId,
    triColonne,
    triDirection,
    centres,
    formations,
    datesLimitesParDossier,
  ]);

  // KPIs synthétiques
  const kpis = useMemo(() => {
    const total = dossiers.length;
    const ouverts = dossiers.filter((d) => d.statut === "OUVERT").length;
    const complets = dossiers.filter((d) => d.statut === "COMPLET").length;
    const clotures = dossiers.filter((d) => d.statut === "CLOTURE").length;
    return { total, ouverts, complets, clotures };
  }, [dossiers]);

  // Handler pour initialiser le catalogue standard
  async function handleInitialiserPiecesStandard() {
    setIsInitializingPieces(true);
    try {
      const existantes = new Set(cataloguePieces.map((p) => p.nom.toLowerCase().trim()));
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
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-2xs transition-colors cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Sparkles size={13} className="text-brand-orange" />
                  <span>{isInitializingPieces ? "Chargement..." : "Initialiser pièces types"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPieceAEditer(null);
                  setModalPieceOuverte(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Ajouter une pièce</span>
              </button>
            </div>
          )}

          {onglet === "suivi" && (
            <button
              type="button"
              onClick={() => setModalSouscrireOuverte(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Inscrire un apprenant</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3 Onglets de Navigation au Même Niveau ── */}
      <div className="border-b border-slate-200 flex flex-wrap gap-4 sm:gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setOnglet("suivi")}
          className={`flex items-center gap-2 border-b-2 py-2 transition-colors cursor-pointer ${
            onglet === "suivi"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FolderOpen size={14} />
          <span>Suivi des Dossiers</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600">
            {dossiers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOnglet("campagnes")}
          className={`flex items-center gap-2 border-b-2 py-2 transition-colors cursor-pointer ${
            onglet === "campagnes"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award size={14} />
          <span>Campagnes de Concours</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600">
            {concoursList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOnglet("pieces")}
          className={`flex items-center gap-2 border-b-2 py-2 transition-colors cursor-pointer ${
            onglet === "pieces"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText size={14} />
          <span>Catalogue des Pièces</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600">
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setStatutFiltre("TOUS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  statutFiltre === "TOUS"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <span>Total dossiers</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono font-bold ${
                    statutFiltre === "TOUS" ? "bg-white/20 text-white" : "bg-white text-slate-700 shadow-2xs"
                  }`}
                >
                  {kpis.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatutFiltre(statutFiltre === "OUVERT" ? "TOUS" : "OUVERT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  statutFiltre === "OUVERT"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-500/10 text-amber-800 hover:bg-amber-500/15"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>En cours</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono font-bold ${
                    statutFiltre === "OUVERT" ? "bg-white/20 text-white" : "bg-white text-amber-800 shadow-2xs"
                  }`}
                >
                  {kpis.ouverts}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatutFiltre(statutFiltre === "COMPLET" ? "TOUS" : "COMPLET")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  statutFiltre === "COMPLET"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Complets</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono font-bold ${
                    statutFiltre === "COMPLET" ? "bg-white/20 text-white" : "bg-white text-emerald-800 shadow-2xs"
                  }`}
                >
                  {kpis.complets}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatutFiltre(statutFiltre === "CLOTURE" ? "TOUS" : "CLOTURE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  statutFiltre === "CLOTURE"
                    ? "bg-slate-600 text-white shadow-2xs"
                    : "bg-slate-500/10 text-slate-700 hover:bg-slate-500/15"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span>Clôturés</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono font-bold ${
                    statutFiltre === "CLOTURE" ? "bg-white/20 text-white" : "bg-white text-slate-700 shadow-2xs"
                  }`}
                >
                  {kpis.clotures}
                </span>
              </button>
            </div>

            {/* Progression globale discrète */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pr-2">
              <span className="font-medium text-slate-400">Complétion :</span>
              <span className="font-mono font-bold text-slate-800">
                {kpis.total > 0 ? Math.round((kpis.complets / kpis.total) * 100) : 0}%
              </span>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${kpis.total > 0 ? (kpis.complets / kpis.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── 2. Barre de Filtres Unifiée & Extensible ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Recherche intégrée avec bouton de nettoyage */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par élève, reçu, note..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all placeholder:text-slate-400"
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
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
                  <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={centreSelectionne}
                    onChange={(e) => setCentreSelectionne(e.target.value)}
                    className="pl-8 pr-7 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange appearance-none cursor-pointer font-medium text-slate-700"
                  >
                    <option value="">Tous les centres ({centres.length})</option>
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/90 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200/80 shrink-0">
                  <Building2 size={13} className="text-brand-orange" />
                  <span className="max-w-[140px] truncate">
                    {centres.find((c) => c.id === userCentreId)?.nom || "Mon centre"}
                  </span>
                </div>
              )}

              {/* Filtre Filière */}
              <div className="relative shrink-0">
                <GraduationCap size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={formationFiltre}
                  onChange={(e) => setFormationFiltre(e.target.value)}
                  className="pl-8 pr-7 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange appearance-none cursor-pointer font-medium text-slate-700"
                >
                  <option value="">Toutes les filières</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Réinitialisation rapide si des filtres sont actifs */}
              {(recherche || formationFiltre || (isSuperviseur && centreSelectionne) || statutFiltre !== "TOUS") && (
                <button
                  type="button"
                  onClick={() => {
                    setRecherche("");
                    setFormationFiltre("");
                    setStatutFiltre("TOUS");
                    if (isSuperviseur) setCentreSelectionne("");
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw size={12} />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {/* ── 3. Tableau de Suivi Aéré & Lignes Épurées ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            {chargementDossiers || chargementApprenants ? (
              <div className="p-12 text-center space-y-3">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-r-transparent" />
                <p className="text-xs text-slate-400">Chargement des dossiers souscrits...</p>
              </div>
            ) : dossiersFiltres.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto">
                  <FolderOpen size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Aucun dossier trouvé</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Aucun apprenant n&rsquo;a encore de dossier correspondant à ces filtres. Cliquez sur
                  &laquo; Inscrire un apprenant &raquo; pour initier une première souscription.
                </p>
                <Button
                  type="button"
                  onClick={() => setModalSouscrireOuverte(true)}
                  className="bg-brand-orange text-white text-xs mt-2"
                >
                  <Plus size={14} className="mr-1" /> Inscrire un apprenant
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
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
                      <th className="py-3 px-3.5 w-[16%] min-w-[135px]">Progression pièces</th>
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
                      <th className="py-3 px-3.5 w-[14%]">Observation</th>
                      <th className="py-3 px-3.5 text-right w-[60px] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {dossiersFiltres.map((dossier) => {
                      const apprenant = apprenantsParId.get(dossier.apprenantId);
                      const centre = centres.find((c) => c.id === dossier.centreId);
                      const formation = formations.find((f) => f.id === apprenant?.formationId);
                      const badge = STATUT_BADGES[dossier.statut];
                      const initiales = `${apprenant?.nom?.[0] || ""}${apprenant?.prenom?.[0] || ""}`.toUpperCase() || "E";
                      const obsInfo = nettoyerObservation(dossier.observation, formation?.nom, badge.label);

                      return (
                        <tr key={dossier.id} className="hover:bg-slate-50/60 transition-colors group">
                          {/* 1. Apprenant : compact et unifié */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px] border border-slate-200/80"
                                title={apprenant ? `${apprenant.nom} ${apprenant.prenom}` : "Élève inconnu"}
                              >
                                {initiales}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/dossiers/${dossier.id}`}
                                  className="font-bold text-slate-900 hover:text-brand-orange hover:underline transition-colors block text-xs truncate"
                                  title={apprenant ? `${apprenant.nom} ${apprenant.prenom}` : "Élève inconnu"}
                                >
                                  {apprenant ? `${apprenant.nom} ${apprenant.prenom}` : "Élève inconnu"}
                                </Link>
                                {apprenant?.referenceRecu && (
                                  <span
                                    className="text-[10px] text-slate-400 font-mono block truncate"
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
                            <td className="py-3 px-3.5">
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                                <Building2 size={13} className="text-slate-400 shrink-0" />
                                <span className="truncate">{centre?.nom || "—"}</span>
                              </span>
                            </td>
                          )}

                          {/* Formation / Filière */}
                          <td className="py-3 px-3.5">
                            <span className="text-slate-600 font-medium truncate block" title={formation?.nom || "—"}>
                              {formation?.nom || "—"}
                            </span>
                          </td>

                          {/* 2. Progression pièces : composant graphique uniforme */}
                          <td className="py-3 px-3.5">
                            <ProgressionPiecesDossierCell
                              dossierId={dossier.id}
                              statut={dossier.statut}
                            />
                          </td>

                          {/* Date ouverture */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="text-slate-500 font-mono text-[11px]">
                              {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
                            </span>
                          </td>

                          {/* 3. Date limite de dépôt pour chaque concours */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <DateLimiteDepotDossierCell
                              dossierId={dossier.id}
                              concoursCatalogue={concoursList}
                            />
                          </td>

                          {/* Statut avec Soft Badge */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          {/* 4. Observation : allégée, sans redondances */}
                          <td className="py-3 px-3.5 max-w-[180px]">
                            {obsInfo ? (
                              <div className="flex items-center gap-1.5 min-w-0" title={obsInfo.texte}>
                                {obsInfo.estAlerte ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 truncate">
                                    <AlertCircle size={10} className="text-amber-600 shrink-0" />
                                    <span className="truncate">{obsInfo.texte}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs truncate block font-medium">
                                    {obsInfo.texte}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px] block">
                                Aucune note
                              </span>
                            )}
                          </td>

                          {/* 5. Actions : harmonisées (Gérer + Menu contextuel) */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <DossierActionMenu
                              dossierId={dossier.id}
                              apprenantId={dossier.apprenantId}
                              onRattacherConcours={(appId) => {
                                setApprenantPourNouveauConcoursId(appId);
                                setModalSouscrireOuverte(true);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award size={17} className="text-brand-orange" />
                  Campagnes de concours &middot; Session {sessionActive?.annee || ""}
                </h3>
                <p className="text-xs text-slate-500">
                  {concoursList.length} concours répertorié{concoursList.length > 1 ? "s" : ""}. Vue optimisée pour grand catalogue avec dates et coûts.
                </p>
              </div>

              {/* Commutateur de vue : Tableau (par défaut) vs Cartes */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setVueConcours("table")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      vueConcours === "table"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="Vue ergonomique en tableau (recommandée pour grand volume)"
                  >
                    <List size={14} className={vueConcours === "table" ? "text-brand-orange" : ""} />
                    <span>Tableau</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVueConcours("cards")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      vueConcours === "cards"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="Vue en cartes"
                  >
                    <LayoutGrid size={14} className={vueConcours === "cards" ? "text-brand-orange" : ""} />
                    <span>Cartes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filtres rapides et recherche */}
            {concoursList.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                {/* Pastilles de statut rapides */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFiltreStatutConcours("TOUS")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un concours..."
                    value={rechercheConcours}
                    onChange={(e) => setRechercheConcours(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
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
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
              <Award size={28} className="text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Aucun concours programmé pour cette session</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Le superviseur ou directeur peut programmer les concours lancés cette année en définissant les
                délais et les pièces requises.
              </p>
              {isSuperviseur && (
                <Button
                  type="button"
                  onClick={() => setModalCreerConcoursOuverte(true)}
                  className="bg-brand-orange text-white text-xs mt-2"
                >
                  Programmer le premier concours
                </Button>
              )}
            </div>
          ) : concoursFiltres.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 bg-white">
              Aucun concours ne correspond à vos filtres &laquo; {rechercheConcours || "Sélection actuelle"} &raquo;.
            </div>
          ) : vueConcours === "table" ? (
            /* ── VUE TABLEAU : Haute ergonomie pour grand volume de concours ── */
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
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
                      <th className="py-3 px-4 text-center">Pièces</th>
                      <SortableHeader
                        label="Coût dossier"
                        sortKey="cout"
                        currentSortKey={triConcoursColonne}
                        direction={triConcoursDirection}
                        onSort={handleTriConcours}
                        align="right"
                      />
                      <th className="py-3 px-4 text-right w-44">Actions</th>
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
                        onSouscrire={() => setModalSouscrireOuverte(true)}
                      />
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/70 border-t border-slate-100 text-slate-500 text-[11px] font-medium">
                    <tr>
                      <td colSpan={8} className="py-3 px-4">
                        Total affiché :{" "}
                        <strong className="text-slate-800 font-bold">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concoursFiltres.map((concours) => (
                <ConcoursCampagneCard
                  key={concours.id}
                  concours={concours}
                  isSuperviseur={isSuperviseur}
                  onGererPieces={() => setConcoursPourPieces(concours)}
                  onSouscrire={() => setModalSouscrireOuverte(true)}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={17} className="text-brand-orange" />
                Catalogue des Pièces Administratives & Tarifs
              </h3>
              <p className="text-xs text-slate-500">
                Référentiel standard des pièces administratives et leurs tarifs applicables.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {cataloguePieces.length > 0 && (
                <div className="relative w-48 sm:w-60">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Filtrer les pièces..."
                    value={recherchePieceCatalogue}
                    onChange={(e) => setRecherchePieceCatalogue(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all placeholder:text-slate-400"
                  />
                  {recherchePieceCatalogue && (
                    <button
                      type="button"
                      onClick={() => setRecherchePieceCatalogue("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
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
                  className="text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles size={13} className="text-brand-orange" />
                  <span>{isInitializingPieces ? "Chargement..." : "Initialiser pièces types"}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Tableau du catalogue de pièces épuré */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
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
                  {isSuperviseur && <th className="py-3 px-4 text-right w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {cataloguePieces.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperviseur ? 5 : 4} className="p-10 text-center text-slate-400">
                      Aucune pièce dans le catalogue. Cliquez sur &laquo; Initialiser pièces types &raquo; pour
                      charger la liste standard.
                    </td>
                  </tr>
                ) : cataloguePiecesTriees.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperviseur ? 5 : 4} className="p-10 text-center text-slate-400">
                      Aucune pièce ne correspond à votre recherche &laquo; {recherchePieceCatalogue} &raquo;.
                    </td>
                  </tr>
                ) : (
                  cataloguePiecesTriees.map((piece, index) => {
                    return (
                      <tr
                        key={piece.id}
                        className="transition-colors hover:bg-slate-50/70 group"
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] font-semibold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0">
                              <FileText size={15} />
                            </div>
                            <span className="font-semibold text-slate-900 text-xs">
                              {piece.nom}
                            </span>
                          </div>
                        </td>
                        {/* Tarif en police semi-bold avec hiérarchie claire */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-semibold font-mono text-slate-900 text-xs">
                            {FCFA.format(piece.montant)} FCFA
                          </span>
                        </td>
                        {/* Statut aligné proprement sur la droite avec soft badge */}
                        <td className="py-3.5 px-4 text-right pr-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              piece.actif
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-slate-500/10 text-slate-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                piece.actif ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {piece.actif ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {/* Actions directes au survol de la ligne */}
                        {isSuperviseur && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPieceAEditer(piece);
                                  setModalPieceOuverte(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                title="Modifier libellé ou tarif"
                              >
                                <Edit2 size={14} />
                              </button>

                              {piece.actif ? (
                                <button
                                  type="button"
                                  onClick={() => desactiverPieceMutation.mutate(piece.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Désactiver cette pièce"
                                >
                                  <Power size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => reactiverPieceMutation.mutate(piece.id)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
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
                <tfoot className="bg-slate-50/70 border-t border-slate-100 text-slate-500 text-[11px] font-medium">
                  <tr>
                    <td colSpan={2} className="py-3 px-4">
                      Total répertorié :{" "}
                      <strong className="text-slate-800 font-bold">
                        {cataloguePiecesTriees.length} pièce{cataloguePiecesTriees.length > 1 ? "s" : ""}
                      </strong>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {FCFA.format(
                        cataloguePiecesTriees.reduce((acc, p) => acc + (p.montant || 0), 0),
                      )}{" "}
                      FCFA
                    </td>
                    <td colSpan={isSuperviseur ? 2 : 1} className="py-3 px-4 text-right pr-6 text-slate-400">
                      {cataloguePiecesTriees.filter((p) => p.actif).length} active(s) sur{" "}
                      {cataloguePiecesTriees.length}
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
  onSouscrire: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Action principale prioritaire */}
      {estEncoreOuvert ? (
        <button
          type="button"
          onClick={onSouscrire}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange/90 rounded-xl transition-all shadow-2xs cursor-pointer"
          title="Souscrire un candidat à ce concours"
        >
          <Plus size={13} />
          <span>Souscrire</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onGererPieces}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          title={isSuperviseur ? "Gérer les pièces exigées" : "Consulter les pièces"}
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
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
              className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200/90 z-40 animate-in fade-in slide-in-from-top-1 text-left"
            >
              <button
                type="button"
                onClick={() => {
                  setOuvert(false);
                  onGererPieces();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-brand-orange rounded-lg transition-colors cursor-pointer"
              >
                <FileText size={14} className="text-slate-400" />
                <span>{isSuperviseur ? "Gérer les pièces exigées" : "Consulter les pièces requises"}</span>
              </button>

              {estEncoreOuvert && (
                <button
                  type="button"
                  onClick={() => {
                    setOuvert(false);
                    onSouscrire();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-brand-orange rounded-lg transition-colors cursor-pointer border-t border-slate-100/70 mt-1 pt-1.5"
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
  onSouscrire: () => void;
}) {
  const { data: pieces = [], isLoading: chargementPieces } = usePiecesDuConcours(concours.id);

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
      className="transition-colors hover:bg-slate-50/70 group"
    >
      <td className="py-3.5 px-4 text-center font-mono text-[11px] font-semibold text-slate-400">
        {String(index + 1).padStart(2, "0")}
      </td>

      <td className="py-3.5 px-4">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-xs block">{concours.nom}</span>
          <span className="text-[10px] text-slate-400 block font-normal">
            Session officielle
          </span>
        </div>
      </td>

      <td className="py-3.5 px-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
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
            className={`w-1.5 h-1.5 rounded-full ${
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

      <td className="py-3.5 px-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-slate-800 font-semibold text-xs">
            {dateCentre.toLocaleDateString("fr-FR")}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {compteAReboursCentre.court || compteAReboursCentre.texte}
          </span>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-slate-800 font-semibold text-xs">
            {dateOfficielle.toLocaleDateString("fr-FR")}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {compteAReboursOfficiel.court || compteAReboursOfficiel.texte}
          </span>
        </div>
      </td>

      <td className="py-3.5 px-4 text-center">
        <span className="font-medium text-slate-600 text-xs">
          {chargementPieces ? "..." : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""}`}
        </span>
      </td>

      <td className="py-3.5 px-4 text-right">
        <span className="font-mono font-semibold text-xs text-slate-900">
          {chargementPieces ? "..." : `${FCFA.format(coutTotal)} FCFA`}
        </span>
      </td>

      {/* Actions épurées : bouton principal et menu contextuel */}
      <td className="py-3.5 px-4 text-right">
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
  const { data: pieces = [], isLoading: chargementPieces } = usePiecesDuConcours(concours.id);

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
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs hover:border-brand-orange/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
      <div className="space-y-3.5">
        {/* En-tête Bento : Titre & Statut soft badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="space-y-0.5 flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">
              {concours.nom}
            </h4>
            <span className="text-[11px] text-slate-400 block">
              {chargementPieces
                ? "Calcul des pièces..."
                : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""} exigée${pieces.length > 1 ? "s" : ""}`}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
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
              className={`w-1.5 h-1.5 rounded-full ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Bento Cellule 1 : Coût total */}
          <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Coût dossier
            </span>
            <div className="mt-1">
              <span className="font-mono font-bold text-sm text-brand-orange block">
                {chargementPieces ? "..." : `${FCFA.format(coutTotal)} FCFA`}
              </span>
              <span className="text-[10px] text-slate-400">
                Frais standards
              </span>
            </div>
          </div>

          {/* Bento Cellule 2 : Pièces exigées */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pièces requises
            </span>
            <div className="mt-1">
              <span className="font-mono font-bold text-sm text-slate-800 block">
                {chargementPieces ? "..." : `${pieces.length} document${pieces.length > 1 ? "s" : ""}`}
              </span>
              <button
                type="button"
                onClick={onGererPieces}
                className="text-[10px] font-semibold text-brand-orange hover:underline cursor-pointer"
              >
                {isSuperviseur ? "Configurer" : "Consulter"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Calendrier & Délais avec indicateurs textuels discrets ── */}
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100/90 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock size={12} className="text-slate-400 shrink-0" />
              Recevabilité centre :
            </span>
            <div className="text-right">
              <span className="font-mono font-bold text-slate-800 text-[11px] block">
                {dateCentre.toLocaleDateString("fr-FR")}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {compteAReboursCentre.court || compteAReboursCentre.texte}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200/50 pt-2 flex items-center justify-between text-slate-600">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock size={12} className="text-slate-400 shrink-0" />
              Dépôt officiel :
            </span>
            <div className="text-right">
              <span className="font-mono font-bold text-slate-800 text-[11px] block">
                {dateOfficielle.toLocaleDateString("fr-FR")}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {compteAReboursOfficiel.court || compteAReboursOfficiel.texte}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de carte avec actions unifiées */}
      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between">
        <button
          type="button"
          onClick={onGererPieces}
          className="text-xs font-semibold text-slate-600 hover:text-brand-orange flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <FileText size={13} className="text-slate-400" />
          <span>{isSuperviseur ? "Gérer les pièces" : "Pièces du dossier"}</span>
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
