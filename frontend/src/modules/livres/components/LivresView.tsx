"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Package,
  Coins,
  AlertCircle,
  Loader2,
  Sparkles,
  BarChart3,
  Layers,
  Building2,
  Calendar,
  UserCheck,
  Users,
  ShoppingCart,
  Receipt,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  ShoppingBag,
} from "lucide-react";
import {
  Card,
  Button,
  Modal,
  SkeletonCard,
  SkeletonTable,
  SortableHeader,
  Pagination,
} from "@/shared/ui";
import { TAILLE_PAGE_LISTE } from "@/shared/lib/pagination";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { usePageParCriteres } from "@/shared/hooks/usePageParCriteres";
import {
  compareStrings,
  compareNumbers,
  type SortDirection,
} from "@/shared/lib/sort-utils";
import {
  useLivres,
  useCreerLivre,
  useModifierLivre,
  useSupprimerLivre,
  useRechercheVentesLivres,
  useStatsVentesLivres,
} from "../data/queries";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import { EnregistrerVenteLivreModal } from "./EnregistrerVenteLivreModal";
import type {
  CriteresRechercheVentes,
  TriVentes,
  Livre,
  CreerLivreDTO,
  ModifierLivreDTO,
  VenteLivre,
  VentilationLivreItem,
  VentilationCentreItem,
} from "../domain/types";

const FCFA = new Intl.NumberFormat("fr-FR");

interface LivresViewProps {
  userRole?: string;
  userCentreId?: string;
}

const TRI_VENTES_BACKEND: Record<string, TriVentes> = {
  date: "DATE",
  centre: "CENTRE",
  acheteur: "ACHETEUR",
  type: "TYPE",
  livre: "LIVRE",
  quantite: "QUANTITE",
  prix: "PRIX",
  total: "TOTAL",
};

