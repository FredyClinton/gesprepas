"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  X,
  Filter,
  UserCheck,
  TrendingUp,
  BarChart2,
  Layers,
  ArrowUpRight,
} from "lucide-react";

import { Card, Skeleton, SkeletonCard } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { formatVolumeHoraire } from "@/modules/remuneration/domain/volumeHoraire";
import { useDepartement, useDepartements } from "@/modules/departement";
import { useRosterDepartement } from "@/modules/affectation-departementale";
import {
  useAffectations,
  useAssignerEnseignant,
  type Affectation,
} from "@/modules/affectation";
import { useEnseignants, type Enseignant } from "@/modules/personnel";
import {
  useCentres,
  useSessionActive,
  useSemaines,
} from "@/modules/centres-sessions";
import { useSalles } from "@/modules/salle";
import { useFormations } from "@/modules/academique";
import {
  useMatieres,
  construireCouleursMatieres,
  getCouleurCardStyle,
} from "@/modules/matieres";
import {
  useProgressions,
  construireMappingAffectationsProgressions,
} from "@/modules/progression";
import {
  semaineCouranteDepuis,
  semaineTotaleSession,
} from "@/shared/lib/semaine";
import { CopierRosterModal } from "./CopierRosterModal";

const PLACEHOLDER = "-";

type Props = {
  departementId?: string | null;
  chefId?: string;
};

