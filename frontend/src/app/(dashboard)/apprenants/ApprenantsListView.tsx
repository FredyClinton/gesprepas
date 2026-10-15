"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  UserPlus,
  Building2,
  Phone,
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  Coins,
  Download,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";

import { Button, Card, Pagination, Skeleton } from "@/shared/ui";
import { useApprenants, type Apprenant } from "@/modules/apprenants";
import { useFormations, type Formation } from "@/modules/academique";
import { useSessionActive } from "@/modules/centres-sessions";
import { useDossiers, type Dossier } from "@/modules/dossiers";
import {
  useMouvementsFinanciers,
  EnregistrerVersementModal,
} from "@/modules/financier";

const TAILLE_PAGE = 10;
const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");

const AVATAR_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-orange-50 text-brand-orange border-orange-200",
];

function getAvatarStyles(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(prenom: string, nom: string) {
  const p = prenom?.trim() ? prenom.trim()[0] : "";
  const n = nom?.trim() ? nom.trim()[0] : "";
  return (p + n).toUpperCase() || "E";
}

type ColonneTri = "nom" | "formation" | "paiement" | "dossier" | "date";
type DirectionTri = "asc" | "desc";

export function ApprenantsListView({ centreId }: { centreId: string }) {
  const { data: apprenants, isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [] } = useFormations();
  const { data: sessionActive } = useSessionActive();
  const { data: mouvements = [], isLoading: chargementMouvements } =
    useMouvementsFinanciers(sessionActive?.id, centreId);
  const { data: dossiers = [], isLoading: chargementDossiers } =
    useDossiers(sessionActive?.id, centreId);

  const [recherche, setRecherche] = useState("");
  const [filtreFormation, setFiltreFormation] = useState("");
  const [filtreEtablissement, setFiltreEtablissement] = useState("");
  const [filtrePaiement, setFiltrePaiement] = useState<"TOUS" | "SOLDE" | "RESTANT">("TOUS");
  const [filtreAdmission, setFiltreAdmission] = useState<"TOUS" | "DEFINITIF" | "PRE_INSCRIT">("TOUS");
  const [page, setPage] = useState(1);

  // État de tri
  const [triColonne, setTriColonne] = useState<ColonneTri>("nom");
  const [triDirection, setTriDirection] = useState<DirectionTri>("asc");

  // État de sélection pour export
  const [selectionIds, setSelectionIds] = useState<Set<string>>(new Set());

  // État modal encaissement rapide
  const [versementApprenant, setVersementApprenant] = useState<{
    id: string;
    nomComplet: string;
    formationId?: string;
    soldeRestant: number;
  } | null>(null);

  function changerRecherche(valeur: string) {
    setRecherche(valeur);
    setPage(1);
  }
  function changerFiltreFormation(valeur: string) {
    setFiltreFormation(valeur);
    setPage(1);
  }
  function changerFiltreEtablissement(valeur: string) {
    setFiltreEtablissement(valeur);
    setPage(1);
  }
  function changerFiltreAdmission(valeur: "TOUS" | "DEFINITIF" | "PRE_INSCRIT") {
    setFiltreAdmission(valeur);
    setPage(1);
  }
  function changerFiltrePaiement(valeur: "TOUS" | "SOLDE" | "RESTANT") {
    setFiltrePaiement(valeur);
    setPage(1);
  }
  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreFormation("");
    setFiltreEtablissement("");
    setFiltrePaiement("TOUS");
    setFiltreAdmission("TOUS");
    setPage(1);
  }

  function basculerTri(colonne: ColonneTri) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
  }

  const apprenantsDuCentre = useMemo(() => {
    if (!sessionActive?.id) {
      return (apprenants ?? []).filter((a) => a.centreId === centreId);
    }
    return (apprenants ?? []).filter(
      (a) => a.centreId === centreId && a.sessionId === sessionActive.id,
    );
  }, [apprenants, centreId, sessionActive]);

  // Calcul groupé des montants payés par apprenant pour éviter les requêtes N+1
  const paiementsParApprenant = useMemo(() => {
    const map = new Map<string, number>();
    mouvements
      .filter((m) => m.type === "ENTREE" && m.statut !== "REJETE" && m.apprenantId)
      .forEach((m) => {
        map.set(m.apprenantId!, (map.get(m.apprenantId!) || 0) + m.montant);
      });
    return map;
  }, [mouvements]);

  // Indexation des dossiers de concours par apprenant
  const dossiersParApprenant = useMemo(() => {
    const map = new Map<string, Dossier>();
    dossiers.forEach((d) => {
      map.set(d.apprenantId, d);
    });
    return map;
  }, [dossiers]);

  const listeEtablissements = useMemo(() => {
    const set = new Set<string>();
    apprenantsDuCentre.forEach((a) => {
      if (a.etablissementOrigine && a.etablissementOrigine.trim()) {
        set.add(a.etablissementOrigine.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr-FR"));
  }, [apprenantsDuCentre]);

  const stats = useMemo(() => {
    const total = apprenantsDuCentre.length;
    const preInscrits = apprenantsDuCentre.filter((a) => a.preInscrit).length;
    const definitifs = total - preInscrits;
    return { total, preInscrits, definitifs };
  }, [apprenantsDuCentre]);

  // Filtrage combiné multi-critères et tri
  const apprenantsFiltres = useMemo(() => {
    const resultat = apprenantsDuCentre.filter((a) => {
      // 1. Filtre par formation
      if (filtreFormation && a.formationId !== filtreFormation) return false;

      // 2. Filtre par établissement
      if (filtreEtablissement && a.etablissementOrigine !== filtreEtablissement) return false;

      // 3. Filtre par type d'admission
      if (filtreAdmission === "PRE_INSCRIT" && !a.preInscrit) return false;
      if (filtreAdmission === "DEFINITIF" && a.preInscrit) return false;

      // 4. Filtre par statut de paiement
      const paye = paiementsParApprenant.get(a.id) || 0;
      const soldeRestant = Math.max(0, (a.montantContrat || 0) - paye);
      if (filtrePaiement === "SOLDE" && soldeRestant > 0) return false;
      if (filtrePaiement === "RESTANT" && soldeRestant === 0) return false;

      // 5. Filtre recherche textuelle
      if (recherche.trim()) {
        const q = recherche.trim().toLowerCase();
        const nomComplet = `${a.prenom} ${a.nom}`.toLowerCase();
        const contact = a.contactApprenant?.toLowerCase() || "";
        const etab = a.etablissementOrigine?.toLowerCase() || "";
        const parent = a.nomParent?.toLowerCase() || "";
        if (
          !nomComplet.includes(q) &&
          !contact.includes(q) &&
          !etab.includes(q) &&
          !parent.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    // Tri
    resultat.sort((a, b) => {
      let comparaison = 0;
      if (triColonne === "nom") {
        const nomA = `${a.nom} ${a.prenom}`.toLowerCase();
        const nomB = `${b.nom} ${b.prenom}`.toLowerCase();
        comparaison = nomA.localeCompare(nomB, "fr-FR");
      } else if (triColonne === "formation") {
        const nomFA = formations.find((f) => f.id === a.formationId)?.nom || "";
        const nomFB = formations.find((f) => f.id === b.formationId)?.nom || "";
        comparaison = nomFA.localeCompare(nomFB, "fr-FR");
      } else if (triColonne === "paiement") {
        const soldeA = Math.max(0, (a.montantContrat || 0) - (paiementsParApprenant.get(a.id) || 0));
        const soldeB = Math.max(0, (b.montantContrat || 0) - (paiementsParApprenant.get(b.id) || 0));
        comparaison = soldeA - soldeB;
      } else if (triColonne === "dossier") {
        const statutA = dossiersParApprenant.get(a.id)?.statut || "Z";
        const statutB = dossiersParApprenant.get(b.id)?.statut || "Z";
        comparaison = statutA.localeCompare(statutB);
      } else if (triColonne === "date") {
        const dateA = a.dateInscription ? new Date(a.dateInscription).getTime() : 0;
        const dateB = b.dateInscription ? new Date(b.dateInscription).getTime() : 0;
        comparaison = dateA - dateB;
      }
      return triDirection === "asc" ? comparaison : -comparaison;
    });

    return resultat;
  }, [
    apprenantsDuCentre,
    filtreFormation,
    filtreEtablissement,
    filtreAdmission,
    filtrePaiement,
    recherche,
    paiementsParApprenant,
    dossiersParApprenant,
    formations,
    triColonne,
    triDirection,
  ]);

  const apprenantsPage = useMemo(
    () => apprenantsFiltres.slice((page - 1) * TAILLE_PAGE, page * TAILLE_PAGE),
    [apprenantsFiltres, page],
  );

  const tousSelectionnesSurPage =
    apprenantsPage.length > 0 &&
    apprenantsPage.every((a) => selectionIds.has(a.id));

  function toggleSelectAllPage() {
    setSelectionIds((prev) => {
      const next = new Set(prev);
      if (tousSelectionnesSurPage) {
        apprenantsPage.forEach((a) => next.delete(a.id));
      } else {
        apprenantsPage.forEach((a) => next.add(a.id));
      }
      return next;
    });
  }

  function toggleSelectApprenant(id: string) {
    setSelectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const aDesFiltresActifs =
    Boolean(recherche) ||
    Boolean(filtreFormation) ||
    Boolean(filtreEtablissement) ||
    filtreAdmission !== "TOUS" ||
    filtrePaiement !== "TOUS";

  // Fonction d'export CSV (adaptée à la sélection)
  function exporterCSV() {
    const cibles =
      selectionIds.size > 0
        ? apprenantsDuCentre.filter((a) => selectionIds.has(a.id))
        : apprenantsFiltres;

    if (cibles.length === 0) return;

    const enTetes = [
      "ID",
      "Nom",
      "Prénom",
      "Téléphone Élève",
      "Formation",
      "Établissement d'origine",
      "Type d'admission",
      "Date d'inscription",
      "Montant Contrat (FCFA)",
      "Montant Payé (FCFA)",
      "Reste Dû (FCFA)",
      "Statut Paiement",
      "Statut Dossier",
      "Nom Parent",
      "Contact Parent",
    ];

    const lignes = cibles.map((a) => {
      const nomFormation =
        formations.find((f) => f.id === a.formationId)?.nom || "Non définie";
      const paye = paiementsParApprenant.get(a.id) || 0;
      const reste = Math.max(0, (a.montantContrat || 0) - paye);
      const statutPaye = reste === 0 ? "Soldé" : paye > 0 ? "Partiel" : "Non démarré";
      const statutDossier = dossiersParApprenant.get(a.id)?.statut || "Aucun dossier";

      return [
        a.id,
        `"${a.nom.replace(/"/g, '""')}"`,
        `"${a.prenom.replace(/"/g, '""')}"`,
        `"${a.contactApprenant || ""}"`,
        `"${nomFormation.replace(/"/g, '""')}"`,
        `"${(a.etablissementOrigine || "").replace(/"/g, '""')}"`,
        a.preInscrit ? "Pré-inscrit" : "Inscription définitive",
        a.dateInscription ? new Date(a.dateInscription).toLocaleDateString("fr-FR") : "",
        a.montantContrat || 0,
        paye,
        reste,
        statutPaye,
        statutDossier,
        `"${(a.nomParent || "").replace(/"/g, '""')}"`,
        `"${a.contactParent || ""}"`,
      ].join(";");
    });

    const contenuCSV = "\uFEFF" + [enTetes.join(";"), ...lignes].join("\n");
    const blob = new Blob([contenuCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.setAttribute(
      "download",
      `apprenants_${selectionIds.size > 0 ? "selection_" : ""}${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  }

  const chargement = chargementApprenants || chargementMouvements || chargementDossiers;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Titre et Action Inscription ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Apprenants
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion des inscriptions, suivi des dossiers administratifs et des encaissements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={exporterCSV}
            disabled={apprenantsFiltres.length === 0}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
              selectionIds.size > 0
                ? "border-brand-orange text-brand-orange bg-orange-50/70"
                : ""
            }`}
          >
            <Download size={14} />
            <span>
              {selectionIds.size > 0
                ? `Exporter sélection (${selectionIds.size})`
                : "Exporter CSV"}
            </span>
          </Button>

          <Link href="/inscription">
            <Button type="button" className="bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xs">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <UserPlus size={15} />
                Inscrire un apprenant
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Cartes Synthèse KPIs Interactives ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => changerFiltreAdmission("TOUS")}
          className={`text-left transition-all cursor-pointer rounded-2xl ${
            filtreAdmission === "TOUS" ? "ring-2 ring-brand-orange/30 shadow-xs" : ""
          }`}
        >
          <Card className="p-4 bg-white border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Inscrits
              </p>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {stats.total} élève{stats.total > 1 ? "s" : ""}
              </p>
            </div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() =>
            changerFiltreAdmission(filtreAdmission === "DEFINITIF" ? "TOUS" : "DEFINITIF")
          }
          className={`text-left transition-all cursor-pointer rounded-2xl ${
            filtreAdmission === "DEFINITIF" ? "ring-2 ring-emerald-500/50 shadow-xs" : ""
          }`}
        >
          <Card className="p-4 bg-white border border-slate-200 hover:border-emerald-300 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Inscriptions Définitives
              </p>
              <p className="text-xl font-black text-emerald-800 mt-0.5">
                {stats.definitifs}
              </p>
            </div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() =>
            changerFiltreAdmission(filtreAdmission === "PRE_INSCRIT" ? "TOUS" : "PRE_INSCRIT")
          }
          className={`text-left transition-all cursor-pointer rounded-2xl ${
            filtreAdmission === "PRE_INSCRIT" ? "ring-2 ring-amber-500/50 shadow-xs" : ""
          }`}
        >
          <Card className="p-4 bg-white border border-slate-200 hover:border-amber-300 shadow-xs flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pré-inscriptions (Acomptes)
              </p>
              <p className="text-xl font-black text-amber-800 mt-0.5">
                {stats.preInscrits}
              </p>
            </div>
          </Card>
        </button>
      </div>

      {/* ── Filtres de Recherche et Recouvrement ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Champ Recherche */}
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => changerRecherche(e.target.value)}
              placeholder="Rechercher par nom, prénom, téléphone, lycée..."
              className="w-full text-xs sm:text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400 font-medium"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => changerRecherche("")}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtre Formations */}
          <select
            value={filtreFormation}
            onChange={(e) => changerFiltreFormation(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="" className="bg-white text-slate-800">
              Toutes les formations ({formations.length})
            </option>
            {formations.map((f) => (
              <option key={f.id} value={f.id} className="bg-white text-slate-800">
                {f.nom}
              </option>
            ))}
          </select>

          {/* Filtre Établissements */}
          <select
            value={filtreEtablissement}
            onChange={(e) => changerFiltreEtablissement(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="" className="bg-white text-slate-800">
              Tous les lycées ({listeEtablissements.length})
            </option>
            {listeEtablissements.map((etab) => (
              <option key={etab} value={etab} className="bg-white text-slate-800">
                {etab}
              </option>
            ))}
          </select>

          {/* Filtre Paiement */}
          <select
            value={filtrePaiement}
            onChange={(e) => changerFiltrePaiement(e.target.value as "TOUS" | "SOLDE" | "RESTANT")}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="TOUS">Tous les paiements</option>
            <option value="SOLDE">Soldés (100%)</option>
            <option value="RESTANT">Reste à payer</option>
          </select>

          {/* Filtre Type d'admission */}
          <select
            value={filtreAdmission}
            onChange={(e) =>
              changerFiltreAdmission(e.target.value as "TOUS" | "DEFINITIF" | "PRE_INSCRIT")
            }
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="TOUS">Tous les types d&rsquo;admission</option>
            <option value="DEFINITIF">Inscriptions définitives</option>
            <option value="PRE_INSCRIT">Pré-inscrits (Acomptes)</option>
          </select>

          {/* Réinitialiser */}
          {aDesFiltresActifs && (
            <button
              type="button"
              onClick={reinitialiserFiltres}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline px-2 py-1 shrink-0"
            >
              <X size={13} />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {/* Info compteur résultats et sélection */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              {apprenantsFiltres.length} apprenant{apprenantsFiltres.length > 1 ? "s" : ""} trouvé
              {apprenantsFiltres.length > 1 ? "s" : ""}
            </span>
            {selectionIds.size > 0 && (
              <span className="font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                {selectionIds.size} sélectionné{selectionIds.size > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filtreFormation && (
              <span className="font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md">
                Formation : {formations.find((f) => f.id === filtreFormation)?.nom}
              </span>
            )}
            {filtrePaiement !== "TOUS" && (
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {filtrePaiement === "SOLDE" ? "Soldés uniquement" : "Reste à payer"}
              </span>
            )}
            {filtreEtablissement && (
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                Lycée : {filtreEtablissement}
              </span>
            )}
            {filtreAdmission !== "TOUS" && (
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {filtreAdmission === "PRE_INSCRIT" ? "Pré-inscriptions" : "Définitifs"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Table des Apprenants ── */}
      <Card className="overflow-hidden border border-slate-200 shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-700 select-none">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={tousSelectionnesSurPage}
                    onChange={toggleSelectAllPage}
                    className="h-4 w-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/30 cursor-pointer"
                    title="Tout sélectionner sur cette page"
                  />
                </th>
                <th
                  onClick={() => basculerTri("nom")}
                  className="p-3.5 text-xs font-bold tracking-wider uppercase cursor-pointer hover:text-brand-orange transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Apprenant &amp; Contact</span>
                    {triColonne === "nom" ? (
                      triDirection === "asc" ? (
                        <ArrowUp size={13} className="text-brand-orange" />
                      ) : (
                        <ArrowDown size={13} className="text-brand-orange" />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => basculerTri("formation")}
                  className="p-3.5 text-xs font-bold tracking-wider uppercase cursor-pointer hover:text-brand-orange transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Filière &amp; Inscription</span>
                    {triColonne === "formation" ? (
                      triDirection === "asc" ? (
                        <ArrowUp size={13} className="text-brand-orange" />
                      ) : (
                        <ArrowDown size={13} className="text-brand-orange" />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => basculerTri("paiement")}
                  className="p-3.5 text-xs font-bold tracking-wider uppercase cursor-pointer hover:text-brand-orange transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Suivi Recouvrement</span>
                    {triColonne === "paiement" ? (
                      triDirection === "asc" ? (
                        <ArrowUp size={13} className="text-brand-orange" />
                      ) : (
                        <ArrowDown size={13} className="text-brand-orange" />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => basculerTri("dossier")}
                  className="p-3.5 text-xs font-bold tracking-wider uppercase cursor-pointer hover:text-brand-orange transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Dossier Concours</span>
                    {triColonne === "dossier" ? (
                      triDirection === "asc" ? (
                        <ArrowUp size={13} className="text-brand-orange" />
                      ) : (
                        <ArrowDown size={13} className="text-brand-orange" />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="p-3.5 text-right text-xs font-bold tracking-wider uppercase">
                  Actions Rapides
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {chargement &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-3.5 text-center">
                      <Skeleton className="h-4 w-4 rounded mx-auto" />
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-2.5 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-2 w-28 rounded-full" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="p-3.5 text-right">
                      <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))}
              {!chargement && apprenantsFiltres.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-slate-400 p-8 text-center text-xs">
                    Aucun apprenant ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
              {apprenantsPage.map((a) => {
                const nomFormation = formations.find((f) => f.id === a.formationId)?.nom;
                const montantPaye = paiementsParApprenant.get(a.id) || 0;
                const dossier = dossiersParApprenant.get(a.id);
                const estSelectionne = selectionIds.has(a.id);

                return (
                  <LigneApprenant
                    key={a.id}
                    apprenant={a}
                    nomFormation={nomFormation}
                    montantPaye={montantPaye}
                    dossier={dossier}
                    estSelectionne={estSelectionne}
                    onToggleSelect={() => toggleSelectApprenant(a.id)}
                    onEncaisser={(soldeRestant) =>
                      setVersementApprenant({
                        id: a.id,
                        nomComplet: `${a.prenom} ${a.nom}`,
                        formationId: a.formationId,
                        soldeRestant,
                      })
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {!chargement && apprenantsFiltres.length > 0 && (
          <div className="border-slate-100 border-t px-4 py-3 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Affichage de {(page - 1) * TAILLE_PAGE + 1} à{" "}
              {Math.min(page * TAILLE_PAGE, apprenantsFiltres.length)} sur{" "}
              {apprenantsFiltres.length} apprenant{apprenantsFiltres.length > 1 ? "s" : ""}
            </span>
            <Pagination
              page={page}
              totalPages={Math.max(1, Math.ceil(apprenantsFiltres.length / TAILLE_PAGE))}
              totalItems={apprenantsFiltres.length}
              pageSize={TAILLE_PAGE}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* ── Modal Encaissement Rapide ── */}
      {versementApprenant && sessionActive && (
        <EnregistrerVersementModal
          isOpen={Boolean(versementApprenant)}
          onClose={() => setVersementApprenant(null)}
          apprenantId={versementApprenant.id}
          nomApprenant={versementApprenant.nomComplet}
          centreId={centreId}
          sessionId={sessionActive.id}
          formationId={versementApprenant.formationId}
          soldeRestant={versementApprenant.soldeRestant}
        />
      )}
    </div>
  );
}

function LigneApprenant({
  apprenant,
  nomFormation,
  montantPaye,
  dossier,
  estSelectionne,
  onToggleSelect,
  onEncaisser,
}: {
  apprenant: Apprenant;
  nomFormation?: string;
  montantPaye: number;
  dossier?: Dossier;
  estSelectionne: boolean;
  onToggleSelect: () => void;
  onEncaisser: (soldeRestant: number) => void;
}) {
  const montantContrat = apprenant.montantContrat || 0;
  const soldeRestant = Math.max(0, montantContrat - montantPaye);
  const pctRegle =
    montantContrat > 0 ? Math.min(100, Math.round((montantPaye / montantContrat) * 100)) : 0;

  return (
    <tr
      className={`transition-colors duration-150 group ${
        estSelectionne ? "bg-orange-50/60" : "hover:bg-amber-50/40"
      }`}
    >
      {/* 0. Checkbox Sélection */}
      <td className="p-3.5 text-center">
        <input
          type="checkbox"
          checked={estSelectionne}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/30 cursor-pointer"
        />
      </td>

      {/* 1. Identité, Contact & Lycée d'origine regroupés */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          <Link
            href={`/apprenants/${apprenant.id}`}
            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-transform group-hover:scale-105 ${getAvatarStyles(
              `${apprenant.prenom} ${apprenant.nom}`,
            )}`}
          >
            {getInitials(apprenant.prenom, apprenant.nom)}
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/apprenants/${apprenant.id}`}
                className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors truncate"
              >
                {apprenant.nom} {apprenant.prenom}
              </Link>
              {apprenant.preInscrit && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 uppercase shrink-0">
                  Pré-inscrit
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-y-0.5 gap-x-2 text-xs text-slate-400 mt-0.5">
              {apprenant.contactApprenant && (
                <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                  <Phone size={11} className="text-slate-400" />
                  {apprenant.contactApprenant}
                </span>
              )}
              {apprenant.contactApprenant && apprenant.etablissementOrigine && (
                <span className="text-slate-300">·</span>
              )}
              {apprenant.etablissementOrigine ? (
                <span
                  className="inline-flex items-center gap-1 text-slate-600 truncate max-w-[180px]"
                  title={apprenant.etablissementOrigine}
                >
                  <Building2 size={11} className="text-slate-400 shrink-0" />
                  {apprenant.etablissementOrigine}
                </span>
              ) : (
                <span className="italic text-slate-400">Lycée non précisé</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Filière & Date d'inscription */}
      <td className="p-3.5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200/70 px-2.5 py-0.5 text-xs font-bold text-orange-950">
            <GraduationCap size={13} className="text-brand-orange shrink-0" />
            <span className="truncate max-w-[160px]">{nomFormation ?? "Formation non définie"}</span>
          </span>
          {apprenant.dateInscription && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Calendar size={11} className="text-slate-400" />
              <span>{new Date(apprenant.dateInscription).toLocaleDateString("fr-FR")}</span>
            </p>
          )}
        </div>
      </td>

      {/* 3. Mini-jauge de recouvrement contextuelle */}
      <td className="p-3.5">
        {soldeRestant <= 0 ? (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Soldé (100%)
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-28 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Total : {FORMATEUR_FCFA.format(montantContrat)} F
            </p>
          </div>
        ) : montantPaye > 0 ? (
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${pctRegle}%` }}
                />
              </div>
              <span className="text-xs font-black text-amber-900 tabular-nums">
                {pctRegle}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Payé <strong className="text-slate-800">{FORMATEUR_FCFA.format(montantPaye)} F</strong>
              {" · "}
              Reste <strong className="text-brand-orange font-bold">{FORMATEUR_FCFA.format(soldeRestant)} F</strong>
            </p>
          </div>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              0% versé
            </span>
            <div className="mt-1.5 h-1.5 w-24 bg-slate-100 rounded-full" />
            <p className="text-[11px] text-brand-orange font-bold mt-1">
              Reste : {FORMATEUR_FCFA.format(montantContrat)} F
            </p>
          </div>
        )}
      </td>

      {/* 4. Statut Dossier Concours */}
      <td className="p-3.5">
        {!dossier ? (
          <span className="bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Aucun dossier
          </span>
        ) : dossier.statut === "COMPLET" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Complet
          </span>
        ) : dossier.statut === "CLOTURE" ? (
          <span className="bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 text-xs font-bold">
            Clôturé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            <Clock size={12} className="text-amber-600" />
            En cours
          </span>
        )}
      </td>

      {/* 5. Actions Rapides */}
      <td className="p-3.5 text-right">
        <div className="inline-flex items-center gap-1.5 justify-end">
          {soldeRestant > 0 && (
            <button
              type="button"
              onClick={() => onEncaisser(soldeRestant)}
              title="Encaisser un versement"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer"
            >
              <Coins size={13} />
              <span>Encaisser</span>
            </button>
          )}

          <Link
            href={`/apprenants/${apprenant.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-brand-orange hover:border-brand-orange/40 hover:bg-orange-50/50 shadow-2xs transition-all"
          >
            <Eye size={13} />
            <span>Fiche</span>
          </Link>
        </div>
      </td>
    </tr>
  );
}
