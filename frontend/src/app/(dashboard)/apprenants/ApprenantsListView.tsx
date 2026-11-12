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
  Printer,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";

import { Button, Card, Pagination, Skeleton } from "@/shared/ui";
import {
  rechercherApprenants,
  useRechercheApprenants,
  useSyntheseApprenants,
  type Apprenant,
  type CriteresRechercheApprenants,
  type LigneApprenant as LigneApprenantListe,
  type TriApprenants,
} from "@/modules/apprenants";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { chargerToutesLesPages } from "@/shared/lib/pagination";
import { useFormations, type Formation } from "@/modules/academique";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import {
  EnregistrerVersementModal,
  RecuPaiementModal,
  type DonneesRecuPaiement,
} from "@/modules/financier";
import { ListeApprenantsPrintModal } from "./ListeApprenantsPrintModal";

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

type ColonneTri =
  "nom" | "formation" | "etablissement" | "paiement" | "dossier" | "date";
type DirectionTri = "asc" | "desc";

const TRI_BACKEND: Record<ColonneTri, TriApprenants> = {
  nom: "NOM",
  formation: "FORMATION",
  etablissement: "ETABLISSEMENT",
  paiement: "PAIEMENT",
  dossier: "DOSSIER",
  date: "DATE",
};

export function ApprenantsListView({
  centreId,
  userRole,
  initialRecherche = "",
}: {
  centreId: string;
  userRole?: string;
  initialRecherche?: string;
}) {
  // INSCRIPTION_GERER côté backend : le Directeur consulte, il n'inscrit pas.
  const peutInscrire =
    userRole === "CAISSIER" ||
    userRole === "DIRECTEUR_ACADEMIQUE" ||
    userRole === "ADMIN";
  const peutEncaisser = userRole === "CAISSIER" || userRole === "ADMIN";

  const isTousCentres = !centreId || centreId === "TOUS";
  const centreIdFiltre = isTousCentres ? undefined : centreId;

  const { data: formations = [] } = useFormations();
  const { data: centres = [] } = useCentres();
  const { data: sessionActive, isLoading: chargementSession } =
    useSessionActive();

  const centreActuel = centres.find((c) => c.id === centreId);

  const [recherche, setRecherche] = useState(initialRecherche);
  const [filtreFormation, setFiltreFormation] = useState("");
  const [filtreEtablissement, setFiltreEtablissement] = useState("");
  const [filtrePaiement, setFiltrePaiement] = useState<
    "TOUS" | "SOLDE" | "RESTANT"
  >("TOUS");
  const [filtreAdmission, setFiltreAdmission] = useState<
    "TOUS" | "DEFINITIF" | "PRE_INSCRIT"
  >("TOUS");
  const [page, setPage] = useState(1);

  // État de tri
  const [triColonne, setTriColonne] = useState<ColonneTri>("nom");
  const [triDirection, setTriDirection] = useState<DirectionTri>("asc");

  // État de sélection pour export
  // Map id -> ligne : une sélection peut couvrir plusieurs pages, on garde donc
  // les lignes elles-mêmes pour l'export/impression.
  const [selectionIds, setSelectionIds] = useState<
    Map<string, LigneApprenantListe>
  >(new Map());
  const [lignesImpression, setLignesImpression] = useState<
    LigneApprenantListe[]
  >([]);
  const [preparationExport, setPreparationExport] = useState(false);

  // État modal encaissement rapide, reçu et impression liste
  const [recuAImprimer, setRecuAImprimer] =
    useState<DonneesRecuPaiement | null>(null);
  const [modalPrintOuverte, setModalPrintOuverte] = useState(false);
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
  function changerFiltreAdmission(
    valeur: "TOUS" | "DEFINITIF" | "PRE_INSCRIT",
  ) {
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

  const rechercheStable = useDebouncedValue(recherche);

  const criteres = useMemo<CriteresRechercheApprenants>(
    () => ({
      sessionId: sessionActive?.id,
      centreId: centreIdFiltre,
      formationId: filtreFormation || undefined,
      etablissement: filtreEtablissement || undefined,
      admission: filtreAdmission,
      paiement: filtrePaiement,
      recherche: rechercheStable.trim() || undefined,
      tri: TRI_BACKEND[triColonne],
      sens: triDirection === "asc" ? "ASC" : "DESC",
    }),
    [
      sessionActive?.id,
      centreIdFiltre,
      filtreFormation,
      filtreEtablissement,
      filtreAdmission,
      filtrePaiement,
      rechercheStable,
      triColonne,
      triDirection,
    ],
  );

  // Filtrage, tri, calcul du payé/reste dû et pagination faits par le backend.
  const { data: pageApprenants, isLoading: chargementApprenants } =
    useRechercheApprenants(criteres, page - 1, TAILLE_PAGE, !chargementSession);
  // Compteurs du périmètre (indépendants des filtres) + établissements connus.
  const { data: synthese } = useSyntheseApprenants(
    sessionActive?.id,
    centreIdFiltre,
  );

  const apprenantsPage = pageApprenants?.contenu ?? [];
  const totalFiltres = pageApprenants?.totalElements ?? 0;
  const totalPages = Math.max(1, pageApprenants?.totalPages ?? 1);
  const listeEtablissements = synthese?.etablissements ?? [];
  const stats = {
    total: synthese?.total ?? 0,
    preInscrits: synthese?.preInscrits ?? 0,
    definitifs: synthese?.definitifs ?? 0,
  };

  const tousSelectionnesSurPage =
    apprenantsPage.length > 0 &&
    apprenantsPage.every((a) => selectionIds.has(a.id));

  function toggleSelectAllPage() {
    setSelectionIds((prev) => {
      const next = new Map(prev);
      if (tousSelectionnesSurPage) {
        apprenantsPage.forEach((a) => next.delete(a.id));
      } else {
        apprenantsPage.forEach((a) => next.set(a.id, a));
      }
      return next;
    });
  }

  function toggleSelectApprenant(apprenant: LigneApprenantListe) {
    setSelectionIds((prev) => {
      const next = new Map(prev);
      if (next.has(apprenant.id)) next.delete(apprenant.id);
      else next.set(apprenant.id, apprenant);
      return next;
    });
  }

  const aDesFiltresActifs =
    Boolean(recherche) ||
    Boolean(filtreFormation) ||
    Boolean(filtreEtablissement) ||
    filtreAdmission !== "TOUS" ||
    filtrePaiement !== "TOUS";

  // Cibles d'un export/impression : la sélection si elle existe, sinon toute la
  // liste filtrée (toutes pages confondues, rechargée depuis le backend).
  async function chargerCibles(): Promise<LigneApprenantListe[]> {
    if (selectionIds.size > 0) return Array.from(selectionIds.values());
    return chargerToutesLesPages((p, t) =>
      rechercherApprenants(criteres, p, t),
    );
  }

  async function ouvrirImpression() {
    setPreparationExport(true);
    try {
      setLignesImpression(await chargerCibles());
      setModalPrintOuverte(true);
    } finally {
      setPreparationExport(false);
    }
  }

  // Fonction d'export CSV (adaptée à la sélection)
  async function exporterCSV() {
    setPreparationExport(true);
    let cibles: LigneApprenantListe[];
    try {
      cibles = await chargerCibles();
    } finally {
      setPreparationExport(false);
    }

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
      const paye = a.montantPaye || 0;
      const reste = a.soldeRestant || 0;
      const statutPaye =
        reste === 0 ? "Soldé" : paye > 0 ? "Partiel" : "Non démarré";
      const statutDossier = a.statutDossier || "Aucun dossier";

      return [
        a.id,
        `"${a.nom.replace(/"/g, '""')}"`,
        `"${a.prenom.replace(/"/g, '""')}"`,
        `"${a.contactApprenant || ""}"`,
        `"${nomFormation.replace(/"/g, '""')}"`,
        `"${(a.etablissementOrigine || "").replace(/"/g, '""')}"`,
        a.preInscrit ? "Pré-inscrit" : "Inscription définitive",
        a.dateInscription
          ? new Date(a.dateInscription).toLocaleDateString("fr-FR")
          : "",
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

  const chargement = chargementSession || chargementApprenants;

  return (
    <div className="w-full space-y-6">
      {/* ── Titre et Action Inscription ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Apprenants
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion des inscriptions, suivi des dossiers administratifs et des
            encaissements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={exporterCSV}
            disabled={totalFiltres === 0 || preparationExport}
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

          <Button
            type="button"
            variant="secondary"
            onClick={ouvrirImpression}
            disabled={totalFiltres === 0 || preparationExport}
            className="flex items-center gap-1.5 text-xs font-bold transition-all"
          >
            <Printer size={14} />
            <span>
              {selectionIds.size > 0
                ? `Imprimer sélection (${selectionIds.size})`
                : "Imprimer la liste"}
            </span>
          </Button>

          {peutInscrire && (
            <Link href="/inscription">
              <Button
                type="button"
                className="bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xs"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <UserPlus size={15} />
                  Inscrire un apprenant
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Cartes Synthèse KPIs Interactives ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => changerFiltreAdmission("TOUS")}
          className={`cursor-pointer rounded-2xl text-left transition-all ${
            filtreAdmission === "TOUS"
              ? "ring-brand-orange/30 shadow-xs ring-2"
              : ""
          }`}
        >
          <Card className="flex items-center gap-3.5 border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300">
            <div className="text-brand-orange flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Total Inscrits
              </p>
              <p className="mt-0.5 text-xl font-black text-slate-900">
                {stats.total} élève{stats.total > 1 ? "s" : ""}
              </p>
            </div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() =>
            changerFiltreAdmission(
              filtreAdmission === "DEFINITIF" ? "TOUS" : "DEFINITIF",
            )
          }
          className={`cursor-pointer rounded-2xl text-left transition-all ${
            filtreAdmission === "DEFINITIF"
              ? "shadow-xs ring-2 ring-emerald-500/50"
              : ""
          }`}
        >
          <Card className="flex items-center gap-3.5 border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-300">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Inscriptions Définitives
              </p>
              <p className="mt-0.5 text-xl font-black text-emerald-800">
                {stats.definitifs}
              </p>
            </div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() =>
            changerFiltreAdmission(
              filtreAdmission === "PRE_INSCRIT" ? "TOUS" : "PRE_INSCRIT",
            )
          }
          className={`cursor-pointer rounded-2xl text-left transition-all ${
            filtreAdmission === "PRE_INSCRIT"
              ? "shadow-xs ring-2 ring-amber-500/50"
              : ""
          }`}
        >
          <Card className="flex items-center gap-3.5 border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-300">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Pré-inscriptions (Acomptes)
              </p>
              <p className="mt-0.5 text-xl font-black text-amber-800">
                {stats.preInscrits}
              </p>
            </div>
          </Card>
        </button>
      </div>

      {/* ── Filtres de Recherche et Recouvrement ── */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        {/* Ligne 1 : Champ Recherche et Réinitialisation */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => changerRecherche(e.target.value)}
              placeholder="Rechercher par nom, prénom, téléphone, lycée..."
              className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => changerRecherche("")}
                className="p-0.5 text-slate-400 hover:text-slate-600"
                title="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Réinitialiser */}
          {aDesFiltresActifs && (
            <button
              type="button"
              onClick={reinitialiserFiltres}
              className="text-brand-orange inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-orange-200 px-3 py-2 text-xs font-bold transition-colors hover:bg-orange-50"
            >
              <X size={13} />
              <span>Réinitialiser filtres</span>
            </button>
          )}
        </div>

        {/* Ligne 2 : Grille responsive des 4 filtres métier */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtre Formations */}
          <select
            value={filtreFormation}
            onChange={(e) => changerFiltreFormation(e.target.value)}
            className="focus:border-brand-orange focus:ring-brand-orange/20 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:ring-2"
          >
            <option value="" className="bg-white text-slate-800">
              Toutes les formations ({formations.length})
            </option>
            {formations.map((f) => (
              <option
                key={f.id}
                value={f.id}
                className="bg-white text-slate-800"
              >
                {f.nom}
              </option>
            ))}
          </select>

          {/* Filtre Établissements */}
          <select
            value={filtreEtablissement}
            onChange={(e) => changerFiltreEtablissement(e.target.value)}
            className="focus:border-brand-orange focus:ring-brand-orange/20 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:ring-2"
          >
            <option value="" className="bg-white text-slate-800">
              Tous les établissements ({listeEtablissements.length})
            </option>
            {listeEtablissements.map((etab) => (
              <option
                key={etab}
                value={etab}
                className="bg-white text-slate-800"
              >
                {etab}
              </option>
            ))}
          </select>

          {/* Filtre Paiement */}
          <select
            value={filtrePaiement}
            onChange={(e) =>
              changerFiltrePaiement(
                e.target.value as "TOUS" | "SOLDE" | "RESTANT",
              )
            }
            className="focus:border-brand-orange focus:ring-brand-orange/20 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:ring-2"
          >
            <option value="TOUS">Tous les paiements</option>
            <option value="SOLDE">Soldés (100%)</option>
            <option value="RESTANT">Reste à payer</option>
          </select>

          {/* Filtre Type d'admission */}
          <select
            value={filtreAdmission}
            onChange={(e) =>
              changerFiltreAdmission(
                e.target.value as "TOUS" | "DEFINITIF" | "PRE_INSCRIT",
              )
            }
            className="focus:border-brand-orange focus:ring-brand-orange/20 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:ring-2"
          >
            <option value="TOUS">Tous types d&rsquo;admission</option>
            <option value="DEFINITIF">Inscriptions définitives</option>
            <option value="PRE_INSCRIT">Pré-inscrits (Acomptes)</option>
          </select>
        </div>

        {/* Info compteur résultats et sélection */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              {totalFiltres} apprenant
              {totalFiltres > 1 ? "s" : ""} trouvé
              {totalFiltres > 1 ? "s" : ""}
            </span>
            {selectionIds.size > 0 && (
              <span className="text-brand-orange rounded-full border border-orange-200/60 bg-orange-50 px-2 py-0.5 font-bold">
                {selectionIds.size} sélectionné
                {selectionIds.size > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filtreFormation && (
              <span className="text-brand-orange rounded-md bg-orange-50 px-2 py-0.5 font-semibold">
                Formation :{" "}
                {formations.find((f) => f.id === filtreFormation)?.nom}
              </span>
            )}
            {filtrePaiement !== "TOUS" && (
              <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                {filtrePaiement === "SOLDE"
                  ? "Soldés uniquement"
                  : "Reste à payer"}
              </span>
            )}
            {filtreEtablissement && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                Établissement : {filtreEtablissement}
              </span>
            )}
            {filtreAdmission !== "TOUS" && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                {filtreAdmission === "PRE_INSCRIT"
                  ? "Pré-inscriptions"
                  : "Définitifs"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Table des Apprenants ── */}
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-700 select-none">
              <tr>
                <th className="w-10 p-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={tousSelectionnesSurPage}
                    onChange={toggleSelectAllPage}
                    className="text-brand-orange focus:ring-brand-orange/30 h-4 w-4 cursor-pointer rounded border-slate-300"
                    title="Tout sélectionner sur cette page"
                  />
                </th>
                <th
                  onClick={() => basculerTri("nom")}
                  className="hover:text-brand-orange cursor-pointer p-3.5 text-xs font-bold tracking-wider uppercase transition-colors"
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
                  className="hover:text-brand-orange cursor-pointer p-3.5 text-xs font-bold tracking-wider uppercase transition-colors"
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
                  onClick={() => basculerTri("etablissement")}
                  className="hover:text-brand-orange cursor-pointer p-3.5 text-xs font-bold tracking-wider uppercase transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Établissement</span>
                    {triColonne === "etablissement" ? (
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
                  className="hover:text-brand-orange w-[240px] min-w-[240px] cursor-pointer p-3.5 text-xs font-bold tracking-wider uppercase transition-colors"
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
                  className="hover:text-brand-orange cursor-pointer p-3.5 text-xs font-bold tracking-wider uppercase transition-colors"
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
                      <Skeleton className="mx-auto h-4 w-4 rounded" />
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-2.5 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Skeleton className="h-4 w-28" />
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
                      <Skeleton className="ml-auto h-7 w-20 rounded-lg" />
                    </td>
                  </tr>
                ))}
              {!chargement && totalFiltres === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-xs text-slate-400"
                  >
                    Aucun apprenant ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
              {apprenantsPage.map((a) => {
                const nomFormation = formations.find(
                  (f) => f.id === a.formationId,
                )?.nom;
                const nomCentre = isTousCentres
                  ? centres.find((c) => c.id === a.centreId)?.nom
                  : undefined;
                const estSelectionne = selectionIds.has(a.id);

                return (
                  <LigneApprenant
                    key={a.id}
                    apprenant={a}
                    nomFormation={nomFormation}
                    nomCentre={nomCentre}
                    montantPaye={a.montantPaye || 0}
                    statutDossier={a.statutDossier}
                    estSelectionne={estSelectionne}
                    peutEncaisser={peutEncaisser}
                    onToggleSelect={() => toggleSelectApprenant(a)}
                    onFiltrerEtablissement={changerFiltreEtablissement}
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
        {!chargement && totalFiltres > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row">
            <span className="text-xs text-slate-500">
              Affichage de {(page - 1) * TAILLE_PAGE + 1} à{" "}
              {Math.min(page * TAILLE_PAGE, totalFiltres)} sur {totalFiltres}{" "}
              apprenant
              {totalFiltres > 1 ? "s" : ""}
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalFiltres}
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
          onSuccessRecu={(recu) => {
            setRecuAImprimer(recu);
          }}
        />
      )}

      {/* ── Modal Reçu Officiel Deux Volets ── */}
      {recuAImprimer && (
        <RecuPaiementModal
          isOpen={Boolean(recuAImprimer)}
          onClose={() => setRecuAImprimer(null)}
          recu={recuAImprimer}
        />
      )}

      {/* ── Modal Impression Liste Apprenants ── */}
      {modalPrintOuverte && (
        <ListeApprenantsPrintModal
          isOpen={modalPrintOuverte}
          onClose={() => setModalPrintOuverte(false)}
          apprenants={lignesImpression}
          formations={formations}
          centres={centres}
          sessionActive={sessionActive || undefined}
          nomCentre={centreActuel?.nom}
          paiementsParApprenant={
            new Map(lignesImpression.map((l) => [l.id, l.montantPaye || 0]))
          }
          isTousCentres={isTousCentres}
        />
      )}
    </div>
  );
}

function LigneApprenant({
  apprenant,
  nomFormation,
  nomCentre,
  montantPaye,
  statutDossier,
  estSelectionne,
  peutEncaisser,
  onToggleSelect,
  onEncaisser,
  onFiltrerEtablissement,
}: {
  apprenant: Apprenant;
  nomFormation?: string;
  nomCentre?: string;
  montantPaye: number;
  statutDossier?: string | null;
  estSelectionne: boolean;
  peutEncaisser?: boolean;
  onToggleSelect: () => void;
  onEncaisser: (soldeRestant: number) => void;
  onFiltrerEtablissement?: (etab: string) => void;
}) {
  const montantContrat = apprenant.montantContrat || 0;
  const soldeRestant = Math.max(0, montantContrat - montantPaye);
  const pctRegle =
    montantContrat > 0
      ? Math.min(100, Math.round((montantPaye / montantContrat) * 100))
      : 0;

  return (
    <tr
      className={`group transition-colors duration-150 ${
        estSelectionne ? "bg-orange-50/60" : "hover:bg-amber-50/40"
      }`}
    >
      {/* 0. Checkbox Sélection */}
      <td className="p-3.5 text-center">
        <input
          type="checkbox"
          checked={estSelectionne}
          onChange={onToggleSelect}
          className="text-brand-orange focus:ring-brand-orange/30 h-4 w-4 cursor-pointer rounded border-slate-300"
        />
      </td>

      {/* 1. Identité & Contact */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          <Link
            href={`/apprenants/${apprenant.id}`}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-transform group-hover:scale-105 ${getAvatarStyles(
              `${apprenant.prenom} ${apprenant.nom}`,
            )}`}
          >
            {getInitials(apprenant.prenom, apprenant.nom)}
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/apprenants/${apprenant.id}`}
                className="group-hover:text-brand-orange truncate text-sm font-bold text-slate-900 transition-colors"
              >
                {apprenant.nom} {apprenant.prenom}
              </Link>
              {apprenant.preInscrit && (
                <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                  Pré-inscrit
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
              {nomCentre && (
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {nomCentre}
                </span>
              )}
              {apprenant.contactApprenant ? (
                <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                  <Phone size={11} className="text-slate-400" />
                  {apprenant.contactApprenant}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Aucun contact
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Filière & Date d'inscription */}
      <td className="p-3.5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200/70 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-950">
            <GraduationCap size={13} className="text-brand-orange shrink-0" />
            <span className="max-w-[160px] truncate">
              {nomFormation ?? "Formation non définie"}
            </span>
          </span>
          {apprenant.dateInscription && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Calendar size={11} className="text-slate-400" />
              <span>
                {new Date(apprenant.dateInscription).toLocaleDateString(
                  "fr-FR",
                )}
              </span>
            </p>
          )}
        </div>
      </td>

      {/* 3. Établissement d'origine (colonne dédiée) */}
      <td className="p-3.5">
        {apprenant.etablissementOrigine ? (
          <button
            type="button"
            onClick={() =>
              onFiltrerEtablissement?.(apprenant.etablissementOrigine!)
            }
            title={`Filtrer par : ${apprenant.etablissementOrigine}`}
            className="hover:text-brand-orange hover:border-brand-orange/40 group/etab inline-flex max-w-[190px] cursor-pointer items-center gap-1.5 truncate rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all hover:bg-orange-50"
          >
            <Building2
              size={12}
              className="text-brand-orange shrink-0 transition-transform group-hover/etab:scale-110"
            />
            <span className="truncate">{apprenant.etablissementOrigine}</span>
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 italic">
            Non renseigné
          </span>
        )}
      </td>

      {/* 3. Mini-jauge de recouvrement contextuelle */}
      <td className="w-[240px] min-w-[240px] p-3.5">
        {soldeRestant <= 0 ? (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Soldé (100%)
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-full rounded-full bg-emerald-500" />
            </div>
            <p className="mt-1 text-[10px] font-medium whitespace-nowrap text-slate-400">
              Total : {FORMATEUR_FCFA.format(montantContrat)} F
            </p>
          </div>
        ) : montantPaye > 0 ? (
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${pctRegle}%` }}
                />
              </div>
              <span className="text-xs font-black text-amber-900 tabular-nums">
                {pctRegle}%
              </span>
            </div>
            <p className="mt-1 text-[11px] whitespace-nowrap text-slate-500">
              Payé{" "}
              <strong className="text-slate-800">
                {FORMATEUR_FCFA.format(montantPaye)} F
              </strong>
              {" · "}
              Reste{" "}
              <strong className="text-brand-orange font-bold">
                {FORMATEUR_FCFA.format(soldeRestant)} F
              </strong>
            </p>
          </div>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              0% versé
            </span>
            <div className="mt-1.5 h-1.5 w-36 rounded-full bg-slate-100" />
            <p className="text-brand-orange mt-1 text-[11px] font-bold whitespace-nowrap">
              Reste : {FORMATEUR_FCFA.format(montantContrat)} F
            </p>
          </div>
        )}
      </td>

      {/* 4. Statut Dossier Concours */}
      <td className="p-3.5">
        {!statutDossier ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
            Aucun dossier
          </span>
        ) : statutDossier === "COMPLET" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Complet
          </span>
        ) : statutDossier === "CLOTURE" ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            Clôturé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            <Clock size={12} className="text-amber-600" />
            En cours
          </span>
        )}
      </td>

      {/* 5. Actions Rapides */}
      <td className="p-3.5 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          {peutEncaisser && soldeRestant > 0 && (
            <button
              type="button"
              onClick={() => onEncaisser(soldeRestant)}
              title="Encaisser un versement"
              className="border-brand-orange/30 text-brand-orange inline-flex cursor-pointer items-center gap-1 rounded-xl border bg-orange-50 px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all hover:bg-orange-100"
            >
              <Coins size={13} />
              <span>Encaisser</span>
            </button>
          )}

          <Link
            href={`/apprenants/${apprenant.id}`}
            className="hover:text-brand-orange hover:border-brand-orange/40 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-orange-50/50"
          >
            <Eye size={13} />
            <span>Fiche</span>
          </Link>
        </div>
      </td>
    </tr>
  );
}
