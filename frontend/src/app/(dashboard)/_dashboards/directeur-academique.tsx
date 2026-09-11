"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  UserRound,
  AlertTriangle,
  ClipboardList,
  Building2,
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
import { useProgressions } from "@/modules/progression";
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

  // Progressions de la session active, toutes matières confondues.
  const progressionsSession = useMemo(() => {
    if (!sessionActive) return [];
    return toutesProgressions.filter((p) => p.sessionId === sessionActive.id);
  }, [toutesProgressions, sessionActive]);

  // Comparatif par département - la vue qu'un Chef de Département n'a jamais,
  // limité lui à son seul département. Même formule "honnête" que le dashboard
  // Chef de Département : le dénominateur est le nombre de créneaux réellement
  // créés cette semaine (pas de total de séances prévues déclaré ailleurs).
  // Suivi de conformité pédagogique pour la semaine active (par département et formation)
  const conformiteSemaineCourante = useMemo(() => {
    return departements.map((d) => {
      const progressionsSemaine = progressionsSession.filter(
        (p) => p.matiereId === d.matiereId && Number(p.semaine) === Number(semaineCourante),
      );
      const seancesSemaine = (affectations ?? []).filter(
        (a) => a.matiereId === d.matiereId,
      );

      return {
        departementId: d.id,
        departementNom: d.nom,
        matiereId: d.matiereId,
        sansChef: !d.chefId,
        nbCoursSaisis: progressionsSemaine.length,
        nbSeancesPlanifiees: seancesSemaine.length,
        aJour: progressionsSemaine.length > 0,
      };
    });
  }, [departements, progressionsSession, affectations, semaineCourante]);

  const nbDepartementsAJour = conformiteSemaineCourante.filter((c) => c.aJour).length;
  const nbDepartementsEnAttente = conformiteSemaineCourante.length - nbDepartementsAJour;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Vue d&rsquo;ensemble Pédagogique
        </h1>
        <p className="text-sm text-slate-500">
          Supervision et conformité de l&rsquo;activité pédagogique du réseau
        </p>
      </div>

      {/* KPIs Opérationnels */}
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
            <span className="text-brand-gray font-medium">Corps enseignant du réseau</span>
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
            <span>Centres ouverts dans la session</span>
          </div>
        </Card>

        {/* KPI 3 : Créneaux sans prof */}
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10">
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
            en cours (S{semaineCourante})
          </p>
        </Card>

        {/* KPI 4 : Nombre de cours documentés */}
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Cours documentés
            </span>
            <div className="rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-2.5 text-brand-orange transition-transform duration-300 group-hover:scale-110">
              <ClipboardList size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-brand-anthracite mt-3 text-4xl font-extrabold tracking-tight">
            {progressionsSession.length}
          </div>
          <p className="text-brand-gray mt-2 text-xs font-medium">
            Toutes matières & filières confondues
          </p>
        </Card>
      </div>

      {/* Suivi Hebdomadaire des Progressions (Semaine Active) */}
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange text-xs font-black text-white">
                S{semaineCourante}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Conformité Hebdomadaire des Progressions
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              État de remplissage du syllabus par département pour la semaine en cours (Semaine {semaineCourante})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {nbDepartementsAJour} à jour
            </span>
            {nbDepartementsEnAttente > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                {nbDepartementsEnAttente} en attente
              </span>
            )}
            <Link
              href="/progression"
              className="bg-brand-orange hover:bg-brand-orange/90 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <span>Ouvrir la Progression</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {departements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-xs text-slate-500">
              Aucun département créé pour l&rsquo;instant.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Département / Discipline</th>
                  <th className="p-3 text-center">Séances planifiées</th>
                  <th className="p-3 text-center">Cours documentés (S{semaineCourante})</th>
                  <th className="p-3 text-center">Statut Semaine {semaineCourante}</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conformiteSemaineCourante.map((item) => (
                  <tr key={item.departementId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {item.departementNom}
                        </span>
                        {item.sansChef && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Sans chef
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-700">
                      {item.nbSeancesPlanifiees > 0 ? (
                        <span>{item.nbSeancesPlanifiees} créneau{item.nbSeancesPlanifiees > 1 ? "x" : ""}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-mono font-bold px-2.5 py-1 rounded-lg ${
                        item.nbCoursSaisis > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.nbCoursSaisis} cours saisi{item.nbCoursSaisis > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.aJour ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          À jour
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          En attente de saisie
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href="/progression"
                        className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
                      >
                        Consulter
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
