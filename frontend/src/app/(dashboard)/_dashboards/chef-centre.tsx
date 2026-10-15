"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  Coins,
  ArrowUpRight,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  UserPlus,
  ArrowRight,
  TrendingUp,
  School,
  DoorOpen,
  Pencil,
  Trash2,
  Lock,
  Search,
} from "lucide-react";

import { Card, Button, Modal, Skeleton, SkeletonCard, SkeletonTable } from "@/shared/ui";
import { useApprenants } from "@/modules/apprenants";
import { useFormations, usePhases } from "@/modules/academique";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import {
  useBilanDuJour,
  useRepartitionFormations,
  useMouvementsFinanciers,
  useMotifs,
  useSupprimerEntree,
  EnregistrerVersementModal,
  ModifierVersementModal,
  type VersementItem,
} from "@/modules/financier";
import { useSalles } from "@/modules/salle";
import { useConcoursBlancs } from "@/modules/concours-blancs";
import { useAffectations } from "@/modules/affectation";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

const FCFA = new Intl.NumberFormat("fr-FR");

function getInitiales(prenom?: string, nom?: string) {
  const p = prenom?.trim()?.[0] || "";
  const n = nom?.trim()?.[0] || "";
  return (p + n).toUpperCase() || "EP";
}

const STATUT_BILAN_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string; desc: string }
> = {
  EN_ATTENTE_CONTROLEUR: {
    label: "À valider par le Contrôleur",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-800 border border-amber-200/80",
    desc: "Bilan soumis, en attente de vérification et validation comptable.",
  },
  CLOTURE: {
    label: "Clôturé & Conforme",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
    desc: "Journée comptabilisée et clôturée avec succès.",
  },
  OUVERT: {
    label: "Caisse Ouverte (En cours)",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-800 border border-blue-200/80",
    desc: "Encaissements de la journée en cours d'enregistrement.",
  },
};