export function ChefDepartementDashboard({ departementId, chefId }: Props) {
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: semainesPersistantes = [] } = useSemaines(sessionId);

  const { data: departements = [], isLoading: chargementDepartements } =
    useDepartements();

  // Liste de tous les départements sous la direction de ce chef (multi-département)
  const mesDepartements = useMemo(() => {
    if (!departements || departements.length === 0) return [];
    if (chefId) {
      const depts = departements.filter(
        (d) => d.chefId === chefId || (departementId && d.id === departementId),
      );
      if (depts.length > 0) return depts;
    }
    if (departementId) {
      const d = departements.find((dep) => dep.id === departementId);
      if (d) return [d];
    }
    return [];
  }, [departements, chefId, departementId]);

  // État du département sélectionné si chef de plusieurs départements
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const currentDepartementId = useMemo(() => {
    if (
      selectedDeptId &&
      mesDepartements.some((d) => d.id === selectedDeptId)
    ) {
      return selectedDeptId;
    }
    if (mesDepartements.length > 0) {
      return mesDepartements[0].id;
    }
    return departementId || undefined;
  }, [selectedDeptId, mesDepartements, departementId]);

  const { data: departement, isLoading: chargementDepartement } =
    useDepartement(currentDepartementId);

  const { data: matieres = [] } = useMatieres();
  const matiere = departement
    ? matieres.find((m) => m.id === departement.matiereId)
    : undefined;

  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres),
    [matieres],
  );
  const couleurMatiere = matiere ? couleursMatieres.get(matiere.id) : undefined;

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;
  const semaineTotaleCalculee = sessionActive
    ? semaineTotaleSession(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;
  const semaineTotale = Math.max(
    semaineTotaleCalculee,
    ...semainesPersistantes,
    1,
  );

  const [semaineChoisie, setSemaineChoisie] = useState<number | null>(null);
  const semaine = semaineChoisie ?? semaineCourante;

  const { data: roster = [], isLoading: chargementRoster } =
    useRosterDepartement(currentDepartementId, sessionId);
  const { data: enseignants = [] } = useEnseignants();
  const { data: centres = [] } = useCentres();
  const { data: salles = [] } = useSalles(sessionId);
  const { data: formations = [] } = useFormations();
  const { data: toutesProgressions = [] } = useProgressions();

  // Affectations de la semaine
  const { data: affectations = [], isLoading: chargementAffectations } =
    useAffectations({
      sessionId: departement ? sessionId : undefined,
      semaine,
      matiereId: departement?.matiereId,
    });

  // Affectations pour calculs statistiques
  const toutesAffectationsSession = affectations;

  // Maps de référence
  const centresParId = useMemo(() => {
    const map = new Map<string, string>();
    centres.forEach((c) => map.set(c.id, c.nom));
    return map;
  }, [centres]);

  const sallesParId = useMemo(() => {
    const map = new Map<string, string>();
    salles.forEach((s) => map.set(s.id, s.nom));
    return map;
  }, [salles]);

  const formationsParId = useMemo(() => {
    const map = new Map<string, string>();
    formations.forEach((f) => map.set(f.id, f.nom));
    return map;
  }, [formations]);

  const enseignantsDuDepartement = useMemo(() => {
    if (!roster || !enseignants) return [];
    const ids = new Set(roster.map((r) => r.enseignantId));
    return enseignants.filter((e) => ids.has(e.id));
  }, [roster, enseignants]);

  // Volume par enseignant sur la semaine
  const volumeSemaineParEnseignant = useMemo(() => {
    const map = new Map<string, number>();
    affectations.forEach((a) => {
      if (a.enseignantId) {
        map.set(a.enseignantId, (map.get(a.enseignantId) ?? 0) + 1);
      }
    });
    return map;
  }, [affectations]);

  // Volume par enseignant sur l'ensemble de la session
  const volumeSessionParEnseignant = useMemo(() => {
    const map = new Map<string, number>();
    toutesAffectationsSession.forEach((a) => {
      if (a.enseignantId) {
        map.set(a.enseignantId, (map.get(a.enseignantId) ?? 0) + 1);
      }
    });
    return map;
  }, [toutesAffectationsSession]);

  // Créneaux sans enseignant assigné
  const creneauxEnAttente = useMemo(
    () => affectations.filter((a) => !a.enseignantId),
    [affectations],
  );

  const seancesAssignees = affectations.length - creneauxEnAttente.length;
  const tauxAssignation =
    affectations.length > 0
      ? Math.round((seancesAssignees / affectations.length) * 100)
      : 100;

  // Filtrage des progressions pour la matière du département
  const depMatiereId = departement?.matiereId;
  const progressionsDepartement = useMemo(() => {
    if (!depMatiereId) return [];
    return toutesProgressions.filter(
      (p) =>
        p.matiereId === depMatiereId &&
        (!sessionId || p.sessionId === sessionId),
    );
  }, [toutesProgressions, depMatiereId, sessionId]);

  // Formations couvertes par la matière de ce département - pas la liste globale
  // (une formation peut être suivie par plusieurs matières, on ne montre ici que
  // celles réellement enseignées dans ce département).
  const formationsDuDepartement = useMemo(() => {
    if (!depMatiereId) return [];
    return formations.filter((f) => f.matiereIds?.includes(depMatiereId));
  }, [formations, depMatiereId]);

  // Statistiques de progression par formation
  const statsProgressionParFormation = useMemo(() => {
    return formationsDuDepartement.map((f) => {
      const seancesPourFormation = toutesAffectationsSession.filter(
        (a) => a.formationId === f.id,
      );
      const progressionsPourFormation = progressionsDepartement.filter(
        (p) => p.formationId === f.id,
      );

      const totalPrevu = seancesPourFormation.length;
      const effectuees = seancesPourFormation.filter(
        (a) => a.statut === "EFFECTUEE",
      ).length;
      const dispensees = progressionsPourFormation.length;

      const baseCalcul = totalPrevu > 0 ? totalPrevu : Math.max(dispensees, 1);
      const pourcentage = Math.min(
        100,
        Math.round((Math.max(effectuees, dispensees) / baseCalcul) * 100),
      );

      return {
        formationId: f.id,
        formationNom: f.nom,
        totalPrevu,
        effectuees,
        dispensees,
        pourcentage,
        dernierTheme:
          progressionsPourFormation[progressionsPourFormation.length - 1]
            ?.theme,
      };
    });
  }, [
    formationsDuDepartement,
    toutesAffectationsSession,
    progressionsDepartement,
  ]);

  // Séances effectuées cette semaine sans contenu de progression associé - relance
  // actionnable pour le chef ("tu as fait cours, qu'as-tu couvert ?"), plus utile
  // qu'un simple bouton d'ajout générique.
  const seancesSansContenu = useMemo(() => {
    const mapping = construireMappingAffectationsProgressions(
      affectations,
      progressionsDepartement,
    );
    return affectations.filter(
      (a) => a.statut === "EFFECTUEE" && !mapping.get(a.id)?.progression,
    );
  }, [affectations, progressionsDepartement]);

  // Onglets : Progression pédagogique (diagramme/jauges), Équilibre de charge, Créneaux à assigner
  const [onglet, setOnglet] = useState<"progression" | "charge" | "creneaux">(
    "progression",
  );
  const [rechercheCreneaux, setRechercheCreneaux] = useState("");
  const [filtreCentre, setFiltreCentre] = useState<string>("TOUS");

  // Modal Copier Roster
  const [isCopierModalOpen, setIsCopierModalOpen] = useState(false);

  // Créneaux en attente filtrés
  const creneauxEnAttenteFiltres = useMemo(() => {
    let list = creneauxEnAttente;
    if (filtreCentre !== "TOUS") {
      list = list.filter((c) => c.centreId === filtreCentre);
    }
    const q = rechercheCreneaux.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const nomC = (centresParId.get(c.centreId) ?? "").toLowerCase();
        const nomS = (sallesParId.get(c.salleId) ?? "").toLowerCase();
        const nomF = (formationsParId.get(c.formationId) ?? "").toLowerCase();
        return (
          nomC.includes(q) ||
          nomS.includes(q) ||
          nomF.includes(q) ||
          c.jour.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [
    creneauxEnAttente,
    filtreCentre,
    rechercheCreneaux,
    centresParId,
    sallesParId,
    formationsParId,
  ]);

  // État de chargement initial
  if (chargementDepartement || chargementDepartements) {
    return (
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Si aucun département n'est rattaché à ce chef
  if (!currentDepartementId || !departement) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-2xs">
            <Building2 size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-amber-950">
            Aucun département assigné
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-amber-800/90">
            Votre compte dispose du rôle <strong>Chef de Département</strong>,
            mais aucun pôle disciplinaire ne vous a encore été attribué par la
            direction académique.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-200/50 px-4 py-2 text-xs font-semibold text-amber-900">
            <AlertTriangle size={15} className="shrink-0 text-amber-700" />
            <span>
              Veuillez contacter le Directeur Académique pour procéder à votre
              nomination.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6">
      {/* ── En-tête du Dashboard Chef de Département ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-brand-orange/10 text-brand-orange flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-2xs">
            <Building2 size={30} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {departement.nom}
              </h1>

              {/* Sélecteur multi-départements si le chef en dirige plus d'un */}
              {mesDepartements.length > 1 && (
                <div className="flex items-center gap-2">
                  <select
                    value={currentDepartementId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                  >
                    {mesDepartements.map((d) => (
                      <option key={d.id} value={d.id} className="bg-white text-slate-800">
                        {d.nom}
                      </option>
                    ))}
                  </select>
                  <span className="text-brand-orange rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold">
                    {mesDepartements.length} départements
                  </span>
                </div>
              )}

              {matiere && (
                <span
                  style={
                    couleurMatiere?.hex
                      ? getCouleurCardStyle(couleurMatiere.hex, true)
                      : undefined
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-extrabold tracking-wide uppercase shadow-2xs ${
                    couleurMatiere
                      ? `${couleurMatiere.bg} ${couleurMatiere.texte} border-slate-200/60`
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <BookOpen size={13} className="shrink-0" />
                  <span>{matiere.nom}</span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tableau de bord disciplinaire • Suivi des programmes, charge
              d&apos;enseignement et assignations.
            </p>
          </div>
        </div>

        {/* Sélecteur de semaine */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setSemaineChoisie(Math.max(1, semaine - 1))}
              disabled={semaine <= 1}
              className="cursor-pointer rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
              aria-label="Semaine précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold whitespace-nowrap text-slate-800">
              Semaine {semaine}
              {semaine === semaineCourante ? (
                <span className="text-brand-orange ml-1.5 font-bold">
                  (en cours)
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() =>
                setSemaineChoisie(Math.min(semaineTotale, semaine + 1))
              }
              disabled={semaine >= semaineTotale}
              className="cursor-pointer rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
              aria-label="Semaine suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs Modernes ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Enseignants dans le Roster */}
        <Card className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Corps Enseignant
            </p>
            <p className="mt-0.5 text-2xl font-extrabold text-slate-900">
              {chargementRoster ? "…" : enseignantsDuDepartement.length}
            </p>
            <p className="text-[11px] text-slate-400">
              Roster actif de la session
            </p>
          </div>
        </Card>

        {/* KPI 2 : Cours cette semaine */}
        <Card className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarClock size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Séances (Sem. {semaine})
            </p>
            <p className="mt-0.5 text-2xl font-extrabold text-slate-900">
              {chargementAffectations ? "…" : affectations.length}
            </p>
            <p className="text-[11px] text-slate-400">
              {seancesAssignees} séances pourvues
            </p>
          </div>
        </Card>

        {/* KPI 3 : Créneaux à assigner */}
        <Card
          className={`flex items-center gap-4 rounded-2xl border bg-white p-4.5 shadow-2xs ${
            creneauxEnAttente.length > 0
              ? "border-amber-300 bg-amber-50/20"
              : "border-slate-200/80"
          }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              creneauxEnAttente.length > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              À assigner
            </p>
            <p
              className={`mt-0.5 text-2xl font-extrabold ${
                creneauxEnAttente.length > 0
                  ? "text-amber-700"
                  : "text-slate-900"
              }`}
            >
              {chargementAffectations ? "…" : creneauxEnAttente.length}
            </p>
            <p className="text-[11px] text-slate-400">
              {creneauxEnAttente.length > 0
                ? "Créneaux sans enseignant"
                : "Tous les cours sont pourvus"}
            </p>
          </div>
        </Card>

        {/* KPI 4 : Couverture Pédagogique */}
        <Card className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Couverture Planning
            </p>
            <p className="mt-0.5 text-2xl font-extrabold text-slate-900">
              {chargementAffectations ? "…" : `${tauxAssignation}%`}
            </p>
            <p className="text-[11px] text-slate-400">
              {seancesAssignees} / {affectations.length || 0} créneaux
            </p>
          </div>
        </Card>
      </div>

      {/* ── Sélecteur d'onglets (Progression, Équilibre de Charge, Créneaux) ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setOnglet("progression")}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              onglet === "progression"
                ? "text-brand-orange bg-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp size={15} />
            <span>Progression Pédagogique</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
              {statsProgressionParFormation.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnglet("charge")}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              onglet === "charge"
                ? "text-brand-orange bg-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart2 size={15} />
            <span>Équilibre de Charge</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
              {enseignantsDuDepartement.length} profs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnglet("creneaux")}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              onglet === "creneaux"
                ? "text-brand-orange bg-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle size={15} />
            <span>Créneaux à assigner</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                creneauxEnAttente.length > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {creneauxEnAttente.length}
            </span>
          </button>
        </div>

        {/* Liens rapides vers les vues dédiées */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/planification"
            className="hover:text-brand-orange flex items-center gap-1 font-semibold text-slate-500 transition-colors"
          >
            <span>Ouvrir le Planning Complet</span>
            <ArrowUpRight size={13} />
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/enseignants"
            className="hover:text-brand-orange flex items-center gap-1 font-semibold text-slate-500 transition-colors"
          >
            <span>Annuaire Enseignants</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── CONTENU DE L'ONGLET 1 : PROGRESSION PÉDAGOGIQUE (RÉSUMÉ) ── */}
      {onglet === "progression" && (
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <TrendingUp size={16} className="text-brand-orange" />
                <span>
                  Progression Pédagogique par Formation -{" "}
                  {matiere?.nom ?? departement.nom}
                </span>
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Avancement du syllabus pour chaque filière. Saisie et journal
                complet sur l&rsquo;écran dédié.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Layers size={14} className="text-slate-400" />
                <span>
                  {progressionsDepartement.length} séance(s) avec contenu
                  enregistré
                </span>
              </div>
              {seancesSansContenu.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                  <AlertTriangle size={14} />
                  <span>{seancesSansContenu.length} sans contenu</span>
                </div>
              )}
              <Link
                href="/progression"
                className="bg-brand-orange hover:bg-brand-orange/90 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
              >
                <span>Ouvrir Progression</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Grille des Jauges de Progression - résumé, la saisie/édition/journal
              complet vivent sur /progression */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {statsProgressionParFormation.map((item) => (
              <Card
                key={item.formationId}
                className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 uppercase">
                      Formation
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {item.formationNom}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-black text-slate-900">
                      {item.pourcentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.pourcentage >= 80
                          ? "bg-emerald-500"
                          : item.pourcentage >= 40
                            ? "bg-brand-orange"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${item.pourcentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{item.effectuees} séance(s) effectuée(s)</span>
                    <span>{item.totalPrevu} prévue(s)</span>
                  </div>
                </div>

                {/* Dernier thème abordé */}
                <div className="border-t border-slate-100 pt-3 text-xs">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-400">
                    Dernier thème au syllabus :
                  </span>
                  {item.dernierTheme ? (
                    <p className="line-clamp-2 rounded-lg border border-slate-100 bg-slate-50 p-2 font-medium text-slate-800">
                      {item.dernierTheme}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Aucun thème saisi pour le moment
                    </p>
                  )}
                </div>

                {/* Bouton direct vers le syllabus */}
                <div className="border-t border-slate-100 pt-3">
                  <Link
                    href="/progression"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 py-2 text-xs font-bold text-slate-700 hover:border-brand-orange hover:bg-orange-50/50 hover:text-brand-orange transition-colors cursor-pointer"
                  >
                    <span>Gérer le syllabus &amp; thèmes</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENU DE L'ONGLET 2 : ÉQUILIBRE DE CHARGE ENSEIGNANTE ── */}
      {onglet === "charge" && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BarChart2 size={16} className="text-brand-orange" />
                <span>
                  Équilibre et Répartition des Charges - Semaine {semaine}
                </span>
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Visualisez la charge d&apos;enseignement hebdomadaire et globale
                pour éviter la surcharge ou sous-utilisation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">
                {enseignantsDuDepartement.length} enseignant(s) au roster
              </span>
            </div>
          </div>

          {chargementRoster ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Chargement des enseignants...
            </div>
          ) : enseignantsDuDepartement.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">
                Aucun enseignant dans le roster de ce département
              </h3>
              <p className="mx-auto mt-1 mb-4 max-w-md text-xs text-slate-400">
                Reconduisez l&apos;équipe depuis une session précédente ou
                ajoutez des enseignants depuis l&apos;annuaire Enseignants.
              </p>
              <button
                type="button"
                onClick={() => setIsCopierModalOpen(true)}
                className="bg-brand-orange shadow-brand-orange/20 hover:bg-brand-orange/90 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md"
              >
                Copier les enseignants d&apos;une session passée
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">Enseignant</th>
                    <th className="p-4">Matricule</th>
                    <th className="p-4 text-center">
                      Séances Semaine {semaine}
                    </th>
                    <th className="w-60 p-4">Jauge de Charge</th>
                    <th className="p-4 text-center">Cumul Session</th>
                    <th className="p-4 text-center">Diagnostic Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enseignantsDuDepartement.map((e) => {
                    const seancesSemaine =
                      volumeSemaineParEnseignant.get(e.id) ?? 0;
                    const seancesSession =
                      volumeSessionParEnseignant.get(e.id) ?? 0;
                    const pourcentageJauge = Math.min(
                      100,
                      Math.round((seancesSemaine / 6) * 100),
                    );

                    return (
                      <tr
                        key={e.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-brand-orange/10 text-brand-orange flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-2xs">
                              {e.prenom[0]}
                              {e.nom[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {e.prenom} {e.nom}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {e.statut === "ACTIF"
                                  ? "Enseignant Actif"
                                  : "Statut Gelé"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-600">
                          {e.matricule}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {seancesSemaine}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400">
                            {formatVolumeHoraire(seancesSemaine)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  seancesSemaine > 4
                                    ? "bg-amber-500"
                                    : seancesSemaine > 0
                                      ? "bg-emerald-500"
                                      : "bg-slate-200"
                                }`}
                                style={{ width: `${pourcentageJauge}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {seancesSemaine} séance(s) •{" "}
                              {formatVolumeHoraire(seancesSemaine)} sur cible
                              hebdo ~4-6
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                            {seancesSession} séance
                            {seancesSession > 1 ? "s" : ""}
                          </span>
                          <span className="mt-1 block font-mono text-[10px] text-slate-400">
                            {formatVolumeHoraire(seancesSession)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {seancesSemaine === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                              Non mobilisé
                            </span>
                          ) : seancesSemaine <= 4 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 size={11} />
                              Équilibrée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <AlertTriangle size={11} />
                              Forte charge
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONTENU DE L'ONGLET 3 : CRÉNEAUX EN ATTENTE D'ASSIGNATION ── */}
      {onglet === "creneaux" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="focus-within:border-brand-orange focus-within:ring-brand-orange/10 relative flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs focus-within:ring-2 sm:w-80">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                type="search"
                value={rechercheCreneaux}
                onChange={(e) => setRechercheCreneaux(e.target.value)}
                placeholder="Filtrer par centre, salle, formation..."
                className="w-full text-xs text-slate-700 placeholder-slate-400 outline-none"
              />
              {rechercheCreneaux && (
                <button
                  type="button"
                  onClick={() => setRechercheCreneaux("")}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {centres.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <Filter size={14} className="text-slate-400" />
                <span className="font-semibold text-slate-600">Centre :</span>
                <select
                  value={filtreCentre}
                  onChange={(e) => setFiltreCentre(e.target.value)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                >
                  <option value="TOUS" className="bg-white text-slate-800">
                    Tous les centres ({centres.length})
                  </option>
                  {centres.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-800">
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {chargementAffectations ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Chargement des créneaux...
            </div>
          ) : creneauxEnAttenteFiltres.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-12 text-center shadow-2xs">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <h3 className="mt-3 text-sm font-bold text-emerald-950">
                Toutes les séances de la semaine sont pourvues !
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-emerald-700">
                {rechercheCreneaux || filtreCentre !== "TOUS"
                  ? "Aucun créneau vacant ne correspond à vos critères de recherche."
                  : `Aucun créneau de ${matiere?.nom ?? "votre matière"} n'est en attente d’assignation pour la semaine ${semaine}.`}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="p-3.5">Jour &amp; Séance</th>
                    <th className="p-3.5">Centre</th>
                    <th className="p-3.5">Salle</th>
                    <th className="p-3.5">Formation</th>
                    <th className="p-3.5 text-right">Assigner un enseignant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {creneauxEnAttenteFiltres.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-amber-50/40"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {c.jour}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Séance {c.seance}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {centresParId.get(c.centreId) ?? PLACEHOLDER}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {sallesParId.get(c.salleId) ?? PLACEHOLDER}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                          <GraduationCap size={13} className="text-slate-500" />
                          <span>
                            {formationsParId.get(c.formationId) ?? PLACEHOLDER}
                          </span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <AssignerCreneauDropdown
                          creneau={c}
                          enseignants={enseignantsDuDepartement}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal pour copier le roster depuis une session précédente */}
      {sessionId && departement && (
        <CopierRosterModal
          isOpen={isCopierModalOpen}
          onClose={() => setIsCopierModalOpen(false)}
          departementId={departement.id}
          departementNom={departement.nom}
          sessionCibleId={sessionId}
          sessionCibleNom={sessionActive?.annee}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT COLOCALISÉ : DROPDOWN D'ASSIGNATION RAPIDE D'UN ENSEIGNANT
// ─────────────────────────────────────────────────────────────────────────────

function AssignerCreneauDropdown({
  creneau,
  enseignants,
  label = "Assigner",
}: {
  creneau: Affectation;
  enseignants: Enseignant[] | undefined;
  label?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const assigner = useAssignerEnseignant();

  const resultats = useMemo(() => {
    if (!enseignants) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return enseignants;
    return enseignants.filter(
      (e) =>
        `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(q) ||
        (e.telephone && e.telephone.toLowerCase().includes(q)),
    );
  }, [enseignants, recherche]);

  function choisir(enseignantId: string) {
    assigner.mutate(
      { id: creneau.id, enseignantId },
      { onSuccess: () => setOuvert(false) },
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs transition-all ${
          creneau.enseignantId
            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
            : "bg-brand-orange hover:bg-brand-orange/90 text-white"
        }`}
      >
        {label}
      </button>

      {ouvert && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOuvert(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="focus-within:border-brand-orange mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 transition-colors focus-within:bg-white">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Chercher un enseignant..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
              {enseignants === undefined && (
                <p className="p-3 text-center text-xs text-slate-400">
                  Chargement...
                </p>
              )}
              {enseignants?.length === 0 && (
                <p className="p-3 text-center text-xs text-slate-400">
                  Aucun enseignant dans le roster du département.
                </p>
              )}
              {enseignants &&
                enseignants.length > 0 &&
                resultats.length === 0 && (
                  <p className="p-3 text-center text-xs text-slate-400">
                    Aucun résultat.
                  </p>
                )}
              {resultats.map((e) => {
                const estAssignéActuellement = creneau.enseignantId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => choisir(e.id)}
                    disabled={assigner.isPending || estAssignéActuellement}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left transition-colors ${
                      estAssignéActuellement
                        ? "cursor-not-allowed bg-slate-50 opacity-60"
                        : "hover:bg-brand-orange/10"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                        {e.prenom[0]}
                        {e.nom[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {e.prenom} {e.nom}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {e.matricule}
                        </p>
                      </div>
                    </div>
                    {estAssignéActuellement ? (
                      <span className="text-[10px] font-bold text-slate-400">
                        Actuel
                      </span>
                    ) : (
                      <UserCheck
                        size={14}
                        className="text-brand-orange shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {assigner.isError && (
              <p className="mt-2 rounded-lg bg-rose-50 p-2 text-[11px] font-bold text-rose-600">
                {messageErreurApi(
                  assigner.error,
                  "Échec de l’assignation. Réessayez.",
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
