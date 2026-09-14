"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Minus,
  Trash2,
  Save,
  Check,
  X,
  Loader2,
  Copy,
  Calendar,
  Sparkles,
  Printer,
  Lock,
  ArrowRightLeft,
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
import { useProgressionQuotas } from "../hooks/useProgressionQuotas";
import { TransfererCoursModal } from "./TransfererCoursModal";
import { ExporterProgressionModal } from "./ExporterProgressionModal";
import { useFormations, type Formation } from "@/modules/academique";
import type { Matiere } from "@/modules/matieres";
import type { Affectation } from "@/modules/affectation";
import { SelecteurSemaine } from "@/modules/centres-sessions";

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
  onTransferer?: (p: Progression) => void;
  estVerrouille?: boolean;
  quota?: number;
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
  onTransferer,
  estVerrouille,
  quota,
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
    } else if (
      e.key === "Backspace" &&
      lines[index] === "" &&
      lines.length > 1
    ) {
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

  // Si quota fixé à 0 et pas de progression enregistrée : discipline non dispensée cette semaine
  if (quota === 0 && !progression) {
    return (
      <td className="max-w-[340px] min-w-[280px] border-r border-b border-slate-200 bg-slate-50/40 p-3 text-center align-middle">
        <div className="no-print flex flex-col items-center justify-center gap-1 py-3 text-slate-400 select-none">
          <span className="text-[11px] font-bold text-slate-400">
            Aucun cours prévu (Quota : 0)
          </span>
          <span className="text-[10px] text-slate-400">
            Discipline non dispensée cette semaine
          </span>
        </div>
        <span className="hidden text-xs text-slate-300 select-none print:inline">
          —
        </span>
      </td>
    );
  }

  // Si verrouillé par le quota fixé et aucun cours n'y est déjà enregistré : case inactive
  if (estVerrouille && !progression) {
    return (
      <td className="max-w-[340px] min-w-[280px] border-r border-b border-slate-200 bg-slate-50/50 p-3 text-center align-middle">
        <div className="no-print flex flex-col items-center justify-center gap-1.5 py-4 text-slate-400 select-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200/70 text-slate-400">
            <Lock size={13} />
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Case inactive ({labelNumeroCours(numeroCours)})
          </span>
          <span className="text-[10px] text-slate-400">
            Quota fixé à {quota ?? 3} cours par la Direction
          </span>
        </div>
        <span className="hidden text-xs text-slate-300 select-none print:inline">
          —
        </span>
      </td>
    );
  }

  // Si pas de progression et pas activé : case incitative sobre
  if (!estActif) {
    return (
      <td className="border-r border-b border-slate-200 bg-slate-50/20 p-3 text-center align-middle transition-colors hover:bg-orange-50/20">
        <button
          type="button"
          onClick={activerEdition}
          className="no-print group hover:border-brand-orange hover:text-brand-orange inline-flex min-h-[90px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/80 px-3 py-4 text-xs font-semibold text-slate-500 transition-all hover:bg-white"
        >
          <div className="group-hover:text-brand-orange flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-orange-100">
            <Plus size={14} />
          </div>
          <span className="text-[11px] font-bold">
            + Renseigner {labelNumeroCours(numeroCours)}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {matiereNom}
          </span>
        </button>
        <span className="hidden text-xs text-slate-300 select-none print:inline">
          —
        </span>
      </td>
    );
  }

  return (
    <td
      className={`max-w-[340px] min-w-[280px] border-r border-b border-slate-200 p-3 align-top transition-colors ${
        statutSauvegarde === "dirty" ? "bg-orange-50/25" : "bg-white"
      }`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sauvegarder();
        }
      }}
    >
      {/* ── Vue Impression Haute Fidélité (Pure lecture, masquée à l'écran) ── */}
      <div className="hidden space-y-1.5 p-0.5 text-left print:block">
        <div className="border-b border-slate-300 pb-1">
          <span className="mr-1 rounded border border-slate-800 bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase">
            {typeProgression}
          </span>
          <span className="text-[11px] font-extrabold tracking-tight text-slate-900 uppercase">
            {titreTheme || progression?.theme || "Sans titre"}
          </span>
          {progression?.theme?.toUpperCase().includes("RATTRAPAGE") && (
            <span className="py-0.2 ml-1 rounded border border-purple-400 bg-purple-50 px-1 text-[9px] font-black text-purple-900 uppercase">
              [RATTRAPAGE]
            </span>
          )}
        </div>

        {lines.filter((l) => l.trim().length > 0).length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 py-0.5 text-[11px] leading-snug text-slate-800">
            {lines
              .filter((l) => l.trim().length > 0)
              .map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
          </ul>
        )}

        {exercices.trim() && (
          <p className="border-t border-slate-200 pt-0.5 text-[10px] text-slate-800">
            <strong className="text-[9px] font-bold text-slate-600 uppercase">
              Exercices :{" "}
            </strong>
            <span>{exercices}</span>
          </p>
        )}
      </div>

      {/* ── Formulaire d'édition In-Situ (Écran uniquement) ── */}
      <div className="space-y-2.5 print:hidden">
        {/* Barre d'état & Actions de la cellule */}
        <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            {estVerrouille && progression && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Lock size={10} />
                <span>
                  Hors quota ({numeroCours}/{quota})
                </span>
              </span>
            )}
            {statutSauvegarde === "saving" && (
              <span className="text-brand-orange inline-flex items-center gap-1 text-[10px] font-bold">
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
                className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs transition-all"
                title="Raccourci : Ctrl + Entrée"
              >
                <Save size={10} />
                <span>Enregistrer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {progression && onTransferer && (
              <button
                type="button"
                onClick={() => onTransferer(progression)}
                className="no-print hover:text-brand-orange cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-orange-50"
                title="Transférer / Reporter ce cours (Rattrapage)"
              >
                <ArrowRightLeft size={13} />
              </button>
            )}
            {progression ? (
              <button
                type="button"
                onClick={() => onSupprimer?.(progression)}
                className="cursor-pointer rounded p-1 text-slate-300 transition-colors hover:text-rose-600"
                title="Supprimer ce cours"
              >
                <Trash2 size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={annulerNouveau}
                className="cursor-pointer rounded p-1 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                title="Annuler la saisie"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Badge Rattrapage si applicable */}
        {progression?.theme?.toUpperCase().includes("RATTRAPAGE") && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-purple-800 uppercase shadow-2xs">
              <Sparkles size={10} className="text-purple-600" />
              <span>Rattrapage</span>
            </span>
          </div>
        )}

        {erreur && (
          <div className="rounded bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
            {erreur}
          </div>
        )}

        {/* 1. SÉLECTEUR THEME / TD & TITRE */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          {/* Sélecteur THEME ou TD */}
          <div className="inline-flex shrink-0 rounded-lg border border-slate-200/80 bg-slate-100 p-0.5 shadow-2xs select-none">
            <button
              type="button"
              onClick={() => {
                if (typeProgression !== "THEME") {
                  setTypeProgression("THEME");
                  setStatutSauvegarde("dirty");
                }
              }}
              className={`cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-black tracking-wider transition-all ${
                typeProgression === "THEME"
                  ? "text-brand-orange bg-white shadow-xs ring-1 ring-slate-200/70"
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
              className={`cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-black tracking-wider transition-all ${
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
              typeProgression === "TD" ? "Titre du TD..." : "Titre du thème..."
            }
            onChange={(e) => {
              setTitreTheme(e.target.value);
              setStatutSauvegarde("dirty");
            }}
            className="focus:ring-brand-orange/40 min-w-[120px] flex-1 rounded-lg bg-slate-50/60 px-2 py-1.5 text-center text-xs font-black tracking-wide text-slate-900 uppercase transition-all placeholder:font-normal placeholder:text-slate-400 placeholder:normal-case hover:bg-slate-100/60 focus:bg-white focus:ring-1 focus:outline-none"
          />
        </div>

        {/* 2. CONTENU LIGNE PAR LIGNE */}
        <div className="space-y-1 py-0.5">
          <span className="block text-[10px] font-black tracking-wider text-slate-700 uppercase">
            CONTENU :
          </span>

          <div className="space-y-1">
            {lines.map((line, idx) => (
              <div key={idx} className="group/line flex items-center gap-1.5">
                <span className="shrink-0 text-xs font-bold text-slate-400 select-none">
                  -
                </span>
                <input
                  ref={(el) => {
                    lineInputRefs.current[idx] = el;
                  }}
                  type="text"
                  value={line}
                  placeholder={
                    idx === 0
                      ? "Ex: Définition et propriétés..."
                      : "Autre point..."
                  }
                  onChange={(e) => handleLineChange(idx, e.target.value)}
                  onKeyDown={(e) => handleLineKeyDown(idx, e)}
                  onPaste={(e) => handleLinePaste(idx, e)}
                  className="focus:border-brand-orange flex-1 rounded border border-transparent bg-transparent px-2 py-0.5 text-xs text-slate-800 transition-all hover:border-slate-200 focus:bg-white focus:outline-none"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="cursor-pointer rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover/line:opacity-100 hover:text-rose-600"
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
            className="text-brand-orange hover:text-brand-orange/80 inline-flex cursor-pointer items-center gap-1 pt-0.5 text-[10px] font-bold"
          >
            <Plus size={10} />
            <span>Ajouter une ligne</span>
          </button>
        </div>

        {/* 3. EXERCICES */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
          <span className="shrink-0 text-[10px] font-black tracking-wider text-slate-700 uppercase">
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
            className="focus:border-brand-orange flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-semibold text-slate-800 transition-all placeholder:font-normal placeholder:text-slate-400 hover:border-slate-200 focus:bg-white focus:outline-none"
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
  allFormations?: Formation[];
  toutesMatieres?: Matiere[];
  toutesProgressions?: Progression[];
  toutesAffectations?: Affectation[];
  sessionId: string;
  phaseId?: string;
  sessionAnnee?: string;
  onSupprimer?: (p: Progression) => void;
  onOuvrirSaisieLot?: (matiereId?: string) => void;
  onOuvrirDuplication?: () => void;
  onOuvrirAjout?: () => void;
  semaineSelectionnee?: number | "TOUTES";
  onChangerSemaine?: (s: number | "TOUTES") => void;
  barreNavigation?: React.ReactNode;
}

export function SyllabusMultiMatieresView({
  formationId,
  formationNom,
  matieres,
  allFormations: propAllFormations,
  toutesMatieres,
  progressions,
  affectations,
  toutesProgressions,
  toutesAffectations,
  sessionId,
  phaseId = "",
  sessionAnnee = "2026",
  onSupprimer,
  onOuvrirSaisieLot,
  onOuvrirDuplication,
  onOuvrirAjout,
  semaineSelectionnee: propSemaineSelectionnee,
  onChangerSemaine,
  barreNavigation,
}: SyllabusMultiMatieresViewProps) {
  const supprimerMutation = useSupprimerProgression();
  const { data: authSession } = useSession();
  const estDirecteur =
    authSession?.user?.role === "DIRECTEUR_ACADEMIQUE" ||
    authSession?.user?.role === "DIRECTEUR";

  const { getQuota, setQuota } = useProgressionQuotas(formationId, sessionId);
  const { data: allFormations = [] } = useFormations();
  const [showExportModal, setShowExportModal] = useState(false);

  // Semaines explicitement supprimées / masquées par l'utilisateur
  const [semainesSupprimees, setSemainesSupprimees] = useState<Set<number>>(
    new Set(),
  );

  // Liste ordonnée continue de toutes les semaines (de 1 à maxSemaine) sans les semaines supprimées
  const semainesDisponibles = useMemo(() => {
    const set = new Set<number>();
    progressions.forEach((p) => {
      if (!semainesSupprimees.has(p.semaine)) set.add(p.semaine);
    });
    affectations.forEach((a) => {
      if (!semainesSupprimees.has(a.semaine)) set.add(a.semaine);
    });
    const maxS = Math.max(1, ...Array.from(set));
    return Array.from({ length: maxS }, (_, i) => i + 1).filter(
      (s) => !semainesSupprimees.has(s),
    );
  }, [progressions, affectations, semainesSupprimees]);

  // Semaine active (soit contrôlée par le parent, soit état local)
  const [internalSemaine, setInternalSemaine] = useState<number | "TOUTES">(
    () => propSemaineSelectionnee ?? "TOUTES",
  );

  const semaineSelectionnee =
    propSemaineSelectionnee !== undefined
      ? propSemaineSelectionnee
      : internalSemaine;
  const setSemaineSelectionnee = onChangerSemaine ?? setInternalSemaine;

  // État du cours en cours de transfert (Rattrapage / Report)
  const [coursATransferer, setCoursATransferer] = useState<Progression | null>(
    null,
  );

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

  // Lignes de cours explicitement supprimées par semaine
  const [lignesSupprimeesParSemaine, setLignesSupprimeesParSemaine] = useState<
    Record<number, Set<number>>
  >({});

  function ajouterLigneCours(semaine: number, prochainNumero: number) {
    setLignesSupprimeesParSemaine((prev) => {
      const set = new Set(prev[semaine] ?? []);
      set.delete(prochainNumero);
      return { ...prev, [semaine]: set };
    });
    setCoursSupplementairesParSemaine((prev) => ({
      ...prev,
      [semaine]: Math.max(prev[semaine] ?? 0, prochainNumero),
    }));
  }

  async function handleSupprimerLigne(semaine: number, numCours: number) {
    const progsSurLigne = progressions.filter(
      (p) => p.semaine === semaine && p.numeroCours === numCours,
    );
    if (progsSurLigne.length > 0) {
      const ok = window.confirm(
        `Attention : ${progsSurLigne.length} cours sont documentés sur la ligne "${labelNumeroCours(numCours)}" en Semaine ${semaine}.\n\nVoulez-vous vraiment supprimer cette ligne et effacer ces contenus ?`,
      );
      if (!ok) return;

      for (const p of progsSurLigne) {
        if (onSupprimer) {
          await onSupprimer(p);
        } else {
          await supprimerMutation.mutateAsync(p.id);
        }
      }
    }

    setLignesSupprimeesParSemaine((prev) => {
      const set = new Set(prev[semaine] ?? []);
      set.add(numCours);
      return { ...prev, [semaine]: set };
    });
  }

  function handleAjouterNouvelleSemaine() {
    const maxSemaine =
      semainesDisponibles.length > 0 ? Math.max(...semainesDisponibles) : 1;
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

  async function handleSupprimerSemaine(semaine: number) {
    if (!estDirecteur) {
      alert(
        "Seul le Directeur Académique est habilité à supprimer un tableau complet de progression. Vous pouvez supprimer individuellement vos entrées de cours.",
      );
      return;
    }

    const progs = progressions.filter((p) => p.semaine === semaine);
    if (progs.length > 0) {
      const ok = window.confirm(
        `Attention : ${progs.length} cours sont actuellement documentés en Semaine ${semaine}.\n\nÊtes-vous sûr de vouloir supprimer définitivement le tableau de la Semaine ${semaine} et effacer ses ${progs.length} cours ?`,
      );
      if (!ok) return;

      for (const p of progs) {
        if (onSupprimer) {
          await onSupprimer(p);
        } else {
          await supprimerMutation.mutateAsync(p.id);
        }
      }
    }

    setCoursSupplementairesParSemaine((prev) => {
      const next = { ...prev };
      delete next[semaine];
      return next;
    });

    setLignesSupprimeesParSemaine((prev) => {
      const next = { ...prev };
      delete next[semaine];
      return next;
    });

    setSemainesSupprimees((prev) => new Set([...prev, semaine]));
    if (semaineSelectionnee === semaine) {
      setSemaineSelectionnee("TOUTES");
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Cartouche Officiel EXCELIS pour impression / Export PDF (masqué à l'écran, visible au print) ── */}
      <div className="border-brand-orange mb-4 hidden rounded-xl border-2 bg-orange-50/20 p-4 print:block">
        <div className="mb-2 flex items-center justify-between border-b border-orange-200 pb-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              EXCELIS PRÉPAS — FICHE PÉDAGOGIQUE OFFICIELLE
            </h1>
            <p className="text-brand-orange text-xs font-bold uppercase">
              Syllabus de progression multi-disciplinaire
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-800">SESSION {sessionAnnee}</p>
            <p className="text-slate-500">
              Date d&rsquo;impression : {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700">
          <span>
            FORMATION :{" "}
            <strong className="text-slate-900">{formationNom}</strong>
          </span>
          <span>
            DISCIPLINES :{" "}
            <strong className="text-slate-900">
              {matieres.map((m) => m.nom).join(" · ")}
            </strong>
          </span>
        </div>
      </div>

      {/* ── En-tête de la Fiche Style Papier Excelis Prépas (Écran uniquement) ── */}
      <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs print:hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <span className="text-brand-orange text-[11px] font-black tracking-widest uppercase">
              Coordination Pédagogique
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase sm:text-2xl">
              Fiche de Progression {sessionAnnee}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-500">
              <span className="font-bold text-slate-800">
                FORMATION : {formationNom}
              </span>
              <span>·</span>
              <span>
                {matieres.length} matière{matieres.length > 1 ? "s" : ""} au
                programme
              </span>
            </div>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            {/* Bouton Export PDF */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="hover:border-brand-orange hover:text-brand-orange inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
              title="Exporter ou imprimer le syllabus en PDF A4 Paysage"
            >
              <Printer size={14} className="text-brand-orange" />
              <span>Exporter en PDF</span>
            </button>

            {onOuvrirSaisieLot && (
              <button
                type="button"
                onClick={() => onOuvrirSaisieLot()}
                className="hover:border-brand-orange hover:text-brand-orange inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
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
                className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:shadow-md sm:text-sm"
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
            <div className="flex items-center gap-2">
              <SelecteurSemaine
                semaines={semainesDisponibles}
                value={semaineSelectionnee}
                onChange={setSemaineSelectionnee}
                toutes
              />
            </div>

            <button
              type="button"
              onClick={handleAjouterNouvelleSemaine}
              className="border-brand-orange/30 text-brand-orange inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border bg-orange-50/60 px-3 py-1.5 text-xs font-bold transition-all hover:bg-orange-100/70"
            >
              <Plus size={13} />
              <span>+ Nouvelle Semaine</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Bande 2 : Navigation Filières & Sélecteur Semaine (Permutée en 2e position) ── */}
      {barreNavigation}

      {/* ── Tableaux des Semaines (Multi-Matières) ── */}
      {semainesAffichees.map((semaine) => {
        const progressionsSemaine = progressions.filter(
          (p) => p.semaine === semaine,
        );
        const affectationsSemaine = affectations.filter(
          (a) => a.semaine === semaine,
        );

        // Quota max sur l'ensemble des matières de la semaine
        const maxQuotaSemaine = matieres.reduce(
          (max, m) => Math.max(max, getQuota(semaine, m.id, 3)),
          0,
        );
        // Détermination du nombre maximal de cours pour cette semaine
        const maxProgressionNum = progressionsSemaine.reduce(
          (max, p) => Math.max(max, p.numeroCours),
          0,
        );
        const extraCours = coursSupplementairesParSemaine[semaine] ?? 0;
        const nombreLignes = Math.max(
          1,
          maxQuotaSemaine,
          maxProgressionNum,
          extraCours,
        );

        const setSupprimees = lignesSupprimeesParSemaine[semaine] ?? new Set();
        const numerosCours = Array.from(
          { length: nombreLignes },
          (_, i) => i + 1,
        ).filter((num) => !setSupprimees.has(num));

        return (
          <div
            key={semaine}
            className="semaine-card space-y-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
          >
            {/* Sous-titre de la semaine (Semaine X) - Fond doux et lumineux */}
            <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-100/90 px-5 py-2.5 text-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-orange flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black text-white shadow-2xs">
                  S{semaine}
                </div>
                <span className="text-xs font-black tracking-wide text-slate-900 uppercase sm:text-sm">
                  SEMAINE {semaine} · {formationNom}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500">
                  {progressionsSemaine.length} cours documenté
                  {progressionsSemaine.length > 1 ? "s" : ""}
                </span>

                {estDirecteur && (
                  <button
                    type="button"
                    onClick={() => handleSupprimerSemaine(semaine)}
                    className="no-print inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-2xs transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    title={`Supprimer le tableau complet de la Semaine ${semaine}`}
                  >
                    <Trash2
                      size={12}
                      className="text-slate-400 group-hover:text-red-600"
                    />
                    <span>Supprimer Semaine {semaine}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Grille Scrollable Multi-Matières */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                {/* En-tête officiel orange avec toutes les matières */}
                <thead>
                  <tr className="bg-brand-orange text-white">
                    {/* Colonne COURS fixe / sticky à gauche */}
                    <th className="bg-brand-orange sticky left-0 z-20 w-28 border-r border-orange-600/40 p-3.5 text-center text-xs font-black tracking-wider uppercase">
                      COURS
                    </th>

                    {/* Une colonne pour chaque matière de la formation */}
                    {matieres.map((m) => {
                      const nbSeances = affectationsSemaine.filter(
                        (a) => a.matiereId === m.id,
                      ).length;
                      const quota = getQuota(
                        semaine,
                        m.id,
                        nbSeances > 0 ? nbSeances : 3,
                      );
                      const nbProgsMatiere = progressionsSemaine.filter(
                        (p) => p.matiereId === m.id,
                      ).length;

                      return (
                        <th
                          key={m.id}
                          className="max-w-[340px] min-w-[280px] border-r border-orange-600/40 p-3 text-center text-xs font-black tracking-wider uppercase last:border-r-0"
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span>{m.nom}</span>
                              <span className="font-mono text-[12px] font-black opacity-95">
                                ({String(quota).padStart(2, "0")})
                              </span>
                            </div>

                            {/* Quota : Stepper bien designé pour le Directeur Académique / Statut pour les autres */}
                            {estDirecteur ? (
                              <div className="no-print flex flex-col items-center gap-1">
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-2 py-0.5 shadow-xs backdrop-blur-xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuota(
                                        semaine,
                                        m.id,
                                        Math.max(0, quota - 1),
                                      )
                                    }
                                    disabled={quota <= 0}
                                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/30 active:scale-90 disabled:cursor-not-allowed disabled:opacity-20"
                                    title="Diminuer le quota hebdomadaire"
                                  >
                                    <Minus size={11} strokeWidth={3} />
                                  </button>

                                  <span className="min-w-[28px] text-center font-mono text-xs font-black text-white">
                                    {quota === 0 ? "0" : `${quota}`}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuota(
                                        semaine,
                                        m.id,
                                        Math.min(10, quota + 1),
                                      )
                                    }
                                    disabled={quota >= 10}
                                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/30 active:scale-90 disabled:cursor-not-allowed disabled:opacity-20"
                                    title="Augmenter le quota hebdomadaire"
                                  >
                                    <Plus size={11} strokeWidth={3} />
                                  </button>
                                </div>

                                <span className="text-[10px] font-bold text-white/90">
                                  {quota === 0
                                    ? "Dispensé (0 cours)"
                                    : `${nbProgsMatiere}/${quota} rédigé${nbProgsMatiere > 1 ? "s" : ""}`}
                                </span>
                              </div>
                            ) : (
                              <div className="no-print inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                <span>
                                  {quota === 0
                                    ? "Dispensé · 0 cours"
                                    : `${nbProgsMatiere}/${quota} rédigé${nbProgsMatiere > 1 ? "s" : ""}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Lignes du tableau : 1er COURS, 2e COURS, etc. */}
                <tbody>
                  {numerosCours.length === 0 ? (
                    <tr>
                      <td
                        colSpan={matieres.length + 1}
                        className="bg-slate-50/50 p-8 text-center text-slate-500"
                      >
                        <p className="text-xs font-semibold text-slate-700">
                          Toutes les lignes de cours ont été retirées pour la
                          Semaine {semaine}.
                        </p>
                        <button
                          type="button"
                          onClick={() => ajouterLigneCours(semaine, 1)}
                          className="bg-brand-orange hover:bg-brand-orange/90 mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all"
                        >
                          <Plus size={13} />
                          <span>Ajouter le 1er Cours</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    numerosCours.map((numCours) => (
                      <tr
                        key={numCours}
                        className="group/row transition-colors hover:bg-slate-50/40"
                      >
                        {/* Colonne 1 : Numéro du cours (Sticky gauche) avec bouton de suppression de la ligne */}
                        <td className="sticky left-0 z-10 w-28 border-r border-b border-slate-200 bg-slate-50/95 p-3 text-center align-middle shadow-xs">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-xs font-black tracking-tight text-slate-900 uppercase">
                              {labelNumeroCours(numCours)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              S{semaine}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleSupprimerLigne(semaine, numCours)
                              }
                              className="no-print mt-1 inline-flex cursor-pointer items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[10px] font-bold text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title={`Supprimer la ligne du ${labelNumeroCours(numCours)}`}
                            >
                              <Trash2 size={10} />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </td>

                        {/* Cellule pour chaque matière avec application du quota */}
                        {matieres.map((m) => {
                          const progMatiere = progressionsSemaine.find(
                            (p) =>
                              p.matiereId === m.id &&
                              p.numeroCours === numCours,
                          );
                          const nbSeances = affectationsSemaine.filter(
                            (a) => a.matiereId === m.id,
                          ).length;
                          const quota = getQuota(
                            semaine,
                            m.id,
                            nbSeances > 0 ? nbSeances : 3,
                          );
                          const estVerrouille = numCours > quota;

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
                              onTransferer={(p) => setCoursATransferer(p)}
                              estVerrouille={estVerrouille}
                              quota={quota}
                            />
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pied du tableau : Boutons d'ajout et de suppression d'une ligne de cours pour la semaine */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const maxActuel =
                      numerosCours.length > 0 ? Math.max(...numerosCours) : 0;
                    ajouterLigneCours(semaine, maxActuel + 1);
                  }}
                  className="hover:border-brand-orange hover:text-brand-orange inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all"
                >
                  <Plus size={13} />
                  <span>
                    + Ajouter une ligne de cours (
                    {labelNumeroCours(
                      (numerosCours.length > 0
                        ? Math.max(...numerosCours)
                        : 0) + 1,
                    )}
                    )
                  </span>
                </button>

                {/* Possibilité de retirer la dernière ligne affichée */}
                {numerosCours.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const dernierNumero = Math.max(...numerosCours);
                      handleSupprimerLigne(semaine, dernierNumero);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-2xs transition-all hover:bg-red-100"
                    title="Supprimer la dernière ligne du tableau"
                  >
                    <Minus size={13} />
                    <span>
                      Retirer la ligne (
                      {labelNumeroCours(Math.max(...numerosCours))})
                    </span>
                  </button>
                )}
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                Raccourci clavier :{" "}
                <kbd className="rounded bg-slate-200/80 px-1 py-0.5 font-mono font-bold text-slate-600">
                  Ctrl + Entrée
                </kbd>{" "}
                pour enregistrer
              </span>
            </div>
          </div>
        );
      })}

      {/* Modale de Transfert / Rattrapage de cours */}
      {coursATransferer && (
        <TransfererCoursModal
          isOpen={Boolean(coursATransferer)}
          onClose={() => setCoursATransferer(null)}
          progression={coursATransferer}
          formationNom={formationNom}
          matiereNom={
            matieres.find((m) => m.id === coursATransferer.matiereId)?.nom
          }
          semainesDisponibles={semainesDisponibles}
          toutesProgressions={progressions}
        />
      )}

      {/* Modale d'exportation PDF & Impression Multi-Formations */}
      {showExportModal && (
        <ExporterProgressionModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          formations={
            propAllFormations && propAllFormations.length > 0
              ? propAllFormations
              : allFormations.length > 0
                ? allFormations
                : [{ id: formationId, nom: formationNom }]
          }
          formationIdActive={formationId}
          semaineActive={propSemaineSelectionnee ?? "TOUTES"}
          matieres={
            toutesMatieres && toutesMatieres.length > 0
              ? toutesMatieres
              : matieres
          }
          sessionAnnee={sessionAnnee}
          sessionId={sessionId}
          progressions={toutesProgressions ?? progressions}
          affectations={toutesAffectations ?? affectations}
        />
      )}
    </div>
  );
}
