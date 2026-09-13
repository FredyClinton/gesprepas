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
  Sparkles,
  Copy,
  BookOpen,
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
import { useMatieres, type Matiere } from "@/modules/matieres";
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

// ── Ligne Éditrice In-Situ (Fidèle à la Fiche Papier Excelis) ──

interface LigneCoursExcelisProps {
  progression?: Progression;
  draftId?: string;
  semaine: number;
  numeroCours: number;
  formationId: string;
  matiereId: string;
  sessionId: string;
  phaseId: string;
  onAnnulerDraft?: () => void;
  onSupprimer?: (p: Progression) => void;
  onTransferer?: (p: Progression) => void;
}

function LigneCoursExcelis({
  progression,
  semaine,
  numeroCours,
  formationId,
  matiereId,
  sessionId,
  phaseId,
  onAnnulerDraft,
  onSupprimer,
  onTransferer,
}: LigneCoursExcelisProps) {
  const creerMutation = useCreerProgression();
  const modifierMutation = useMettreAJourContenuProgression();

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
  >(progression ? "saved" : "dirty");
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
    }
  }, [
    progression?.id,
    progression?.theme,
    progression?.contenu,
    progression?.exercices,
  ]);

  // Si c'est un nouveau brouillon, placer le focus sur le thème
  useEffect(() => {
    if (!progression) {
      themeInputRef.current?.focus();
    }
  }, [progression]);

  // Gestion des touches dans les lignes de contenu (Entrée / Retour arrière)
  function handleLineKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
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

  // Collage multi-lignes automatique
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

  // Sauvegarde sur place
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
        onAnnulerDraft?.();
      }
      setStatutSauvegarde("saved");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setErreur(msg);
      setStatutSauvegarde("error");
    }
  }

  return (
    <tr
      className={`border-b border-slate-200 transition-colors ${
        statutSauvegarde === "dirty" ? "bg-orange-50/20" : "bg-white"
      }`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sauvegarder();
        }
      }}
    >
      {/* ── COLONNE 1 : COURS (1er COURS, 2e COURS...) ── */}
      <td className="w-28 border-r border-slate-200 bg-slate-50/60 p-4 text-center align-middle">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-extrabold text-slate-900 tracking-tight text-xs uppercase">
            {labelNumeroCours(numeroCours)}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            S{semaine}
          </span>
        </div>
      </td>

      {/* ── COLONNE 2 : FICHE PÉDAGOGIQUE (THEME CENTRÉ, CONTENU LIGNE PAR LIGNE, EXERCICES) ── */}
      <td className="p-4 align-top">
        {/* ── Vue Impression Haute Fidélité (Pure lecture, sans champs ni boutons) ── */}
        <div className="hidden print:block space-y-2 text-left">
          <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
            <span className="font-black text-[11px] uppercase px-1.5 py-0.5 border border-slate-800 rounded bg-slate-100">
              {typeProgression}
            </span>
            <span className="font-extrabold text-xs uppercase tracking-wide text-slate-900">
              {titreTheme || progression?.theme || "Sans titre"}
            </span>
            {progression?.theme?.toUpperCase().includes("RATTRAPAGE") && (
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 border border-purple-400 bg-purple-50 text-purple-900 rounded">
                [RATTRAPAGE]
              </span>
            )}
          </div>

          {lines.filter((l) => l.trim().length > 0).length > 0 && (
            <div className="py-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">
                Contenu abordé :
              </span>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-xs text-slate-800">
                {lines
                  .filter((l) => l.trim().length > 0)
                  .map((line, idx) => (
                    <li key={idx} className="leading-snug">{line}</li>
                  ))}
              </ul>
            </div>
          )}

          {exercices.trim() && (
            <div className="pt-1 text-xs text-slate-800 border-t border-slate-200">
              <span className="font-bold text-[10px] uppercase text-slate-700 tracking-wider">
                Exercices traités :{" "}
              </span>
              <span className="font-medium">{exercices}</span>
            </div>
          )}
        </div>

        {/* ── Formulaire d'édition In-Situ (Écran interactif uniquement) ── */}
        <div className="space-y-3 print:hidden">
          {erreur && (
            <div className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
              {erreur}
            </div>
          )}

          {/* Badge Rattrapage si applicable */}
          {progression?.theme?.toUpperCase().includes("RATTRAPAGE") && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-purple-200 shadow-2xs">
                <Sparkles size={10} className="text-purple-600" />
                <span>Rattrapage</span>
              </span>
            </div>
          )}

          {/* 1. SÉLECTEUR THEME / TD & TITRE DU THÈME */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 border-b border-slate-200 pb-2">
            {/* Sélecteur THEME ou TD */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 shrink-0 select-none shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (typeProgression !== "THEME") {
                    setTypeProgression("THEME");
                    setStatutSauvegarde("dirty");
                  }
                }}
                className={`px-3 py-1.5 text-xs font-black tracking-wider rounded-lg transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 text-xs font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                  typeProgression === "TD"
                    ? "bg-brand-orange text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Travaux Dirigés / Séance d'exercices"
              >
                TD
              </button>
            </div>

            {/* Champ de saisie du titre */}
            <input
              ref={themeInputRef}
              type="text"
              value={titreTheme}
              placeholder={
                typeProgression === "TD"
                  ? "TITRE DU TD (EX. PLANCHE N° 1 - MATRICES)"
                  : "TITRE DU THÈME (EX. LOGIQUE ET RAISONNEMENT)"
              }
              onChange={(e) => {
                setTitreTheme(e.target.value);
                setStatutSauvegarde("dirty");
              }}
              className="flex-1 min-w-[200px] text-center font-black text-slate-900 uppercase tracking-wide text-xs sm:text-sm py-2 px-3 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 rounded-xl transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:normal-case"
            />
          </div>

          {/* 2. CONTENU LIGNE PAR LIGNE */}
          <div className="space-y-1.5 py-1">
            <span className="text-[11px] font-black text-slate-700 tracking-wider uppercase block">
              CONTENU :
            </span>

            <div className="space-y-1.5">
              {lines.map((line, idx) => (
                <div key={idx} className="group/line flex items-center gap-2">
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
                      idx === 0
                        ? "Ex: Définir une proposition logique et ses connecteurs..."
                        : "Ajouter un point clé..."
                    }
                    onChange={(e) => handleLineChange(idx, e.target.value)}
                    onKeyDown={(e) => handleLineKeyDown(idx, e)}
                    onPaste={(e) => handleLinePaste(idx, e)}
                    className="flex-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-brand-orange bg-transparent focus:bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none transition-all"
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="opacity-0 group-hover/line:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-opacity"
                      title="Supprimer cette ligne"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-brand-orange hover:text-brand-orange/80 cursor-pointer"
            >
              <Plus size={12} />
              <span>Ajouter une ligne (ou appuyez sur Entrée)</span>
            </button>
          </div>

          {/* 3. EXERCICES */}
          <div className="flex items-center gap-2 border-t border-slate-200 pt-2.5 text-xs">
            <span className="text-[11px] font-black text-slate-700 tracking-wider uppercase shrink-0">
              EXERCICES :
            </span>
            <input
              type="text"
              value={exercices}
              placeholder="Ex: 1, 2, 4, 12 ou Planche TD N° 1..."
              onChange={(e) => {
                setExercices(e.target.value);
                setStatutSauvegarde("dirty");
              }}
              className="flex-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-brand-orange bg-transparent focus:bg-white px-2.5 py-1 font-semibold text-slate-800 text-xs focus:outline-none transition-all"
            />
          </div>
        </div>
      </td>

      {/* ── COLONNE 3 : ACTIONS & STATUT (Masquée à l'export/impression) ── */}
      <td className="w-28 border-l border-slate-200 p-4 text-center align-middle no-print print:hidden">
        <div className="flex flex-col items-center justify-center gap-2">
          {statutSauvegarde === "saving" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange">
              <Loader2 size={12} className="animate-spin" />
              <span>Sauvegarde...</span>
            </span>
          )}

          {statutSauvegarde === "saved" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
              <Check size={12} />
              <span>À jour</span>
            </span>
          )}

          {statutSauvegarde === "dirty" && (
            <button
              type="button"
              onClick={sauvegarder}
              disabled={creerMutation.isPending || modifierMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-brand-orange/90 transition-all cursor-pointer"
              title="Raccourci : Ctrl + Entrée"
            >
              <Save size={12} />
              <span>Enregistrer</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1">
            {progression && onTransferer && (
              <button
                type="button"
                onClick={() => onTransferer(progression)}
                className="p-1.5 text-slate-400 hover:bg-orange-50 hover:text-brand-orange rounded-lg transition-colors cursor-pointer"
                title="Transférer / Reporter ce cours (Rattrapage)"
              >
                <ArrowRightLeft size={14} />
              </button>
            )}

            {progression ? (
              <button
                type="button"
                onClick={() => onSupprimer?.(progression)}
                className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Supprimer ce cours"
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onAnnulerDraft}
                className="p-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Composant Principal : Fiche de Progression Éditable In-Situ ──

interface SyllabusFiliereViewProps {
  formationId: string;
  formationNom: string;
  matiereId: string;
  matiereNom?: string;
  sessionId: string;
  phaseId?: string;
  sessionAnnee?: string;
  progressions: Progression[];
  affectations: Affectation[];
  allFormations?: Formation[];
  toutesMatieres?: Matiere[];
  toutesProgressions?: Progression[];
  toutesAffectations?: Affectation[];
  onAjouter?: (prefill?: { semaine?: number; numeroCours?: number }) => void;
  onModifier?: (progression: Progression) => void;
  onSupprimer?: (progression: Progression) => void;
  onOuvrirSaisieLot?: () => void;
  onOuvrirDuplication?: () => void;
  semaineSelectionnee?: number | "TOUTES";
  onChangerSemaine?: (s: number | "TOUTES") => void;
  peutSupprimerSemaine?: boolean;
}

export function SyllabusFiliereView({
  formationId,
  formationNom,
  allFormations: propAllFormations,
  toutesMatieres: propToutesMatieres,
  matiereId,
  matiereNom = "MATHEMATIQUES",
  sessionId,
  phaseId = "",
  sessionAnnee = "2026",
  progressions,
  affectations,
  toutesProgressions,
  toutesAffectations,
  onSupprimer,
  onOuvrirSaisieLot,
  onOuvrirDuplication,
  onAjouter,
  semaineSelectionnee: propSemaineSelectionnee,
  onChangerSemaine,
  peutSupprimerSemaine = false,
}: SyllabusFiliereViewProps) {
  const supprimerMutation = useSupprimerProgression();
  const { data: authSession } = useSession();
  const estDirecteur =
    authSession?.user?.role === "DIRECTEUR_ACADEMIQUE" ||
    authSession?.user?.role === "DIRECTEUR";

  const droitSupprimerSemaine =
    peutSupprimerSemaine !== undefined ? peutSupprimerSemaine : estDirecteur;

  const { getQuota, setQuota } = useProgressionQuotas(formationId);
  const { data: allFormations = [] } = useFormations();
  const { data: allMatieres = [] } = useMatieres();
  const [showExportModal, setShowExportModal] = useState(false);
  const [coursATransferer, setCoursATransferer] = useState<Progression | null>(null);

  // Semaines explicitement supprimées / masquées par l'utilisateur
  const [semainesSupprimees, setSemainesSupprimees] = useState<Set<number>>(
    new Set(),
  );

  // Liste ordonnée continue de toutes les semaines (de 1 à maxSemaine) sans les semaines supprimées
  const semainesDisponibles = useMemo(() => {
    const sSet = new Set<number>();
    progressions.forEach((p) => {
      if (!semainesSupprimees.has(p.semaine)) sSet.add(p.semaine);
    });
    affectations.forEach((a) => {
      if (!semainesSupprimees.has(a.semaine)) sSet.add(a.semaine);
    });
    const maxS = Math.max(1, ...Array.from(sSet));
    return Array.from({ length: maxS }, (_, i) => i + 1).filter(
      (s) => !semainesSupprimees.has(s),
    );
  }, [progressions, affectations, semainesSupprimees]);

  // Semaine sélectionnée (soit contrôlée par le parent, soit état local)
  const [internalSemaine, setInternalSemaine] = useState<number | "TOUTES">(
    () => propSemaineSelectionnee ?? "TOUTES",
  );
  const semaineSelectionnee =
    propSemaineSelectionnee !== undefined
      ? propSemaineSelectionnee
      : internalSemaine;
  const setSemaineSelectionnee = onChangerSemaine ?? setInternalSemaine;

  // Brouillons en cours de création in-situ (par semaine)
  const [draftsParSemaine, setDraftsParSemaine] = useState<
    Record<number, boolean>
  >({});

  // Groupement des progressions par semaine
  const progressionsParSemaine = useMemo(() => {
    const map = new Map<number, Progression[]>();
    semainesDisponibles.forEach((s) => map.set(s, []));

    progressions.forEach((p) => {
      const list = map.get(p.semaine) ?? [];
      list.push(p);
      map.set(p.semaine, list);
    });

    map.forEach((list) => {
      list.sort((a, b) => a.numeroCours - b.numeroCours);
    });

    return map;
  }, [semainesDisponibles, progressions]);

  // Semaines à afficher dans le tableau
  const semainesAffichees = useMemo(() => {
    if (semaineSelectionnee === "TOUTES") {
      return semainesDisponibles;
    }
    return [semaineSelectionnee];
  }, [semaineSelectionnee, semainesDisponibles]);

  async function handleSupprimer(p: Progression) {
    if (onSupprimer) {
      onSupprimer(p);
      return;
    }
    if (
      !window.confirm(
        `Supprimer définitivement le cours "${p.theme || `Cours ${p.numeroCours}`}" ?`,
      )
    ) {
      return;
    }
    await supprimerMutation.mutateAsync(p.id);
  }

  function handleCreerBrouillon(semaine: number) {
    setDraftsParSemaine((prev) => ({ ...prev, [semaine]: true }));
  }

  function handleAnnulerBrouillon(semaine: number) {
    setDraftsParSemaine((prev) => ({ ...prev, [semaine]: false }));
  }

  function handleAjouterNouvelleSemaine() {
    const maxSemaine =
      semainesDisponibles.length > 0
        ? Math.max(...semainesDisponibles)
        : 1;
    const nouvelleSemaine = maxSemaine + 1;
    setSemaineSelectionnee(nouvelleSemaine);
    setDraftsParSemaine((prev) => ({ ...prev, [nouvelleSemaine]: true }));
  }

  async function handleSupprimerSemaine(semaine: number) {
    if (!droitSupprimerSemaine) {
      alert(
        "Seule la Direction Académique est habilitée à supprimer un tableau complet de progression. Vous pouvez supprimer individuellement vos cours.",
      );
      return;
    }

    const progs = progressions.filter((p) => p.semaine === semaine);
    if (progs.length > 0) {
      const ok = window.confirm(
        `Attention : ${progs.length} cours sont actuellement documentés dans la Semaine ${semaine}.\n\nÊtes-vous sûr de vouloir supprimer définitivement le tableau de la Semaine ${semaine} et effacer ses ${progs.length} cours ?`,
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

    setDraftsParSemaine((prev) => {
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
      <div className="hidden print:block mb-4 p-4 border-2 border-brand-orange rounded-xl bg-orange-50/20">
        <div className="flex items-center justify-between border-b border-orange-200 pb-2 mb-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              EXCELIS PRÉPAS — FICHE PÉDAGOGIQUE OFFICIELLE
            </h1>
            <p className="text-xs font-bold text-brand-orange uppercase">
              Syllabus de progression par filière & discipline
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-800">SESSION {sessionAnnee}</p>
            <p className="text-slate-500">Date d&rsquo;impression : {new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700">
          <span>FORMATION : <strong className="text-slate-900">{formationNom}</strong></span>
          <span>DISCIPLINE : <strong className="text-slate-900">{matiereNom}</strong></span>
        </div>
      </div>

      {/* ── SÉLECTION DES SEMAINES (affichée uniquement si non gérée par la navigation parente) ── */}
      {propSemaineSelectionnee === undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs no-print print:hidden">
          <div className="flex items-center gap-2">
            <label
              htmlFor="select-semaine-filiere"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0"
            >
              Semaine :
            </label>
            <select
              id="select-semaine-filiere"
              value={semaineSelectionnee}
              onChange={(e) => {
                const val = e.target.value;
                setSemaineSelectionnee(
                  val === "TOUTES" ? "TOUTES" : Number(val),
                );
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-brand-orange focus:outline-hidden focus:ring-1 focus:ring-brand-orange/20 cursor-pointer"
            >
              <option value="TOUTES">
                Toutes les semaines (S1 à S
                {semainesDisponibles[semainesDisponibles.length - 1] || 1}) ·{" "}
                {progressions.length} cours
              </option>
              {semainesDisponibles.map((s) => {
                const count = progressionsParSemaine.get(s)?.length ?? 0;
                return (
                  <option key={s} value={s}>
                    Semaine {s} ({count} cours)
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAjouterNouvelleSemaine}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>+ Nouvelle Semaine</span>
          </button>
        </div>
      )}

      {/* ── TABLEAU ÉDITABLE SUR PLACE (STYLE EXCELIS PREPAS PAPIER) ── */}
      <div className="space-y-6">
        {semainesAffichees.map((semaine) => {
          const coursList = progressionsParSemaine.get(semaine) ?? [];
          const aBrouillon = draftsParSemaine[semaine];
          const prochainNumero = coursList.length + 1;
          const quota = getQuota(semaine, matiereId, 4);
          const quotaAtteint = coursList.length >= quota;

          return (
            <div
              key={semaine}
              className="semaine-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
            >
              {/* Titre de la semaine au-dessus du tableau */}
              <div className="bg-slate-100/90 px-4 py-2.5 text-xs font-black uppercase text-slate-800 flex items-center justify-between border-b border-slate-200/90">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-orange text-[10px] font-black text-white shadow-2xs">
                    S{semaine}
                  </span>
                  <span>Semaine {semaine}</span>

                  {/* Stepper Quota : modifiable UNIQUEMENT par le Directeur Académique / Directeur, lecture seule pour les chefs de département */}
                  {estDirecteur ? (
                    <div className="ml-2 inline-flex items-center gap-2 rounded-full bg-white border border-slate-200/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs no-print">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Quota :
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuota(semaine, matiereId, Math.max(0, quota - 1))}
                          disabled={quota <= 0}
                          className="h-5 w-5 rounded-full bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-600 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                          title="Diminuer le quota hebdomadaire"
                        >
                          <Minus size={11} strokeWidth={3} />
                        </button>
                        <span className="font-mono font-black text-xs text-brand-orange min-w-[18px] text-center">
                          {quota}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuota(semaine, matiereId, Math.min(10, quota + 1))}
                          disabled={quota >= 10}
                          className="h-5 w-5 rounded-full bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-600 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                          title="Augmenter le quota hebdomadaire"
                        >
                          <Plus size={11} strokeWidth={3} />
                        </button>
                      </div>

                      <span className="text-slate-300">|</span>

                      <span className="text-[11px] font-bold text-slate-600">
                        {quota === 0
                          ? "Aucun cours prévu"
                          : `${coursList.length}/${quota} cours rédigé${coursList.length > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  ) : (
                    <div className="ml-2 inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs no-print">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Quota fixé :
                      </span>
                      <span className="font-mono font-black text-xs text-brand-orange">
                        ({String(quota).padStart(2, "0")})
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[11px] font-bold text-slate-600">
                        {quota === 0
                          ? "Dispensé (0 cours)"
                          : `${coursList.length}/${quota} cours rédigé${coursList.length > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  )}

                  {/* Information compacte visible uniquement à l'impression */}
                  <span className="hidden print:inline text-[11px] font-bold text-slate-700 ml-2 normal-case">
                    ({coursList.length} cours)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-500 no-print">
                    {coursList.length} cours rédigé{coursList.length > 1 ? "s" : ""}
                  </span>

                  {droitSupprimerSemaine && (
                    <button
                      type="button"
                      onClick={() => handleSupprimerSemaine(semaine)}
                      className="no-print inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer shadow-2xs"
                      title={`Supprimer le tableau de la Semaine ${semaine}`}
                    >
                      <Trash2 size={11} className="text-slate-400 group-hover:text-red-600" />
                      <span>Supprimer Semaine {semaine}</span>
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full border-collapse text-left">
                {/* ── EN-TÊTE ORANGE FIDÈLE AU PAPIER EXCELIS ── */}
                <thead>
                  <tr className="bg-brand-orange text-white text-xs font-bold tracking-wider uppercase">
                    <th className="w-28 p-3 text-center border-r border-orange-600/40">
                      COURS
                    </th>
                    <th className="p-3 text-center border-r border-orange-600/40">
                      {matiereNom.toUpperCase()} ({String(quota).padStart(2, "0")})
                    </th>
                    <th className="w-28 p-3 text-center no-print print:hidden">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                {/* ── LIGNES DU TABLEAU DE PROGRESSION ── */}
                <tbody className="divide-y divide-slate-200">
                  {/* Si aucun cours et pas de brouillon */}
                  {coursList.length === 0 && !aBrouillon ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center bg-slate-50/40">
                        {quota === 0 ? (
                          <div className="max-w-md mx-auto space-y-2 py-2">
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/70 text-slate-500">
                              <Lock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Aucun cours prévu en Semaine {semaine} (Quota : 0)
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium no-print">
                              La Direction Académique a fixé le quota de cette discipline à 0 pour cette semaine (matière non dispensée ou semaine libérée).
                            </p>
                            <p className="hidden print:block text-xs italic text-slate-600">
                              Matière non programmée sur cette semaine.
                            </p>
                          </div>
                        ) : (
                          <>
                            <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2 no-print" />
                            <p className="text-xs font-bold text-slate-700">
                              Aucun cours renseigné pour la Semaine {semaine}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 mb-3 no-print">
                              Commencez à remplir directement la progression dans le tableau ci-dessous.
                            </p>
                            <p className="hidden print:block text-xs italic text-slate-500">
                              Aucun cours documenté pour cette semaine.
                            </p>
                            {quotaAtteint ? (
                              <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 shadow-2xs no-print">
                                <Lock size={13} className="text-slate-400" />
                                <span>Quota hebdomadaire atteint ({quota}/{quota} cours max)</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCreerBrouillon(semaine)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-orange/90 transition-all cursor-pointer no-print"
                              >
                                <Plus size={14} />
                                <span>Remplir le 1er Cours de la Semaine {semaine}</span>
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    coursList.map((cours) => (
                      <LigneCoursExcelis
                        key={cours.id}
                        progression={cours}
                        semaine={cours.semaine}
                        numeroCours={cours.numeroCours}
                        formationId={formationId}
                        matiereId={matiereId}
                        sessionId={sessionId}
                        phaseId={phaseId}
                        onSupprimer={handleSupprimer}
                        onTransferer={setCoursATransferer}
                      />
                    ))
                  )}

                  {/* Ligne de brouillon in-situ (ajout direct dans le tableau) */}
                  {aBrouillon && (
                    <LigneCoursExcelis
                      key={`draft-${semaine}-${prochainNumero}`}
                      draftId={`draft-${semaine}-${prochainNumero}`}
                      semaine={semaine}
                      numeroCours={prochainNumero}
                      formationId={formationId}
                      matiereId={matiereId}
                      sessionId={sessionId}
                      phaseId={phaseId}
                      onAnnulerDraft={() => handleAnnulerBrouillon(semaine)}
                    />
                  )}

                  {/* Bouton pour ajouter un cours suivant directement dans la table */}
                  {!aBrouillon && coursList.length > 0 && (
                    <tr className="bg-slate-50/50 hover:bg-orange-50/30 transition-colors no-print">
                      <td colSpan={3} className="p-3 text-center">
                        {quota === 0 ? (
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 shadow-2xs select-none">
                            <Lock size={13} className="text-slate-400" />
                            <span>Quota fixé à 0 cours par la Direction (matière dispensée cette semaine)</span>
                          </div>
                        ) : quotaAtteint ? (
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 shadow-2xs select-none">
                            <Lock size={13} className="text-slate-400" />
                            <span>Quota hebdomadaire atteint ({quota}/{quota} cours max autorisés par la Direction)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreerBrouillon(semaine)}
                            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-brand-orange hover:text-brand-orange transition-all cursor-pointer"
                          >
                            <Plus size={14} className="text-brand-orange" />
                            <span>
                              + Ajouter un cours ({labelNumeroCours(prochainNumero)}) à la Semaine {semaine}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* ── MODALE DE TRANSFERT / REPORT / RATTRAPAGE DE COURS ── */}
      {coursATransferer && (
        <TransfererCoursModal
          isOpen={Boolean(coursATransferer)}
          onClose={() => setCoursATransferer(null)}
          progression={coursATransferer}
          formationNom={formationNom}
          matiereNom={matiereNom}
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
            (propAllFormations && propAllFormations.length > 0)
              ? propAllFormations
              : allFormations.length > 0
                ? allFormations
                : [{ id: formationId, nom: formationNom }]
          }
          formationIdActive={formationId}
          semaineActive={propSemaineSelectionnee ?? "TOUTES"}
          matieres={
            propToutesMatieres && propToutesMatieres.length > 0
              ? propToutesMatieres
              : allMatieres.length > 0
                ? allMatieres
                : [{ id: matiereId, nom: matiereNom }]
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

