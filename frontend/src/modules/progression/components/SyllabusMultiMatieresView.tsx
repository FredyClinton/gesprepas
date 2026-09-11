"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Check,
  X,
  Loader2,
  Copy,
  Calendar,
  Sparkles,
} from "lucide-react";

import {
  decomposerTheme,
  recomposerTheme,
  type Progression,
  type TypeProgression,
} from "../domain/types";
import {
  useCreerProgression,
  useMettreAJourContenuProgression,
  useSupprimerProgression,
} from "../data/queries";
import type { Matiere } from "@/modules/matieres";
import type { Affectation } from "@/modules/affectation";

// ── Utilitaires de conversion Lignes <-> Contenu texte ──

function parseContenuLines(contenu?: string | null): string[] {
  if (!contenu) return [""];
  const lines = contenu
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 0);
  return lines.length > 0 ? lines : [""];
}

function serializeContenuLines(lines: string[]): string {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => `- ${l}`)
    .join("\n");
}

function labelNumeroCours(num: number): string {
  if (num === 1) return "1er COURS";
  return `${num}e COURS`;
}

// ── Cellule Éditable In-Situ pour Une Matière (Multi-Matières DA) ──

interface CelluleMultiMatiereProps {
  progression?: Progression;
  semaine: number;
  numeroCours: number;
  formationId: string;
  matiereId: string;
  matiereNom: string;
  sessionId: string;
  phaseId: string;
  onSupprimer?: (p: Progression) => void;
}

