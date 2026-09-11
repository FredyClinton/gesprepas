"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Layers,
  Plus,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Building2,
  Search,
  CalendarRange,
  ChevronRight,
  Sparkles,
  Copy,
  FileText,
  CheckCircle2,
} from "lucide-react";

import { Card } from "@/shared/ui";
import { useSessionActive } from "@/modules/centres-sessions";
import { useDepartement, useDepartements } from "@/modules/departement";
import {
  useAffectations,
  useAffectationsMultiMatiere,
} from "@/modules/affectation";
import { useFormations, type Formation } from "@/modules/academique";
import { useMatieres } from "@/modules/matieres";
import { useSalles } from "@/modules/salle";
import {
  useProgressions,
  useSupprimerProgression,
  ProgressionFormModal,
  JournalProgression,
  SyllabusFiliereView,
  SyllabusMultiMatieresView,
  SaisieLotModal,
  DupliquerSyllabusModal,
  construireMappingAffectationsProgressions,
  type Progression,
  type PrefillProgression,
} from "@/modules/progression";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

type Props =
  | { role: "CHEF_DEPARTEMENT"; departementId: string | null; chefId?: string }
  | { role: "DIRECTEUR_ACADEMIQUE" };

const TOUS_DEPARTEMENTS_VALEUR = "__TOUS__";

