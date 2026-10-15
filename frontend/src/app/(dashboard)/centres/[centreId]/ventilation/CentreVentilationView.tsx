"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Wallet,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Search,
  Filter,
  DollarSign,
  PieChart,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";

import { Card, Button, SkeletonCard, SkeletonTable } from "@/shared/ui";
import { useCentres, useSessionActive, useSessions } from "@/modules/centres-sessions";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { useFormations } from "@/modules/academique";
import { useApprenants } from "@/modules/apprenants";
import { useMouvementsFinanciers, useMotifs } from "@/modules/financier";
import { useStatsVentesLivres, useVentesLivres } from "@/modules/livres";
import { useDossiers } from "@/modules/dossiers";

const FCFA = new Intl.NumberFormat("fr-FR");

type SectionActive = "toutes" | "formations" | "finances" | "livres" | "dossiers";

interface CentreVentilationViewProps {
  centreId: string;
  initialSessionId?: string;
}

export function CentreVentilationView({
  centreId,
  initialSessionId,
}: CentreVentilationViewProps) {
  const [sectionActive, setSectionActive] = useState<SectionActive>("toutes");
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<string | null>(
    initialSessionId || null,
  );
  const [rechercheFormation, setRechercheFormation] = useState("");
  const [rechercheMouvement, setRechercheMouvement] = useState("");
  const [filtreTypeMouvement, setFiltreTypeMouvement] = useState<"TOUS" | "ENTREE" | "SORTIE">("TOUS");
  const [rechercheDossier, setRechercheDossier] = useState("");

  // Récupération des données globales
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive, isLoading: chargementSessionActive } = useSessionActive();
  const { data: utilisateurs = [] } = useUtilisateurs();
  const { data: formations = [], isLoading: chargementFormations } = useFormations();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: motifs = [] } = useMotifs();

  const centre = useMemo(() => centres.find((c) => c.id === centreId), [centres, centreId]);

  // Session de référence
  const sessionCourante = useMemo(() => {
    if (sessionIdSelectionnee) {
      return sessions.find((s) => s.id === sessionIdSelectionnee) ?? sessionActive ?? sessions[0];
    }
    return sessionActive ?? sessions[0];
  }, [sessionIdSelectionnee, sessions, sessionActive]);

  const activeSessionId = sessionCourante?.id;

  // Données dépendantes de la session et du centre
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(
    activeSessionId,
    centreId,
  );

  const { data: statsVentesLivres, isLoading: chargementStatsLivres } = useStatsVentesLivres({
    sessionId: activeSessionId || "",
    centreId: centreId,
  });

  const { data: ventesLivres = [], isLoading: chargementVentesLivres } = useVentesLivres({
    sessionId: activeSessionId || "",
    centreId: centreId,
  });

  const { data: dossiers = [], isLoading: chargementDossiers } = useDossiers(
    activeSessionId,
    centreId,
  );

  // Chef de centre
  const chefDeCentre = useMemo(() => {
    return utilisateurs.find((u) => u.role === "CHEF_CENTRE" && u.centreId === centreId);
  }, [utilisateurs, centreId]);

  // Map des motifs
  const mapMotifs = useMemo(() => {
    const map = new Map<string, string>();
    motifs.forEach((m) => map.set(m.id, m.nom));
    return map;
  }, [motifs]);

  // Map des apprenants pour recherche rapide (ID -> Apprenant)
  const mapApprenants = useMemo(() => {
    const map = new Map<string, (typeof apprenants)[0]>();
    apprenants.forEach((a) => map.set(a.id, a));
    return map;
  }, [apprenants]);

  // Map des formations pour recherche rapide
  const mapFormations = useMemo(() => {
    const map = new Map<string, (typeof formations)[0]>();
    formations.forEach((f) => map.set(f.id, f));
    return map;
  }, [formations]);

  // Apprenants de ce centre pour cette session
  const apprenantsCentre = useMemo(() => {
    return apprenants.filter(
      (a) =>
        a.centreId === centreId &&
        (!activeSessionId || !a.sessionId || a.sessionId === activeSessionId),
    );
  }, [apprenants, centreId, activeSessionId]);

  // Mouvements valides
  const entreesValides = useMemo(
    () => mouvements.filter((m) => m.type === "ENTREE" && m.statut !== "REJETE"),
    [mouvements],
  );
  const sortiesValides = useMemo(
    () => mouvements.filter((m) => m.type === "SORTIE" && m.statut !== "REJETE"),
    [mouvements],
  );

  const totalEncaisse = useMemo(
    () => entreesValides.reduce((acc, m) => acc + m.montant, 0),
    [entreesValides],
  );
  const totalDecaisse = useMemo(
    () => sortiesValides.reduce((acc, m) => acc + m.montant, 0),
    [sortiesValides],
  );
  const soldeNet = totalEncaisse - totalDecaisse;

  // 1. VENTILATION PAR FORMATION
  const ventilationFormations = useMemo(() => {
    const mapVersementsParApprenant = new Map<string, number>();
    entreesValides.forEach((m) => {
      if (m.apprenantId) {
        const anc = mapVersementsParApprenant.get(m.apprenantId) || 0;
        mapVersementsParApprenant.set(m.apprenantId, anc + m.montant);
      }
    });

    const effectifTotalCentre = apprenantsCentre.length;

    // Regrouper par formationId
    const resultats = formations.map((formation) => {
      const apprenantsDeFormation = apprenantsCentre.filter(
        (a) => a.formationId === formation.id,
      );
      const effectif = apprenantsDeFormation.length;
      const preInscrits = apprenantsDeFormation.filter((a) => a.preInscrit).length;
      const confirmes = effectif - preInscrits;

      const caContrats = apprenantsDeFormation.reduce(
        (acc, a) => acc + (a.montantContrat || 0),
        0,
      );

      // Total encaissé pour cette formation
      // Soit par les versements des apprenants, soit par les entrées affectées directement à formationId
      let encaisse = apprenantsDeFormation.reduce(
        (acc, a) => acc + (mapVersementsParApprenant.get(a.id) || 0),
        0,
      );

      // Si des entrées n'ont pas d'apprenantId mais ont formationId === formation.id
      entreesValides.forEach((m) => {
        if (!m.apprenantId && m.formationId === formation.id) {
          encaisse += m.montant;
        }
      });

      const resteARecouvrer = Math.max(0, caContrats - encaisse);
      const tauxRecouvrement =
        caContrats > 0 ? Math.min(100, Math.round((encaisse / caContrats) * 100)) : 100;
      const partEffectif =
        effectifTotalCentre > 0 ? Math.round((effectif / effectifTotalCentre) * 100) : 0;

      return {
        formation,
        effectif,
        confirmes,
        preInscrits,
        caContrats,
        encaisse,
        resteARecouvrer,
        tauxRecouvrement,
        partEffectif,
      };
    });

    // Garder les formations qui ont des inscrits ou qui sont actives
    return resultats
      .filter((item) => item.effectif > 0 || item.caContrats > 0 || item.encaisse > 0)
      .sort((a, b) => b.effectif - a.effectif);
  }, [formations, apprenantsCentre, entreesValides]);

  // Formations filtrées pour affichage
  const formationsAffichees = useMemo(() => {
    if (!rechercheFormation.trim()) return ventilationFormations;
    const q = rechercheFormation.toLowerCase().trim();
    return ventilationFormations.filter((item) =>
      item.formation.nom.toLowerCase().includes(q),
    );
  }, [ventilationFormations, rechercheFormation]);

  // Synthèse globale centre
  const caContratsTotal = useMemo(
    () => apprenantsCentre.reduce((acc, a) => acc + (a.montantContrat || 0), 0),
    [apprenantsCentre],
  );
  const resteARecouvrerTotal = Math.max(0, caContratsTotal - totalEncaisse);
  const tauxRecouvrementGlobal =
    caContratsTotal > 0 ? Math.min(100, Math.round((totalEncaisse / caContratsTotal) * 100)) : 100;

  // 2. VENTILATION DES LIVRES
  const livresVendusTotal = statsVentesLivres?.totalQuantite || 0;
  const livresCaTotal = statsVentesLivres?.totalMontant || 0;
  const livresParOuvrage = statsVentesLivres?.parLivre || [];

  // 3. VENTILATION DES DOSSIERS
  const dossiersTotal = dossiers.length;
  const dossiersComplets = dossiers.filter((d) => d.statut === "COMPLET").length;
  const dossiersOuverts = dossiers.filter((d) => d.statut === "OUVERT").length;
  const dossiersClotures = dossiers.filter((d) => d.statut === "CLOTURE").length;

  const dossiersAffiches = useMemo(() => {
    if (!rechercheDossier.trim()) return dossiers;
    const q = rechercheDossier.toLowerCase().trim();
    return dossiers.filter((d) => {
      const apprenant = mapApprenants.get(d.apprenantId);
      const nomComplet = `${apprenant?.prenom || ""} ${apprenant?.nom || ""}`.toLowerCase();
      return nomComplet.includes(q) || d.observation?.toLowerCase().includes(q);
    });
  }, [dossiers, rechercheDossier, mapApprenants]);

  // 4. MOUVEMENTS FINANCIERS FILTRÉS
  const mouvementsAffiches = useMemo(() => {
    return mouvements
      .filter((m) => {
        if (filtreTypeMouvement !== "TOUS" && m.type !== filtreTypeMouvement) return false;
        if (rechercheMouvement.trim()) {
          const q = rechercheMouvement.toLowerCase().trim();
          const motif = mapMotifs.get(m.motifId)?.toLowerCase() || "";
          const apprenant = m.apprenantId ? mapApprenants.get(m.apprenantId) : null;
          const nomApprenant = apprenant
            ? `${apprenant.prenom} ${apprenant.nom}`.toLowerCase()
            : "";
          const formation = m.formationId ? mapFormations.get(m.formationId)?.nom.toLowerCase() || "" : "";
          return motif.includes(q) || nomApprenant.includes(q) || formation.includes(q);
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mouvements, filtreTypeMouvement, rechercheMouvement, mapMotifs, mapApprenants, mapFormations]);

  const chargementEnCours =
    chargementCentres ||
    chargementSessions ||
    chargementSessionActive ||
    chargementFormations ||
    chargementApprenants ||
    chargementMouvements ||
    chargementStatsLivres ||
    chargementDossiers;

  if (chargementEnCours && !centre) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <Card className="p-12 text-center rounded-2xl border border-slate-200">
          <Building2 size={40} className="mx-auto text-slate-400 mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Centre introuvable</h2>
          <p className="text-sm text-slate-500 mt-1">
            Le centre spécifié n&apos;existe pas ou a été supprimé.
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-orange-600 transition"
            >
              <ArrowLeft size={16} /> Retour au tableau de bord
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const estOuvert = centre.statut === "OUVERT";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16 animate-in fade-in duration-200">
      {/* ── 1. FIL D'ARIANE ET NAVIGATION SUPÉRIEURE ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/"
            className="hover:text-brand-orange inline-flex items-center gap-1.5 font-bold transition-colors"
          >
            <ArrowLeft size={15} />
            Supervision Réseau
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href={`/centres/${centre.id}`}
            className="hover:text-brand-orange font-medium transition-colors"
          >
            {centre.nom}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            Ventilation & Pilotage
          </span>
        </div>

        {/* Sélecteur de session active */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-brand-orange" />
            <span className="text-xs font-semibold text-slate-600">Session :</span>
            <div className="relative">
              <select
                value={sessionCourante?.id || ""}
                onChange={(e) => setSessionIdSelectionnee(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-6 text-xs font-bold text-slate-900 outline-none"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session {s.annee}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <Link
            href={`/centres/${centre.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-brand-orange hover:text-brand-orange transition"
            title="Consulter la fiche administrative du centre"
          >
            <Building2 size={13} />
            Fiche Centre
          </Link>
        </div>
      </div>

      {/* ── 2. BANNIÈRE D'IDENTITÉ DU CENTRE & RESPONSABLE ── */}
      <Card className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-r from-white via-white to-slate-50/70 p-6 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            {/* Avatar / Badge du centre */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 font-black text-2xl text-white shadow-md shadow-brand-orange/20">
              {centre.nom.substring(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {centre.nom}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${
                    estOuvert
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-600 ring-slate-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      estOuvert ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {estOuvert ? "Centre Opérationnel" : "Centre Fermé"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>📍 {centre.villeActuelle || "Localisation non précisée"}</span>
                <span>•</span>
                <span>
                  Session :{" "}
                  <strong className="text-slate-700">
                    Session {sessionCourante?.annee}
                  </strong>
                </span>
                <span>•</span>
                <span>{ventilationFormations.length} filières actives</span>
              </div>
            </div>
          </div>

          {/* Fiche Chef de Centre */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-xs text-brand-orange ring-1 ring-orange-200/60">
              {chefDeCentre
                ? `${chefDeCentre.prenom?.[0] || ""}${chefDeCentre.nom?.[0] || ""}`.toUpperCase()
                : "—"}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Chef de Centre
              </div>
              <div className="text-xs font-bold text-slate-900">
                {chefDeCentre
                  ? `${chefDeCentre.prenom} ${chefDeCentre.nom}`
                  : "Aucun chef assigné"}
              </div>
              {chefDeCentre?.telephone && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Phone size={10} /> {chefDeCentre.telephone}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3. CARTES DE SYNTHÈSE / KPIS MAJEURS DU CENTRE ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Effectifs */}
        <Card className="rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              Effectif Centre
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {apprenantsCentre.length}
            </span>
            <span className="text-xs text-slate-500">élèves au total</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span className="font-semibold text-emerald-700">
              {apprenantsCentre.filter((a) => !a.preInscrit).length} confirmés
            </span>
            <span>•</span>
            <span className="font-semibold text-amber-700">
              {apprenantsCentre.filter((a) => a.preInscrit).length} pré-inscrits
            </span>
          </div>
        </Card>

        {/* KPI 2 : Finances & Recouvrement */}
        <Card className="rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              Recouvrement
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                tauxRecouvrementGlobal >= 80
                  ? "bg-emerald-50 text-emerald-600"
                  : tauxRecouvrementGlobal >= 50
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                tauxRecouvrementGlobal >= 80
                  ? "text-emerald-700"
                  : tauxRecouvrementGlobal >= 50
                    ? "text-amber-700"
                    : "text-rose-700"
              }`}
            >
              {tauxRecouvrementGlobal}%
            </span>
            <span className="text-xs text-slate-500">
              ({FCFA.format(totalEncaisse)} F encaissés)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>CA : {FCFA.format(caContratsTotal)} F</span>
            <span className="font-bold text-rose-600">
              Reste : {FCFA.format(resteARecouvrerTotal)} F
            </span>
          </div>
        </Card>

        {/* KPI 3 : Vente des Livres */}
        <Card className="rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              Vente Livres
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {livresVendusTotal}
            </span>
            <span className="text-xs text-slate-500">exemplaires vendus</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Chiffre d&apos;affaires librairie</span>
            <span className="font-bold text-emerald-700">
              {FCFA.format(livresCaTotal)} F
            </span>
          </div>
        </Card>

        {/* KPI 4 : Dossiers de Concours */}
        <Card className="rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              Dossiers Concours
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {dossiersTotal}
            </span>
            <span className="text-xs text-slate-500">dossiers enregistrés</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-semibold">
              {dossiersComplets} complets
            </span>
            <span className="text-amber-700 font-semibold">
              {dossiersOuverts} en cours
            </span>
          </div>
        </Card>
      </div>

      {/* ── 4. BARRE D'ONGLETS / FILTRES DE SECTIONS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setSectionActive("toutes")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              sectionActive === "toutes"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Toutes les ventilations
          </button>
          <button
            type="button"
            onClick={() => setSectionActive("formations")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              sectionActive === "formations"
                ? "bg-white text-brand-orange shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap size={14} />
            Formations &amp; Effectifs ({ventilationFormations.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionActive("finances")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              sectionActive === "finances"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet size={14} />
            Trésorerie &amp; Mouvements ({mouvements.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionActive("livres")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              sectionActive === "livres"
                ? "bg-white text-orange-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={14} />
            Livres ({livresParOuvrage.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionActive("dossiers")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              sectionActive === "dossiers"
                ? "bg-white text-purple-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={14} />
            Dossiers ({dossiersTotal})
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 : VENTILATION PAR FORMATION (EFFECTIFS & FINANCES)      */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(sectionActive === "toutes" || sectionActive === "formations") && (
        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-brand-orange ring-1 ring-orange-200/60">
                <GraduationCap size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Ventilation par Filière de Formation
                </h2>
                <p className="text-xs text-slate-500">
                  Répartition détaillée des apprenants, du chiffre d&apos;affaires et des encaissements par formation
                </p>
              </div>
            </div>

            {/* Champ de recherche rapide */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filtrer une formation..."
                value={rechercheFormation}
                onChange={(e) => setRechercheFormation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-orange focus:bg-white transition"
              />
            </div>
          </div>

          {formationsAffichees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucune formation trouvée avec des inscrits pour cette session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Filière / Formation</th>
                    <th className="p-3.5 text-center">Effectif</th>
                    <th className="p-3.5 text-center">Part (%)</th>
                    <th className="p-3.5 text-right">CA Contrats</th>
                    <th className="p-3.5 text-right">Total Encaissé</th>
                    <th className="p-3.5 text-right">Reste à Recouvrer</th>
                    <th className="p-3.5 min-w-[140px]">Taux Recouvrement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {formationsAffichees.map((item) => (
                    <tr
                      key={item.formation.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Formation & Code */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {item.formation.nom}
                        </div>
                      </td>

                      {/* Effectifs */}
                      <td className="p-3.5 text-center font-semibold">
                        <div className="font-black text-slate-900 text-sm">
                          {item.effectif}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.confirmes} inscrits • {item.preInscrits} pré
                        </div>
                      </td>

                      {/* Part dans le centre */}
                      <td className="p-3.5 text-center font-bold text-slate-600">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                          {item.partEffectif}%
                        </span>
                      </td>

                      {/* CA Contrats */}
                      <td className="p-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {FCFA.format(item.caContrats)}{" "}
                        <span className="text-[10px] text-slate-400">F</span>
                      </td>

                      {/* Encaissé */}
                      <td className="p-3.5 text-right font-bold tabular-nums text-emerald-700">
                        {FCFA.format(item.encaisse)}{" "}
                        <span className="text-[10px] text-emerald-500">F</span>
                      </td>

                      {/* Reste à recouvrer */}
                      <td className="p-3.5 text-right font-bold tabular-nums text-rose-700">
                        {FCFA.format(item.resteARecouvrer)}{" "}
                        <span className="text-[10px] text-rose-400">F</span>
                      </td>

                      {/* Jauge Taux */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className={
                                item.tauxRecouvrement >= 80
                                  ? "text-emerald-700"
                                  : item.tauxRecouvrement >= 50
                                    ? "text-amber-700"
                                    : "text-rose-700"
                              }
                            >
                              {item.tauxRecouvrement}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.tauxRecouvrement >= 80
                                  ? "bg-emerald-500"
                                  : item.tauxRecouvrement >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                              }`}
                              style={{ width: `${item.tauxRecouvrement}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total de la table */}
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900">
                  <tr>
                    <td className="p-3.5">TOTAL DU CENTRE</td>
                    <td className="p-3.5 text-center text-sm">
                      {apprenantsCentre.length}
                    </td>
                    <td className="p-3.5 text-center">100%</td>
                    <td className="p-3.5 text-right">
                      {FCFA.format(caContratsTotal)} F
                    </td>
                    <td className="p-3.5 text-right text-emerald-700">
                      {FCFA.format(totalEncaisse)} F
                    </td>
                    <td className="p-3.5 text-right text-rose-700">
                      {FCFA.format(resteARecouvrerTotal)} F
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-800">
                        {tauxRecouvrementGlobal}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 : TRÉSORERIE & MOUVEMENTS FINANCIERS DU CENTRE         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(sectionActive === "toutes" || sectionActive === "finances") && (
        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                <Wallet size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Mouvements Financiers &amp; Flux de Caisse
                </h2>
                <p className="text-xs text-slate-500">
                  Traçabilité des encaissements et décaissements enregistrés dans ce centre
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtre type */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFiltreTypeMouvement("TOUS")}
                  className={`rounded-lg px-2.5 py-1 ${
                    filtreTypeMouvement === "TOUS"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600"
                  }`}
                >
                  Tous ({mouvements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltreTypeMouvement("ENTREE")}
                  className={`rounded-lg px-2.5 py-1 ${
                    filtreTypeMouvement === "ENTREE"
                      ? "bg-white text-emerald-700 shadow-2xs font-bold"
                      : "text-slate-600"
                  }`}
                >
                  Entrées ({entreesValides.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltreTypeMouvement("SORTIE")}
                  className={`rounded-lg px-2.5 py-1 ${
                    filtreTypeMouvement === "SORTIE"
                      ? "bg-white text-rose-700 shadow-2xs font-bold"
                      : "text-slate-600"
                  }`}
                >
                  Sorties ({sortiesValides.length})
                </button>
              </div>

              {/* Recherche */}
              <div className="relative w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Motif, apprenant..."
                  value={rechercheMouvement}
                  onChange={(e) => setRechercheMouvement(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-orange focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Cartouches Récapitulatifs Entrées / Sorties / Solde */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Total des Entrées Encaissées
              </span>
              <div className="mt-1 text-xl font-black text-emerald-800 tabular-nums">
                {FCFA.format(totalEncaisse)} FCFA
              </div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Total des Décaissements / Dépenses
              </span>
              <div className="mt-1 text-xl font-black text-rose-800 tabular-nums">
                {FCFA.format(totalDecaisse)} FCFA
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Solde Net de Trésorerie
              </span>
              <div
                className={`mt-1 text-xl font-black tabular-nums ${
                  soldeNet >= 0 ? "text-slate-900" : "text-rose-700"
                }`}
              >
                {FCFA.format(soldeNet)} FCFA
              </div>
            </div>
          </div>

          {mouvementsAffiches.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Aucun mouvement financier enregistré correspondant aux critères.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Type &amp; Statut</th>
                    <th className="p-3.5">Motif de l&apos;opération</th>
                    <th className="p-3.5">Apprenant / Formation</th>
                    <th className="p-3.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {mouvementsAffiches.slice(0, 50).map((m) => {
                    const estEntree = m.type === "ENTREE";
                    const libelleMotif =
                      mapMotifs.get(m.motifId) ||
                      (estEntree ? "Versement scolarité" : "Dépense de fonctionnement");
                    const apprenant = m.apprenantId ? mapApprenants.get(m.apprenantId) : null;
                    const formation = m.formationId
                      ? mapFormations.get(m.formationId)
                      : apprenant?.formationId
                        ? mapFormations.get(apprenant.formationId)
                        : null;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-3.5 whitespace-nowrap text-slate-600">
                          {new Date(m.date).toLocaleDateString("fr-FR")}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              estEntree
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                            }`}
                          >
                            {estEntree ? (
                              <ArrowDownRight size={12} />
                            ) : (
                              <ArrowUpRight size={12} />
                            )}
                            {estEntree ? "Entrée" : "Sortie"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">
                            {libelleMotif}
                          </div>
                          {m.ordonnateur && (
                            <div className="text-[10px] text-slate-400">
                              Ordonnateur : {m.ordonnateur}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          {apprenant ? (
                            <div>
                              <div className="font-semibold text-slate-900">
                                {apprenant.prenom} {apprenant.nom}
                              </div>
                              {formation && (
                                <div className="text-[10px] text-brand-orange font-medium">
                                  {formation.nom}
                                </div>
                              )}
                            </div>
                          ) : formation ? (
                            <span className="font-medium text-brand-orange">
                              {formation.nom}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td
                          className={`p-3.5 text-right font-black tabular-nums text-sm ${
                            estEntree ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {estEntree ? "+" : "-"}
                          {FCFA.format(m.montant)} F
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 : DÉTAIL DES VENTES DE LIVRES ET ANNALES               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(sectionActive === "toutes" || sectionActive === "livres") && (
        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-brand-orange ring-1 ring-orange-200/60">
                <BookOpen size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Détail des Ventes d&apos;Ouvrages et Livres
                </h2>
                <p className="text-xs text-slate-500">
                  Quantités et recettes des manuels et annales distribués dans ce centre
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1 text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Recettes Livres</span>
                <div className="font-black text-emerald-700 text-sm">{FCFA.format(livresCaTotal)} FCFA</div>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1 text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Volume Vendu</span>
                <div className="font-black text-slate-900 text-sm">{livresVendusTotal} exemplaires</div>
              </div>
            </div>
          </div>

          {livresParOuvrage.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucune vente de livre enregistrée pour ce centre durant cette session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Titre de l&apos;Ouvrage</th>
                    <th className="p-3.5 text-center">Quantité Vendue</th>
                    <th className="p-3.5 text-right">Chiffre d&apos;Affaires</th>
                    <th className="p-3.5 text-center">Part dans les ventes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {livresParOuvrage.map((livre) => {
                    const part =
                      livresCaTotal > 0
                        ? Math.round((livre.montantTotal / livresCaTotal) * 100)
                        : 0;

                    return (
                      <tr
                        key={livre.livreId}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-slate-900">
                          {livre.titreLivre}
                        </td>

                        <td className="p-3.5 text-center font-black text-slate-800 text-sm tabular-nums">
                          {livre.quantiteVendue} ex.
                        </td>

                        <td className="p-3.5 text-right font-bold text-emerald-700 tabular-nums text-sm">
                          {FCFA.format(livre.montantTotal)} F
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="inline-block rounded-md bg-orange-50 text-brand-orange font-bold px-2 py-0.5 text-[11px] border border-orange-200/50">
                            {part}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900">
                  <tr>
                    <td className="p-3.5">TOTAL LIBRAIRIE</td>
                    <td className="p-3.5 text-center text-sm">{livresVendusTotal} ex.</td>
                    <td className="p-3.5 text-right text-emerald-700 text-sm">
                      {FCFA.format(livresCaTotal)} F
                    </td>
                    <td className="p-3.5 text-center">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 : DÉTAIL DES DOSSIERS DE CONCOURS                      */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(sectionActive === "toutes" || sectionActive === "dossiers") && (
        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200/60">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Détail des Dossiers de Concours
                </h2>
                <p className="text-xs text-slate-500">
                  État des candidatures et complétude administrative des dossiers déposés dans ce centre
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher un candidat..."
                value={rechercheDossier}
                onChange={(e) => setRechercheDossier(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-orange focus:bg-white transition"
              />
            </div>
          </div>

          {/* Mini-stats dossiers */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Dossiers</span>
              <div className="text-xl font-black text-slate-900">{dossiersTotal}</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Dossiers Complets</span>
              <div className="text-xl font-black text-emerald-800">{dossiersComplets}</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-700">Dossiers En Cours</span>
              <div className="text-xl font-black text-amber-800">{dossiersOuverts}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-600">Dossiers Clôturés</span>
              <div className="text-xl font-black text-slate-700">{dossiersClotures}</div>
            </div>
          </div>

          {dossiersAffiches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucun dossier de concours enregistré pour ce centre.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Candidat / Apprenant</th>
                    <th className="p-3.5">Filière / Formation</th>
                    <th className="p-3.5">Date d&apos;Ouverture</th>
                    <th className="p-3.5 text-center">Statut du Dossier</th>
                    <th className="p-3.5">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dossiersAffiches.map((d) => {
                    const apprenant = mapApprenants.get(d.apprenantId);
                    const formation = apprenant?.formationId
                      ? mapFormations.get(apprenant.formationId)
                      : null;

                    const estComplet = d.statut === "COMPLET";
                    const estOuvert = d.statut === "OUVERT";

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-3.5">
                          {apprenant ? (
                            <div>
                              <div className="font-bold text-slate-900">
                                {apprenant.prenom} {apprenant.nom}
                              </div>
                              {apprenant.contactApprenant && (
                                <div className="text-[10px] text-slate-500">
                                  {apprenant.contactApprenant}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">ID: {d.apprenantId}</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {formation ? (
                            <span className="font-semibold text-brand-orange">
                              {formation.nom}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-3.5 whitespace-nowrap text-slate-600">
                          {d.dateOuverture
                            ? new Date(d.dateOuverture).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                              estComplet
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : estOuvert
                                  ? "bg-amber-50 text-amber-700 ring-amber-200"
                                  : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {estComplet ? (
                              <CheckCircle2 size={12} />
                            ) : estOuvert ? (
                              <Clock size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            {estComplet
                              ? "Complet"
                              : estOuvert
                                ? "En cours"
                                : "Clôturé"}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-500 max-w-xs truncate">
                          {d.observation || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