function CelluleMultiMatiereInSitu({
  progression,
  semaine,
  numeroCours,
  formationId,
  matiereId,
  matiereNom,
  sessionId,
  phaseId,
  onSupprimer,
}: CelluleMultiMatiereProps) {
  const creerMutation = useCreerProgression();
  const modifierMutation = useMettreAJourContenuProgression();

  // Mode actif (si pas de progression existante)
  const [estActif, setEstActif] = useState(Boolean(progression));

  const initThemeData = decomposerTheme(progression?.theme);
  const [typeProgression, setTypeProgression] = useState<TypeProgression>(
    initThemeData.type,
  );
  const [titreTheme, setTitreTheme] = useState(initThemeData.titre);
  const [lines, setLines] = useState<string[]>(() =>
    parseContenuLines(progression?.contenu),
  );
  const [exercices, setExercices] = useState(progression?.exercices ?? "");
  const [statutSauvegarde, setStatutSauvegarde] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >(progression ? "saved" : "idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const lineInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const themeInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronisation si la progression change à distance
  useEffect(() => {
    if (progression) {
      const dec = decomposerTheme(progression.theme);
      setTypeProgression(dec.type);
      setTitreTheme(dec.titre);
      setLines(parseContenuLines(progression.contenu));
      setExercices(progression.exercices ?? "");
      setStatutSauvegarde("saved");
      setEstActif(true);
    } else {
      setEstActif(false);
      setStatutSauvegarde("idle");
    }
  }, [
    progression?.id,
    progression?.theme,
    progression?.contenu,
    progression?.exercices,
  ]);

  function handleLineKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const newLines = [...lines];
      newLines.splice(index + 1, 0, "");
      setLines(newLines);
      setStatutSauvegarde("dirty");
      setTimeout(() => {
        lineInputRefs.current[index + 1]?.focus();
      }, 10);
    } else if (e.key === "Backspace" && lines[index] === "" && lines.length > 1) {
      e.preventDefault();
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
      setStatutSauvegarde("dirty");
      const targetIdx = Math.max(0, index - 1);
      setTimeout(() => {
        lineInputRefs.current[targetIdx]?.focus();
      }, 10);
    }
  }

  function handleLinePaste(
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) {
    const pasteData = e.clipboardData.getData("text");
    if (pasteData.includes("\n")) {
      e.preventDefault();
      const pastedLines = pasteData
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter((l) => l.length > 0);

      if (pastedLines.length > 0) {
        const newLines = [...lines];
        newLines.splice(index, 1, ...pastedLines);
        setLines(newLines);
        setStatutSauvegarde("dirty");
        setTimeout(() => {
          lineInputRefs.current[index + pastedLines.length - 1]?.focus();
        }, 10);
      }
    }
  }

  function handleLineChange(index: number, val: string) {
    const newLines = [...lines];
    newLines[index] = val;
    setLines(newLines);
    setStatutSauvegarde("dirty");
  }

  function handleRemoveLine(index: number) {
    if (lines.length <= 1) {
      setLines([""]);
    } else {
      setLines(lines.filter((_, i) => i !== index));
    }
    setStatutSauvegarde("dirty");
  }

  function handleAddLine() {
    setLines([...lines, ""]);
    setStatutSauvegarde("dirty");
    setTimeout(() => {
      lineInputRefs.current[lines.length]?.focus();
    }, 10);
  }

  async function sauvegarder() {
    const themeFinal = recomposerTheme(typeProgression, titreTheme);
    if (!themeFinal.trim() || !titreTheme.trim()) {
      setErreur(
        `Le titre du ${typeProgression === "TD" ? "TD" : "thème"} est obligatoire.`,
      );
      themeInputRef.current?.focus();
      return;
    }
    const serialized = serializeContenuLines(lines);
    if (!serialized.trim()) {
      setErreur("Veuillez renseigner au moins une ligne de contenu.");
      lineInputRefs.current[0]?.focus();
      return;
    }

    setErreur(null);
    setStatutSauvegarde("saving");

    try {
      if (progression?.id) {
        await modifierMutation.mutateAsync({
          id: progression.id,
          payload: {
            theme: themeFinal,
            contenu: serialized,
            exercices: exercices.trim() || null,
          },
        });
      } else {
        await creerMutation.mutateAsync({
          formationId,
          sessionId,
          phaseId: phaseId || "phase-default",
          matiereId,
          semaine,
          numeroCours,
          theme: themeFinal,
          contenu: serialized,
          exercices: exercices.trim() || null,
        });
      }
      setStatutSauvegarde("saved");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setErreur(msg);
      setStatutSauvegarde("error");
    }
  }

  function activerEdition() {
    setEstActif(true);
    setStatutSauvegarde("dirty");
    setTimeout(() => {
      themeInputRef.current?.focus();
    }, 20);
  }

  function annulerNouveau() {
    if (progression) return;
    setEstActif(false);
    setTypeProgression("THEME");
    setTitreTheme("");
    setLines([""]);
    setExercices("");
    setErreur(null);
    setStatutSauvegarde("idle");
  }

  // Si pas de progression et pas activé : case incitative sobre
  if (!estActif) {
    return (
      <td className="p-3 align-middle text-center border-r border-b border-slate-200 bg-slate-50/20 hover:bg-orange-50/20 transition-colors">
        <button
          type="button"
          onClick={activerEdition}
          className="group inline-flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 hover:border-brand-orange bg-white/80 hover:bg-white px-3 py-4 text-xs font-semibold text-slate-500 hover:text-brand-orange transition-all cursor-pointer w-full min-h-[90px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 group-hover:bg-orange-100 text-slate-400 group-hover:text-brand-orange transition-colors">
            <Plus size={14} />
          </div>
          <span className="text-[11px] font-bold">
            + Renseigner {labelNumeroCours(numeroCours)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {matiereNom}
          </span>
        </button>
      </td>
    );
  }

  return (
    <td
      className={`p-3 align-top border-r border-b border-slate-200 transition-colors min-w-[280px] max-w-[340px] ${
        statutSauvegarde === "dirty" ? "bg-orange-50/25" : "bg-white"
      }`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sauvegarder();
        }
      }}
    >
      <div className="space-y-2.5">
        {/* Barre d'état & Actions de la cellule */}
        <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            {statutSauvegarde === "saving" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-orange">
                <Loader2 size={11} className="animate-spin" />
                <span>Sauvegarde...</span>
              </span>
            )}
            {statutSauvegarde === "saved" && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <Check size={11} />
                <span>À jour</span>
              </span>
            )}
            {statutSauvegarde === "dirty" && (
              <button
                type="button"
                onClick={sauvegarder}
                disabled={creerMutation.isPending || modifierMutation.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-orange px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs hover:bg-brand-orange/90 transition-all cursor-pointer"
                title="Raccourci : Ctrl + Entrée"
              >
                <Save size={10} />
                <span>Enregistrer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {progression ? (
              <button
                type="button"
                onClick={() => onSupprimer?.(progression)}
                className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                title="Supprimer ce cours"
              >
                <Trash2 size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={annulerNouveau}
                className="p-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                title="Annuler la saisie"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {erreur && (
          <div className="rounded bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
            {erreur}
          </div>
        )}

        {/* 1. SÉLECTEUR THEME / TD & TITRE */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          {/* Sélecteur THEME ou TD */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80 shrink-0 select-none shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (typeProgression !== "THEME") {
                  setTypeProgression("THEME");
                  setStatutSauvegarde("dirty");
                }
              }}
              className={`px-1.5 py-1 text-[10px] font-black tracking-wider rounded-md transition-all cursor-pointer ${
                typeProgression === "THEME"
                  ? "bg-white text-brand-orange shadow-xs ring-1 ring-slate-200/70"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Cours magistral / Thème théorique"
            >
              THÈME
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeProgression !== "TD") {
                  setTypeProgression("TD");
                  setStatutSauvegarde("dirty");
                }
              }}
              className={`px-1.5 py-1 text-[10px] font-black tracking-wider rounded-md transition-all cursor-pointer ${
                typeProgression === "TD"
                  ? "bg-brand-orange text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Travaux Dirigés / Séance d'exercices"
            >
              TD
            </button>
          </div>

          {/* Titre du thème ou TD */}
          <input
            ref={themeInputRef}
            type="text"
            value={titreTheme}
            placeholder={
              typeProgression === "TD"
                ? "Titre du TD..."
                : "Titre du thème..."
            }
            onChange={(e) => {
              setTitreTheme(e.target.value);
              setStatutSauvegarde("dirty");
            }}
            className="flex-1 min-w-[120px] text-center font-black text-slate-900 uppercase tracking-wide text-xs py-1.5 px-2 bg-slate-50/60 hover:bg-slate-100/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange/40 rounded-lg transition-all placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal"
          />
        </div>

        {/* 2. CONTENU LIGNE PAR LIGNE */}
        <div className="space-y-1 py-0.5">
          <span className="text-[10px] font-black text-slate-700 tracking-wider uppercase block">
            CONTENU :
          </span>

          <div className="space-y-1">
            {lines.map((line, idx) => (
              <div key={idx} className="group/line flex items-center gap-1.5">
                <span className="select-none font-bold text-slate-400 text-xs shrink-0">
                  -
                </span>
                <input
                  ref={(el) => {
                    lineInputRefs.current[idx] = el;
                  }}
                  type="text"
                  value={line}
                  placeholder={
                    idx === 0 ? "Ex: Définition et propriétés..." : "Autre point..."
                  }
                  onChange={(e) => handleLineChange(idx, e.target.value)}
                  onKeyDown={(e) => handleLineKeyDown(idx, e)}
                  onPaste={(e) => handleLinePaste(idx, e)}
                  className="flex-1 rounded border border-transparent hover:border-slate-200 focus:border-brand-orange bg-transparent focus:bg-white px-2 py-0.5 text-xs text-slate-800 focus:outline-none transition-all"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="opacity-0 group-hover/line:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-opacity"
                    title="Supprimer cette ligne"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-orange hover:text-brand-orange/80 cursor-pointer pt-0.5"
          >
            <Plus size={10} />
            <span>Ajouter une ligne</span>
          </button>
        </div>

        {/* 3. EXERCICES */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
          <span className="text-[10px] font-black text-slate-700 tracking-wider uppercase shrink-0">
            EXERCICES :
          </span>
          <input
            type="text"
            value={exercices}
            placeholder="Ex: 1, 2, 4, 12..."
            onChange={(e) => {
              setExercices(e.target.value);
              setStatutSauvegarde("dirty");
            }}
            className="flex-1 rounded border border-transparent hover:border-slate-200 focus:border-brand-orange bg-transparent focus:bg-white px-1.5 py-0.5 font-semibold text-slate-800 text-xs focus:outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
      </div>
    </td>
  );
}

// ── Composant Principal : Syllabus Multi-Matières Directeur Académique ──

export interface SyllabusMultiMatieresViewProps {
  formationId: string;
  formationNom: string;
  matieres: Matiere[];
  progressions: Progression[];
  affectations: Affectation[];
  sessionId: string;
  phaseId?: string;
  sessionAnnee?: string;
  onSupprimer?: (p: Progression) => void;
  onOuvrirSaisieLot?: (matiereId?: string) => void;
  onOuvrirDuplication?: () => void;
  onOuvrirAjout?: () => void;
  semaineSelectionnee?: number | "TOUTES";
  onChangerSemaine?: (s: number | "TOUTES") => void;
}

export function SyllabusMultiMatieresView({
  formationId,
  formationNom,
  matieres,
  progressions,
  affectations,
  sessionId,
  phaseId = "",
  sessionAnnee = "2026",
  onSupprimer,
  onOuvrirSaisieLot,
  onOuvrirDuplication,
  onOuvrirAjout,
  semaineSelectionnee: propSemaineSelectionnee,
  onChangerSemaine,
}: SyllabusMultiMatieresViewProps) {
  const supprimerMutation = useSupprimerProgression();

  // Liste ordonnée de toutes les semaines disponibles
  const semainesDisponibles = useMemo(() => {
    const set = new Set<number>();
    progressions.forEach((p) => set.add(p.semaine));
    affectations.forEach((a) => set.add(a.semaine));
    if (set.size === 0) set.add(1);
    return Array.from(set).sort((a, b) => a - b);
  }, [progressions, affectations]);

  // Semaine active (soit contrôlée par le parent, soit état local)
  const [internalSemaine, setInternalSemaine] = useState<
    number | "TOUTES"
  >(() => propSemaineSelectionnee ?? "TOUTES");

  const semaineSelectionnee =
    propSemaineSelectionnee !== undefined
      ? propSemaineSelectionnee
      : internalSemaine;
  const setSemaineSelectionnee = onChangerSemaine ?? setInternalSemaine;

  // Semaines à afficher selon le filtre
  const semainesAffichees = useMemo(() => {
    if (semaineSelectionnee === "TOUTES") {
      return semainesDisponibles;
    }
    return [semaineSelectionnee];
  }, [semaineSelectionnee, semainesDisponibles]);

  // Gestion des cours supplémentaires manuels par semaine
  const [coursSupplementairesParSemaine, setCoursSupplementairesParSemaine] =
    useState<Record<number, number>>({});

  function ajouterLigneCours(semaine: number, prochainNumero: number) {
    setCoursSupplementairesParSemaine((prev) => ({
      ...prev,
      [semaine]: Math.max(prev[semaine] ?? 0, prochainNumero),
    }));
  }

  function handleAjouterNouvelleSemaine() {
    const maxSemaine =
      semainesDisponibles.length > 0
        ? Math.max(...semainesDisponibles)
        : 1;
    const nouvelle = maxSemaine + 1;
    setSemaineSelectionnee(nouvelle);
    ajouterLigneCours(nouvelle, 1);
  }

  async function handleSupprimerProgression(p: Progression) {
    if (!window.confirm(`Supprimer l'entrée "${p.theme}" ?`)) return;
    if (onSupprimer) {
      onSupprimer(p);
    } else {
      await supprimerMutation.mutateAsync(p.id);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── En-tête de la Fiche Style Papier Excelis Prépas ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-black tracking-widest text-brand-orange uppercase">
              Tableau Pédagogique Officiel Multi-Disciplines
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              Fiche de Progression Excelis Prépas {sessionAnnee}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
              <span className="font-bold text-slate-800">
                FORMATION : {formationNom}
              </span>
              <span>·</span>
              <span>
                {matieres.length} matière{matieres.length > 1 ? "s" : ""} au programme
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOuvrirSaisieLot && (
              <button
                type="button"
                onClick={() => onOuvrirSaisieLot()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-brand-orange hover:text-brand-orange transition-all cursor-pointer"
                title="Saisir ou importer plusieurs thèmes en lot"
              >
                <Sparkles size={14} className="text-brand-orange" />
                <span>Saisie par lot</span>
              </button>
            )}

            {onOuvrirDuplication && (
              <button
                type="button"
                onClick={onOuvrirDuplication}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                title="Copier le programme d'une filière vers une autre"
              >
                <Copy size={14} className="text-slate-500" />
                <span>Dupliquer syllabus</span>
              </button>
            )}

            {onOuvrirAjout && (
              <button
                type="button"
                onClick={onOuvrirAjout}
                className="bg-brand-orange hover:bg-brand-orange/90 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:shadow-md cursor-pointer"
              >
                <Plus size={16} />
                <span>Nouvelle progression</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Sélecteur d'onglets de Semaines (affiché si non géré par le parent) ── */}
        {propSemaineSelectionnee === undefined && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              {semainesDisponibles.map((sem) => {
                const nbProgsSemaine = progressions.filter(
                  (p) => p.semaine === sem,
                ).length;
                const actif = semaineSelectionnee === sem;

                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSemaineSelectionnee(sem)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      actif
                        ? "bg-brand-orange text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar
                      size={12}
                      className={actif ? "text-white" : "text-slate-400"}
                    />
                    <span>Semaine {sem}</span>
                    {nbProgsSemaine > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          actif
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {nbProgsSemaine}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSemaineSelectionnee("TOUTES")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  semaineSelectionnee === "TOUTES"
                    ? "bg-brand-orange text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Toutes les semaines
              </button>
            </div>

            <button
              type="button"
              onClick={handleAjouterNouvelleSemaine}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-orange/30 bg-orange-50/60 px-3 py-1.5 text-xs font-bold text-brand-orange hover:bg-orange-100/70 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>+ Nouvelle Semaine</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tableaux des Semaines (Multi-Matières) ── */}
      {semainesAffichees.map((semaine) => {
        const progressionsSemaine = progressions.filter(
          (p) => p.semaine === semaine,
        );
        const affectationsSemaine = affectations.filter(
          (a) => a.semaine === semaine,
        );

        // Détermination du nombre maximal de cours pour cette semaine
        const maxProgressionNum = progressionsSemaine.reduce(
          (max, p) => Math.max(max, p.numeroCours),
          0,
        );
        const extraCours = coursSupplementairesParSemaine[semaine] ?? 0;
        const nombreLignes = Math.max(1, maxProgressionNum, extraCours);

        const numerosCours = Array.from(
          { length: nombreLignes },
          (_, i) => i + 1,
        );

        return (
          <div
            key={semaine}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-0"
          >
            {/* Sous-titre de la semaine (Semaine X) - Fond doux et lumineux */}
            <div className="flex items-center justify-between bg-slate-100/90 border-b border-slate-200/90 px-5 py-2.5 text-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange text-[11px] font-black text-white shadow-2xs">
                  S{semaine}
                </div>
                <span className="font-black tracking-wide uppercase text-xs sm:text-sm text-slate-900">
                  SEMAINE {semaine} · {formationNom}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {progressionsSemaine.length} cours documenté{progressionsSemaine.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Grille Scrollable Multi-Matières */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                {/* En-tête officiel orange avec toutes les matières */}
                <thead>
                  <tr className="bg-brand-orange text-white">
                    {/* Colonne COURS fixe / sticky à gauche */}
                    <th className="sticky left-0 z-20 w-28 bg-brand-orange p-3.5 text-center font-black uppercase tracking-wider text-xs border-r border-orange-600/40">
                      COURS
                    </th>

                    {/* Une colonne pour chaque matière de la formation */}
                    {matieres.map((m) => {
                      const nbSeances = affectationsSemaine.filter(
                        (a) => a.matiereId === m.id,
                      ).length;

                      return (
                        <th
                          key={m.id}
                          className="min-w-[280px] max-w-[340px] p-3.5 text-center font-black uppercase tracking-wider text-xs border-r border-orange-600/40 last:border-r-0"
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span>{m.nom}</span>
                            {nbSeances > 0 && (
                              <span className="text-[11px] font-semibold opacity-90">
                                ({String(nbSeances).padStart(2, "0")})
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Lignes du tableau : 1er COURS, 2e COURS, etc. */}
                <tbody>
                  {numerosCours.map((numCours) => (
                    <tr
                      key={numCours}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Colonne 1 : Numéro du cours (Sticky gauche) */}
                      <td className="sticky left-0 z-10 w-28 border-r border-b border-slate-200 bg-slate-50/95 p-3 text-center align-middle shadow-xs">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-black text-slate-900 tracking-tight text-xs uppercase">
                            {labelNumeroCours(numCours)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            S{semaine}
                          </span>
                        </div>
                      </td>

                      {/* Cellule pour chaque matière */}
                      {matieres.map((m) => {
                        const progMatiere = progressionsSemaine.find(
                          (p) =>
                            p.matiereId === m.id && p.numeroCours === numCours,
                        );

                        return (
                          <CelluleMultiMatiereInSitu
                            key={m.id}
                            progression={progMatiere}
                            semaine={semaine}
                            numeroCours={numCours}
                            formationId={formationId}
                            matiereId={m.id}
                            matiereNom={m.nom}
                            sessionId={sessionId}
                            phaseId={phaseId}
                            onSupprimer={handleSupprimerProgression}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pied du tableau : Bouton d'ajout d'une ligne de cours pour la semaine */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-3">
              <button
                type="button"
                onClick={() =>
                  ajouterLigneCours(semaine, nombreLignes + 1)
                }
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 hover:border-brand-orange bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-brand-orange shadow-2xs transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>
                  + Ajouter un cours ({labelNumeroCours(nombreLignes + 1)}) à la Semaine {semaine}
                </span>
              </button>

              <span className="text-[11px] font-medium text-slate-400">
                Raccourci clavier : <kbd className="font-mono font-bold text-slate-600 bg-slate-200/80 px-1 py-0.5 rounded">Ctrl + Entrée</kbd> pour enregistrer
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

