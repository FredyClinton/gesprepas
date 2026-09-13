"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  Coins,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  FileText,
  UserPlus,
  ArrowRight,
  TrendingUp,
  School,
  DoorOpen,
  CalendarCheck,
  BookOpen,
} from "lucide-react";

import { Card, Button } from "@/shared/ui";
import { useApprenants } from "@/modules/apprenants";
import { useFormations, usePhases } from "@/modules/academique";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import {
  useBilanDuJour,
  useRepartitionFormations,
  useMouvementsFinanciers,
  useMotifs,
  EnregistrerVersementModal,
} from "@/modules/financier";
import { useSalles } from "@/modules/salle";
import { useConcoursBlancs } from "@/modules/concours-blancs";
import { useAffectations } from "@/modules/affectation";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

const FCFA = new Intl.NumberFormat("fr-FR");

const STATUT_BILAN_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  EN_ATTENTE_CONTROLEUR: {
    label: "À valider par le Contrôleur",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
    desc: "Bilan soumis, en attente de vérification et validation comptable.",
  },
  CLOTURE: {
    label: "Clôturé & Conforme",
    badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300",
    desc: "Journée comptabilisée et clôturée avec succès.",
  },
  OUVERT: {
    label: "Caisse Ouverte (En cours)",
    badgeClass: "bg-blue-100 text-blue-900 border border-blue-300",
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

  const { data: centres } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const { data: phases = [] } = usePhases();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [], isLoading: chargementFormations } = useFormations();
  const { data: bilan, isLoading: chargementBilan } = useBilanDuJour(
    centreId,
    sessionActive?.id,
  );
  const { data: repartition } = useRepartitionFormations(bilan?.id);
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

  // 1. Données apprenants du centre
  const apprenantsDuCentre = useMemo(
    () => apprenants.filter((a) => a.centreId === centreId),
    [apprenants, centreId],
  );

  const effectifTotal = apprenantsDuCentre.length;
  const preInscrits = apprenantsDuCentre.filter((a) => a.preInscrit).length;
  const definitifs = effectifTotal - preInscrits;

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
      : 100;

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
        : totalEntreesAuj > 0
          ? totalEntreesAuj
          : entreesCentre.length > 0
            ? entreesCentre[0].montant
            : 0;

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

  // 6. Top élèves à relancer (Soldes restants prioritaires)
  const soldesPrioritaires = useMemo(() => {
    return apprenantsDuCentre
      .map((apprenant) => {
        const paye = entreesCentre
          .filter((e) => e.apprenantId === apprenant.id)
          .reduce((sum, e) => sum + e.montant, 0);
        const solde = Math.max(0, (apprenant.montantContrat || 0) - paye);
        const formation = formations.find((f) => f.id === apprenant.formationId);
        return {
          apprenant,
          formationNom: formation?.nom || "Filière",
          totalContrat: apprenant.montantContrat || 0,
          paye,
          solde,
        };
      })
      .filter((item) => item.solde > 0)
      .sort((a, b) => b.solde - a.solde)
      .slice(0, 5);
  }, [apprenantsDuCentre, entreesCentre, formations]);

  // 7. Top Lycées / Établissements d'Origine
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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ── 1. En-tête & Bannière Opérationnelle Hero ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-black text-brand-orange uppercase">
                <Building2 size={13} />
                <span>Centre Opérationnel</span>
              </span>

              {sessionActive && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  <Calendar size={13} className="text-slate-500" />
                  <span>Session {sessionActive.annee}</span>
                </span>
              )}

              {phases.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
                  <Layers size={13} className="text-brand-orange" />
                  <span>Semaine {semaineCourante}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {centre?.nom ?? "Tableau de Bord du Centre"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {centre?.adresseActuelle ? `${centre.adresseActuelle}, ` : ""}
              {centre?.villeActuelle ?? "Direction de Centre"} · Suivi en temps réel des effectifs, de la caisse et des évaluations.
            </p>
          </div>

          {/* Raccourcis d'actions rapides directes */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <Button
              type="button"
              onClick={() => setModalVersementOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Coins size={14} />
              <span>Encaisser versement</span>
            </Button>

            <Link href="/inscription">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Inscrire un élève</span>
              </Button>
            </Link>

            <Link href="/concours-blancs">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Award size={14} />
                <span>Concours Blancs</span>
              </Button>
            </Link>

            <Link href="/livres">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <BookOpen size={14} />
                <span>Livres & Supports</span>
              </Button>
            </Link>

            <Link href="/planification">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <CalendarCheck size={14} />
                <span>Planning</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. 4 KPIs Majeurs en Données Réelles ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Effectif Apprenants */}
        <Link href="/apprenants" className="group">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Effectif Apprenants
              </span>
              <div className="bg-orange-50 text-brand-orange rounded-xl p-2.5 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-slate-900 text-3xl font-black">
                {chargementApprenants ? "…" : effectifTotal}
              </span>
              <span className="text-xs font-bold text-slate-500">élèves au centre</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} />
                {definitifs} définitifs
              </span>
              <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                <Clock size={12} />
                {preInscrits} pré-inscrits
              </span>
            </div>
          </Card>
        </Link>

        {/* KPI 2 : Recouvrement Global */}
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Recouvrement Global
            </span>
            <div className="bg-emerald-50 text-emerald-700 rounded-xl p-2.5">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-slate-900 text-2xl font-black">
              {chargementMouvements ? "…" : `${FCFA.format(montantTotalEncaisse)} F`}
            </span>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              sur {FCFA.format(totalContratsCentre)} F souscrits
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-500">Taux de recouvrement</span>
              <span className="text-emerald-700 font-black">{tauxRecouvrementGlobal}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${tauxRecouvrementGlobal}%` }}
              />
            </div>
          </div>
        </Card>

        {/* KPI 3 : Caisse du Jour & Bilan */}
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Caisse du Jour
            </span>
            <div className="bg-blue-50 text-blue-700 rounded-xl p-2.5">
              <Coins size={20} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-slate-900 text-2xl font-black">
              {chargementBilan && chargementMouvements
                ? "…"
                : `${FCFA.format(caisseDuJourCalcul.net)} F`}
            </span>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Entrées : {FCFA.format(caisseDuJourCalcul.totalEntrees)} F · Sorties : {FCFA.format(caisseDuJourCalcul.totalSorties)} F
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${statutBilanInfo.badgeClass}`}
            >
              {statutBilanInfo.label}
            </span>
            {bilan?.effectifNouveauxEleves !== undefined && bilan.effectifNouveauxEleves > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                +{bilan.effectifNouveauxEleves} élève(s) auj.
              </span>
            )}
          </div>
        </Card>

        {/* KPI 4 : Concours Blancs & Évaluations */}
        <Link href="/concours-blancs" className="group">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Concours Blancs
              </span>
              <div className="bg-purple-50 text-purple-700 rounded-xl p-2.5 group-hover:scale-110 transition-transform">
                <Award size={20} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm font-black text-slate-900 line-clamp-1">
                {prochainConcours?.titre || "Concours Blanc Session"}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {prochainConcours
                  ? `Prévu le ${new Date(prochainConcours.dateEpreuve).toLocaleDateString("fr-FR")}`
                  : `${concoursBlancs.length} épreuve(s) programmée(s)`}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-orange font-bold">
              <span>Voir les classements</span>
              <ArrowUpRight size={14} />
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
              </table>
            </div>
          </Card>

          {/* Flux des Dernières Transactions Encaissées */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-brand-orange" size={20} />
                  <span>Derniers Règlements Encaissés au Centre</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mouvements financiers récents enregistrés à la caisse du centre.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setApprenantSelectionneVersement(null);
                  setModalVersementOuverte(true);
                }}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Coins size={13} />
                <span>Nouveau versement</span>
              </Button>
            </div>

            {entreesCentre.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun règlement financier enregistré pour le moment.
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entreesCentre.slice(0, 5).map((e) => {
                      const apprenant = apprenantsDuCentre.find((a) => a.id === e.apprenantId);
                      const formation = formations.find((f) => f.id === e.formationId);
                      const motif = motifs.find((m) => m.id === e.motifId);

                      return (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {new Date(e.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="p-3">
                            {apprenant ? (
                              <Link
                                href={`/apprenants/${apprenant.id}`}
                                className="font-bold text-slate-900 hover:text-brand-orange transition-colors"
                              >
                                {apprenant.prenom} {apprenant.nom}
                              </Link>
                            ) : (
                              <span className="text-slate-500 font-medium">Versement divers</span>
                            )}
                            {formation && (
                              <span className="text-[10px] text-slate-400 block">
                                {formation.nom}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {motif?.nom || "Frais de scolarité"}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap">
                            {FCFA.format(e.montant)} FCFA
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                e.statut === "VALIDE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {e.statut === "VALIDE" ? "Validé" : "En cours"}
                            </span>
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
          {/* Card Soldes Prioritaires à Recouvrer (Relances) */}
          {/* <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-brand-orange" size={18} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Soldes à Recouvrer
                </h3>
              </div>
              <Link
                href="/apprenants"
                className="text-[11px] font-bold text-brand-orange hover:underline"
              >
                Tous les élèves
              </Link>
            </div>

            {soldesPrioritaires.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Tous les contrats du centre sont intégralement soldés !
              </p>
            ) : (
              <div className="space-y-2.5">
                {soldesPrioritaires.map((item) => (
                  <div
                    key={item.apprenant.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-orange/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <Link
                        href={`/apprenants/${item.apprenant.id}`}
                        className="font-bold text-xs text-slate-900 hover:text-brand-orange truncate block"
                        title={`${item.apprenant.nom} ${item.apprenant.prenom}`}
                      >
                        {item.apprenant.nom} {item.apprenant.prenom}
                      </Link>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {item.formationNom}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-brand-orange whitespace-nowrap">
                        {FCFA.format(item.solde)} F
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setApprenantSelectionneVersement({
                            id: item.apprenant.id,
                            nom: `${item.apprenant.nom} ${item.apprenant.prenom}`,
                            soldeRestant: item.solde,
                            formationId: item.apprenant.formationId,
                          });
                          setModalVersementOuverte(true);
                        }}
                        className="rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Encaisser un versement pour cet élève"
                      >
                        Encaisser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card> */}

          {/* Card Salles & Infrastructures du Centre */}
          <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DoorOpen className="text-brand-orange" size={18} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Infrastructures
                </h3>
              </div>
              <Link
                href="/planification"
                className="text-[11px] font-bold text-brand-orange hover:underline"
              >
                Planning
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-2xl font-black text-slate-900 block">
                  {sallesDuCentre.length}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Salles de cours
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-2xl font-black text-brand-orange block">
                  {seancesSemaineCentre}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Séances (Sem. {semaineCourante})
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
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
                      className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
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
              <School className="text-brand-orange" size={18} />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Lycées Partenaires (Top Recrutement)
              </h3>
            </div>

            {topEtablissements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Aucun établissement d&rsquo;origine renseigné pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {topEtablissements.map((etab) => (
                  <div key={etab.nom} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]" title={etab.nom}>
                        {etab.nom}
                      </span>
                      <span className="text-slate-500 font-bold">
                        {etab.count} élève{etab.count > 1 ? "s" : ""} ({etab.part}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-orange"
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
    </div>
  );
}
