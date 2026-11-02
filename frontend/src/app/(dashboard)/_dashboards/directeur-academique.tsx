"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UserRound,
  Users,
  AlertTriangle,
  ClipboardList,
  Building2,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";

import { Card, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";
import { useEnseignants } from "@/modules/personnel";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useAffectations } from "@/modules/affectation";
import { useDepartements } from "@/modules/departement";
import { useRostersDepartements } from "@/modules/affectation-departementale";
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
  const { data: departements = [] } = useDepartements();

  const departementIds = useMemo(
    () => departements.map((d) => d.id),
    [departements],
  );
  const { data: rosters = [], isLoading: chargementRosters } = useRostersDepartements(
    departementIds,
    sessionActive?.id,
  );

  const centresActifs = centres?.filter(
    (c) =>
      c.statut === "OUVERT" &&
      sessionActive &&
      c.sessionIds.includes(sessionActive.id),
  ).length;

  const totalEnseignants = enseignants?.length ?? 0;
  const enseignantsActifs = enseignants?.filter((e) => e.statut === "ACTIF").length ?? 0;
  const enseignantsSuspendus = totalEnseignants - enseignantsActifs;

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

  // Enseignants mobilisés / rattachés à la session courante (roster départemental ou affectations de créneaux)
  const enseignantIdsSession = useMemo(() => {
    const ids = new Set<string>();
    (rosters ?? []).forEach((r) => {
      if (r.enseignantId) ids.add(r.enseignantId);
    });
    (affectations ?? []).forEach((a) => {
      if (a.enseignantId) ids.add(a.enseignantId);
    });
    return ids;
  }, [rosters, affectations]);

  // Nombre d'enseignants actifs dans la session en cours
  const enseignantsActifsSession = useMemo(() => {
    if (!enseignants) return 0;
    return enseignants.filter(
      (e) => enseignantIdsSession.has(e.id) && e.statut === "ACTIF",
    ).length;
  }, [enseignants, enseignantIdsSession]);

  // Données globales du réseau (tous les enseignants enregistrés)
  const totalEnseignantsReseau = enseignants?.length ?? 0;
  const totalEnseignantsActifsReseau =
    enseignants?.filter((e) => e.statut === "ACTIF").length ?? 0;
  const totalEnseignantsSuspendusReseau =
    enseignants?.filter((e) => e.statut === "SUSPENDU").length ?? 0;

  const departementsParEnseignant = useMemo(() => {
    const map = new Map<string, string[]>();
    rosters.forEach((r) => {
      const dep = departements.find((d) => d.id === r.departementId);
      if (dep) {
        const existants = map.get(r.enseignantId) ?? [];
        if (!existants.includes(dep.nom)) {
          existants.push(dep.nom);
          map.set(r.enseignantId, existants);
        }
      }
    });
    return map;
  }, [rosters, departements]);

  const enseignantsAffiches = useMemo(() => {
    if (!enseignants) return [];
    const tries = [...enseignants].sort((a, b) => {
      const aInSession = enseignantIdsSession.has(a.id) ? 1 : 0;
      const bInSession = enseignantIdsSession.has(b.id) ? 1 : 0;
      if (aInSession !== bInSession) return bInSession - aInSession;
      return a.nom.localeCompare(b.nom);
    });
    return tries.slice(0, 8);
  }, [enseignants, enseignantIdsSession]);

  // Tris des tableaux
  type TriConformiteColonne = "departement" | "seances" | "cours" | "statut";
  const [triConformiteColonne, setTriConformiteColonne] = useState<TriConformiteColonne>("departement");
  const [triConformiteDirection, setTriConformiteDirection] = useState<SortDirection>("asc");

  function handleTriConformite(colonne: TriConformiteColonne) {
    if (triConformiteColonne === colonne) {
      setTriConformiteDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriConformiteColonne(colonne);
      setTriConformiteDirection(colonne === "departement" ? "asc" : "desc");
    }
  }

  const conformiteTriees = useMemo(() => {
    return [...conformiteSemaineCourante].sort((a, b) => {
      let res = 0;
      switch (triConformiteColonne) {
        case "departement":
          res = compareStrings(a.departementNom, b.departementNom);
          break;
        case "seances":
          res = compareNumbers(a.nbSeancesPlanifiees, b.nbSeancesPlanifiees);
          break;
        case "cours":
          res = compareNumbers(a.nbCoursSaisis, b.nbCoursSaisis);
          break;
        case "statut":
          res = Number(a.aJour) - Number(b.aJour);
          break;
      }
      return triConformiteDirection === "asc" ? res : -res;
    });
  }, [conformiteSemaineCourante, triConformiteColonne, triConformiteDirection]);

  type TriEnseignantCol = "nom" | "matricule" | "departements" | "statut";
  const [triEnseignantCol, setTriEnseignantCol] = useState<TriEnseignantCol>("nom");
  const [triEnseignantDir, setTriEnseignantDir] = useState<SortDirection>("asc");

  function handleTriEnseignant(colonne: TriEnseignantCol) {
    if (triEnseignantCol === colonne) {
      setTriEnseignantDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriEnseignantCol(colonne);
      setTriEnseignantDir("asc");
    }
  }

  const enseignantsAffichesTries = useMemo(() => {
    return [...enseignantsAffiches].sort((a, b) => {
      let res = 0;
      switch (triEnseignantCol) {
        case "nom":
          res = compareStrings(a.nom + " " + a.prenom, b.nom + " " + b.prenom);
          break;
        case "matricule":
          res = compareStrings(a.matricule || "", b.matricule || "");
          break;
        case "departements": {
          const depsA = departementsParEnseignant.get(a.id)?.join(", ") || "";
          const depsB = departementsParEnseignant.get(b.id)?.join(", ") || "";
          res = compareStrings(depsA, depsB);
          break;
        }
        case "statut":
          res = compareStrings(a.statut, b.statut);
          break;
      }
      return triEnseignantDir === "asc" ? res : -res;
    });
  }, [enseignantsAffiches, triEnseignantCol, triEnseignantDir, departementsParEnseignant]);

  return (
    <div className="w-full space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-anthracite">
            Vue d&rsquo;ensemble Pédagogique
          </h1>
          <p className="text-sm text-brand-gray">
            Supervision et conformité de l&rsquo;activité pédagogique du réseau
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/personnel"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-gray/20 bg-white px-3.5 py-2 text-xs font-bold text-brand-anthracite shadow-xs hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            <Users size={16} className="text-brand-orange" />
            <span>Personnel & Accès</span>
          </Link>
          <Link
            href="/livres"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-gray/20 bg-white px-3.5 py-2 text-xs font-bold text-brand-anthracite shadow-xs hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            <BookOpen size={16} className="text-brand-orange" />
            <span>Gérer les Livres & Supports</span>
          </Link>
        </div>
      </div>

      {/* KPIs Opérationnels */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* KPI 1 : Enseignants en session (Actifs) */}
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                Enseignants en session
              </span>
              <div className="bg-orange-50 text-brand-orange rounded-xl p-2.5 ring-1 ring-orange-500/10">
                <UserRound size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-slate-900 text-3xl font-black tracking-tight tabular-nums">
                {chargementEnseignants || chargementRosters
                  ? "…"
                  : (sessionActive ? enseignantsActifsSession : PLACEHOLDER)}
              </span>
              {enseignantsActifsSession > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  actif{enseignantsActifsSession > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
                  aucun affecté
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Session {sessionActive?.annee ?? "en cours"}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">
              Total réseau : <strong className="text-slate-800 font-bold">{chargementEnseignants ? "…" : totalEnseignantsReseau}</strong>
            </span>
            <Link
              href="/enseignants"
              className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5"
            >
              <span>Annuaire</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </Card>

        {/* KPI 2 : Centres Actifs */}
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                Centres actifs
              </span>
              <div className="bg-slate-100 text-slate-700 rounded-xl p-2.5">
                <Building2 size={18} />
              </div>
            </div>
            <div className="text-slate-900 mt-3 text-3xl font-black tracking-tight tabular-nums">
              {chargementCentres ? "…" : (centresActifs ?? PLACEHOLDER)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Centres ouverts dans la session
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Réseau national EXCELIS
          </div>
        </Card>

        {/* KPI 3 : Créneaux sans prof */}
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                Créneaux sans prof
              </span>
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600 ring-1 ring-red-200">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-red-600 tabular-nums">
              {chargementAffectations ? "…" : (creneauxNonAssignes ?? 0)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Semaine {semaineCourante} en cours
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">À affecter d&rsquo;urgence</span>
            <Link href="/planification" className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5">
              <span>Planning</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </Card>

        {/* KPI 4 : Nombre de cours documentés */}
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                Cours documentés
              </span>
              <div className="rounded-xl bg-orange-50 p-2.5 text-brand-orange ring-1 ring-orange-500/10">
                <ClipboardList size={18} />
              </div>
            </div>
            <div className="text-slate-900 mt-3 text-3xl font-black tracking-tight tabular-nums">
              {progressionsSession.length}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Syllabus renseignés (session)
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Toutes matières</span>
            <Link href="/progression" className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5">
              <span>Progression</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
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
              <h2 className="text-base sm:text-lg font-extrabold text-brand-anthracite">
                Conformité Hebdomadaire des Progressions
              </h2>
            </div>
            <p className="text-xs text-brand-gray">
              État de remplissage du syllabus par département pour la semaine en cours (Semaine {semaineCourante})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-xs font-bold text-brand-anthracite">
              {nbDepartementsAJour} à jour
            </span>
            {nbDepartementsEnAttente > 0 && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
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
            <p className="text-xs text-brand-gray">
              Aucun département créé pour l&rsquo;instant.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider text-brand-gray uppercase">
                <tr>
                  <SortableHeader
                    label="Département / Discipline"
                    columnKey="departement"
                    currentSortColumn={triConformiteColonne}
                    currentSortDirection={triConformiteDirection}
                    onSort={handleTriConformite}
                    align="left"
                  />
                  <SortableHeader
                    label="Séances planifiées"
                    columnKey="seances"
                    currentSortColumn={triConformiteColonne}
                    currentSortDirection={triConformiteDirection}
                    onSort={handleTriConformite}
                    align="center"
                  />
                  <SortableHeader
                    label={`Cours documentés (S${semaineCourante})`}
                    columnKey="cours"
                    currentSortColumn={triConformiteColonne}
                    currentSortDirection={triConformiteDirection}
                    onSort={handleTriConformite}
                    align="center"
                  />
                  <SortableHeader
                    label={`Statut Semaine ${semaineCourante}`}
                    columnKey="statut"
                    currentSortColumn={triConformiteColonne}
                    currentSortDirection={triConformiteDirection}
                    onSort={handleTriConformite}
                    align="center"
                  />
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conformiteTriees.map((item) => (
                  <tr key={item.departementId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-anthracite">
                          {item.departementNom}
                        </span>
                        {item.sansChef && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-brand-gray">
                            Sans chef
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-semibold text-brand-anthracite">
                      {item.nbSeancesPlanifiees > 0 ? (
                        <span>{item.nbSeancesPlanifiees} créneau{item.nbSeancesPlanifiees > 1 ? "x" : ""}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold px-2.5 py-1 rounded-lg ${
                        item.nbCoursSaisis > 0
                          ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                          : "bg-slate-100 text-brand-gray"
                      }`}>
                        {item.nbCoursSaisis} cours saisi{item.nbCoursSaisis > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.aJour ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-brand-anthracite border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                          À jour
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          En attente de saisie
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href="/progression"
                        className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 inline-flex items-center gap-1"
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

      {/* ── Section Enseignants du Réseau (Placée plus bas) ── */}
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-brand-orange">
                <Users size={16} />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-anthracite">
                Enseignants du Réseau & Session
              </h2>
            </div>
            <p className="text-xs text-brand-gray">
              {enseignantsActifsSession} actif{enseignantsActifsSession > 1 ? "s" : ""} dans la session en cours · {totalEnseignantsReseau} enseignant{totalEnseignantsReseau > 1 ? "s" : ""} au total dans l&rsquo;annuaire du réseau
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 ${
              enseignantsActifsSession > 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                enseignantsActifsSession > 0 ? "bg-emerald-500" : "bg-slate-400"
              }`} />
              {enseignantsActifsSession} en session
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
              {totalEnseignantsReseau} dans le réseau
            </span>
            <Link
              href="/enseignants"
              className="bg-brand-orange hover:bg-brand-orange/90 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <span>Accéder à l&rsquo;annuaire complet</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {chargementEnseignants ? (
          <div className="p-6 text-center text-xs text-brand-gray">
            Chargement des enseignants...
          </div>
        ) : !enseignants || enseignants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-xs text-brand-gray">
              Aucun enseignant enregistré dans le réseau pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider text-brand-gray uppercase">
                  <tr>
                    <SortableHeader
                      label="Enseignant"
                      columnKey="nom"
                      currentSortColumn={triEnseignantCol}
                      currentSortDirection={triEnseignantDir}
                      onSort={handleTriEnseignant}
                      align="left"
                    />
                    <SortableHeader
                      label="Matricule"
                      columnKey="matricule"
                      currentSortColumn={triEnseignantCol}
                      currentSortDirection={triEnseignantDir}
                      onSort={handleTriEnseignant}
                      align="left"
                    />
                    <SortableHeader
                      label="Département(s) session"
                      columnKey="departements"
                      currentSortColumn={triEnseignantCol}
                      currentSortDirection={triEnseignantDir}
                      onSort={handleTriEnseignant}
                      align="left"
                    />
                    <SortableHeader
                      label="Statut réseau"
                      columnKey="statut"
                      currentSortColumn={triEnseignantCol}
                      currentSortDirection={triEnseignantDir}
                      onSort={handleTriEnseignant}
                      align="center"
                    />
                    <th className="p-3 text-right">Fiche</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enseignantsAffichesTries.map((e) => {
                    const deps = departementsParEnseignant.get(e.id) ?? [];
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs shrink-0">
                              {(e.prenom?.[0] || "") + (e.nom?.[0] || "")}
                            </div>
                            <div>
                              <div className="font-bold text-brand-anthracite">
                                {e.prenom} {e.nom}
                              </div>
                              {e.telephone && (
                                <div className="text-[11px] text-slate-400">
                                  {e.telephone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-600">
                          {e.matricule}
                        </td>
                        <td className="p-3">
                          {deps.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {deps.map((depNom) => (
                                <span
                                  key={depNom}
                                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200/80"
                                >
                                  {depNom}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Non rattaché à la session</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {e.statut === "ACTIF" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                              Suspendu
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/enseignants/${e.id}`}
                            className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 inline-flex items-center gap-1"
                          >
                            Consulter
                            <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {enseignants.length > 8 && (
              <div className="text-center pt-1">
                <Link
                  href="/enseignants"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
                >
                  <span>Voir l&rsquo;ensemble des {enseignants.length} enseignants du réseau</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