export function ProgressionView(props: Props) {
  if (props.role === "CHEF_DEPARTEMENT") {
    return (
      <ProgressionChefDepartement
        departementId={props.departementId}
        chefId={props.chefId}
      />
    );
  }
  return <ProgressionDirecteurAcademique />;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHEF DE DÉPARTEMENT
// ─────────────────────────────────────────────────────────────────────────────

function ProgressionChefDepartement({
  departementId,
  chefId,
}: {
  departementId: string | null;
  chefId?: string;
}) {
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: departements = [] } = useDepartements();
  const { data: formations = [] } = useFormations();
  const { data: salles = [] } = useSalles(sessionId);
  const { data: toutesProgressions = [] } = useProgressions();

  const mesDepartements = useMemo(() => {
    if (!departements.length) return [];
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

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const vueTousDepartements =
    selectedDeptId === TOUS_DEPARTEMENTS_VALEUR && mesDepartements.length > 1;

  const departementEffectifId = useMemo(() => {
    if (vueTousDepartements) return undefined;
    if (
      selectedDeptId &&
      mesDepartements.some((d) => d.id === selectedDeptId)
    ) {
      return selectedDeptId;
    }
    if (mesDepartements.length > 0) return mesDepartements[0].id;
    return departementId ?? undefined;
  }, [vueTousDepartements, selectedDeptId, mesDepartements, departementId]);

  const { data: departementUnique } = useDepartement(
    vueTousDepartements ? undefined : departementEffectifId,
  );

  const { data: matieres = [] } = useMatieres();

  const matiereActiveNom = useMemo(() => {
    const mId = departementUnique?.matiereId ?? mesDepartements[0]?.matiereId;
    const found = matieres.find((m) => m.id === mId);
    return found?.nom ?? departementUnique?.nom ?? "MATHEMATIQUES";
  }, [departementUnique, mesDepartements, matieres]);

  const matiereIds = useMemo(
    () => (vueTousDepartements ? mesDepartements.map((d) => d.matiereId) : []),
    [vueTousDepartements, mesDepartements],
  );

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  const { data: affectationsUnDept = [] } = useAffectations({
    sessionId:
      !vueTousDepartements && departementUnique ? sessionId : undefined,
    semaine: semaineCourante,
    matiereId: departementUnique?.matiereId,
  });
  const { data: affectationsTousDept } = useAffectationsMultiMatiere({
    sessionId: vueTousDepartements ? sessionId : undefined,
    semaine: semaineCourante,
    matiereIds,
  });
  const affectations = useMemo(
    () =>
      vueTousDepartements ? (affectationsTousDept ?? []) : affectationsUnDept,
    [vueTousDepartements, affectationsTousDept, affectationsUnDept],
  );

  const matiereIdsActifs = useMemo(
    () =>
      vueTousDepartements
        ? matiereIds
        : departementUnique
          ? [departementUnique.matiereId]
          : [],
    [vueTousDepartements, matiereIds, departementUnique],
  );

  const progressionsPerimetre = useMemo(() => {
    if (!sessionId || matiereIdsActifs.length === 0) return [];
    return toutesProgressions.filter(
      (p) =>
        matiereIdsActifs.includes(p.matiereId) && p.sessionId === sessionId,
    );
  }, [toutesProgressions, matiereIdsActifs, sessionId]);

  const formationsPerimetre = useMemo(() => {
    if (matiereIdsActifs.length === 0) return [];
    return formations.filter((f) =>
      f.matiereIds?.some((mId) => matiereIdsActifs.includes(mId)),
    );
  }, [formations, matiereIdsActifs]);

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

  const statsProgressionParFormation = useMemo(() => {
    return formationsPerimetre.map((f) => {
      const seances = affectations.filter((a) => a.formationId === f.id);
      const progressionsFormation = progressionsPerimetre.filter(
        (p) => p.formationId === f.id,
      );
      const totalPrevu = seances.length;
      const effectuees = seances.filter((a) => a.statut === "EFFECTUEE").length;
      const dispensees = progressionsFormation.length;
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
          progressionsFormation[progressionsFormation.length - 1]?.theme,
      };
    });
  }, [formationsPerimetre, affectations, progressionsPerimetre]);


  const [filtreFormation, setFiltreFormation] = useState("TOUTES");
  const [rechercheJournal, setRechercheJournal] = useState("");

  const progressionsFiltreesJournal = useMemo(() => {
    let list = progressionsPerimetre;
    if (filtreFormation !== "TOUTES") {
      list = list.filter((p) => p.formationId === filtreFormation);
    }
    if (rechercheJournal.trim()) {
      const q = rechercheJournal.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.theme.toLowerCase().includes(q) ||
          p.contenu.toLowerCase().includes(q) ||
          (p.exercices && p.exercices.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [progressionsPerimetre, filtreFormation, rechercheJournal]);

  const [modalOuvert, setModalOuvert] = useState(false);
  const [progressionEnEdition, setProgressionEnEdition] =
    useState<Progression | null>(null);
  const [prefill, setPrefill] = useState<PrefillProgression | undefined>(
    undefined,
  );
  const [modeVue, setModeVue] = useState<"syllabus" | "journal">("syllabus");
  const [filiereActiveId, setFiliereActiveId] = useState<string>("");
  const [saisieLotOuverte, setSaisieLotOuverte] = useState(false);
  const [duplicationOuverte, setDuplicationOuverte] = useState(false);

  const supprimerMutation = useSupprimerProgression();

  const formationSelectionnee = useMemo(() => {
    if (formationsPerimetre.length === 0) return null;
    return (
      formationsPerimetre.find((f) => f.id === filiereActiveId) ??
      formationsPerimetre[0]
    );
  }, [formationsPerimetre, filiereActiveId]);

  const progressionsFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return [];
    return progressionsPerimetre.filter(
      (p) => p.formationId === formationSelectionnee.id,
    );
  }, [progressionsPerimetre, formationSelectionnee]);

  const affectationsFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return [];
    return affectations.filter(
      (a) => a.formationId === formationSelectionnee.id,
    );
  }, [affectations, formationSelectionnee]);

  const phaseIdFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return "";
    const salle = salles.find((s) => s.formationId === formationSelectionnee.id);
    return (
      salle?.phaseId ||
      progressionsFiliereActive[0]?.phaseId ||
      salles[0]?.phaseId ||
      ""
    );
  }, [formationSelectionnee, salles, progressionsFiliereActive]);

  const statsParFormationId = useMemo(() => {
    const map = new Map<string, (typeof statsProgressionParFormation)[0]>();
    statsProgressionParFormation.forEach((s) => map.set(s.formationId, s));
    return map;
  }, [statsProgressionParFormation]);

  function ouvrirAjout(pf?: PrefillProgression) {
    setProgressionEnEdition(null);
    setPrefill(pf);
    setModalOuvert(true);
  }
  function ouvrirEdition(p: Progression) {
    setProgressionEnEdition(p);
    setPrefill(undefined);
    setModalOuvert(true);
  }
  async function supprimer(p: Progression) {
    if (!window.confirm(`Supprimer l'entrée "${p.theme}" ?`)) return;
    await supprimerMutation.mutateAsync(p.id);
  }

  const matiereIdFixePourModale = vueTousDepartements
    ? undefined
    : departementUnique?.matiereId;

  const matieresPourModale = vueTousDepartements
    ? mesDepartements.map((d) => ({ id: d.matiereId, nom: d.nom }))
    : undefined;


  if (mesDepartements.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-xs">
          <Building2 size={36} className="mx-auto text-amber-600 mb-3" />
          <h2 className="text-lg font-bold text-amber-950">
            Aucun département rattaché
          </h2>
          <p className="mt-1 text-sm text-amber-800/90">
            Votre compte n&rsquo;a pas encore de département assigné pour cette session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── En-tête de page moderne ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Progression Pédagogique
            </h1>
            {sessionActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                <CalendarRange size={12} className="text-slate-400" />
                Session {sessionActive.annee}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Suivi du syllabus, validation des leçons dispensées et archivage des
            exercices traités.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de département (multi-départements) */}
          {mesDepartements.length > 1 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
              <Building2 size={14} className="text-slate-400" />
              <select
                value={
                  vueTousDepartements
                    ? TOUS_DEPARTEMENTS_VALEUR
                    : departementEffectifId
                }
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="cursor-pointer bg-transparent text-xs font-bold text-slate-800 outline-none"
              >
                {mesDepartements.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-slate-800">
                    {d.nom}
                  </option>
                ))}
                <option value={TOUS_DEPARTEMENTS_VALEUR} className="bg-white text-slate-800">
                  Tous mes départements ({mesDepartements.length})
                </option>
              </select>
            </div>
          )}

          {/* Boutons d'action rapides */}
          <button
            type="button"
            onClick={() => setDuplicationOuverte(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Copier le programme d'une filière vers une autre"
          >
            <Copy size={15} className="text-slate-500" />
            <span>Dupliquer</span>
          </button>

          <button
            type="button"
            onClick={() => setSaisieLotOuverte(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer"
            title="Saisir ou importer plusieurs thèmes en lot"
          >
            <Sparkles size={15} className="text-amber-500" />
            <span>Saisie en lot</span>
          </button>

          {/* Bouton principal : Nouveau cours */}
          <button
            type="button"
            onClick={() =>
              ouvrirAjout(
                formationSelectionnee
                  ? {
                      formationId: formationSelectionnee.id,
                      matiereId: departementUnique?.matiereId,
                      semaine: semaineCourante,
                      numeroCours: 1,
                    }
                  : undefined,
              )
            }
            className="bg-brand-orange hover:bg-brand-orange/90 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-2xs transition-all hover:shadow-md cursor-pointer"
          >
            <Plus size={16} />
            <span>Nouveau cours</span>
          </button>
        </div>
      </div>



      {/* ── Navigation Filières & Commutateur de Mode ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        {/* Onglets des filières (en mode syllabus) */}
        {modeVue === "syllabus" ? (
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-xl scrollbar-none">
            {formationsPerimetre.map((f) => {
              const stats = statsParFormationId.get(f.id);
              const totalDocs = stats?.dispensees ?? 0;
              const pct = stats?.pourcentage ?? 0;
              const actif = (formationSelectionnee?.id ?? "") === f.id;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiliereActiveId(f.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    actif
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{f.nom}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      actif
                        ? "bg-orange-100 text-brand-orange"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {totalDocs} cours · {pct}%
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Layers size={15} className="text-brand-orange" />
            <span>Vue d&rsquo;ensemble chronologique multi-filières</span>
          </div>
        )}

        {/* Commutateur Syllabus / Journal */}
        <div className="inline-flex rounded-xl bg-slate-100/80 p-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModeVue("syllabus")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              modeVue === "syllabus"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen
              size={13}
              className={modeVue === "syllabus" ? "text-brand-orange" : "text-slate-400"}
            />
            <span>Syllabus par Filière</span>
          </button>
          <button
            type="button"
            onClick={() => setModeVue("journal")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              modeVue === "journal"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers
              size={13}
              className={modeVue === "journal" ? "text-brand-orange" : "text-slate-400"}
            />
            <span>Journal Chronologique</span>
          </button>
        </div>
      </div>

      {/* ── VUE 1 : SYLLABUS PAR FILIÈRE (MODERNE, STRUCTURÉ, ÉDITION INLINE) ── */}
      {modeVue === "syllabus" && (
        <div className="space-y-4">
          {formationSelectionnee && (
            <SyllabusFiliereView
              formationId={formationSelectionnee.id}
              formationNom={formationSelectionnee.nom}
              matiereId={
                departementUnique?.matiereId ??
                (mesDepartements[0]?.matiereId || "")
              }
              matiereNom={matiereActiveNom}
              sessionId={sessionId!}
              phaseId={phaseIdFiliereActive}
              sessionAnnee={sessionActive?.annee?.toString() ?? "2026"}
              progressions={progressionsFiliereActive}
              affectations={affectationsFiliereActive}
              onSupprimer={supprimer}
              onOuvrirSaisieLot={() => setSaisieLotOuverte(true)}
              onOuvrirDuplication={() => setDuplicationOuverte(true)}
            />
          )}
        </div>
      )}

      {/* ── VUE 2 : JOURNAL CHRONOLOGIQUE GLOBAL & RECHERCHE ── */}
      {modeVue === "journal" && (
        <div className="space-y-6">
          {/* Cartes d'Avancement par Filière */}
          {statsProgressionParFormation.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <BookOpen size={17} className="text-brand-orange" />
                  <span>Avancement par Filière</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {statsProgressionParFormation.length}
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statsProgressionParFormation.map((item) => (
                  <div
                    key={item.formationId}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-slate-600 uppercase">
                            Filière
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            {item.formationNom}
                          </h3>
                        </div>
                        <span className="font-mono text-2xl font-black text-slate-900">
                          {item.pourcentage}%
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-3.5 space-y-1.5">
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
                        <div className="flex justify-between text-[11px] font-medium text-slate-500">
                          <span>{item.effectuees} séance(s) effectuée(s)</span>
                          <span>{item.totalPrevu} prévue(s)</span>
                        </div>
                      </div>

                      {/* Dernier thème abordé */}
                      <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
                        <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">
                          Dernier thème au syllabus :
                        </span>
                        {item.dernierTheme ? (
                          <p className="line-clamp-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 font-medium text-slate-800">
                            {item.dernierTheme}
                          </p>
                        ) : (
                          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 text-[11px] text-slate-400 italic">
                            Aucun thème saisi pour le moment
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100/80 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          ouvrirAjout({
                            formationId: item.formationId,
                            matiereId: matiereIdFixePourModale,
                            semaine: semaineCourante,
                            numeroCours: item.effectuees + 1,
                          })
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-brand-orange hover:bg-orange-50/50 hover:text-brand-orange cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Ajouter une entrée pour cette filière</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Journal Chronologique Épuré */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">
                  Journal des Thèmes &amp; Contenus Enregistrés
                </h3>
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  {progressionsFiltreesJournal.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Recherche en temps réel */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={rechercheJournal}
                    onChange={(e) => setRechercheJournal(e.target.value)}
                    placeholder="Rechercher un thème..."
                    className="w-48 sm:w-56 rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                {/* Filtre par formation */}
                {formationsPerimetre.length > 0 && (
                  <select
                    value={filtreFormation}
                    onChange={(e) => setFiltreFormation(e.target.value)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                  >
                    <option value="TOUTES" className="bg-white text-slate-800">
                      Toutes les formations
                    </option>
                    {formationsPerimetre.map((f) => (
                      <option
                        key={f.id}
                        value={f.id}
                        className="bg-white text-slate-800"
                      >
                        {f.nom}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <JournalProgression
              progressions={progressionsFiltreesJournal}
              formationsParId={formationsParId}
              departementsParMatiereId={
                vueTousDepartements ? departementsParMatiereId : undefined
              }
              onModifier={ouvrirEdition}
              onSupprimer={supprimer}
              pageSize={10}
            />
          </div>
        </div>
      )}

      {sessionId && (
        <>
          <ProgressionFormModal
            isOpen={modalOuvert}
            onClose={() => setModalOuvert(false)}
            sessionId={sessionId}
            formations={formations}
            salles={salles}
            matiereIdFixe={matiereIdFixePourModale}
            matieres={matieresPourModale}
            prefill={prefill}
            progressionExistante={progressionEnEdition ?? undefined}
            progressionsExistantes={toutesProgressions}
          />

          {formationSelectionnee && (
            <SaisieLotModal
              isOpen={saisieLotOuverte}
              onClose={() => setSaisieLotOuverte(false)}
              formationId={formationSelectionnee.id}
              formationNom={formationSelectionnee.nom}
              matiereId={
                departementUnique?.matiereId ??
                (mesDepartements[0]?.matiereId || "")
              }
              sessionId={sessionId}
              phaseId={phaseIdFiliereActive}
              coursExistants={progressionsFiliereActive}
            />
          )}

          {formationSelectionnee && (
            <DupliquerSyllabusModal
              isOpen={duplicationOuverte}
              onClose={() => setDuplicationOuverte(false)}
              formationActuelleId={formationSelectionnee.id}
              formationActuelleNom={formationSelectionnee.nom}
              formations={formations}
              salles={salles}
              matiereId={
                departementUnique?.matiereId ??
                (mesDepartements[0]?.matiereId || "")
              }
              sessionId={sessionId}
              toutesProgressions={toutesProgressions}
            />
          )}
        </>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTEUR ACADÉMIQUE
// ─────────────────────────────────────────────────────────────────────────────

function ProgressionDirecteurAcademique() {
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: departements = [] } = useDepartements();
  const { data: formations = [] } = useFormations();
  const { data: matieres = [] } = useMatieres();
  const { data: salles = [] } = useSalles(sessionId);
  const { data: toutesProgressions = [] } = useProgressions();

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  // Le DA consulte l'ensemble des affectations de la session
  const { data: affectations = [] } = useAffectations({
    sessionId,
    semaine: semaineCourante,
    matiereId: undefined,
  });

  const formationsParId = useMemo(() => {
    const map = new Map<string, string>();
    formations.forEach((f: Formation) => map.set(f.id, f.nom));
    return map;
  }, [formations]);

  const departementsParMatiereId = useMemo(() => {
    const map = new Map<string, string>();
    departements.forEach((d) => map.set(d.matiereId, d.nom));
    return map;
  }, [departements]);

  const progressionsSession = useMemo(() => {
    if (!sessionId) return [];
    return toutesProgressions.filter((p) => p.sessionId === sessionId);
  }, [toutesProgressions, sessionId]);


  // Statistiques de progression par filière
  const statsProgressionParFormation = useMemo(() => {
    return formations.map((f) => {
      const seances = affectations.filter((a) => a.formationId === f.id);
      const progressionsFormation = progressionsSession.filter(
        (p) => p.formationId === f.id,
      );
      const totalPrevu = seances.length;
      const effectuees = seances.filter((a) => a.statut === "EFFECTUEE").length;
      const dispensees = progressionsFormation.length;
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
          progressionsFormation[progressionsFormation.length - 1]?.theme,
      };
    });
  }, [formations, affectations, progressionsSession]);

  const statsParFormationId = useMemo(() => {
    const map = new Map<string, (typeof statsProgressionParFormation)[0]>();
    statsProgressionParFormation.forEach((s) => map.set(s.formationId, s));
    return map;
  }, [statsProgressionParFormation]);

  // Statistiques de couverture par département
  const statsProgressionParDepartement = useMemo(() => {
    return departements.map((d) => {
      const seancesDuDepartement = affectations.filter(
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


  // Filière active
  const [filiereActiveId, setFiliereActiveId] = useState<string>("");
  const formationSelectionnee = useMemo(() => {
    return (
      formations.find((f) => f.id === filiereActiveId) ||
      formations[0] ||
      null
    );
  }, [formations, filiereActiveId]);

  // Matières de la filière active (toutes les colonnes du tableau multi-matières)
  const matieresFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return [];
    if (
      formationSelectionnee.matiereIds &&
      formationSelectionnee.matiereIds.length > 0
    ) {
      return matieres.filter((m) =>
        formationSelectionnee.matiereIds!.includes(m.id),
      );
    }
    // Déduction automatique à partir des affectations et progressions de la filière
    const mIds = new Set<string>();
    affectations
      .filter((a) => a.formationId === formationSelectionnee.id)
      .forEach((a) => mIds.add(a.matiereId));
    progressionsSession
      .filter((p) => p.formationId === formationSelectionnee.id)
      .forEach((p) => mIds.add(p.matiereId));
    const match = matieres.filter((m) => mIds.has(m.id));
    return match.length > 0 ? match : matieres;
  }, [formationSelectionnee, matieres, affectations, progressionsSession]);

  const progressionsFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return [];
    return progressionsSession.filter(
      (p) => p.formationId === formationSelectionnee.id,
    );
  }, [progressionsSession, formationSelectionnee]);

  const affectationsFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return [];
    return affectations.filter(
      (a) => a.formationId === formationSelectionnee.id,
    );
  }, [affectations, formationSelectionnee]);

  const phaseIdFiliereActive = useMemo(() => {
    if (!formationSelectionnee) return "";
    const salle = salles.find((s) => s.formationId === formationSelectionnee.id);
    return (
      salle?.phaseId ||
      progressionsFiliereActive[0]?.phaseId ||
      salles[0]?.phaseId ||
      ""
    );
  }, [formationSelectionnee, salles, progressionsFiliereActive]);

  // Commutateur de Mode : Syllabus Multi-Matières (Tableau officiel), Journal, ou Synthèse Départements
  const [modeVue, setModeVue] = useState<"syllabus" | "journal" | "departements">(
    "syllabus",
  );

  // Journal recherche & filtres
  const [rechercheJournal, setRechercheJournal] = useState("");
  const [filtreFormationJournal, setFiltreFormationJournal] = useState("TOUTES");

  const progressionsFiltreesJournal = useMemo(() => {
    let list = progressionsSession;
    if (filtreFormationJournal !== "TOUTES") {
      list = list.filter((p) => p.formationId === filtreFormationJournal);
    }
    if (rechercheJournal.trim()) {
      const q = rechercheJournal.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.theme.toLowerCase().includes(q) ||
          p.contenu.toLowerCase().includes(q) ||
          (p.exercices && p.exercices.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [progressionsSession, filtreFormationJournal, rechercheJournal]);

  // Modales
  const [modalOuvert, setModalOuvert] = useState(false);
  const [progressionEnEdition, setProgressionEnEdition] =
    useState<Progression | null>(null);
  const [prefill, setPrefill] = useState<PrefillProgression | undefined>(
    undefined,
  );
  const [saisieLotOuverte, setSaisieLotOuverte] = useState(false);
  const [matierePourLot, setMatierePourLot] = useState<string>("");
  const [duplicationOuverte, setDuplicationOuverte] = useState(false);

  const supprimerMutation = useSupprimerProgression();

  function ouvrirAjout(p?: PrefillProgression) {
    setProgressionEnEdition(null);
    setPrefill(p);
    setModalOuvert(true);
  }

  function ouvrirEdition(p: Progression) {
    setProgressionEnEdition(p);
    setPrefill(undefined);
    setModalOuvert(true);
  }

  async function supprimer(p: Progression) {
    if (!window.confirm(`Supprimer l'entrée "${p.theme}" ?`)) return;
    await supprimerMutation.mutateAsync(p.id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* ── Navigation Filières & Commutateur de Mode ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        {/* Onglets des filières (en mode syllabus) */}
        {modeVue === "syllabus" ? (
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-xl scrollbar-none">
            {formations.map((f) => {
              const stats = statsParFormationId.get(f.id);
              const totalDocs = stats?.dispensees ?? 0;
              const pct = stats?.pourcentage ?? 0;
              const actif = (formationSelectionnee?.id ?? "") === f.id;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiliereActiveId(f.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    actif
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{f.nom}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      actif
                        ? "bg-orange-100 text-brand-orange"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {totalDocs} cours · {pct}%
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Layers size={15} className="text-brand-orange" />
            <span>
              {modeVue === "journal"
                ? "Vue d'ensemble chronologique multi-filières"
                : "Synthèse de la couverture par département"}
            </span>
          </div>
        )}

        {/* Commutateur de Mode : Syllabus Multi-Matières / Journal / Synthèse */}
        <div className="inline-flex rounded-xl bg-slate-100/80 p-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModeVue("syllabus")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              modeVue === "syllabus"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen
              size={13}
              className={modeVue === "syllabus" ? "text-brand-orange" : "text-slate-400"}
            />
            <span>Syllabus Multi-Matières</span>
          </button>

          <button
            type="button"
            onClick={() => setModeVue("journal")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              modeVue === "journal"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers
              size={13}
              className={modeVue === "journal" ? "text-brand-orange" : "text-slate-400"}
            />
            <span>Journal Chronologique</span>
          </button>

          <button
            type="button"
            onClick={() => setModeVue("departements")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              modeVue === "departements"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2
              size={13}
              className={modeVue === "departements" ? "text-brand-orange" : "text-slate-400"}
            />
            <span>Départements</span>
          </button>
        </div>
      </div>

      {/* ── VUE 1 : SYLLABUS MULTI-MATIÈRES FIDÈLE AU PAPIER EXCELIS PRÉPAS ── */}
      {modeVue === "syllabus" && formationSelectionnee && (
        <SyllabusMultiMatieresView
          formationId={formationSelectionnee.id}
          formationNom={formationSelectionnee.nom}
          matieres={matieresFiliereActive}
          progressions={progressionsFiliereActive}
          affectations={affectationsFiliereActive}
          sessionId={sessionId!}
          phaseId={phaseIdFiliereActive}
          sessionAnnee={sessionActive?.annee?.toString() ?? "2026"}
          onSupprimer={supprimer}
          onOuvrirSaisieLot={(mId) => {
            setMatierePourLot(mId || matieresFiliereActive[0]?.id || "");
            setSaisieLotOuverte(true);
          }}
          onOuvrirDuplication={() => setDuplicationOuverte(true)}
          onOuvrirAjout={() => ouvrirAjout()}
        />
      )}

      {/* ── VUE 2 : SYNTHÈSE COUVERTURE PAR DÉPARTEMENT ── */}
      {modeVue === "departements" && (
        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Building2 size={17} className="text-brand-orange" />
              <span>Couverture Pédagogique par Département</span>
            </h2>
          </div>

          {departements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Aucun département créé pour l&rsquo;instant.
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
                    <tr key={item.departementId} className="hover:bg-slate-50/60 transition-colors">
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
        </div>
      )}

      {/* ── VUE 3 : JOURNAL CHRONOLOGIQUE GLOBAL & RECHERCHE ── */}
      {modeVue === "journal" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">
                Journal des Thèmes &amp; Contenus Enregistrés
              </h3>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                {progressionsFiltreesJournal.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Recherche en temps réel */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={rechercheJournal}
                  onChange={(e) => setRechercheJournal(e.target.value)}
                  placeholder="Rechercher un thème..."
                  className="w-48 sm:w-56 rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>

              {/* Filtre par formation */}
              {formations.length > 0 && (
                <select
                  value={filtreFormationJournal}
                  onChange={(e) => setFiltreFormationJournal(e.target.value)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                >
                  <option value="TOUTES" className="bg-white text-slate-800">Toutes les filières</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id} className="bg-white text-slate-800">
                      {f.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <JournalProgression
            progressions={progressionsFiltreesJournal}
            formationsParId={formationsParId}
            departementsParMatiereId={departementsParMatiereId}
            onModifier={ouvrirEdition}
            onSupprimer={supprimer}
            pageSize={10}
          />
        </div>
      )}

      {/* ── Modales Actionnables ── */}
      {sessionId && formationSelectionnee && (
        <SaisieLotModal
          isOpen={saisieLotOuverte}
          onClose={() => setSaisieLotOuverte(false)}
          formationId={formationSelectionnee.id}
          formationNom={formationSelectionnee.nom}
          matiereId={matierePourLot || matieresFiliereActive[0]?.id || ""}
          sessionId={sessionId}
          phaseId={phaseIdFiliereActive}
          coursExistants={progressionsFiliereActive}
        />
      )}

      {sessionId && formationSelectionnee && (
        <DupliquerSyllabusModal
          isOpen={duplicationOuverte}
          onClose={() => setDuplicationOuverte(false)}
          formationActuelleId={formationSelectionnee.id}
          formationActuelleNom={formationSelectionnee.nom}
          formations={formations}
          salles={salles}
          matiereId={matierePourLot || matieresFiliereActive[0]?.id || ""}
          sessionId={sessionId}
          toutesProgressions={toutesProgressions}
        />
      )}

      {sessionId && (
        <ProgressionFormModal
          isOpen={modalOuvert}
          onClose={() => {
            setModalOuvert(false);
            setPrefill(undefined);
            setProgressionEnEdition(null);
          }}
          sessionId={sessionId}
          formations={formations}
          salles={salles}
          matieres={matieres}
          prefill={prefill}
          progressionExistante={progressionEnEdition ?? undefined}
        />
      )}
    </div>
  );
}
