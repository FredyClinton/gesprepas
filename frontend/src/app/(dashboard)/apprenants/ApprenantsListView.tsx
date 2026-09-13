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
  AlertCircle,
} from "lucide-react";

import { Button, Card, Pagination } from "@/shared/ui";
import { useApprenants, useCursusApprenant, type Apprenant } from "@/modules/apprenants";
import { useFormations, type Formation } from "@/modules/academique";
import { useSessionActive } from "@/modules/centres-sessions";
import { useDossierParApprenant } from "@/modules/dossiers";
import {
  useVersementsApprenant,
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

export function ApprenantsListView({ centreId }: { centreId: string }) {
  const { data: apprenants, isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [] } = useFormations();
  const { data: sessionActive } = useSessionActive();

  const [recherche, setRecherche] = useState("");
  const [filtreFormation, setFiltreFormation] = useState("");
  const [filtreEtablissement, setFiltreEtablissement] = useState("");
  const [filtrePaiement, setFiltrePaiement] = useState<"TOUS" | "SOLDE" | "RESTANT">("TOUS");
  const [filtreAdmission, setFiltreAdmission] = useState<"TOUS" | "DEFINITIF" | "PRE_INSCRIT">("TOUS");
  const [page, setPage] = useState(1);

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
  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreFormation("");
    setFiltreEtablissement("");
    setFiltrePaiement("TOUS");
    setFiltreAdmission("TOUS");
    setPage(1);
  }

  const apprenantsDuCentre = useMemo(
    () => (apprenants ?? []).filter((a) => a.centreId === centreId),
    [apprenants, centreId],
  );

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

  // Filtrage combiné multi-critères
  const apprenantsFiltres = useMemo(() => {
    return apprenantsDuCentre.filter((a) => {
      // 1. Filtre par formation
      if (filtreFormation && a.formationId !== filtreFormation) return false;

      // 2. Filtre par établissement
      if (filtreEtablissement && a.etablissementOrigine !== filtreEtablissement) return false;

      // 3. Filtre par type d'admission
      if (filtreAdmission === "PRE_INSCRIT" && !a.preInscrit) return false;
      if (filtreAdmission === "DEFINITIF" && a.preInscrit) return false;

      // 4. Filtre recherche textuelle
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
  }, [apprenantsDuCentre, filtreFormation, filtreEtablissement, filtreAdmission, recherche]);

  const apprenantsPage = useMemo(
    () => apprenantsFiltres.slice((page - 1) * TAILLE_PAGE, page * TAILLE_PAGE),
    [apprenantsFiltres, page],
  );

  const aDesFiltresActifs =
    Boolean(recherche) ||
    Boolean(filtreFormation) ||
    Boolean(filtreEtablissement) ||
    filtreAdmission !== "TOUS" ||
    filtrePaiement !== "TOUS";

  // Fonction d'export CSV
  function exporterCSV() {
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
      "Nom Parent",
      "Contact Parent",
    ];

    const lignes = apprenantsFiltres.map((a) => {
      const nomFormation =
        formations.find((f) => f.id === a.formationId)?.nom || "Non définie";
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
        `"${(a.nomParent || "").replace(/"/g, '""')}"`,
        `"${a.contactParent || ""}"`,
      ].join(";");
    });

    const contenuCSV = "\uFEFF" + [enTetes.join(";"), ...lignes].join("\n");
    const blob = new Blob([contenuCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.setAttribute("download", `apprenants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  }

  const chargement = chargementApprenants;

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
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Download size={14} />
            <span>Exporter CSV</span>
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

      {/* ── Filtres de Recherche Modernes ── */}
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
              Tous les établissements ({listeEtablissements.length})
            </option>
            {listeEtablissements.map((etab) => (
              <option key={etab} value={etab} className="bg-white text-slate-800">
                {etab}
              </option>
            ))}
          </select>

          {/* Filtre Type d'admission */}
          <select
            value={filtreAdmission}
            onChange={(e) =>
              changerFiltreAdmission(e.target.value as "TOUS" | "DEFINITIF" | "PRE_INSCRIT")
            }
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="TOUS">Tous les types d'admission</option>
            <option value="DEFINITIF">Inscriptions définitives</option>
            <option value="PRE_INSCRIT">Pré-inscrits (Acomptes)</option>
          </select>

          {/* Réinitialiser */}
          {aDesFiltresActifs && (
            <button
              type="button"
              onClick={reinitialiserFiltres}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline px-2 py-1"
            >
              <X size={13} />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {/* Info compteur résultats */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            {apprenantsFiltres.length} apprenant{apprenantsFiltres.length > 1 ? "s" : ""} trouvé
            {apprenantsFiltres.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            {filtreFormation && (
              <span className="font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md">
                Formation : {formations.find((f) => f.id === filtreFormation)?.nom}
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
            <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-700">
              <tr>
                <th className="p-3.5 text-xs font-bold tracking-wider uppercase">
                  Apprenant
                </th>
                <th className="p-3.5 text-xs font-bold tracking-wider uppercase">
                  Formation
                </th>
                <th className="p-3.5 text-xs font-bold tracking-wider uppercase">
                  Établissement
                </th>
                <th className="p-3.5 text-xs font-bold tracking-wider uppercase">
                  Paiement & Contrat
                </th>
                <th className="p-3.5 text-xs font-bold tracking-wider uppercase">
                  Dossier
                </th>
                <th className="p-3.5 text-right text-xs font-bold tracking-wider uppercase">
                  Actions Rapides
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {chargement && (
                <tr>
                  <td colSpan={6} className="text-slate-400 p-8 text-center text-xs">
                    Chargement des apprenants...
                  </td>
                </tr>
              )}
              {!chargement && apprenantsFiltres.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-slate-400 p-8 text-center text-xs">
                    Aucun apprenant ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
              {apprenantsPage.map((a) => (
                <LigneApprenant
                  key={a.id}
                  apprenant={a}
                  formations={formations}
                  onEncaisser={(soldeRestant) =>
                    setVersementApprenant({
                      id: a.id,
                      nomComplet: `${a.prenom} ${a.nom}`,
                      formationId: a.formationId,
                      soldeRestant,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        {!chargement && apprenantsFiltres.length > 0 && (
          <div className="border-slate-100 border-t px-4 py-3 bg-slate-50/60">
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
  formations,
  onEncaisser,
}: {
  apprenant: Apprenant;
  formations: Formation[];
  onEncaisser: (soldeRestant: number) => void;
}) {
  const { data: versements, isLoading: chargementVersements } =
    useVersementsApprenant(apprenant.id);
  const {
    data: dossier,
    isLoading: chargementDossier,
    isError: erreurDossier,
  } = useDossierParApprenant(apprenant.id);
  const { data: cursus } = useCursusApprenant(apprenant.id);

  const formationEffectiveId = cursus?.formationActiveId || apprenant.formationId;
  const nomFormation = formations.find((f) => f.id === formationEffectiveId)?.nom;

  const montantPaye = (versements ?? [])
    .filter((v) => v.statut !== "REJETE")
    .reduce((total, v) => total + v.montant, 0);
  const soldeRestant = Math.max(apprenant.montantContrat - montantPaye, 0);

  return (
    <tr className="hover:bg-amber-50/50 transition-colors duration-150 group">
      {/* 1. Identité & Avatar */}
      <td className="p-3.5">
        <Link
          href={`/apprenants/${apprenant.id}`}
          className="flex items-center gap-3 group"
        >
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-transform group-hover:scale-105 ${getAvatarStyles(
              `${apprenant.prenom} ${apprenant.nom}`,
            )}`}
          >
            {getInitials(apprenant.prenom, apprenant.nom)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors">
                {apprenant.nom} {apprenant.prenom}
              </span>
              {apprenant.preInscrit && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 uppercase shrink-0">
                  Pré-inscrit
                </span>
              )}
            </div>
            {apprenant.contactApprenant && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Phone size={11} className="text-slate-400" />
                <span>{apprenant.contactApprenant}</span>
              </p>
            )}
          </div>
        </Link>
      </td>

      {/* 2. Formation */}
      <td className="p-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200/70 px-2.5 py-1 text-xs font-bold text-orange-950">
          <GraduationCap size={13} className="text-brand-orange shrink-0" />
          <span>{nomFormation ?? "Formation non définie"}</span>
        </span>
      </td>

      {/* 3. Établissement d'origine */}
      <td className="p-3.5">
        {apprenant.etablissementOrigine ? (
          <span className="text-slate-700 flex items-center gap-1.5 text-xs font-medium">
            <Building2 size={13} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[200px]" title={apprenant.etablissementOrigine}>
              {apprenant.etablissementOrigine}
            </span>
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Lycée non précisé</span>
        )}
      </td>

      {/* 3. Statut Paiement */}
      <td className="p-3.5">
        {chargementVersements ? (
          <span className="text-slate-400 text-xs">...</span>
        ) : soldeRestant <= 0 ? (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800 uppercase">
              <CheckCircle2 size={12} />
              Soldé
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Total : {FORMATEUR_FCFA.format(apprenant.montantContrat)} F
            </p>
          </div>
        ) : (
          <div>
            <span className="bg-orange-100 text-brand-orange rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
              Reste : {FORMATEUR_FCFA.format(soldeRestant)} F
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Contrat : {FORMATEUR_FCFA.format(apprenant.montantContrat)} F
            </p>
          </div>
        )}
      </td>

      {/* 4. Statut Dossier */}
      <td className="p-3.5">
        {chargementDossier ? (
          <span className="text-slate-400 text-xs">...</span>
        ) : erreurDossier || !dossier ? (
          <span className="bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
            Aucun dossier
          </span>
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
              dossier.statut === "CLOTURE"
                ? "bg-slate-100 text-slate-600"
                : dossier.statut === "COMPLET"
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-brand-orange"
            }`}
          >
            {dossier.statut === "OUVERT"
              ? "Ouvert"
              : dossier.statut === "COMPLET"
              ? "Complet"
              : "Clôturé"}
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
