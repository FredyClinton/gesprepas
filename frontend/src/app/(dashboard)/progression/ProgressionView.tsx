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
  Calendar,
  CalendarRange,
  ChevronRight,
  Sparkles,
  Copy,
  FileText,
  CheckCircle2,
  Palette,
} from "lucide-react";

import { Card } from "@/shared/ui";
import { useSessionActive } from "@/modules/centres-sessions";
import { useDepartement, useDepartements } from "@/modules/departement";
import {
  useAffectations,
  useAffectationsMultiMatiere,
} from "@/modules/affectation";
import { useFormations, type Formation } from "@/modules/academique";
import { useMatieres, CatalogueMatieresModal } from "@/modules/matieres";
import { useSalles } from "@/modules/salle";
import {
  useProgressions,
  useSupprimerProgression,
  ProgressionFormModal,
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


  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number | "TOUTES">(1);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [progressionEnEdition, setProgressionEnEdition] =
    useState<Progression | null>(null);
  const [prefill, setPrefill] = useState<PrefillProgression | undefined>(
    undefined,
  );
  const [filiereActiveId, setFiliereActiveId] = useState<string>("");
  const [saisieLotOuverte, setSaisieLotOuverte] = useState(false);
  const [duplicationOuverte, setDuplicationOuverte] = useState(false);
  const [catalogueMatieresOuvert, setCatalogueMatieresOuvert] = useState(false);

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

  const maxSemaine = useMemo(() => {
    let max = Math.max(1, semaineCourante);
    progressionsFiliereActive.forEach((p) => {
      if (p.semaine > max) max = p.semaine;
    });
    affectationsFiliereActive.forEach((a) => {
      if (a.semaine > max) max = a.semaine;
    });
    if (typeof semaineSelectionnee === "number" && semaineSelectionnee > max) {
      max = semaineSelectionnee;
    }
    return max;
  }, [
    semaineCourante,
    progressionsFiliereActive,
    affectationsFiliereActive,
    semaineSelectionnee,
  ]);

  // Toutes les semaines du début du cursus (S1) jusqu'à présent (semaineCourante), et plus si prévu
  const semainesDisponibles = useMemo(() => {
    return Array.from({ length: maxSemaine }, (_, i) => i + 1);
  }, [maxSemaine]);

  function handleAjouterNouvelleSemaine() {
    const next = maxSemaine + 1;
    setSemaineSelectionnee(next);
  }

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
      {/* ── En-tête de page moderne (Masqué à l'export/impression) ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between no-print print:hidden">
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
            onClick={() => setCatalogueMatieresOuvert(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Gérer les matières et leurs couleurs associées"
          >
            <Palette size={15} className="text-brand-orange" />
            <span>Catalogue matières</span>
          </button>

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
                      semaine: typeof semaineSelectionnee === "number" ? semaineSelectionnee : semaineCourante,
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



      {/* ── Navigation Filières & Sélecteur de Semaine (Masqué à l'export/impression) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3 no-print print:hidden">
        {/* Onglets des filières */}
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

        {/* Sélecteur de semaine en liste déroulante */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Calendar size={15} className="text-brand-orange shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Semaine :
            </span>
            <select
              value={semaineSelectionnee === "TOUTES" ? "TOUTES" : String(semaineSelectionnee)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "TOUTES") {
                  setSemaineSelectionnee("TOUTES");
                } else {
                  setSemaineSelectionnee(Number(val));
                }
              }}
              className="cursor-pointer bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none pr-1"
            >
              <option value="TOUTES" className="bg-white text-slate-800">
                Toutes les semaines (S1 à S{maxSemaine})
              </option>
              <optgroup label="Semaines du cursus (Début → Présent)">
                {semainesDisponibles.map((s) => (
                  <option key={s} value={String(s)} className="bg-white text-slate-800 font-bold">
                    Semaine {s} {s === semaineCourante ? "• (Semaine en cours)" : s > semaineCourante ? "(À venir)" : ""}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={handleAjouterNouvelleSemaine}
            title="Ajouter une nouvelle semaine au syllabus"
            className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange transition-colors cursor-pointer shrink-0"
          >
            <Plus size={13} className="text-brand-orange" />
            <span>+ Semaine</span>
          </button>
        </div>
      </div>

      {/* ── SYLLABUS PAR FILIÈRE (ÉDITION INLINE) ── */}
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
            semaineSelectionnee={semaineSelectionnee}
            onChangerSemaine={setSemaineSelectionnee}
            onSupprimer={supprimer}
            onOuvrirSaisieLot={() => setSaisieLotOuverte(true)}
            onOuvrirDuplication={() => setDuplicationOuverte(true)}
          />
        )}
      </div>

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

      <CatalogueMatieresModal
        isOpen={catalogueMatieresOuvert}
        onClose={() => setCatalogueMatieresOuvert(false)}
      />
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

  // Commutateur de Mode : Syllabus Multi-Matières (Tableau officiel) ou Synthèse Départements
  const [modeVue, setModeVue] = useState<"syllabus" | "departements">(
    "syllabus",
  );
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number | "TOUTES">(1);

  const maxSemaine = useMemo(() => {
    let max = Math.max(1, semaineCourante);
    progressionsFiliereActive.forEach((p) => {
      if (p.semaine > max) max = p.semaine;
    });
    affectationsFiliereActive.forEach((a) => {
      if (a.semaine > max) max = a.semaine;
    });
    if (typeof semaineSelectionnee === "number" && semaineSelectionnee > max) {
      max = semaineSelectionnee;
    }
    return max;
  }, [
    semaineCourante,
    progressionsFiliereActive,
    affectationsFiliereActive,
    semaineSelectionnee,
  ]);

  const semainesDisponibles = useMemo(() => {
    return Array.from({ length: maxSemaine }, (_, i) => i + 1);
  }, [maxSemaine]);

  function handleAjouterNouvelleSemaine() {
    const next = maxSemaine + 1;
    setSemaineSelectionnee(next);
  }

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
  const [catalogueMatieresOuvert, setCatalogueMatieresOuvert] = useState(false);

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
      {/* ── Navigation Filières & Commutateur de Mode / Sélecteur de Semaine (Masqué à l'export/impression) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3 no-print print:hidden">
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
            <Building2 size={16} className="text-brand-orange" />
            <span>Synthèse de la couverture par département</span>
          </div>
        )}

        {/* Sélecteur de Semaine & Commutateur Départements */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          {modeVue === "syllabus" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <Calendar size={15} className="text-brand-orange shrink-0" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Semaine :
                </span>
                <select
                  value={semaineSelectionnee === "TOUTES" ? "TOUTES" : String(semaineSelectionnee)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "TOUTES") {
                      setSemaineSelectionnee("TOUTES");
                    } else {
                      setSemaineSelectionnee(Number(val));
                    }
                  }}
                  className="cursor-pointer bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none pr-1"
                >
                  <option value="TOUTES" className="bg-white text-slate-800">
                    Toutes les semaines (S1 à S{maxSemaine})
                  </option>
                  <optgroup label="Semaines du cursus (Début → Présent)">
                    {semainesDisponibles.map((s) => (
                      <option key={s} value={String(s)} className="bg-white text-slate-800 font-bold">
                        Semaine {s} {s === semaineCourante ? "• (en cours)" : s > semaineCourante ? "(À venir)" : ""}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAjouterNouvelleSemaine}
                title="Ajouter une nouvelle semaine au syllabus"
                className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange transition-colors cursor-pointer shrink-0"
              >
                <Plus size={13} className="text-brand-orange" />
                <span>+ Semaine</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCatalogueMatieresOuvert(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Gérer les matières et leurs couleurs associées"
          >
            <Palette size={14} className="text-brand-orange" />
            <span>Catalogue matières</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setModeVue(modeVue === "syllabus" ? "departements" : "syllabus")
            }
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              modeVue === "departements"
                ? "border-brand-orange bg-orange-50/80 text-brand-orange"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Building2
              size={14}
              className={
                modeVue === "departements" ? "text-brand-orange" : "text-slate-500"
              }
            />
            <span>
              {modeVue === "departements"
                ? "Retour au Syllabus"
                : "Vue Départements"}
            </span>
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
          semaineSelectionnee={semaineSelectionnee}
          onChangerSemaine={setSemaineSelectionnee}
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
          progressionsExistantes={toutesProgressions}
        />
      )}

      <CatalogueMatieresModal
        isOpen={catalogueMatieresOuvert}
        onClose={() => setCatalogueMatieresOuvert(false)}
      />
    </div>
  );
}