export function LivresView({ userRole, userCentreId }: LivresViewProps = {}) {
  const { data: authSession } = useSession();
  const roleEffectif = userRole || authSession?.user?.role;
  const userCentreIdEffectif = userCentreId || authSession?.user?.centreId;

  const isChefCentre = roleEffectif === "CHEF_CENTRE";
  const peutGererLivres = roleEffectif === "DIRECTEUR_ACADEMIQUE";
  // La vente est faite par le caissier (permission backend LIVRE_VENDRE) ; le Directeur consulte.
  const peutEnregistrerVente = roleEffectif === "CAISSIER";

  // Navigation par onglets
  const [ongletActif, setOngletActif] = useState<"catalogue" | "bilan">(
    "catalogue",
  );

  // Données de base
  const { data: sessionActive } = useSessionActive();
  const { data: centres = [] } = useCentres();
  const {
    data: livres = [],
    isLoading: livresLoading,
    error: livresError,
  } = useLivres();

  // Mutations catalogue
  const creerLivreMutation = useCreerLivre(roleEffectif);
  const modifierLivreMutation = useModifierLivre(roleEffectif);
  const supprimerLivreMutation = useSupprimerLivre(roleEffectif);

  // Filtres, vue & tris Catalogue
  const [rechercheCatalogue, setRechercheCatalogue] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<
    "TOUS" | "ACTIFS" | "INACTIFS"
  >("TOUS");
  const [vueMode, setVueMode] = useState<"grille" | "tableau">("grille");
  type TriCatalogueOption =
    | "titre-asc"
    | "titre-desc"
    | "prix-asc"
    | "prix-desc"
    | "disponibilite"
    | "recent";
  const [triCatalogue, setTriCatalogue] =
    useState<TriCatalogueOption>("titre-asc");

  function handleTriCatalogueHeader(
    colonne: "titre" | "prix" | "disponibilite",
  ) {
    if (colonne === "titre") {
      setTriCatalogue((prev) =>
        prev === "titre-asc" ? "titre-desc" : "titre-asc",
      );
    } else if (colonne === "prix") {
      setTriCatalogue((prev) =>
        prev === "prix-asc" ? "prix-desc" : "prix-asc",
      );
    } else if (colonne === "disponibilite") {
      setTriCatalogue("disponibilite");
    }
  }

  // Tris des ventes et statistiques
  type TriVenteColonne =
    | "date"
    | "centre"
    | "acheteur"
    | "type"
    | "livre"
    | "quantite"
    | "prix"
    | "total";
  const [triVenteColonne, setTriVenteColonne] =
    useState<TriVenteColonne>("date");
  const [triVenteDirection, setTriVenteDirection] =
    useState<SortDirection>("desc");

  function handleTriVente(colonne: TriVenteColonne) {
    if (triVenteColonne === colonne) {
      setTriVenteDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriVenteColonne(colonne);
      setTriVenteDirection(
        colonne === "date" ||
          colonne === "quantite" ||
          colonne === "prix" ||
          colonne === "total"
          ? "desc"
          : "asc",
      );
    }
  }

  type TriLivreVentesOuvrageColonne = "nom" | "quantite" | "recette" | "part";
  const [triOuvrageColonne, setTriOuvrageColonne] =
    useState<TriLivreVentesOuvrageColonne>("recette");
  const [triOuvrageDirection, setTriOuvrageDirection] =
    useState<SortDirection>("desc");

  function handleTriOuvrage(colonne: TriLivreVentesOuvrageColonne) {
    if (triOuvrageColonne === colonne) {
      setTriOuvrageDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriOuvrageColonne(colonne);
      setTriOuvrageDirection(colonne === "nom" ? "asc" : "desc");
    }
  }

  type TriLivreVentesCentreColonne =
    "centre" | "quantite" | "recette" | "contribution";
  const [triCentreColonne, setTriCentreColonne] =
    useState<TriLivreVentesCentreColonne>("recette");
  const [triCentreDirection, setTriCentreDirection] =
    useState<SortDirection>("desc");

  function handleTriCentre(colonne: TriLivreVentesCentreColonne) {
    if (triCentreColonne === colonne) {
      setTriCentreDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriCentreColonne(colonne);
      setTriCentreDirection(colonne === "centre" ? "asc" : "desc");
    }
  }

  // Modal Catalogue (Création / Edition)
  const [modalCatalogueOuverte, setModalCatalogueOuverte] = useState(false);
  const [livreEnEdition, setLivreEnEdition] = useState<Livre | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState<number | "">("");
  const [actif, setActif] = useState(true);
  const [formErreur, setFormErreur] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal Vente
  const [modalVenteOuverte, setModalVenteOuverte] = useState(false);
  const [livreVentePreselectionne, setLivreVentePreselectionne] = useState<
    string | null
  >(null);

  function ouvrirVente(livreId?: string) {
    setLivreVentePreselectionne(livreId || null);
    setModalVenteOuverte(true);
  }

  // Filtres Traçabilité & Bilans
  // Le Chef de Centre est obligatoirement filtré sur son centre ; les Directeurs voient tout par défaut
  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    isChefCentre ? userCentreIdEffectif || "" : "",
  );
  const [selectedLivreId, setSelectedLivreId] = useState<string>("");
  const [selectedTypeAcheteur, setSelectedTypeAcheteur] = useState<
    "TOUS" | "INTERNE" | "EXTERNE"
  >("TOUS");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [rechercheVente, setRechercheVente] = useState("");

  // Centre effectif pour les requêtes
  const centreIdQuery = isChefCentre
    ? userCentreIdEffectif || ""
    : selectedCentreId || undefined;

  // Données de ventes & statistiques
  const { data: statsVentes, isLoading: statsLoading } = useStatsVentesLivres(
    {
      sessionId: sessionActive?.id || "",
      centreId: centreIdQuery,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    },
    roleEffectif ?? undefined,
    userCentreIdEffectif ?? undefined,
  );

  // Journal des ventes : filtrage (type d'acheteur, texte), tri, pagination et
  // agrégats faits par le backend.
  const rechercheVenteStable = useDebouncedValue(rechercheVente);
  const criteresVentes = useMemo<CriteresRechercheVentes>(
    () => ({
      sessionId: sessionActive?.id || "",
      centreId: centreIdQuery,
      livreId: selectedLivreId || undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      typeAcheteur: selectedTypeAcheteur,
      recherche: rechercheVenteStable.trim() || undefined,
      tri: TRI_VENTES_BACKEND[triVenteColonne],
      sens: triVenteDirection === "asc" ? "ASC" : "DESC",
    }),
    [
      sessionActive?.id,
      centreIdQuery,
      selectedLivreId,
      dateDebut,
      dateFin,
      selectedTypeAcheteur,
      rechercheVenteStable,
      triVenteColonne,
      triVenteDirection,
    ],
  );
  const [pageVentes, setPageVentes] = usePageParCriteres(
    JSON.stringify(criteresVentes),
  );
  const {
    data: resultatVentes,
    isLoading: ventesLoading,
    error: ventesError,
  } = useRechercheVentesLivres(
    criteresVentes,
    pageVentes - 1,
    TAILLE_PAGE_LISTE,
    roleEffectif ?? undefined,
    userCentreIdEffectif ?? undefined,
  );
  const ventesPage = resultatVentes?.page.contenu ?? [];
  const nbVentes = resultatVentes?.page.totalElements ?? 0;

  const statsParLivreTries = useMemo(() => {
    if (!statsVentes?.parLivre) return [];
    return [...statsVentes.parLivre].sort((a, b) => {
      let cmp = 0;
      if (triOuvrageColonne === "nom") {
        cmp = compareStrings(a.titreLivre, b.titreLivre);
      } else if (triOuvrageColonne === "quantite") {
        cmp = compareNumbers(a.quantiteVendue, b.quantiteVendue);
      } else if (triOuvrageColonne === "recette") {
        cmp = compareNumbers(a.montantTotal, b.montantTotal);
      } else if (triOuvrageColonne === "part") {
        cmp = compareNumbers(a.montantTotal, b.montantTotal);
      }
      return triOuvrageDirection === "asc" ? cmp : -cmp;
    });
  }, [statsVentes?.parLivre, triOuvrageColonne, triOuvrageDirection]);

  const statsParCentreTries = useMemo(() => {
    if (!statsVentes?.parCentre) return [];
    return [...statsVentes.parCentre].sort((a, b) => {
      let cmp = 0;
      if (triCentreColonne === "centre") {
        cmp = compareStrings(a.nomCentre, b.nomCentre);
      } else if (triCentreColonne === "quantite") {
        cmp = compareNumbers(a.quantiteVendue, b.quantiteVendue);
      } else if (triCentreColonne === "recette") {
        cmp = compareNumbers(a.montantTotal, b.montantTotal);
      } else if (triCentreColonne === "contribution") {
        cmp = compareNumbers(a.montantTotal, b.montantTotal);
      }
      return triCentreDirection === "asc" ? cmp : -cmp;
    });
  }, [statsVentes?.parCentre, triCentreColonne, triCentreDirection]);

  // Agrégats de toute la sélection filtrée (renvoyés avec la page).
  const aggregatesFiltres = {
    totalMontant: resultatVentes?.totalMontant ?? 0,
    totalQuantite: resultatVentes?.totalQuantite ?? 0,
    nbInternes: resultatVentes?.nbInternes ?? 0,
    montantInternes: resultatVentes?.montantInternes ?? 0,
    nbExternes: resultatVentes?.nbExternes ?? 0,
    montantExternes: resultatVentes?.montantExternes ?? 0,
  };

  const statsCatalogue = useMemo(() => {
    const total = livres.length;
    const actifs = livres.filter((l) => l.actif).length;
    const inactifs = total - actifs;
    return { total, actifs, inactifs };
  }, [livres]);

  // Filtrage et Tri du catalogue
  const livresFiltres = useMemo(() => {
    const list = livres.filter((l) => {
      if (statutFiltre === "ACTIFS" && !l.actif) return false;
      if (statutFiltre === "INACTIFS" && l.actif) return false;
      if (rechercheCatalogue.trim() !== "") {
        const q = rechercheCatalogue.toLowerCase().trim();
        const matchTitre = l.titre.toLowerCase().includes(q);
        const matchDesc = l.description?.toLowerCase().includes(q);
        if (!matchTitre && !matchDesc) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (triCatalogue === "titre-asc") {
        return a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" });
      }
      if (triCatalogue === "titre-desc") {
        return b.titre.localeCompare(a.titre, "fr", { sensitivity: "base" });
      }
      if (triCatalogue === "prix-asc") {
        return a.prix - b.prix;
      }
      if (triCatalogue === "prix-desc") {
        return b.prix - a.prix;
      }
      if (triCatalogue === "disponibilite") {
        if (a.actif === b.actif) {
          return a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" });
        }
        return a.actif ? -1 : 1;
      }
      if (triCatalogue === "recent") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [livres, rechercheCatalogue, statutFiltre, triCatalogue]);

  const nomCentreUtilisateur = useMemo(() => {
    if (!userCentreIdEffectif) return "Centre non spécifié";
    const c = centres.find((item) => item.id === userCentreIdEffectif);
    return c ? c.nom : "Mon Centre";
  }, [centres, userCentreIdEffectif]);

  // Actions catalogue
  function ouvrirCreation() {
    if (!peutGererLivres) return;
    setLivreEnEdition(null);
    setTitre("");
    setDescription("");
    setPrix("");
    setActif(true);
    setFormErreur(null);
    setModalCatalogueOuverte(true);
  }

  function ouvrirEdition(l: Livre) {
    if (!peutGererLivres) return;
    setLivreEnEdition(l);
    setTitre(l.titre);
    setDescription(l.description || "");
    setPrix(l.prix);
    setActif(l.actif);
    setFormErreur(null);
    setModalCatalogueOuverte(true);
  }

  async function handleSubmitLivre(e: React.FormEvent) {
    e.preventDefault();
    if (!peutGererLivres) return;
    setFormErreur(null);

    if (!titre.trim()) {
      setFormErreur("Le titre du livre est obligatoire.");
      return;
    }
    const p = Number(prix);
    if (isNaN(p) || p < 0) {
      setFormErreur("Veuillez saisir un prix valide supérieur ou égal à 0.");
      return;
    }

    try {
      if (livreEnEdition) {
        const payload: ModifierLivreDTO = {
          titre: titre.trim(),
          description: description.trim() || undefined,
          prix: p,
          actif,
        };
        await modifierLivreMutation.mutateAsync({
          id: livreEnEdition.id,
          payload,
        });
      } else {
        const payload: CreerLivreDTO = {
          titre: titre.trim(),
          description: description.trim() || undefined,
          prix: p,
        };
        await creerLivreMutation.mutateAsync(payload);
      }
      setModalCatalogueOuverte(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du livre.";
      setFormErreur(msg);
    }
  }

  async function handleToggleActif(l: Livre) {
    if (!peutGererLivres) return;
    try {
      await modifierLivreMutation.mutateAsync({
        id: l.id,
        payload: {
          titre: l.titre,
          description: l.description,
          prix: l.prix,
          actif: !l.actif,
        },
      });
    } catch {
      // Ignorer
    }
  }

  async function handleSupprimer(id: string) {
    if (!peutGererLivres) return;
    try {
      await supprimerLivreMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch {
      // Ignorer
    }
  }

  return (
    <div className="space-y-6">
      {/* ── En-tête de la page avec Onglets ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-brand-orange flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 shadow-2xs">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Gestion des Ouvrages & Ventes
                </h1>
                {sessionActive && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    <Calendar size={11} className="text-slate-500" />
                    Session {sessionActive.annee}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {isChefCentre
                  ? `Vue Centre : ${nomCentreUtilisateur} — Disponibilité des ouvrages et traçabilité des ventes de la session.`
                  : "Supervision Globale : Catalogue national, bilans consolidés et traçabilité multi-centres."}
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action contextuels */}
        <div className="flex items-center gap-2.5">
          {peutEnregistrerVente && (
            <Button
              onClick={() => setModalVenteOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 flex cursor-pointer items-center gap-2 font-bold text-white shadow-sm"
            >
              <ShoppingCart size={16} />
              <span>Enregistrer une vente</span>
            </Button>
          )}

          {peutGererLivres && (
            <Button
              onClick={ouvrirCreation}
              className="bg-brand-anthracite hover:bg-brand-anthracite/90 flex cursor-pointer items-center gap-2 font-bold text-white shadow-sm"
            >
              <Plus size={16} />
              <span>Nouveau livre</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Barre d'Onglets ── */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOngletActif("catalogue")}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-black transition-colors ${
              ongletActif === "catalogue"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers size={16} />
            <span>Catalogue ({statsCatalogue.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setOngletActif("bilan")}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-black transition-colors ${
              ongletActif === "bilan"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={16} />
            <span>Traçabilité & Bilans des Ventes</span>
            {nbVentes > 0 && (
              <span className="text-brand-orange py-0.2 rounded-full bg-orange-100 px-2 text-[10px] font-black">
                {nbVentes}
              </span>
            )}
          </button>
        </div>

        {/* Badge rôle / granularité */}
        <div className="hidden items-center gap-2 pb-2 text-xs font-bold text-slate-500 sm:flex">
          <Building2 size={14} className="text-slate-400" />
          <span>Niveau d'accès : </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-800">
            {isChefCentre
              ? `Centre (${nomCentreUtilisateur})`
              : "Consolidé (Global)"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── CONTENU ONGLET 1 : CATALOGUE ── */}
      {/* ========================================================================= */}
      {ongletActif === "catalogue" && (
        <div className="space-y-4">
          {/* Cartes Récapitulatives & Filtres Rapides */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setStatutFiltre("TOUS")}
              className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                statutFiltre === "TOUS"
                  ? "border-blue-300 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white shadow-2xs hover:border-slate-300"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Total des Références
                </span>
                <span className="text-xl leading-tight font-black text-slate-900">
                  {statsCatalogue.total} ouvrages
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                  Tous supports confondus
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatutFiltre("ACTIFS")}
              className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                statutFiltre === "ACTIFS"
                  ? "border-emerald-300 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white shadow-2xs hover:border-slate-300"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Disponibles à la vente
                </span>
                <span className="text-xl leading-tight font-black text-emerald-800">
                  {statsCatalogue.actifs} actifs
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                  Prêts pour vente directe
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatutFiltre("INACTIFS")}
              className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                statutFiltre === "INACTIFS"
                  ? "border-slate-400 bg-slate-100 shadow-xs ring-2 ring-slate-500/20"
                  : "border-slate-200 bg-white shadow-2xs hover:border-slate-300"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <XCircle size={20} />
              </div>
              <div>
                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Indisponibles / Archivés
                </span>
                <span className="text-xl leading-tight font-black text-slate-700">
                  {statsCatalogue.inactifs} inactifs
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                  Retirés temporairement
                </span>
              </div>
            </button>
          </div>

          {/* Barre d'Outils Catalogue : Recherche, Filtres, Tri & Mode d'affichage */}
          <Card className="border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
              {/* Recherche textuelle */}
              <div className="relative max-w-lg min-w-[220px] flex-1">
                <Search
                  size={16}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou mot-clé..."
                  value={rechercheCatalogue}
                  onChange={(e) => setRechercheCatalogue(e.target.value)}
                  className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-8 pl-9 text-xs font-semibold text-slate-800 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2"
                />
                {rechercheCatalogue && (
                  <button
                    type="button"
                    onClick={() => setRechercheCatalogue("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                    title="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtres de Statut, Menu de Tri et Sélecteur de Vue */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Pilules de statut */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setStatutFiltre("TOUS")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 transition-all ${
                      statutFiltre === "TOUS"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatutFiltre("ACTIFS")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 transition-all ${
                      statutFiltre === "ACTIFS"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-emerald-700 hover:text-emerald-900"
                    }`}
                  >
                    Disponibles
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatutFiltre("INACTIFS")}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 transition-all ${
                      statutFiltre === "INACTIFS"
                        ? "bg-slate-700 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Indisponibles
                  </button>
                </div>

                {/* Sélecteur de tri */}
                <div className="flex items-center gap-1.5 pl-0.5">
                  <ArrowUpDown size={14} className="shrink-0 text-slate-400" />
                  <select
                    value={triCatalogue}
                    onChange={(e) =>
                      setTriCatalogue(e.target.value as TriCatalogueOption)
                    }
                    aria-label="Trier les ouvrages par"
                    className="focus:border-brand-orange cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-all outline-none focus:bg-white"
                  >
                    <option value="titre-asc">Titre (A → Z)</option>
                    <option value="titre-desc">Titre (Z → A)</option>
                    <option value="prix-asc">Prix (Croissant)</option>
                    <option value="prix-desc">Prix (Décroissant)</option>
                    <option value="disponibilite">Disponibilité d'abord</option>
                    <option value="recent">Plus récents</option>
                  </select>
                </div>

                {/* Sélecteur Mode Grille / Mode Tableau */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setVueMode("grille")}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      vueMode === "grille"
                        ? "text-brand-orange bg-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Vue en grille / fiches"
                  >
                    <LayoutGrid size={14} />
                    <span className="hidden sm:inline">Grille</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVueMode("tableau")}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      vueMode === "tableau"
                        ? "text-brand-orange bg-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Vue en tableau / liste compacte"
                  >
                    <List size={14} />
                    <span className="hidden sm:inline">Tableau</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Affichage des Données : Loading, Erreur, Vide ou Liste/Grille */}
          {livresLoading ? (
            vueMode === "grille" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))}
              </div>
            ) : (
              <SkeletonTable rows={6} columns={4} />
            )
          ) : livresError ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>
                Impossible de charger les ouvrages. Veuillez réessayer plus
                tard.
              </span>
            </div>
          ) : livresFiltres.length === 0 ? (
            <Card className="border border-slate-200 bg-white p-12 text-center">
              <BookOpen size={42} className="mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-black text-slate-800">
                Aucun ouvrage trouvé
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                {rechercheCatalogue || statutFiltre !== "TOUS"
                  ? "Aucun résultat ne correspond à vos filtres actuels."
                  : "Aucun ouvrage n'est encore enregistré dans le catalogue."}
              </p>
              {(rechercheCatalogue || statutFiltre !== "TOUS") && (
                <button
                  type="button"
                  onClick={() => {
                    setRechercheCatalogue("");
                    setStatutFiltre("TOUS");
                  }}
                  className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <X size={13} />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </Card>
          ) : vueMode === "tableau" ? (
            /* ── VUE TABLEAU COMPACT ── */
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      <SortableHeader
                        label="Ouvrage & Référence"
                        sortKey="titre"
                        currentSortKey={
                          triCatalogue.startsWith("titre") ? "titre" : undefined
                        }
                        direction={
                          triCatalogue === "titre-desc" ? "desc" : "asc"
                        }
                        onSort={() => handleTriCatalogueHeader("titre")}
                      />
                      <SortableHeader
                        label="Prix Unitaire"
                        sortKey="prix"
                        currentSortKey={
                          triCatalogue.startsWith("prix") ? "prix" : undefined
                        }
                        direction={
                          triCatalogue === "prix-desc" ? "desc" : "asc"
                        }
                        onSort={() => handleTriCatalogueHeader("prix")}
                        align="right"
                      />
                      <SortableHeader
                        label="Disponibilité"
                        sortKey="disponibilite"
                        currentSortKey={
                          triCatalogue === "disponibilite"
                            ? "disponibilite"
                            : undefined
                        }
                        direction="asc"
                        onSort={() => handleTriCatalogueHeader("disponibilite")}
                        align="center"
                      />
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {livresFiltres.map((livre) => (
                      <tr
                        key={livre.id}
                        className={`transition-colors ${
                          livre.actif
                            ? "hover:bg-slate-50/70"
                            : "bg-slate-50/40 hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                                livre.actif
                                  ? "text-brand-orange bg-orange-100"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {livre.titre.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-black text-slate-900 sm:text-sm">
                                {livre.titre}
                              </span>
                              <span className="line-clamp-1 text-[11px] text-slate-500">
                                {livre.description ||
                                  "Aucune description renseignée."}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="text-brand-orange text-xs font-black sm:text-sm">
                            {FCFA.format(livre.prix)} FCFA
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {peutGererLivres ? (
                            <button
                              type="button"
                              onClick={() => handleToggleActif(livre)}
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                                livre.actif
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              title="Cliquer pour basculer la disponibilité"
                            >
                              {livre.actif ? (
                                <>
                                  <CheckCircle2
                                    size={11}
                                    className="text-emerald-600"
                                  />{" "}
                                  Disponible
                                </>
                              ) : (
                                <>
                                  <XCircle
                                    size={11}
                                    className="text-slate-400"
                                  />{" "}
                                  Indisponible
                                </>
                              )}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                livre.actif
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {livre.actif ? (
                                <>
                                  <CheckCircle2
                                    size={11}
                                    className="text-emerald-600"
                                  />{" "}
                                  Disponible
                                </>
                              ) : (
                                <>
                                  <XCircle
                                    size={11}
                                    className="text-slate-400"
                                  />{" "}
                                  Indisponible
                                </>
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Raccourci Vente Directe (Caissier / Direction) */}
                            {livre.actif && peutEnregistrerVente && (
                              <button
                                type="button"
                                onClick={() => ouvrirVente(livre.id)}
                                className="hover:bg-brand-orange text-brand-orange inline-flex cursor-pointer items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold transition-colors hover:text-white"
                                title="Enregistrer une vente pour cet ouvrage"
                              >
                                <ShoppingBag size={12} />
                                <span>Vendre</span>
                              </button>
                            )}

                            {peutGererLivres && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => ouvrirEdition(livre)}
                                  className="hover:text-brand-orange cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                                  title="Modifier cet ouvrage"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {deleteConfirmId === livre.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSupprimer(livre.id)}
                                      className="cursor-pointer rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-rose-700"
                                    >
                                      Oui
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="cursor-pointer rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 transition-colors hover:bg-slate-300"
                                    >
                                      Non
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(livre.id)}
                                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    title="Supprimer cet ouvrage"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600">
                      <td className="px-4 py-3" colSpan={2}>
                        {livresFiltres.length} référence(s) affichée(s) sur{" "}
                        {statsCatalogue.total} au total
                      </td>
                      <td className="px-4 py-3 text-right" colSpan={2}>
                        {statsCatalogue.actifs} disponible(s) à la vente
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          ) : (
            /* ── VUE GRILLE / FICHES ÉLÉGANTES ── */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {livresFiltres.map((livre) => {
                return (
                  <Card
                    key={livre.id}
                    className={`flex flex-col justify-between border p-5 transition-all ${
                      livre.actif
                        ? "hover:border-brand-orange/40 border-slate-200 bg-white hover:shadow-md"
                        : "border-slate-200/80 bg-slate-50 opacity-80"
                    }`}
                  >
                    <div>
                      {/* Entête de carte */}
                      <div className="mb-2.5 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                              livre.actif
                                ? "text-brand-orange bg-orange-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {livre.titre.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm leading-tight font-black tracking-tight text-slate-900 sm:text-base">
                              {livre.titre}
                            </h3>
                          </div>
                        </div>

                        {peutGererLivres ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActif(livre)}
                            className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                              livre.actif
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border border-slate-300 bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                            title="Cliquer pour basculer la disponibilité"
                          >
                            {livre.actif ? (
                              <>
                                <CheckCircle2 size={11} /> Disponible
                              </>
                            ) : (
                              <>
                                <XCircle size={11} /> Indisponible
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              livre.actif
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-slate-300 bg-slate-200 text-slate-600"
                            }`}
                          >
                            {livre.actif ? (
                              <>
                                <CheckCircle2 size={11} /> Disponible
                              </>
                            ) : (
                              <>
                                <XCircle size={11} /> Indisponible
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mb-4 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-slate-600">
                        {livre.description ||
                          "Aucune description renseignée pour cet ouvrage."}
                      </p>

                      {/* Prix et Raccourci Vente */}
                      <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div>
                          <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Prix unitaire
                          </span>
                          <span className="text-brand-orange text-base font-black">
                            {FCFA.format(livre.prix)} FCFA
                          </span>
                        </div>

                        {livre.actif && peutEnregistrerVente && (
                          <button
                            type="button"
                            onClick={() => ouvrirVente(livre.id)}
                            className="hover:bg-brand-orange text-brand-orange flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-bold transition-colors hover:text-white"
                            title="Enregistrer une vente pour cet ouvrage"
                          >
                            <ShoppingBag size={13} />
                            <span>Vendre</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions d'administration */}
                    {peutGererLivres && (
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <Button
                          variant="secondary"
                          onClick={() => ouvrirEdition(livre)}
                          className="hover:text-brand-orange flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700"
                        >
                          <Edit2 size={13} />
                          <span>Modifier</span>
                        </Button>

                        {deleteConfirmId === livre.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSupprimer(livre.id)}
                              className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-rose-700"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="cursor-pointer rounded-md bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-300"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(livre.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Supprimer cet ouvrage"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── CONTENU ONGLET 2 : TRAÇABILITÉ & BILANS DES VENTES ── */}
      {/* ========================================================================= */}
      {ongletActif === "bilan" && (
        <div className="space-y-6">
          {/* Barre de Filtres Traçabilité & Granularité */}
          <Card className="space-y-3 border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider text-slate-800 uppercase">
                <Filter size={14} className="text-brand-orange" />
                <span>Filtres de consolidation & Recherche</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {isChefCentre
                  ? "Périmètre restreint à votre centre"
                  : "Périmètre national ajustable"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {/* Filtre Centre */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Centre d'apprentissage
                </label>
                {isChefCentre ? (
                  <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                    <span className="truncate">{nomCentreUtilisateur}</span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Fixé
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedCentreId}
                    onChange={(e) => setSelectedCentreId(e.target.value)}
                    className="focus:border-brand-orange w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                  >
                    <option value="">Tous les centres (Consolidé)</option>
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Filtre Livre */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Ouvrage / Titre
                </label>
                <select
                  value={selectedLivreId}
                  onChange={(e) => setSelectedLivreId(e.target.value)}
                  className="focus:border-brand-orange w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                >
                  <option value="">Tous les ouvrages</option>
                  {livres.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titre} ({FCFA.format(l.prix)} F)
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Type Acheteur */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Type d'acheteur
                </label>
                <select
                  value={selectedTypeAcheteur}
                  onChange={(e) =>
                    setSelectedTypeAcheteur(
                      e.target.value as "TOUS" | "INTERNE" | "EXTERNE",
                    )
                  }
                  className="focus:border-brand-orange w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                >
                  <option value="TOUS">Tous les acheteurs</option>
                  <option value="INTERNE">Élèves inscrits uniquement</option>
                  <option value="EXTERNE">Acheteurs externes uniquement</option>
                </select>
              </div>

              {/* Date Début */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="focus:border-brand-orange w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                />
              </div>

              {/* Date Fin */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="focus:border-brand-orange w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Recherche textuelle acheteur */}
            <div className="pt-1">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher par nom de l'élève ou de l'acheteur externe..."
                  value={rechercheVente}
                  onChange={(e) => setRechercheVente(e.target.value)}
                  className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2"
                />
              </div>
            </div>
          </Card>

          {/* Cartes KPI Bilans Ventes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="text-brand-orange flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <Coins size={22} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Recettes Totales Ventes
                  </span>
                  <span className="text-brand-orange text-xl font-black">
                    {FCFA.format(aggregatesFiltres.totalMontant)} FCFA
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package size={22} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Exemplaires Vendus
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {aggregatesFiltres.totalQuantite} livres
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="bg-brand-orange/10 text-brand-orange flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <UserCheck size={22} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Élèves du Centre
                  </span>
                  <span className="text-brand-anthracite block text-base leading-tight font-black">
                    {FCFA.format(aggregatesFiltres.montantInternes)} FCFA
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {aggregatesFiltres.nbInternes} transaction(s)
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Users size={22} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Acheteurs Externes
                  </span>
                  <span className="block text-base leading-tight font-black text-purple-800">
                    {FCFA.format(aggregatesFiltres.montantExternes)} FCFA
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {aggregatesFiltres.nbExternes} transaction(s)
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* ── SECTION 1 : VENTILATION PAR TYPE DE LIVRE (NOM) ── */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-brand-orange" />
                <h2 className="text-sm font-black text-slate-900">
                  Bilan & Ventilation par Ouvrage (Nom du Livre)
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Session en cours
              </span>
            </div>

            {statsLoading ? (
              <div className="p-4">
                <SkeletonTable rows={4} columns={4} />
              </div>
            ) : !statsVentes || statsVentes.parLivre.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Aucune vente enregistrée pour les filtres sélectionnés.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      <SortableHeader
                        label="Nom de l'Ouvrage"
                        sortKey="nom"
                        currentSortKey={triOuvrageColonne}
                        direction={triOuvrageDirection}
                        onSort={handleTriOuvrage}
                      />
                      <SortableHeader
                        label="Exemplaires Vendus"
                        sortKey="quantite"
                        currentSortKey={triOuvrageColonne}
                        direction={triOuvrageDirection}
                        onSort={handleTriOuvrage}
                        align="center"
                      />
                      <SortableHeader
                        label="Recette Totale"
                        sortKey="recette"
                        currentSortKey={triOuvrageColonne}
                        direction={triOuvrageDirection}
                        onSort={handleTriOuvrage}
                        align="right"
                      />
                      <SortableHeader
                        label="Part du Chiffre"
                        sortKey="part"
                        currentSortKey={triOuvrageColonne}
                        direction={triOuvrageDirection}
                        onSort={handleTriOuvrage}
                        align="center"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statsParLivreTries.map((item: VentilationLivreItem) => {
                      const pct =
                        statsVentes.totalMontant > 0
                          ? Math.round(
                              (item.montantTotal / statsVentes.totalMontant) *
                                100,
                            )
                          : 0;

                      return (
                        <tr
                          key={item.livreId}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="flex items-center gap-2 px-4 py-3 font-black text-slate-800">
                            <span className="text-brand-orange flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-[10px] font-bold">
                              {item.titreLivre.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{item.titreLivre}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-black text-blue-700">
                              {item.quantiteVendue} ex.
                            </span>
                          </td>
                          <td className="text-brand-orange px-4 py-3 text-right font-black">
                            {FCFA.format(item.montantTotal)} FCFA
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="bg-brand-orange h-full rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 font-black text-slate-900">
                      <td className="px-4 py-3">TOTAL CONSOLIDÉ</td>
                      <td className="px-4 py-3 text-center text-blue-700">
                        {statsVentes.totalQuantite} exemplaires
                      </td>
                      <td className="text-brand-orange px-4 py-3 text-right text-sm">
                        {FCFA.format(statsVentes.totalMontant)} FCFA
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          {/* ── SECTION 2 : VENTILATION PAR CENTRE (Visible aux Directeurs quand pas de filtre centre unique) ── */}
          {!isChefCentre &&
            !selectedCentreId &&
            statsVentes &&
            statsVentes.parCentre.length > 0 && (
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    <h2 className="text-sm font-black text-slate-900">
                      Ventilation des Ventes par Centre d'Apprentissage
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Vue Consolidation Nationale
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        <SortableHeader
                          label="Centre"
                          sortKey="centre"
                          currentSortKey={triCentreColonne}
                          direction={triCentreDirection}
                          onSort={handleTriCentre}
                        />
                        <SortableHeader
                          label="Exemplaires Vendus"
                          sortKey="quantite"
                          currentSortKey={triCentreColonne}
                          direction={triCentreDirection}
                          onSort={handleTriCentre}
                          align="center"
                        />
                        <SortableHeader
                          label="Recette Totale"
                          sortKey="recette"
                          currentSortKey={triCentreColonne}
                          direction={triCentreDirection}
                          onSort={handleTriCentre}
                          align="right"
                        />
                        <SortableHeader
                          label="Contribution"
                          sortKey="contribution"
                          currentSortKey={triCentreColonne}
                          direction={triCentreDirection}
                          onSort={handleTriCentre}
                          align="center"
                        />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statsParCentreTries.map((c: VentilationCentreItem) => {
                        const pct =
                          statsVentes.totalMontant > 0
                            ? Math.round(
                                (c.montantTotal / statsVentes.totalMontant) *
                                  100,
                              )
                            : 0;

                        return (
                          <tr
                            key={c.centreId}
                            className="transition-colors hover:bg-slate-50/60"
                          >
                            <td className="flex items-center gap-2 px-4 py-3 font-black text-slate-800">
                              <Building2 size={14} className="text-slate-400" />
                              <span>{c.nomCentre}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-black text-blue-700">
                                {c.quantiteVendue} ex.
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">
                              {FCFA.format(c.montantTotal)} FCFA
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-blue-600"
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

          {/* ── SECTION 3 : JOURNAL DÉTAILLÉ & TRAÇABILITÉ DES VENTES ── */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-brand-orange" />
                <h2 className="text-sm font-black text-slate-900">
                  Journal Détaillé des Ventes & Traçabilité ({nbVentes} lignes)
                </h2>
              </div>

              <Button
                variant="secondary"
                onClick={() => setModalVenteOuverte(true)}
                className="hover:text-brand-orange flex items-center gap-1 text-xs font-bold text-slate-700"
              >
                <Plus size={13} />
                <span>Nouvelle vente</span>
              </Button>
            </div>

            {ventesLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} columns={8} />
              </div>
            ) : ventesError ? (
              <div className="p-6 text-center text-xs text-rose-600">
                Erreur lors du chargement des ventes.
              </div>
            ) : ventesPage.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <ShoppingCart
                  size={32}
                  className="mx-auto mb-2 text-slate-300"
                />
                <p className="text-xs font-bold text-slate-600">
                  Aucune transaction enregistrée pour ces critères.
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Cliquez sur « Enregistrer une vente » pour consigner une vente
                  de livres.
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs">
                    <tr className="border-b border-slate-200 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      <SortableHeader
                        label="Date de vente"
                        sortKey="date"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                      />
                      <SortableHeader
                        label="Centre"
                        sortKey="centre"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                      />
                      <SortableHeader
                        label="Nom de l'Acheteur"
                        sortKey="acheteur"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                      />
                      <SortableHeader
                        label="Type"
                        sortKey="type"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                      />
                      <SortableHeader
                        label="Ouvrage vendu"
                        sortKey="livre"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                      />
                      <SortableHeader
                        label="Quantité"
                        sortKey="quantite"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                        align="center"
                      />
                      <SortableHeader
                        label="Prix Unitaire"
                        sortKey="prix"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                        align="right"
                      />
                      <SortableHeader
                        label="Total FCFA"
                        sortKey="total"
                        currentSortKey={triVenteColonne}
                        direction={triVenteDirection}
                        onSort={handleTriVente}
                        align="right"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ventesPage.map((v: VenteLivre) => (
                      <tr
                        key={v.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3 font-semibold whitespace-nowrap text-slate-600">
                          {new Date(v.dateVente).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Building2 size={12} className="text-slate-400" />
                            {v.centreNom}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black whitespace-nowrap text-slate-900">
                          {v.nomAcheteur}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {v.estExterne ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              <Users size={10} /> Externe
                            </span>
                          ) : (
                            <span className="bg-brand-orange/10 border-brand-orange/20 text-brand-orange inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                              <UserCheck size={10} /> Élève inscrit
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-800">
                          {v.livreTitre}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-slate-800">
                          {v.quantite}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {FCFA.format(v.prixUnitaire)} F
                        </td>
                        <td className="text-brand-orange px-4 py-3 text-right font-black whitespace-nowrap">
                          {FCFA.format(v.montantTotal)} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  page={pageVentes}
                  totalPages={Math.max(1, resultatVentes?.page.totalPages ?? 1)}
                  totalItems={nbVentes}
                  pageSize={TAILLE_PAGE_LISTE}
                  onChange={setPageVentes}
                  label="vente"
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Modal Création / Modification Catalogue (Directeur Académique) ── */}
      {peutGererLivres && (
        <Modal
          isOpen={modalCatalogueOuverte}
          onClose={() => setModalCatalogueOuverte(false)}
          title={
            livreEnEdition ? "Modifier l'ouvrage" : "Ajouter un nouvel ouvrage"
          }
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitLivre} className="space-y-4">
            {formErreur && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{formErreur}</span>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Titre de l'ouvrage <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: AXIOME, VECTEUR..."
                className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block flex items-center gap-1 text-xs font-bold text-slate-700">
                <Coins size={12} className="text-brand-orange" />
                <span>Prix (FCFA)</span>{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={prix}
                onChange={(e) =>
                  setPrix(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Ex: 10000"
                className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Description / Matière / Destination
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Manuel de préparation intensive en mathématiques..."
                className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:ring-2"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modal-livre-actif"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                className="text-brand-orange focus:ring-brand-orange h-4 w-4 cursor-pointer rounded border-slate-300"
              />
              <label
                htmlFor="modal-livre-actif"
                className="cursor-pointer text-xs font-bold text-slate-700 select-none"
              >
                Livre disponible (visible et disponible à l'encaissement)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalCatalogueOuverte(false)}
                disabled={
                  creerLivreMutation.isPending ||
                  modifierLivreMutation.isPending
                }
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  creerLivreMutation.isPending ||
                  modifierLivreMutation.isPending
                }
                className="bg-brand-orange hover:bg-brand-orange/90 font-bold text-white"
              >
                {creerLivreMutation.isPending || modifierLivreMutation.isPending
                  ? "Enregistrement..."
                  : livreEnEdition
                    ? "Mettre à jour"
                    : "Créer le livre"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal Enregistrer une vente de livres ── */}
      <EnregistrerVenteLivreModal
        isOpen={modalVenteOuverte}
        onClose={() => {
          setModalVenteOuverte(false);
          setLivreVentePreselectionne(null);
        }}
        sessionId={sessionActive?.id || ""}
        centres={centres.map((c) => ({ id: c.id, nom: c.nom }))}
        userCentreId={userCentreIdEffectif ?? undefined}
        userRole={roleEffectif ?? undefined}
        initialLivreId={livreVentePreselectionne ?? undefined}
      />
    </div>
  );
}
