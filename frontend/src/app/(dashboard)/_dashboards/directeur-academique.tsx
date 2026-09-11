"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UserRound,
  AlertTriangle,
  ClipboardList,
  Building2,
  TrendingUp,
  Layers,
  ArrowUpRight,
} from "lucide-react";

import { Card } from "@/shared/ui";
import { useEnseignants } from "@/modules/personnel";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useAffectations } from "@/modules/affectation";
import { useDepartements } from "@/modules/departement";
import { useFormations } from "@/modules/academique";
import { useMatieres } from "@/modules/matieres";
import { useSalles } from "@/modules/salle";
import {
  useProgressions,
  JournalProgression,
} from "@/modules/progression";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

const PLACEHOLDER = "-";

export function DirecteurAcademiqueDashboard() {
  const { data: enseignants, isLoading: chargementEnseignants } =
    useEnseignants();
  const { data: centres, isLoading: chargementCentres } = useCentres();
  const { data: sessionActive } = useSessionActive();

  const enseignantsActifs = enseignants?.filter(
    (e) => e.statut === "ACTIF",
  ).length;

  const centresActifs = centres?.filter(
    (c) =>
      c.statut === "OUVERT" &&
      sessionActive &&
      c.sessionIds.includes(sessionActive.id),
  ).length;

  // Semaine courante calculée comme sur le dashboard Chef de Département (pas de
  // semaine calendaire ISO côté backend). Pas de filtre matiereId : le Directeur
  // Académique voit les créneaux de tout le réseau, toutes matières confondues.
  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;
  const { data: affectations, isLoading: chargementAffectations } =
    useAffectations({
      sessionId: sessionActive?.id,
      semaine: semaineCourante,
      matiereId: undefined,
    });
  const creneauxNonAssignes = affectations?.filter(
    (a) => a.statut === "PLANIFIEE",
  ).length;

  const { data: departements = [] } = useDepartements();
  const { data: formations = [] } = useFormations();
  const { data: matieres = [] } = useMatieres();
  const { data: salles = [] } = useSalles(sessionActive?.id);
  const { data: toutesProgressions = [] } = useProgressions();

  const formationsParId = useMemo(() => {
    const map = new Map<string, string>();
    formations.forEach((f) => map.set(f.id, f.nom));
    return map;
  }, [formations]);

  const departementsParMatiereId = useMemo(() => {
    const map = new Map<string, string>();
    departements.forEach((d) => map.set(d.matiereId, d.nom));
    return map;
  }, [departements]);

  // Progressions de la session active, toutes matières confondues.
  const progressionsSession = useMemo(() => {
    if (!sessionActive) return [];
    return toutesProgressions.filter((p) => p.sessionId === sessionActive.id);
  }, [toutesProgressions, sessionActive]);

  // Comparatif par département - la vue qu'un Chef de Département n'a jamais,
  // limité lui à son seul département. Même formule "honnête" que le dashboard
  // Chef de Département : le dénominateur est le nombre de créneaux réellement
  // créés cette semaine (pas de total de séances prévues déclaré ailleurs).
  const statsProgressionParDepartement = useMemo(() => {
    return departements.map((d) => {
      const seancesDuDepartement = (affectations ?? []).filter(
        (a) => a.matiereId === d.matiereId,
      );
      const progressionsDuDepartement = progressionsSession.filter(
        (p) => p.matiereId === d.matiereId,
      );
      const totalPrevu = seancesDuDepartement.length;
      const effectuees = seancesDuDepartement.filter(
        (a) => a.statut === "EFFECTUEE",
      ).length;
      const dispensees = progressionsDuDepartement.length;
      const baseCalcul = totalPrevu > 0 ? totalPrevu : Math.max(dispensees, 1);
      const pourcentage = Math.min(
        100,
        Math.round((Math.max(effectuees, dispensees) / baseCalcul) * 100),
      );
      return {
        departementId: d.id,
        departementNom: d.nom,
        matiereId: d.matiereId,
        sansChef: !d.chefId,
        totalPrevu,
        effectuees,
        dispensees,
        pourcentage,
      };
    });
  }, [departements, affectations, progressionsSession]);

  // Filtres du journal chronologique global
  const [filtreDepartementJournal, setFiltreDepartementJournal] =
    useState("TOUS");
  const progressionsFiltreesJournal = useMemo(() => {
    if (filtreDepartementJournal === "TOUS") return progressionsSession;
    return progressionsSession.filter(
      (p) => p.matiereId === filtreDepartementJournal,
    );
  }, [progressionsSession, filtreDepartementJournal]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Vue d&rsquo;ensemble Pédagogique
        </h1>
        <p className="text-sm text-slate-500">
          Aperçu de l&rsquo;activité pédagogique du réseau
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Enseignants Actifs */}
        <Card className="group hover:shadow-brand-orange/10 relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Enseignants actifs
            </span>
            <div className="from-brand-orange/20 to-brand-orange/5 text-brand-orange rounded-xl bg-gradient-to-br p-2.5 transition-transform duration-300 group-hover:scale-110">
              <UserRound size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-brand-anthracite mt-3 text-4xl font-extrabold tracking-tight">
            {chargementEnseignants ? "…" : (enseignantsActifs ?? PLACEHOLDER)}
          </div>
          <div className="mt-2 flex items-center text-xs font-medium">
            <span className="mr-2 rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              +3%
            </span>
            <span className="text-brand-gray font-medium">vs mois dernier</span>
          </div>
        </Card>

        {/* KPI 2 : Centres Actifs */}
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Centres actifs
            </span>
            <div className="from-brand-anthracite/10 to-brand-anthracite/5 text-brand-anthracite rounded-xl bg-gradient-to-br p-2.5 transition-transform duration-300 group-hover:scale-110">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-brand-anthracite mt-3 text-4xl font-extrabold tracking-tight">
            {chargementCentres ? "…" : (centresActifs ?? PLACEHOLDER)}
          </div>
          <div className="text-brand-gray mt-2 flex items-center text-xs font-medium">
            <span>Réseau global</span>
          </div>
        </Card>

        {/* KPI 3 : Créneaux non assignés */}
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10">
          {/* Effet de fond subtil rouge en cas d'alerte */}
          {creneauxNonAssignes && creneauxNonAssignes > 0 ? (
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-red-50 blur-2xl transition-all duration-300 group-hover:bg-red-100"></div>
          ) : null}
          <div className="relative flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Créneaux sans prof
            </span>
            <div className="rounded-xl bg-gradient-to-br from-red-100 to-red-50 p-2.5 text-red-600 transition-transform duration-300 group-hover:scale-110">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="relative mt-3 text-4xl font-extrabold tracking-tight text-red-600">
            {chargementAffectations ? "…" : (creneauxNonAssignes ?? 0)}
          </div>
          <p className="text-brand-gray relative mt-2 text-xs font-medium">
            Semaine en cours ({semaineCourante})
          </p>
        </Card>

        {/* KPI 4 : Nombre de cours */}
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Cours planifiés
            </span>
            <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 p-2.5 text-blue-600 transition-transform duration-300 group-hover:scale-110">
              <ClipboardList size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-brand-anthracite mt-3 text-4xl font-extrabold tracking-tight">
            {chargementAffectations ? "…" : (affectations?.length ?? 0)}
          </div>
          <p className="text-brand-gray mt-2 text-xs font-medium">
            Toutes matières confondues (S{semaineCourante})
          </p>
        </Card>
      </div>

      {/* Progression pédagogique - comparatif par département */}
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-brand-anthracite flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={18} className="text-brand-orange" />
            <span>Progression Pédagogique par Département</span>
          </h2>
          <Link
            href="/progression"
            className="bg-brand-orange hover:bg-brand-orange/90 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <span>Ouvrir Progression</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {departements.length === 0 ? (
          <div className="border-brand-gray/20 bg-brand-gray/5 rounded-md border border-dashed p-6 text-center">
            <p className="text-brand-gray text-sm">
              Aucun département créé pour l&rsquo;instant.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Département</th>
                  <th className="p-3 text-center">Séances effectuées</th>
                  <th className="p-3 text-center">Séances documentées</th>
                  <th className="w-48 p-3">Couverture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsProgressionParDepartement.map((item) => (
                  <tr key={item.departementId} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <span className="font-bold text-slate-900">
                        {item.departementNom}
                      </span>
                      {item.sansChef && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Sans chef
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-800">
                      {item.effectuees}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-800">
                      {item.dispensees}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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
                        <span className="w-10 shrink-0 text-right font-mono font-bold text-slate-700">
                          {item.pourcentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Journal chronologique global, tous départements confondus */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
          <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
            <Layers size={14} className="text-slate-400" />
            Journal des Thèmes &amp; Contenus Enregistrés (
            {progressionsFiltreesJournal.length})
          </h4>
          <select
            value={filtreDepartementJournal}
            onChange={(e) => setFiltreDepartementJournal(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="TOUS" className="bg-white text-slate-800">Tous les départements</option>
            {departements.map((d) => (
              <option key={d.id} value={d.matiereId} className="bg-white text-slate-800">
                {d.nom}
              </option>
            ))}
          </select>
        </div>

        <JournalProgression
          progressions={progressionsFiltreesJournal}
          formationsParId={formationsParId}
          departementsParMatiereId={departementsParMatiereId}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