export function ChefCentreDashboard({ centreId }: { centreId: string }) {
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [apprenantSelectionneVersement, setApprenantSelectionneVersement] = useState<{
    id: string;
    nom: string;
    soldeRestant: number;
    formationId?: string;
  } | null>(null);

  const [versementAModifier, setVersementAModifier] = useState<VersementItem | null>(null);
  const [versementASupprimer, setVersementASupprimer] = useState<{
    id: string;
    montant: number;
    libelle: string;
    date: string;
  } | null>(null);
  const [erreurActionVersement, setErreurActionVersement] = useState<string | null>(null);
  const [rechercheTransaction, setRechercheTransaction] = useState("");
  const [filtreStatutTransaction, setFiltreStatutTransaction] = useState<"TOUS" | "VALIDE" | "EN_COURS">("TOUS");

  const supprimerEntreeMutation = useSupprimerEntree();

  const { data: centres } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const { data: phases = [] } = usePhases();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [], isLoading: chargementFormations } = useFormations();
  const { data: bilan, isLoading: chargementBilan } = useBilanDuJour(
    centreId,
    sessionActive?.id,
  );
  const { data: repartition } = useRepartitionFormations(bilan?.id ?? undefined);
  const { data: mouvements = [], isLoading: chargementMouvements } =
    useMouvementsFinanciers(sessionActive?.id, centreId);
  const { data: motifs = [] } = useMotifs("ENTREE");
  const { data: salles = [] } = useSalles(sessionActive?.id);
  const { data: concoursBlancs = [] } = useConcoursBlancs(
    sessionActive?.id,
    "CHEF_CENTRE",
    centreId,
  );

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  const { data: affectations = [] } = useAffectations({
    sessionId: sessionActive?.id,
    semaine: semaineCourante,
    matiereId: undefined,
  });

  const centre = centres?.find((c) => c.id === centreId);

  // 1. Données apprenants du centre pour la session active
  const apprenantsDuCentre = useMemo(() => {
    if (!sessionActive?.id) {
      return apprenants.filter((a) => a.centreId === centreId);
    }
    return apprenants.filter(
      (a) => a.centreId === centreId && a.sessionId === sessionActive.id,
    );
  }, [apprenants, centreId, sessionActive]);

  const effectifTotal = apprenantsDuCentre.length;
  const preInscrits = apprenantsDuCentre.filter((a) => a.preInscrit).length;
  const definitifs = effectifTotal - preInscrits;
  const pctDefinitifs = effectifTotal > 0 ? Math.round((definitifs / effectifTotal) * 100) : 0;
  const pctPreInscrits = effectifTotal > 0 ? 100 - pctDefinitifs : 0;

  // 2. Données financières globales du centre
  const totalContratsCentre = useMemo(
    () => apprenantsDuCentre.reduce((sum, a) => sum + (a.montantContrat || 0), 0),
    [apprenantsDuCentre],
  );

  // Calcul du montant total encaissé au centre à partir des mouvements financiers réels non rejetés
  const entreesCentre = useMemo(
    () =>
      mouvements
        .filter((m) => m.type === "ENTREE" && m.statut !== "REJETE")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [mouvements],
  );

  const montantTotalEncaisse = useMemo(
    () => entreesCentre.reduce((sum, e) => sum + e.montant, 0),
    [entreesCentre],
  );

  const resteGlobalRecouvrer = Math.max(0, totalContratsCentre - montantTotalEncaisse);
  const tauxRecouvrementGlobal =
    totalContratsCentre > 0
      ? Math.min(100, Math.round((montantTotalEncaisse / totalContratsCentre) * 100))
      : 0;

  // Calcul dynamique temps réel de la caisse journalière du centre
  const caisseDuJourCalcul = useMemo(() => {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const entreesAuj = entreesCentre.filter((m) => m.date === aujourdhui);
    const sortiesAuj = mouvements.filter(
      (m) => m.type === "SORTIE" && m.statut !== "REJETE" && m.date === aujourdhui,
    );

    const totalEntreesAuj = entreesAuj.reduce((sum, e) => sum + e.montant, 0);
    const totalSortiesAuj = sortiesAuj.reduce((sum, s) => sum + s.montant, 0);

    const totalEntrees =
      bilan?.totalEntrees && bilan.totalEntrees > 0
        ? bilan.totalEntrees
        : totalEntreesAuj;

    const totalSorties = bilan?.totalSorties ?? totalSortiesAuj;
    const net = bilan?.netAVerser ?? totalEntrees - totalSorties;

    return {
      totalEntrees,
      totalSorties,
      net,
    };
  }, [bilan, entreesCentre, mouvements]);

  // 3. Salles du centre et créneaux cette semaine
  const sallesDuCentre = useMemo(
    () => salles.filter((s) => s.centreId === centreId),
    [salles, centreId],
  );

  const seancesSemaineCentre = useMemo(() => {
    const idsSalles = new Set(sallesDuCentre.map((s) => s.id));
    return affectations.filter((a) => idsSalles.has(a.salleId)).length;
  }, [affectations, sallesDuCentre]);

  // 4. Prochain Concours Blanc
  const prochainConcours = useMemo(() => {
    if (!concoursBlancs || concoursBlancs.length === 0) return null;
    return [...concoursBlancs].sort(
      (a, b) => new Date(a.dateEpreuve).getTime() - new Date(b.dateEpreuve).getTime(),
    )[0];
  }, [concoursBlancs]);

  // 5. Statistiques par Formation dans le centre
  const statsFormations = useMemo(() => {
    return formations.map((formation) => {
      const eleves = apprenantsDuCentre.filter((a) => a.formationId === formation.id);
      const totalEleves = eleves.length;
      const preInscritsFormation = eleves.filter((a) => a.preInscrit).length;
      const definitifsFormation = totalEleves - preInscritsFormation;
      const contratsFormation = eleves.reduce((sum, a) => sum + (a.montantContrat || 0), 0);

      // Encaissements de cette formation (directement liés à la formation ou aux élèves de cette formation)
      const encaisseFormation = entreesCentre
        .filter(
          (e) =>
            e.formationId === formation.id ||
            eleves.some((a) => a.id === e.apprenantId),
        )
        .reduce((sum, e) => sum + e.montant, 0);

      // Fallback si pas d'entrées filtrées par formation, se référer au bilan du jour
      const ligneBilan = repartition?.find((r) => r.formationId === formation.id);
      const encaisseAffiche = encaisseFormation > 0 ? encaisseFormation : (ligneBilan?.montant || 0);

      const taux =
        contratsFormation > 0
          ? Math.min(100, Math.round((encaisseAffiche / contratsFormation) * 100))
          : 0;

      return {
        id: formation.id,
        nom: formation.nom,
        totalEleves,
        definitifsFormation,
        preInscritsFormation,
        contratsFormation,
        encaisseAffiche,
        resteARecouvrer: Math.max(0, contratsFormation - encaisseAffiche),
        taux,
      };
    });
  }, [formations, apprenantsDuCentre, entreesCentre, repartition]);

  // Totaux consolidés pour le tableau des formations
  const totalStatsFormations = useMemo(() => {
    const totaux = statsFormations.reduce(
      (acc, f) => ({
        totalEleves: acc.totalEleves + f.totalEleves,
        definitifsFormation: acc.definitifsFormation + f.definitifsFormation,
        preInscritsFormation: acc.preInscritsFormation + f.preInscritsFormation,
        contratsFormation: acc.contratsFormation + f.contratsFormation,
        encaisseAffiche: acc.encaisseAffiche + f.encaisseAffiche,
        resteARecouvrer: acc.resteARecouvrer + f.resteARecouvrer,
      }),
      {
        totalEleves: 0,
        definitifsFormation: 0,
        preInscritsFormation: 0,
        contratsFormation: 0,
        encaisseAffiche: 0,
        resteARecouvrer: 0,
      },
    );

    const tauxGlobal =
      totaux.contratsFormation > 0
        ? Math.min(100, Math.round((totaux.encaisseAffiche / totaux.contratsFormation) * 100))
        : 0;

    return { ...totaux, tauxGlobal };
  }, [statsFormations]);

  // Filtrage temps réel des règlements récents
  const entreesFiltrees = useMemo(() => {
    return entreesCentre.filter((e) => {
      if (filtreStatutTransaction !== "TOUS") {
        if (filtreStatutTransaction === "VALIDE" && e.statut !== "VALIDE") return false;
        if (filtreStatutTransaction === "EN_COURS" && e.statut === "VALIDE") return false;
      }
      if (!rechercheTransaction.trim()) return true;
      const q = rechercheTransaction.toLowerCase();
      const apprenant = apprenantsDuCentre.find((a) => a.id === e.apprenantId);
      const motif = motifs.find((m) => m.id === e.motifId);
      const formation = formations.find((f) => f.id === e.formationId);
      const nomComplet = apprenant ? `${apprenant.prenom} ${apprenant.nom}`.toLowerCase() : "";
      const motifNom = motif?.nom?.toLowerCase() || "";
      const formationNom = formation?.nom?.toLowerCase() || "";
      return nomComplet.includes(q) || motifNom.includes(q) || formationNom.includes(q);
    });
  }, [
    entreesCentre,
    filtreStatutTransaction,
    rechercheTransaction,
    apprenantsDuCentre,
    motifs,
    formations,
  ]);

  // 6. Top Lycées / Établissements d'Origine
  const topEtablissements = useMemo(() => {
    const counts: Record<string, number> = {};
    apprenantsDuCentre.forEach((a) => {
      if (a.etablissementOrigine?.trim()) {
        const etab = a.etablissementOrigine.trim();
        counts[etab] = (counts[etab] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([nom, count]) => ({
        nom,
        count,
        part: effectifTotal > 0 ? Math.round((count / effectifTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [apprenantsDuCentre, effectifTotal]);

  const statutBilanInfo = bilan?.statut
    ? STATUT_BILAN_CONFIG[bilan.statut] || STATUT_BILAN_CONFIG.OUVERT
    : STATUT_BILAN_CONFIG.OUVERT;

  if (chargementApprenants || chargementMouvements) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Banner Skeleton */}
        <div className="h-44 w-full rounded-2xl bg-slate-100 p-6 flex flex-col justify-between">
          <div className="flex gap-3">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Tables Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonTable rows={4} columns={4} />
            <SkeletonTable rows={5} columns={6} />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ── 1. En-tête & Bannière Opérationnelle Hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        {/* Décoration douce d'arrière-plan */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-orange-100/50 via-amber-50/20 to-transparent blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-brand-orange ring-1 ring-orange-500/20 shadow-2xs">
              <Building2 size={24} />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Centre Opérationnel</span>
                </span>

                {sessionActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    <Calendar size={12} className="text-slate-500" />
                    <span>Session {sessionActive.annee}</span>
                  </span>
                )}

                {phases.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                    <Layers size={12} className="text-brand-orange" />
                    <span>Semaine {semaineCourante}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {centre?.nom ?? "Tableau de Bord du Centre"}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {centre?.adresseActuelle ? `${centre.adresseActuelle}, ` : ""}
                {centre?.villeActuelle ?? "Direction de Centre"} · Suivi opérationnel en temps réel des effectifs, de la trésorerie et de la pédagogie.
              </p>
            </div>
          </div>

          {/* Actions opérationnelles directes */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <Button
              type="button"
              onClick={() => {
                setApprenantSelectionneVersement(null);
                setModalVersementOuverte(true);
              }}
              className="bg-brand-orange hover:bg-orange-600 text-white flex items-center gap-2 text-xs font-bold shadow-xs cursor-pointer px-4 py-2.5 rounded-xl transition-all active:scale-[0.98]"
            >
              <Coins size={15} />
              <span>Encaisser versement</span>
            </Button>

            <Link href="/inscription">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-2 text-xs font-bold cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl text-slate-800 transition-all active:scale-[0.98]"
              >
                <UserPlus size={15} />
                <span>Inscrire un élève</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. 4 KPIs Majeurs en Données Réelles ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* KPI 1 : Effectif Apprenants */}
        <Link href="/apprenants" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* 1. Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Effectif Apprenants
              </span>
              <div className="bg-orange-50 text-brand-orange rounded-xl p-2.5 ring-1 ring-orange-500/10 group-hover:scale-105 transition-transform shrink-0">
                <Users size={18} />
              </div>
            </div>

            {/* 2. Corps / Métrique & Jauge */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-900 text-3xl font-black tabular-nums tracking-tight">
                    {chargementApprenants ? "…" : effectifTotal}
                  </span>
                  <span className="text-xs font-bold text-slate-500">élèves au centre</span>
                </div>
              </div>

              {/* Jauge visuelle */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex gap-0.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                    style={{ width: `${pctDefinitifs}%` }}
                    title={`${definitifs} définitifs (${pctDefinitifs}%)`}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 rounded-r-full"
                    style={{ width: `${pctPreInscrits}%` }}
                    title={`${preInscrits} pré-inscrits (${pctPreInscrits}%)`}
                  />
                </div>
              </div>
            </div>

            {/* 3. Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold mt-auto h-8">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="inline-flex items-center gap-1 text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {definitifs} déf.
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {preInscrits} pré-ins.
                </span>
              </span>
              <span className="inline-flex items-center gap-0.5 text-brand-orange">
                <span>Apprenants</span>
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </Link>

        {/* KPI 2 : Recouvrement Global */}
        <Link href="/finances" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* 1. Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Recouvrement Global
              </span>
              <div className="bg-emerald-50 text-emerald-700 rounded-xl p-2.5 ring-1 ring-emerald-600/10 group-hover:scale-105 transition-transform shrink-0">
                <Wallet size={18} />
              </div>
            </div>

            {/* 2. Corps / Métrique & Jauge */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <span className="text-slate-900 text-2xl lg:text-[26px] font-black tabular-nums tracking-tight block">
                  {chargementMouvements ? "…" : `${FCFA.format(montantTotalEncaisse)} F`}
                </span>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                  sur {FCFA.format(totalContratsCentre)} F souscrits
                </p>
              </div>

              {/* Jauge visuelle */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${tauxRecouvrementGlobal}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold mt-auto h-8">
              <span className="text-slate-500">
                Taux : <strong className="text-emerald-700 font-black">{tauxRecouvrementGlobal}%</strong>
              </span>
              <span className="text-slate-500">
                Reste : <strong className="text-brand-orange font-black">{FCFA.format(resteGlobalRecouvrer)} F</strong>
              </span>
            </div>
          </Card>
        </Link>

        {/* KPI 3 : Caisse du Jour & Bilan */}
        <Link href="/bilan-journalier" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* 1. Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Caisse du Jour
              </span>
              <div className="bg-blue-50 text-blue-700 rounded-xl p-2.5 ring-1 ring-blue-600/10 group-hover:scale-105 transition-transform shrink-0">
                <Coins size={18} />
              </div>
            </div>

            {/* 2. Corps / Métrique & Jauge */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <span className="text-slate-900 text-2xl lg:text-[26px] font-black tabular-nums tracking-tight block">
                  {chargementBilan && chargementMouvements
                    ? "…"
                    : `${FCFA.format(caisseDuJourCalcul.net)} F`}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold">
                  <span className="text-emerald-700">+{FCFA.format(caisseDuJourCalcul.totalEntrees)} F</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-rose-700">-{FCFA.format(caisseDuJourCalcul.totalSorties)} F</span>
                </div>
              </div>

              {/* Jauge visuelle flux net / sorties */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex gap-0.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                    style={{
                      width: `${
                        caisseDuJourCalcul.totalEntrees + caisseDuJourCalcul.totalSorties > 0
                          ? Math.max(
                              15,
                              Math.min(
                                85,
                                Math.round(
                                  (caisseDuJourCalcul.totalEntrees /
                                    (caisseDuJourCalcul.totalEntrees + caisseDuJourCalcul.totalSorties)) *
                                    100,
                                ),
                              ),
                            )
                          : 50
                      }%`,
                    }}
                    title="Entrées"
                  />
                  <div
                    className="h-full bg-rose-400 transition-all duration-500 rounded-r-full"
                    style={{
                      width: `${
                        caisseDuJourCalcul.totalEntrees + caisseDuJourCalcul.totalSorties > 0
                          ? Math.max(
                              15,
                              Math.min(
                                85,
                                Math.round(
                                  (caisseDuJourCalcul.totalSorties /
                                    (caisseDuJourCalcul.totalEntrees + caisseDuJourCalcul.totalSorties)) *
                                    100,
                                ),
                              ),
                            )
                          : 50
                      }%`,
                    }}
                    title="Sorties"
                  />
                </div>
              </div>
            </div>

            {/* 3. Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold mt-auto h-8">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statutBilanInfo.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statutBilanInfo.dotClass} animate-pulse`} />
                {statutBilanInfo.label}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-brand-orange font-bold">
                <span>Bilan</span>
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </Link>

        {/* KPI 4 : Concours Blancs & Évaluations */}
        <Link href="/concours-blancs" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* 1. Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Concours Blancs
              </span>
              <div className="bg-purple-50 text-purple-700 rounded-xl p-2.5 ring-1 ring-purple-600/10 group-hover:scale-105 transition-transform shrink-0">
                <Award size={18} />
              </div>
            </div>

            {/* 2. Corps / Métrique & Jauge */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <p className="text-sm font-black text-slate-900 line-clamp-1">
                  {prochainConcours?.titre || "Concours Blanc Session"}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                  {prochainConcours
                    ? `Prévu le ${new Date(prochainConcours.dateEpreuve).toLocaleDateString("fr-FR")}`
                    : `${concoursBlancs.length} épreuve(s) programmée(s)`}
                </p>
              </div>

              {/* Jauge visuelle */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${
                        concoursBlancs.length > 0
                          ? Math.max(
                              20,
                              Math.min(
                                100,
                                Math.round(
                                  (concoursBlancs.filter(
                                    (c) => new Date(c.dateEpreuve).getTime() <= Date.now(),
                                  ).length /
                                    concoursBlancs.length) *
                                    100,
                                ),
                              ),
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-orange font-bold mt-auto h-8">
              <span>{concoursBlancs.length} épreuve(s)</span>
              <span className="inline-flex items-center gap-0.5">
                <span>Classements</span>
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* ── 3. Section Centrale : Performance Filières (65%) & Volet Opérationnel (35%) ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne Gauche : Tableau Formations & Règlements (2 colonnes sur grand écran) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Tableau de Performance par Formation */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="text-brand-orange" size={20} />
                  <span>Performance & Recouvrement par Filière</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Effectifs, contrats souscrits et recouvrements réels pour les formations du centre.
                </p>
              </div>

              <Link
                href="/apprenants"
                className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
              >
                <span>Gérer les apprenants</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <th className="p-3.5 font-bold">Filière / Programme</th>
                    <th className="p-3.5 font-bold text-center">Effectif Total</th>
                    <th className="p-3.5 font-bold text-right">Contrats Souscrits</th>
                    <th className="p-3.5 font-bold text-right">Encaissé</th>
                    <th className="p-3.5 font-bold text-right">Reste Dû</th>
                    <th className="p-3.5 font-bold text-center">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chargementFormations ? (
                    <tr>
                      <td colSpan={6} className="text-slate-400 p-6 text-center text-xs">
                        Chargement des filières...
                      </td>
                    </tr>
                  ) : statsFormations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-slate-400 p-6 text-center text-xs">
                        Aucune formation active trouvée.
                      </td>
                    </tr>
                  ) : (
                    statsFormations.map((f) => (
                      <tr key={f.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 text-sm block">
                            {f.nom}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {f.definitifsFormation} définitif(s) · {f.preInscritsFormation} pré-inscrit(s)
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 font-bold text-slate-800">
                            {f.totalEleves}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900">
                          {FCFA.format(f.contratsFormation)} F
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-800">
                          {FCFA.format(f.encaisseAffiche)} F
                        </td>
                        <td className="p-3.5 text-right font-bold text-brand-orange">
                          {FCFA.format(f.resteARecouvrer)} F
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                f.taux >= 100
                                  ? "bg-emerald-100 text-emerald-800"
                                  : f.taux > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {f.taux}%
                            </span>
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${f.taux}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {statsFormations.length > 0 && (
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-800">
                    <tr>
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 block">Total Consolidé</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {statsFormations.length} filière(s) active(s)
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-slate-200/80 font-black text-slate-900 tabular-nums">
                          {totalStatsFormations.totalEleves}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 tabular-nums">
                        {FCFA.format(totalStatsFormations.contratsFormation)} F
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-800 tabular-nums">
                        {FCFA.format(totalStatsFormations.encaisseAffiche)} F
                      </td>
                      <td className="p-3.5 text-right font-black text-brand-orange tabular-nums">
                        {FCFA.format(totalStatsFormations.resteARecouvrer)} F
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {totalStatsFormations.tauxGlobal}%
                          </span>
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${totalStatsFormations.tauxGlobal}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {/* Flux des Dernières Transactions Encaissées */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-brand-orange" size={20} />
                  <span>Derniers Règlements Encaissés</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {entreesFiltrees.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mouvements de trésorerie récents enregistrés au guichet du centre.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rechercheTransaction}
                    onChange={(e) => setRechercheTransaction(e.target.value)}
                    placeholder="Filtrer élève, motif..."
                    className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50/70 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none transition-all w-44 sm:w-48"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/60 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setFiltreStatutTransaction("TOUS")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      filtreStatutTransaction === "TOUS"
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreStatutTransaction("VALIDE")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      filtreStatutTransaction === "VALIDE"
                        ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-emerald-800"
                    }`}
                  >
                    Validés
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreStatutTransaction("EN_COURS")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      filtreStatutTransaction === "EN_COURS"
                        ? "bg-white text-amber-800 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-amber-800"
                    }`}
                  >
                    En cours
                  </button>
                </div>

                <Link
                  href="/finances"
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 ml-0.5"
                >
                  <span>Journal</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {entreesFiltrees.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search size={16} />
                </div>
                <p className="font-medium">
                  {rechercheTransaction.trim()
                    ? "Aucun règlement ne correspond à votre filtre."
                    : "Aucun règlement financier enregistré pour le moment."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <th className="p-3 font-bold">Date</th>
                      <th className="p-3 font-bold">Élève & Programme</th>
                      <th className="p-3 font-bold">Motif</th>
                      <th className="p-3 font-bold text-right">Montant</th>
                      <th className="p-3 font-bold text-center">Statut</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entreesFiltrees.slice(0, 10).map((e) => {
                      const apprenant = apprenantsDuCentre.find((a) => a.id === e.apprenantId);
                      const formation = formations.find((f) => f.id === e.formationId);
                      const motif = motifs.find((m) => m.id === e.motifId);
                      const aujourdhuiStr = new Date().toISOString().slice(0, 10);
                      const bilanAujourdhuiValide =
                        bilan?.statut === "EN_ATTENTE_CONTROLEUR" || bilan?.statut === "CLOTURE";
                      const isDateVerrouillee =
                        (e.date === aujourdhuiStr && bilanAujourdhuiValide) ||
                        (e.date < aujourdhuiStr && e.statut === "VALIDE");

                      return (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">
                              {new Date(e.date).toLocaleDateString("fr-FR")}
                            </span>
                            {e.date === aujourdhuiStr && (
                              <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 bg-emerald-100 text-[10px] font-black text-emerald-800">
                                Aujourd&apos;hui
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {getInitiales(apprenant?.prenom, apprenant?.nom)}
                              </div>
                              <div className="min-w-0">
                                {apprenant ? (
                                  <Link
                                    href={`/apprenants/${apprenant.id}`}
                                    className="font-bold text-slate-900 hover:text-brand-orange transition-colors truncate block"
                                  >
                                    {apprenant.prenom} {apprenant.nom}
                                  </Link>
                                ) : (
                                  <span className="text-slate-500 font-medium">Versement divers</span>
                                )}
                                {formation && (
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {formation.nom}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] inline-block">
                              {motif?.nom || "Frais de scolarité"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                            +{FCFA.format(e.montant)} F
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                e.statut === "VALIDE"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  e.statut === "VALIDE" ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              {e.statut === "VALIDE" ? "Validé" : "En cours"}
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {isDateVerrouillee ? (
                              <span
                                title="Bilan clôturé pour cette date (modification verrouillée)"
                                className="inline-flex items-center gap-1 text-slate-400 p-1 cursor-not-allowed"
                              >
                                <Lock size={13} />
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVersementAModifier({
                                      id: e.id,
                                      montant: e.montant,
                                      date: e.date,
                                      motifId: e.motifId,
                                      motifNom: motif?.nom,
                                      apprenantId: e.apprenantId,
                                      apprenantNom: apprenant ? `${apprenant.prenom} ${apprenant.nom}` : undefined,
                                    })
                                  }
                                  className="p-1 rounded-md text-slate-500 hover:text-brand-orange hover:bg-orange-50 transition-colors cursor-pointer"
                                  title="Modifier ce versement"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setErreurActionVersement(null);
                                    setVersementASupprimer({
                                      id: e.id,
                                      montant: e.montant,
                                      libelle: motif?.nom || "Versement",
                                      date: e.date,
                                    });
                                  }}
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Supprimer ce versement"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Colonne Droite : Volets Opérationnels Latéraux */}
        <div className="space-y-6">

          {/* Card Salles & Infrastructures du Centre */}
          <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-orange-50 text-brand-orange">
                  <DoorOpen size={17} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Infrastructures & Salles
                </h3>
              </div>
              <Link
                href="/planification"
                className="text-[11px] font-bold text-brand-orange hover:underline flex items-center gap-0.5"
              >
                <span>Planning</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-center">
                <span className="text-2xl font-black text-slate-900 tabular-nums block">
                  {sallesDuCentre.length}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Salles de cours
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/60 text-center">
                <span className="text-2xl font-black text-brand-orange tabular-nums block">
                  {seancesSemaineCentre}
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  Séances (Sem. {semaineCourante})
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Salles attribuées au centre
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sallesDuCentre.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">Aucune salle configurée.</span>
                ) : (
                  sallesDuCentre.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
                    >
                      {s.nom}
                    </span>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Card Top Lycées d'Origine (Vivier de Recrutement) */}
          <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-1 rounded-lg bg-orange-50 text-brand-orange">
                <School size={17} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Lycées Partenaires (Top Recrutement)
              </h3>
            </div>

            {topEtablissements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Aucun établissement d&rsquo;origine renseigné pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {topEtablissements.map((etab, idx) => (
                  <div key={etab.nom} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0 ? "bg-brand-orange text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          0{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]" title={etab.nom}>
                          {etab.nom}
                        </span>
                      </div>
                      <span className="text-slate-600 font-bold tabular-nums">
                        {etab.count} élève{etab.count > 1 ? "s" : ""} ({etab.part}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-orange transition-all duration-500"
                        style={{ width: `${etab.part}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Modal Encaissement Rapide Directe ── */}
      {modalVersementOuverte && sessionActive && (
        <EnregistrerVersementModal
          isOpen={modalVersementOuverte}
          onClose={() => {
            setModalVersementOuverte(false);
            setApprenantSelectionneVersement(null);
          }}
          centreId={centreId}
          sessionId={sessionActive.id}
          apprenantId={apprenantSelectionneVersement?.id}
          nomApprenant={apprenantSelectionneVersement?.nom}
          formationId={apprenantSelectionneVersement?.formationId}
          soldeRestant={apprenantSelectionneVersement?.soldeRestant ?? resteGlobalRecouvrer}
        />
      )}

      {/* ── Modal Modification de Versement ── */}
      {versementAModifier && (
        <ModifierVersementModal
          isOpen={Boolean(versementAModifier)}
          onClose={() => setVersementAModifier(null)}
          versement={versementAModifier}
        />
      )}

      {/* ── Modal Confirmation Suppression Versement ── */}
      {versementASupprimer && (
        <Modal
          isOpen={Boolean(versementASupprimer)}
          onClose={() => {
            if (!supprimerEntreeMutation.isPending) {
              setVersementASupprimer(null);
              setErreurActionVersement(null);
            }
          }}
          title="Confirmer la suppression du versement"
        >
          <div className="space-y-4">
            {erreurActionVersement && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{erreurActionVersement}</span>
              </div>
            )}

            <p className="text-xs text-slate-600">
              Êtes-vous certain de vouloir supprimer ce versement ?
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Montant :</span>
                <span className="font-bold text-slate-900">{FCFA.format(versementASupprimer.montant)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date :</span>
                <span className="font-bold text-slate-900">{new Date(versementASupprimer.date).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motif :</span>
                <span className="font-bold text-slate-900">{versementASupprimer.libelle}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Attention :</strong> Cette action est irréversible. Si ce versement est lié à une vente d'ouvrages,
                les enregistrements de vente associés seront automatiquement annulés.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                disabled={supprimerEntreeMutation.isPending}
                onClick={() => {
                  setVersementASupprimer(null);
                  setErreurActionVersement(null);
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={supprimerEntreeMutation.isPending}
                onClick={async () => {
                  setErreurActionVersement(null);
                  try {
                    await supprimerEntreeMutation.mutateAsync(versementASupprimer.id);
                    setVersementASupprimer(null);
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error
                        ? err.message
                        : "Impossible de supprimer ce versement : le bilan de cette journée est déjà validé.";
                    setErreurActionVersement(msg);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {supprimerEntreeMutation.isPending ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
