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
  CheckCircle2,
  Lock,
  Building2,
  GraduationCap,
  Eye,
  SlidersHorizontal,
  FileText,
  Edit2,
  Power,
  RotateCcw,
  Sparkles,
  ChevronRight,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/shared/ui";
import {
  useDossiers,
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
  type Dossier,
  type Concours,
  type PieceRequise,
} from "@/modules/dossiers";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { useApprenants, type Apprenant } from "@/modules/apprenants";

const FCFA = new Intl.NumberFormat("fr-FR");

const STATUT_BADGES: Record<Dossier["statut"], { label: string; bg: string; text: string; border: string }> = {
  OUVERT: { label: "En cours", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  COMPLET: { label: "Complet", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  CLOTURE: { label: "Clôturé", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
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

  // Catalogue trié par ordre alphabétique et filtré par recherche
  const cataloguePiecesTriees = useMemo(() => {
    const q = recherchePieceCatalogue.toLowerCase().trim();
    return [...cataloguePieces]
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))
      .filter((p) => (!q ? true : p.nom.toLowerCase().includes(q)));
  }, [cataloguePieces, recherchePieceCatalogue]);

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
  const [rechercheConcours, setRechercheConcours] = useState("");
  const concoursFiltres = useMemo(() => {
    const q = rechercheConcours.toLowerCase().trim();
    return concoursList.filter((c) => {
      if (q && !c.nom.toLowerCase().includes(q)) return false;
      if (filtreStatutConcours !== "TOUS") {
        const cd = calculerCompteARebours(c.dateLimiteDepot);
        if (filtreStatutConcours === "CLOS" && !cd.estPasse) return false;
        if (filtreStatutConcours === "OUVERT" && cd.estPasse) return false;
        if (filtreStatutConcours === "URGENT" && (!cd.estUrgent || cd.estPasse)) return false;
      }
      return true;
    });
  }, [concoursList, rechercheConcours, filtreStatutConcours]);

  // Apprenants mappés par ID pour enrichir les lignes du tableau
  const apprenantsParId = useMemo(() => {
    const map = new Map<string, Apprenant>();
    apprenants.forEach((a) => map.set(a.id, a));
    return map;
  }, [apprenants]);

  // Dossiers filtrés
  const dossiersFiltres = useMemo(() => {
    return dossiers.filter((dossier) => {
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
  }, [dossiers, statutFiltre, formationFiltre, recherche, apprenantsParId]);

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
    <div className="space-y-6">
      {/* ── En-tête Principal & Titre ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Gestion des Dossiers de Concours
            </h1>
            {sessionActive && (
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-orange border border-orange-200">
                Session {sessionActive.annee}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isSuperviseur
              ? "Supervision globale des campagnes de concours, catalogue des pièces et suivi multi-centres."
              : `Gestion et suivi des souscriptions des apprenants du centre (${centres.find((c) => c.id === userCentreId)?.nom || "Mon centre"}).`}
          </p>
        </div>

        {/* Actions principales contextuelles selon l'onglet actif */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onglet === "campagnes" && isSuperviseur && (
            <Button
              type="button"
              onClick={() => setModalCreerConcoursOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <Award size={14} />
              <span>Programmer un concours</span>
            </Button>
          )}

          {onglet === "pieces" && isSuperviseur && (
            <div className="flex items-center gap-2">
              {cataloguePieces.length === 0 && (
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
              <Button
                type="button"
                onClick={() => {
                  setPieceAEditer(null);
                  setModalPieceOuverte(true);
                }}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs"
              >
                <Plus size={14} />
                <span>Ajouter une pièce</span>
              </Button>
            </div>
          )}

          {onglet === "suivi" && (
            <Button
              type="button"
              onClick={() => setModalSouscrireOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <Plus size={15} />
              <span>Inscrire un apprenant</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 3 Onglets de Navigation au Même Niveau ── */}
      <div className="border-b border-slate-200 flex flex-wrap gap-6 sm:gap-8">
        <button
          type="button"
          onClick={() => setOnglet("suivi")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors cursor-pointer ${
            onglet === "suivi"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FolderOpen size={16} />
          <span>Suivi des Dossiers</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
            {dossiers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOnglet("campagnes")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors cursor-pointer ${
            onglet === "campagnes"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award size={16} />
          <span>Campagnes de Concours</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
            {concoursList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOnglet("pieces")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors cursor-pointer ${
            onglet === "pieces"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText size={16} />
          <span>Catalogue des Pièces</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
            {cataloguePieces.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 1 : SUIVI DES DOSSIERS SOUSCRITS                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {onglet === "suivi" && (
        <div className="space-y-6">
          {/* Cartouches KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Dossiers
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{kpis.total}</p>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  En cours (Ouverts)
                </span>
                <Clock size={15} className="text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-900 mt-1">{kpis.ouverts}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Dossiers Complets
                </span>
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-900 mt-1">{kpis.complets}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Clôturés / Déposés
                </span>
                <Lock size={15} className="text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-700 mt-1">{kpis.clotures}</p>
            </div>
          </div>

          {/* Barre de Filtres */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Recherche */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher par élève ou reçu..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                />
              </div>

              {/* Filtre Centre (sélectionnable pour superviseur, affiché fixe pour chargé/chef de centre) */}
              {isSuperviseur ? (
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={centreSelectionne}
                    onChange={(e) => setCentreSelectionne(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Tous les centres ({centres.length})</option>
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/80 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
                  <Building2 size={14} className="text-brand-orange shrink-0" />
                  <span className="truncate">
                    {centres.find((c) => c.id === userCentreId)?.nom || "Mon centre"}
                  </span>
                </div>
              )}

              {/* Filtre Filière */}
              <div className="relative">
                <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={formationFiltre}
                  onChange={(e) => setFormationFiltre(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all appearance-none cursor-pointer"
                >
                  <option value="">Toutes les filières</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Statut */}
              <div className="relative">
                <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={statutFiltre}
                  onChange={(e) => setStatutFiltre(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all appearance-none cursor-pointer"
                >
                  <option value="TOUS">Tous les statuts</option>
                  <option value="OUVERT">En cours (Ouvert)</option>
                  <option value="COMPLET">Complet (Prêt)</option>
                  <option value="CLOTURE">Clôturé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tableau des dossiers souscrits */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {chargementDossiers || chargementApprenants ? (
              <div className="p-8 text-center space-y-3">
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
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-3.5">Apprenant</th>
                      {isSuperviseur && <th className="p-3.5">Centre</th>}
                      <th className="p-3.5">Filière</th>
                      <th className="p-3.5">Date ouverture</th>
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5">Observation</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dossiersFiltres.map((dossier) => {
                      const apprenant = apprenantsParId.get(dossier.apprenantId);
                      const centre = centres.find((c) => c.id === dossier.centreId);
                      const formation = formations.find((f) => f.id === apprenant?.formationId);
                      const badge = STATUT_BADGES[dossier.statut];
                      const initiales = `${apprenant?.nom?.[0] || ""}${apprenant?.prenom?.[0] || ""}`.toUpperCase() || "E";

                      return (
                        <tr key={dossier.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Apprenant */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs border border-slate-200">
                                {initiales}
                              </div>
                              <div>
                                <Link
                                  href={`/dossiers/${dossier.id}`}
                                  className="font-bold text-slate-900 hover:text-brand-orange hover:underline transition-colors block"
                                >
                                  {apprenant ? `${apprenant.nom} ${apprenant.prenom}` : "Élève inconnu"}
                                </Link>
                                {apprenant?.referenceRecu && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Reçu: {apprenant.referenceRecu}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Centre (si superviseur) */}
                          {isSuperviseur && (
                            <td className="p-3.5">
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Building2 size={12} className="text-slate-400" />
                                {centre?.nom || "—"}
                              </span>
                            </td>
                          )}

                          {/* Formation */}
                          <td className="p-3.5">
                            <span className="text-slate-600 font-medium">
                              {formation?.nom || "—"}
                            </span>
                          </td>

                          {/* Date ouverture */}
                          <td className="p-3.5">
                            <span className="text-slate-500 font-mono">
                              {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
                            </span>
                          </td>

                          {/* Statut */}
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {dossier.statut === "OUVERT" && <Clock size={11} />}
                              {dossier.statut === "COMPLET" && <CheckCircle2 size={11} />}
                              {dossier.statut === "CLOTURE" && <Lock size={11} />}
                              {badge.label}
                            </span>
                          </td>

                          {/* Observation */}
                          <td className="p-3.5 max-w-xs">
                            <span className="text-slate-500 italic truncate block">
                              {dossier.observation || "Aucune note"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setApprenantPourNouveauConcoursId(dossier.apprenantId);
                                  setModalSouscrireOuverte(true);
                                }}
                                className="text-xs px-2 py-1.5 font-bold flex items-center gap-1 text-brand-orange hover:bg-orange-50 border-orange-200"
                                title="Rattacher un autre concours pour cet élève"
                              >
                                <Plus size={13} />
                                <span>Concours</span>
                              </Button>

                              <Link
                                href={`/dossiers/${dossier.id}`}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
                              >
                                <span>Gérer</span>
                                <ChevronRight size={12} />
                              </Link>

                              <Link
                                href={`/apprenants/${dossier.apprenantId}`}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Voir la fiche détaillée de l'élève"
                              >
                                <Eye size={15} />
                              </Link>
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
            <div className="p-8 text-center text-xs text-slate-400">
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
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-slate-200 bg-white">
              Aucun concours ne correspond à vos filtres &laquo; {rechercheConcours || "Sélection actuelle"} &raquo;.
            </div>
          ) : vueConcours === "table" ? (
            /* ── VUE TABLEAU : Haute ergonomie pour grand volume de concours ── */
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-3.5 w-12 text-center">#</th>
                      <th className="p-3.5">Concours officiel</th>
                      <th className="p-3.5 text-center">Statut</th>
                      <th className="p-3.5">Recevabilité centre</th>
                      <th className="p-3.5">Dépôt officiel</th>
                      <th className="p-3.5 text-center">Pièces</th>
                      <th className="p-3.5 text-right">Coût dossier</th>
                      <th className="p-3.5 text-right w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                  <tfoot className="bg-slate-100/80 border-t border-slate-200 text-slate-600 text-[11px] font-semibold">
                    <tr>
                      <td colSpan={3} className="p-3.5">
                        Total affiché :{" "}
                        <strong className="text-slate-900 font-bold">
                          {concoursFiltres.length} concours
                        </strong>
                        {concoursFiltres.length !== concoursList.length &&
                          ` (sur ${concoursList.length} au total)`}
                      </td>
                      <td colSpan={5} className="p-3.5 text-right text-slate-500 font-medium">
                        Astuce : Cliquez sur « Pièces » pour consulter ou ajuster les pièces exigées.
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* ── VUE GRILLE / CARTES ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concoursFiltres.map((concours) => (
                <ConcoursCampagneCard
                  key={concours.id}
                  concours={concours}
                  isSuperviseur={isSuperviseur}
                  onGererPieces={() => setConcoursPourPieces(concours)}
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
                Référentiel standard des pièces de dossier pouvant être exigées pour n&rsquo;importe quel concours.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {cataloguePieces.length > 0 && (
                <div className="relative w-44 sm:w-56">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Filtrer les pièces (A-Z)..."
                    value={recherchePieceCatalogue}
                    onChange={(e) => setRecherchePieceCatalogue(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                  />
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

            {/* Tableau du catalogue de pièces avec alternance des couleurs (zebra striping) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5 w-12 text-center">#</th>
                    <th className="p-3.5">Libellé de la pièce exigible</th>
                    <th className="p-3.5 text-right">Tarif standard</th>
                    <th className="p-3.5 text-center">Statut</th>
                    {isSuperviseur && <th className="p-3.5 text-right w-24">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cataloguePieces.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperviseur ? 5 : 4} className="p-8 text-center text-slate-400">
                        Aucune pièce dans le catalogue. Cliquez sur &laquo; Initialiser pièces types &raquo; pour
                        charger la liste standard.
                      </td>
                    </tr>
                  ) : cataloguePiecesTriees.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperviseur ? 5 : 4} className="p-8 text-center text-slate-400">
                        Aucune pièce ne correspond à votre recherche &laquo; {recherchePieceCatalogue} &raquo;.
                      </td>
                    </tr>
                  ) : (
                    cataloguePiecesTriees.map((piece, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <tr
                          key={piece.id}
                          className={`transition-colors ${
                            isEven ? "bg-white" : "bg-slate-50/75"
                          } hover:bg-orange-50/40`}
                        >
                          <td className="p-3.5 text-center font-mono text-[11px] font-semibold text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-orange-100/70 text-brand-orange flex items-center justify-center shrink-0">
                                <FileText size={14} />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">{piece.nom}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  Pièce officielle du catalogue standard
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            <span className="inline-block bg-slate-100/90 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                              {FCFA.format(piece.montant)} FCFA
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                piece.actif
                                  ? "bg-emerald-100/80 text-emerald-800 border border-emerald-200/60"
                                  : "bg-slate-100 text-slate-400 border border-slate-200/60"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  piece.actif ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              {piece.actif ? "Active" : "Désactivée"}
                            </span>
                          </td>
                          {isSuperviseur && (
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
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
                  <tfoot className="bg-slate-100/80 border-t border-slate-200 text-slate-600 text-[11px] font-semibold">
                    <tr>
                      <td colSpan={2} className="p-3.5">
                        Total affiché :{" "}
                        <strong className="text-slate-900 font-bold">
                          {cataloguePiecesTriees.length} pièce{cataloguePiecesTriees.length > 1 ? "s" : ""}
                        </strong>
                        {recherchePieceCatalogue && ` (sur filtre "${recherchePieceCatalogue}")`}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {FCFA.format(
                          cataloguePiecesTriees.reduce((acc, p) => acc + (p.montant || 0), 0),
                        )}{" "}
                        FCFA
                      </td>
                      <td colSpan={isSuperviseur ? 2 : 1} className="p-3.5 text-center text-slate-500 font-medium">
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
// COMPOSANT CARTE CONCOURS AVEC COMPTE À REBOURS ET COÛT TOTAL DES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

function calculerCompteARebours(dateStr: string) {
  const cible = new Date(dateStr);
  const now = new Date();

  // Comparer en jours calendaires stricts
  const cibleMinuit = new Date(cible.getFullYear(), cible.getMonth(), cible.getDate()).getTime();
  const nowMinuit = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffJours = Math.round((cibleMinuit - nowMinuit) / (1000 * 60 * 60 * 24));

  if (diffJours < 0) {
    const abs = Math.abs(diffJours);
    return {
      texte: abs === 1 ? "Expiré hier" : `Expiré il y a ${abs} jours`,
      court: `Passé (${abs}j)`,
      badge: "bg-red-50 text-red-700 border-red-200",
      jours: diffJours,
      estPasse: true,
      estAujourdhui: false,
      estUrgent: false,
    };
  }
  if (diffJours === 0) {
    return {
      texte: "Aujourd'hui (Dernier jour !)",
      court: "Dernier jour !",
      badge: "bg-red-100 text-red-800 border-red-300 font-extrabold animate-pulse",
      jours: 0,
      estPasse: false,
      estAujourdhui: true,
      estUrgent: true,
    };
  }
  if (diffJours === 1) {
    return {
      texte: "Demain (J - 1)",
      court: "J - 1",
      badge: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      jours: 1,
      estPasse: false,
      estAujourdhui: false,
      estUrgent: true,
    };
  }
  if (diffJours <= 7) {
    return {
      texte: `Dans ${diffJours} jours (J - ${diffJours})`,
      court: `J - ${diffJours}`,
      badge: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
      jours: diffJours,
      estPasse: false,
      estAujourdhui: false,
      estUrgent: true,
    };
  }
  return {
    texte: `Dans ${diffJours} jours (J - ${diffJours})`,
    court: `J - ${diffJours}`,
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    jours: diffJours,
    estPasse: false,
    estAujourdhui: false,
    estUrgent: false,
  };
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
  const isEven = index % 2 === 0;

  return (
    <tr
      key={concours.id}
      className={`transition-colors border-b border-slate-100 ${
        isEven ? "bg-white" : "bg-slate-50/75"
      } hover:bg-orange-50/40`}
    >
      <td className="p-3.5 text-center font-mono text-[11px] font-semibold text-slate-400">
        {String(index + 1).padStart(2, "0")}
      </td>

      <td className="p-3.5">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-xs block">{concours.nom}</span>
          <span className="text-[10px] text-slate-400 block font-normal">
            Session officielle
          </span>
        </div>
      </td>

      <td className="p-3.5 text-center">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            !estEncoreOuvert
              ? "bg-slate-100 text-slate-500 border-slate-200"
              : compteAReboursCentre.estPasse
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : compteAReboursCentre.estUrgent
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-emerald-100 text-emerald-800 border-emerald-200"
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

      <td className="p-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-slate-800 font-bold text-xs">
            {dateCentre.toLocaleDateString("fr-FR")}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded w-fit border ${compteAReboursCentre.badge}`}
          >
            {compteAReboursCentre.court || compteAReboursCentre.texte}
          </span>
        </div>
      </td>

      <td className="p-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-slate-800 font-bold text-xs">
            {dateOfficielle.toLocaleDateString("fr-FR")}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded w-fit border ${compteAReboursOfficiel.badge}`}
          >
            {compteAReboursOfficiel.court || compteAReboursOfficiel.texte}
          </span>
        </div>
      </td>

      <td className="p-3.5 text-center">
        <span className="font-bold text-slate-700 text-xs">
          {chargementPieces ? "..." : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""}`}
        </span>
      </td>

      <td className="p-3.5 text-right">
        <span className="font-mono font-bold text-xs text-brand-orange bg-orange-50/80 border border-orange-200/60 px-2.5 py-1 rounded-lg inline-block">
          {chargementPieces ? "..." : `${FCFA.format(coutTotal)} FCFA`}
        </span>
      </td>

      <td className="p-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onGererPieces}
            className="p-1.5 text-slate-600 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-slate-200 hover:border-orange-200"
            title={isSuperviseur ? "Gérer les pièces exigées" : "Voir les pièces exigées"}
          >
            {isSuperviseur ? <Edit2 size={13} /> : <FileText size={13} />}
            <span className="hidden sm:inline">
              {isSuperviseur ? "Pièces" : "Pièces"}
            </span>
          </button>

          {estEncoreOuvert && (
            <button
              type="button"
              onClick={onSouscrire}
              className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-emerald-200"
              title="Souscrire un candidat à ce concours"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Souscrire</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ConcoursCampagneCard({
  concours,
  isSuperviseur,
  onGererPieces,
}: {
  concours: Concours;
  isSuperviseur: boolean;
  onGererPieces: () => void;
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
    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-orange-200 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Titre & Statut Principal */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-sm leading-snug">
              {concours.nom}
            </h4>
            <span className="text-[11px] text-slate-400">
              {chargementPieces
                ? "Calcul des pièces..."
                : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""} exigée${pieces.length > 1 ? "s" : ""}`}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${
              !estEncoreOuvert
                ? "bg-slate-100 text-slate-500 border-slate-200"
                : compteAReboursCentre.estPasse
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : compteAReboursCentre.estUrgent
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-100 text-emerald-800 border-emerald-200"
            }`}
          >
            {!estEncoreOuvert
              ? "Clos"
              : compteAReboursCentre.estPasse
              ? "Clos au centre"
              : "Ouvert"}
          </span>
        </div>

        {/* ── Coût total des dossiers du concours ── */}
        <div className="p-3 bg-gradient-to-br from-orange-50/90 to-amber-50/50 rounded-xl border border-orange-200/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Coût total du dossier
            </span>
            <span className="text-[11px] text-slate-400">Frais standards confection</span>
          </div>
          <div className="text-right">
            <span className="font-mono font-black text-sm text-brand-orange">
              {chargementPieces ? "..." : `${FCFA.format(coutTotal)} FCFA`}
            </span>
          </div>
        </div>

        {/* ── Échéances avec Compte à rebours ── */}
        <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs">
          {/* Recevabilité centre */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock size={12} className="text-brand-orange shrink-0" />
                Recevabilité centre :
              </span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {dateCentre.toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-end">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${compteAReboursCentre.badge}`}
              >
                {compteAReboursCentre.texte}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-2 space-y-1">
            {/* Dépôt officiel */}
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock size={12} className="text-slate-400 shrink-0" />
                Dépôt officiel :
              </span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {dateOfficielle.toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-end">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${compteAReboursOfficiel.badge}`}
              >
                {compteAReboursOfficiel.texte}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action pièces */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onGererPieces}
          className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          {isSuperviseur ? (
            <>
              <Edit2 size={13} />
              <span>Gérer les pièces exigées ({pieces.length})</span>
            </>
          ) : (
            <>
              <FileText size={13} />
              <span>Voir les pièces exigées ({pieces.length})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
