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
import { Card, Button, Modal, SkeletonCard, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import {
  useLivres,
  useCreerLivre,
  useModifierLivre,
  useSupprimerLivre,
  useVentesLivres,
  useStatsVentesLivres,
} from "../data/queries";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import { EnregistrerVenteLivreModal } from "./EnregistrerVenteLivreModal";
import type {
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

export function LivresView({ userRole, userCentreId }: LivresViewProps = {}) {
  const { data: authSession } = useSession();
  const roleEffectif = userRole || authSession?.user?.role;
  const userCentreIdEffectif = userCentreId || authSession?.user?.centreId;

  const isChefCentre = roleEffectif === "CHEF_CENTRE";
  const peutGererLivres = roleEffectif === "DIRECTEUR_ACADEMIQUE";
  const peutEnregistrerVente =
    roleEffectif === "CAISSIER" ||
    roleEffectif === "DIRECTEUR";

  // Navigation par onglets
  const [ongletActif, setOngletActif] = useState<"catalogue" | "bilan">("catalogue");

  // Données de base
  const { data: sessionActive } = useSessionActive();
  const { data: centres = [] } = useCentres();
  const { data: livres = [], isLoading: livresLoading, error: livresError } = useLivres();

  // Mutations catalogue
  const creerLivreMutation = useCreerLivre(roleEffectif);
  const modifierLivreMutation = useModifierLivre(roleEffectif);
  const supprimerLivreMutation = useSupprimerLivre(roleEffectif);

  // Filtres, vue & tris Catalogue
  const [rechercheCatalogue, setRechercheCatalogue] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<"TOUS" | "ACTIFS" | "INACTIFS">("TOUS");
  const [vueMode, setVueMode] = useState<"grille" | "tableau">("grille");
  type TriCatalogueOption =
    | "titre-asc"
    | "titre-desc"
    | "prix-asc"
    | "prix-desc"
    | "disponibilite"
    | "recent";
  const [triCatalogue, setTriCatalogue] = useState<TriCatalogueOption>("titre-asc");

  function handleTriCatalogueHeader(colonne: "titre" | "prix" | "disponibilite") {
    if (colonne === "titre") {
      setTriCatalogue((prev) => (prev === "titre-asc" ? "titre-desc" : "titre-asc"));
    } else if (colonne === "prix") {
      setTriCatalogue((prev) => (prev === "prix-asc" ? "prix-desc" : "prix-asc"));
    } else if (colonne === "disponibilite") {
      setTriCatalogue("disponibilite");
    }
  }

  // Tris des ventes et statistiques
  type TriVenteColonne = "date" | "centre" | "acheteur" | "type" | "livre" | "quantite" | "prix" | "total";
  const [triVenteColonne, setTriVenteColonne] = useState<TriVenteColonne>("date");
  const [triVenteDirection, setTriVenteDirection] = useState<SortDirection>("desc");

  function handleTriVente(colonne: TriVenteColonne) {
    if (triVenteColonne === colonne) {
      setTriVenteDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriVenteColonne(colonne);
      setTriVenteDirection(
        colonne === "date" || colonne === "quantite" || colonne === "prix" || colonne === "total"
          ? "desc"
          : "asc",
      );
    }
  }

  type TriLivreVentesOuvrageColonne = "nom" | "quantite" | "recette" | "part";
  const [triOuvrageColonne, setTriOuvrageColonne] = useState<TriLivreVentesOuvrageColonne>("recette");
  const [triOuvrageDirection, setTriOuvrageDirection] = useState<SortDirection>("desc");

  function handleTriOuvrage(colonne: TriLivreVentesOuvrageColonne) {
    if (triOuvrageColonne === colonne) {
      setTriOuvrageDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriOuvrageColonne(colonne);
      setTriOuvrageDirection(colonne === "nom" ? "asc" : "desc");
    }
  }

  type TriLivreVentesCentreColonne = "centre" | "quantite" | "recette" | "contribution";
  const [triCentreColonne, setTriCentreColonne] = useState<TriLivreVentesCentreColonne>("recette");
  const [triCentreDirection, setTriCentreDirection] = useState<SortDirection>("desc");

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
  const [livreVentePreselectionne, setLivreVentePreselectionne] = useState<string | null>(null);

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
  const [selectedTypeAcheteur, setSelectedTypeAcheteur] = useState<"TOUS" | "INTERNE" | "EXTERNE">("TOUS");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [rechercheVente, setRechercheVente] = useState("");

  // Centre effectif pour les requêtes
  const centreIdQuery = isChefCentre ? (userCentreIdEffectif || "") : (selectedCentreId || undefined);

  // Données de ventes & statistiques
  const {
    data: statsVentes,
    isLoading: statsLoading,
  } = useStatsVentesLivres(
    {
      sessionId: sessionActive?.id || "",
      centreId: centreIdQuery,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    },
    roleEffectif ?? undefined,
    userCentreIdEffectif ?? undefined,
  );

  const {
    data: ventes = [],
    isLoading: ventesLoading,
    error: ventesError,
  } = useVentesLivres(
    {
      sessionId: sessionActive?.id || "",
      centreId: centreIdQuery,
      livreId: selectedLivreId || undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    },
    roleEffectif ?? undefined,
    userCentreIdEffectif ?? undefined,
  );

  // Filtrage et Tri local des ventes (acheteur / texte)
  const ventesFiltrees = useMemo(() => {
    const filtered = (ventes || []).filter((v: VenteLivre) => {
      if (selectedTypeAcheteur === "INTERNE" && v.estExterne) return false;
      if (selectedTypeAcheteur === "EXTERNE" && !v.estExterne) return false;
      if (rechercheVente.trim() !== "") {
        const q = rechercheVente.toLowerCase();
        const matchAcheteur = v.nomAcheteur?.toLowerCase().includes(q);
        const matchLivre = v.livreTitre?.toLowerCase().includes(q);
        const matchCentre = v.centreNom?.toLowerCase().includes(q);
        if (!matchAcheteur && !matchLivre && !matchCentre) return false;
      }
      return true;
    });

    return [...filtered].sort((a: VenteLivre, b: VenteLivre) => {
      let cmp = 0;
      if (triVenteColonne === "date") {
        cmp = compareDates(a.dateVente, b.dateVente);
      } else if (triVenteColonne === "centre") {
        cmp = compareStrings(a.centreNom, b.centreNom);
      } else if (triVenteColonne === "acheteur") {
        cmp = compareStrings(a.nomAcheteur, b.nomAcheteur);
      } else if (triVenteColonne === "type") {
        cmp = Number(b.estExterne) - Number(a.estExterne);
      } else if (triVenteColonne === "livre") {
        cmp = compareStrings(a.livreTitre, b.livreTitre);
      } else if (triVenteColonne === "quantite") {
        cmp = compareNumbers(a.quantite, b.quantite);
      } else if (triVenteColonne === "prix") {
        cmp = compareNumbers(a.prixUnitaire, b.prixUnitaire);
      } else if (triVenteColonne === "total") {
        cmp = compareNumbers(a.montantTotal, b.montantTotal);
      }
      return triVenteDirection === "asc" ? cmp : -cmp;
    });
  }, [ventes, selectedTypeAcheteur, rechercheVente, triVenteColonne, triVenteDirection]);

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

  // Agrégats complémentaires des ventes filtrées
  const aggregatesFiltres = useMemo(() => {
    const totalMontant = (ventesFiltrees as VenteLivre[]).reduce(
      (acc: number, v: VenteLivre) => acc + (v.montantTotal || 0),
      0,
    );
    const totalQuantite = (ventesFiltrees as VenteLivre[]).reduce(
      (acc: number, v: VenteLivre) => acc + (v.quantite || 0),
      0,
    );
    const ventesInternes = (ventesFiltrees as VenteLivre[]).filter((v: VenteLivre) => !v.estExterne);
    const ventesExternes = (ventesFiltrees as VenteLivre[]).filter((v: VenteLivre) => v.estExterne);

    const montantInternes = ventesInternes.reduce(
      (acc: number, v: VenteLivre) => acc + (v.montantTotal || 0),
      0,
    );
    const montantExternes = ventesExternes.reduce(
      (acc: number, v: VenteLivre) => acc + (v.montantTotal || 0),
      0,
    );

    return {
      totalMontant,
      totalQuantite,
      nbInternes: ventesInternes.length,
      montantInternes,
      nbExternes: ventesExternes.length,
      montantExternes,
    };
  }, [ventesFiltrees]);

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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-brand-orange shadow-2xs">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Gestion des Ouvrages & Ventes
                </h1>
                {sessionActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    <Calendar size={11} className="text-slate-500" />
                    Session {sessionActive.annee}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
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
              className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold shadow-sm cursor-pointer"
            >
              <ShoppingCart size={16} />
              <span>Enregistrer une vente</span>
            </Button>
          )}

          {peutGererLivres && (
            <Button
              onClick={ouvrirCreation}
              className="flex items-center gap-2 bg-brand-anthracite hover:bg-brand-anthracite/90 text-white font-bold shadow-sm cursor-pointer"
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-colors border-b-2 cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-colors border-b-2 cursor-pointer ${
              ongletActif === "bilan"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={16} />
            <span>Traçabilité & Bilans des Ventes</span>
            {ventes.length > 0 && (
              <span className="rounded-full bg-orange-100 text-brand-orange px-2 py-0.2 text-[10px] font-black">
                {ventes.length}
              </span>
            )}
          </button>
        </div>

        {/* Badge rôle / granularité */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-bold pb-2">
          <Building2 size={14} className="text-slate-400" />
          <span>Niveau d'accès : </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-black text-[11px]">
            {isChefCentre ? `Centre (${nomCentreUtilisateur})` : "Consolidé (Global)"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── CONTENU ONGLET 1 : CATALOGUE ── */}
      {/* ========================================================================= */}
      {ongletActif === "catalogue" && (
        <div className="space-y-4">
          {/* Cartes Récapitulatives & Filtres Rapides */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              type="button"
              onClick={() => setStatutFiltre("TOUS")}
              className={`p-4 flex items-center gap-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statutFiltre === "TOUS"
                  ? "bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700 shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total des Références
                </span>
                <span className="text-xl font-black text-slate-900 leading-tight">
                  {statsCatalogue.total} ouvrages
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Tous supports confondus
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatutFiltre("ACTIFS")}
              className={`p-4 flex items-center gap-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statutFiltre === "ACTIFS"
                  ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Disponibles à la vente
                </span>
                <span className="text-xl font-black text-emerald-800 leading-tight">
                  {statsCatalogue.actifs} actifs
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Prêts pour vente directe
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatutFiltre("INACTIFS")}
              className={`p-4 flex items-center gap-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statutFiltre === "INACTIFS"
                  ? "bg-slate-100 border-slate-400 ring-2 ring-slate-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <XCircle size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Indisponibles / Archivés
                </span>
                <span className="text-xl font-black text-slate-700 leading-tight">
                  {statsCatalogue.inactifs} inactifs
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Retirés temporairement
                </span>
              </div>
            </button>
          </div>

          {/* Barre d'Outils Catalogue : Recherche, Filtres, Tri & Mode d'affichage */}
          <Card className="p-3.5 bg-white border border-slate-200 shadow-2xs">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Recherche textuelle */}
              <div className="relative flex-1 min-w-[220px] max-w-lg">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou mot-clé..."
                  value={rechercheCatalogue}
                  onChange={(e) => setRechercheCatalogue(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />
                {rechercheCatalogue && (
                  <button
                    type="button"
                    onClick={() => setRechercheCatalogue("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                    title="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtres de Statut, Menu de Tri et Sélecteur de Vue */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Pilules de statut */}
                <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setStatutFiltre("TOUS")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
                  <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
                  <select
                    value={triCatalogue}
                    onChange={(e) => setTriCatalogue(e.target.value as TriCatalogueOption)}
                    aria-label="Trier les ouvrages par"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-brand-orange focus:bg-white cursor-pointer transition-all"
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
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vueMode === "grille"
                        ? "bg-white text-brand-orange shadow-2xs"
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
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vueMode === "tableau"
                        ? "bg-white text-brand-orange shadow-2xs"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))}
              </div>
            ) : (
              <SkeletonTable rows={6} columns={4} />
            )
          ) : livresError ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 font-medium">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>Impossible de charger les ouvrages. Veuillez réessayer plus tard.</span>
            </div>
          ) : livresFiltres.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <BookOpen size={42} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-black text-slate-800">Aucun ouvrage trouvé</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={13} />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </Card>
          ) : vueMode === "tableau" ? (
            /* ── VUE TABLEAU COMPACT ── */
            <Card className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <SortableHeader
                        label="Ouvrage & Référence"
                        sortKey="titre"
                        currentSortKey={triCatalogue.startsWith("titre") ? "titre" : undefined}
                        direction={triCatalogue === "titre-desc" ? "desc" : "asc"}
                        onSort={() => handleTriCatalogueHeader("titre")}
                      />
                      <SortableHeader
                        label="Prix Unitaire"
                        sortKey="prix"
                        currentSortKey={triCatalogue.startsWith("prix") ? "prix" : undefined}
                        direction={triCatalogue === "prix-desc" ? "desc" : "asc"}
                        onSort={() => handleTriCatalogueHeader("prix")}
                        align="right"
                      />
                      <SortableHeader
                        label="Disponibilité"
                        sortKey="disponibilite"
                        currentSortKey={triCatalogue === "disponibilite" ? "disponibilite" : undefined}
                        direction="asc"
                        onSort={() => handleTriCatalogueHeader("disponibilite")}
                        align="center"
                      />
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {livresFiltres.map((livre) => (
                      <tr
                        key={livre.id}
                        className={`transition-colors ${
                          livre.actif ? "hover:bg-slate-50/70" : "bg-slate-50/40 hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-xs shrink-0 shadow-2xs ${
                                livre.actif
                                  ? "bg-orange-100 text-brand-orange"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {livre.titre.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <span className="font-black text-slate-900 block truncate text-xs sm:text-sm">
                                {livre.titre}
                              </span>
                              <span className="text-[11px] text-slate-500 line-clamp-1">
                                {livre.description || "Aucune description renseignée."}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-brand-orange text-xs sm:text-sm">
                            {FCFA.format(livre.prix)} FCFA
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {peutGererLivres ? (
                            <button
                              type="button"
                              onClick={() => handleToggleActif(livre)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                                livre.actif
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                              }`}
                              title="Cliquer pour basculer la disponibilité"
                            >
                              {livre.actif ? (
                                <>
                                  <CheckCircle2 size={11} className="text-emerald-600" /> Disponible
                                </>
                              ) : (
                                <>
                                  <XCircle size={11} className="text-slate-400" /> Indisponible
                                </>
                              )}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                livre.actif
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {livre.actif ? (
                                <>
                                  <CheckCircle2 size={11} className="text-emerald-600" /> Disponible
                                </>
                              ) : (
                                <>
                                  <XCircle size={11} className="text-slate-400" /> Indisponible
                                </>
                              )}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Raccourci Vente Directe (Caissier / Direction) */}
                            {livre.actif && peutEnregistrerVente && (
                              <button
                                type="button"
                                onClick={() => ouvrirVente(livre.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-brand-orange text-brand-orange hover:text-white font-bold text-xs transition-colors cursor-pointer"
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
                                  className="p-1.5 text-slate-500 hover:text-brand-orange hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Modifier cet ouvrage"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {deleteConfirmId === livre.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSupprimer(livre.id)}
                                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                                    >
                                      Oui
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-medium hover:bg-slate-300 transition-colors cursor-pointer"
                                    >
                                      Non
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(livre.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                    <tr className="bg-slate-50/75 border-t border-slate-200 text-[11px] font-bold text-slate-600">
                      <td className="py-3 px-4" colSpan={2}>
                        {livresFiltres.length} référence(s) affichée(s) sur {statsCatalogue.total} au total
                      </td>
                      <td className="py-3 px-4 text-right" colSpan={2}>
                        {statsCatalogue.actifs} disponible(s) à la vente
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          ) : (
            /* ── VUE GRILLE / FICHES ÉLÉGANTES ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {livresFiltres.map((livre) => {
                return (
                  <Card
                    key={livre.id}
                    className={`p-5 flex flex-col justify-between border transition-all ${
                      livre.actif
                        ? "bg-white border-slate-200 hover:border-brand-orange/40 hover:shadow-md"
                        : "bg-slate-50 border-slate-200/80 opacity-80"
                    }`}
                  >
                    <div>
                      {/* Entête de carte */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-black text-xs shrink-0 shadow-2xs ${
                              livre.actif
                                ? "bg-orange-100 text-brand-orange"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {livre.titre.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                              {livre.titre}
                            </h3>
                          </div>
                        </div>

                        {peutGererLivres ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActif(livre)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors shrink-0 ${
                              livre.actif
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300"
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
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                              livre.actif
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-200 text-slate-600 border border-slate-300"
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
                      <p className="text-xs text-slate-600 mb-4 line-clamp-2 min-h-[32px] leading-relaxed">
                        {livre.description || "Aucune description renseignée pour cet ouvrage."}
                      </p>

                      {/* Prix et Raccourci Vente */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Prix unitaire
                          </span>
                          <span className="text-base font-black text-brand-orange">
                            {FCFA.format(livre.prix)} FCFA
                          </span>
                        </div>

                        {livre.actif && peutEnregistrerVente && (
                          <button
                            type="button"
                            onClick={() => ouvrirVente(livre.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-brand-orange text-brand-orange hover:text-white font-bold text-xs transition-colors cursor-pointer"
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
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                        <Button
                          variant="secondary"
                          onClick={() => ouvrirEdition(livre)}
                          className="flex items-center gap-1.5 text-slate-700 hover:text-brand-orange font-bold text-xs py-1 px-2.5 cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>Modifier</span>
                        </Button>

                        {deleteConfirmId === livre.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSupprimer(livre.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded-md text-[11px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium hover:bg-slate-300 transition-colors cursor-pointer"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(livre.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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
          <Card className="p-4 bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <Filter size={14} className="text-brand-orange" />
                <span>Filtres de consolidation & Recherche</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {isChefCentre
                  ? "Périmètre restreint à votre centre"
                  : "Périmètre national ajustable"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Filtre Centre */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Centre d'apprentissage
                </label>
                {isChefCentre ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="truncate">{nomCentreUtilisateur}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Fixé</span>
                  </div>
                ) : (
                  <select
                    value={selectedCentreId}
                    onChange={(e) => setSelectedCentreId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white cursor-pointer"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ouvrage / Titre
                </label>
                <select
                  value={selectedLivreId}
                  onChange={(e) => setSelectedLivreId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white cursor-pointer"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Type d'acheteur
                </label>
                <select
                  value={selectedTypeAcheteur}
                  onChange={(e) =>
                    setSelectedTypeAcheteur(e.target.value as "TOUS" | "INTERNE" | "EXTERNE")
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white cursor-pointer"
                >
                  <option value="TOUS">Tous les acheteurs</option>
                  <option value="INTERNE">Élèves inscrits uniquement</option>
                  <option value="EXTERNE">Acheteurs externes uniquement</option>
                </select>
              </div>

              {/* Date Début */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white cursor-pointer"
                />
              </div>

              {/* Date Fin */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* Recherche textuelle acheteur */}
            <div className="pt-1">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher par nom de l'élève ou de l'acheteur externe..."
                  value={rechercheVente}
                  onChange={(e) => setRechercheVente(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
            </div>
          </Card>

          {/* Cartes KPI Bilans Ventes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-brand-orange shrink-0">
                  <Coins size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recettes Totales Ventes
                  </span>
                  <span className="text-xl font-black text-brand-orange">
                    {FCFA.format(aggregatesFiltres.totalMontant)} FCFA
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Package size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Exemplaires Vendus
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {aggregatesFiltres.totalQuantite} livres
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange shrink-0">
                  <UserCheck size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Élèves du Centre
                  </span>
                  <span className="text-base font-black text-brand-anthracite block leading-tight">
                    {FCFA.format(aggregatesFiltres.montantInternes)} FCFA
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {aggregatesFiltres.nbInternes} transaction(s)
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                  <Users size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Acheteurs Externes
                  </span>
                  <span className="text-base font-black text-purple-800 block leading-tight">
                    {FCFA.format(aggregatesFiltres.montantExternes)} FCFA
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {aggregatesFiltres.nbExternes} transaction(s)
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* ── SECTION 1 : VENTILATION PAR TYPE DE LIVRE (NOM) ── */}
          <Card className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-brand-orange" />
                <h2 className="text-sm font-black text-slate-900">
                  Bilan & Ventilation par Ouvrage (Nom du Livre)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Session en cours
              </span>
            </div>

            {statsLoading ? (
              <div className="p-4">
                <SkeletonTable rows={4} columns={4} />
              </div>
            ) : !statsVentes || statsVentes.parLivre.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucune vente enregistrée pour les filtres sélectionnés.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
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
                          ? Math.round((item.montantTotal / statsVentes.totalMontant) * 100)
                          : 0;

                      return (
                        <tr key={item.livreId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-800 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-brand-orange font-bold text-[10px]">
                              {item.titreLivre.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{item.titreLivre}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black">
                              {item.quantiteVendue} ex.
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-brand-orange">
                            {FCFA.format(item.montantTotal)} FCFA
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-brand-orange rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                      <td className="py-3 px-4">TOTAL CONSOLIDÉ</td>
                      <td className="py-3 px-4 text-center text-blue-700">
                        {statsVentes.totalQuantite} exemplaires
                      </td>
                      <td className="py-3 px-4 text-right text-brand-orange text-sm">
                        {FCFA.format(statsVentes.totalMontant)} FCFA
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          {/* ── SECTION 2 : VENTILATION PAR CENTRE (Visible aux Directeurs quand pas de filtre centre unique) ── */}
          {!isChefCentre && !selectedCentreId && statsVentes && statsVentes.parCentre.length > 0 && (
            <Card className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <h2 className="text-sm font-black text-slate-900">
                    Ventilation des Ventes par Centre d'Apprentissage
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Vue Consolidation Nationale
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
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
                          ? Math.round((c.montantTotal / statsVentes.totalMontant) * 100)
                          : 0;

                      return (
                        <tr key={c.centreId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-800 flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400" />
                            <span>{c.nomCentre}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black">
                              {c.quantiteVendue} ex.
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            {FCFA.format(c.montantTotal)} FCFA
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
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
          <Card className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-brand-orange" />
                <h2 className="text-sm font-black text-slate-900">
                  Journal Détaillé des Ventes & Traçabilité ({ventesFiltrees.length} lignes)
                </h2>
              </div>

              <Button
                variant="secondary"
                onClick={() => setModalVenteOuverte(true)}
                className="text-xs font-bold flex items-center gap-1 text-slate-700 hover:text-brand-orange"
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
            ) : ventesFiltrees.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <ShoppingCart size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">
                  Aucune transaction enregistrée pour ces critères.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cliquez sur « Enregistrer une vente » pour consigner une vente de livres.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10">
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
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
                    {ventesFiltrees.map((v: VenteLivre) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-600 whitespace-nowrap">
                          {new Date(v.dateVente).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Building2 size={12} className="text-slate-400" />
                            {v.centreNom}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                          {v.nomAcheteur}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {v.estExterne ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              <Users size={10} /> Externe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
                              <UserCheck size={10} /> Élève inscrit
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-800">
                          {v.livreTitre}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-slate-800">
                          {v.quantite}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {FCFA.format(v.prixUnitaire)} F
                        </td>
                        <td className="py-3 px-4 text-right font-black text-brand-orange whitespace-nowrap">
                          {FCFA.format(v.montantTotal)} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          title={livreEnEdition ? "Modifier l'ouvrage" : "Ajouter un nouvel ouvrage"}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitLivre} className="space-y-4">
            {formErreur && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                <span>{formErreur}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre de l'ouvrage <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: AXIOME, VECTEUR..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Coins size={12} className="text-brand-orange" />
                <span>Prix (FCFA)</span> <span className="text-rose-500">*</span>
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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Matière / Destination
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Manuel de préparation intensive en mathématiques..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modal-livre-actif"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer"
              />
              <label
                htmlFor="modal-livre-actif"
                className="text-xs font-bold text-slate-700 cursor-pointer select-none"
              >
                Livre disponible (visible et disponible à l'encaissement)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalCatalogueOuverte(false)}
                disabled={
                  creerLivreMutation.isPending || modifierLivreMutation.isPending
                }
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  creerLivreMutation.isPending || modifierLivreMutation.isPending
                }
                className="bg-brand-orange text-white font-bold hover:bg-brand-orange/90"
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
