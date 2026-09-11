"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft, Calendar, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Modal, Button } from "@/shared/ui";
import { useCreerProgression, useSupprimerProgression } from "../data/queries";
import { decomposerTheme, type Progression } from "../domain/types";

interface TransfererCoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: Progression | null;
  formationNom?: string;
  matiereNom?: string;
  semainesDisponibles: number[];
  toutesProgressions: Progression[];
}

export function TransfererCoursModal({
  isOpen,
  onClose,
  progression,
  formationNom,
  matiereNom,
  semainesDisponibles,
  toutesProgressions,
}: TransfererCoursModalProps) {
  const creerMutation = useCreerProgression();
  const supprimerMutation = useSupprimerProgression();

  // Semaine cible sélectionnée
  const [semaineCible, setSemaineCible] = useState<number>(() => {
    if (!progression) return 1;
    return progression.semaine + 1;
  });

  // Action : déplacer ou dupliquer
  const [modeTransfert, setModeTransfert] = useState<"deplacer" | "dupliquer">("deplacer");

  // Marquer comme rattrapage
  const [estRattrapage, setEstRattrapage] = useState(true);

  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Détermination du prochain numéro de cours disponible dans la semaine cible
  const prochainNumeroCours = useMemo(() => {
    if (!progression) return 1;
    const coursSemaineCible = toutesProgressions.filter(
      (p) =>
        p.formationId === progression.formationId &&
        p.matiereId === progression.matiereId &&
        Number(p.semaine) === Number(semaineCible),
    );
    const maxNum = coursSemaineCible.reduce((max, p) => Math.max(max, p.numeroCours), 0);
    return maxNum + 1;
  }, [progression, toutesProgressions, semaineCible]);

  const [numeroCoursChoisi, setNumeroCoursChoisi] = useState<number | "auto">("auto");

  if (!progression) return null;

  const decTheme = decomposerTheme(progression.theme);
  const numeroEffectif = numeroCoursChoisi === "auto" ? prochainNumeroCours : numeroCoursChoisi;

  async function handleConfirmer() {
    if (!progression) return;
    setErreur(null);
    setEnCours(true);

    try {
      // 1. Construire le thème enrichi avec tag rattrapage si demandé
      let themeFinal = progression.theme;
      if (estRattrapage && !themeFinal.toUpperCase().includes("RATTRAPAGE")) {
        themeFinal = `${decTheme.type} [RATTRAPAGE] : ${decTheme.titre}`;
      }

      // 2. Créer la nouvelle progression sur la semaine cible
      await creerMutation.mutateAsync({
        formationId: progression.formationId,
        sessionId: progression.sessionId,
        phaseId: progression.phaseId,
        matiereId: progression.matiereId,
        semaine: semaineCible,
        numeroCours: numeroEffectif,
        theme: themeFinal,
        contenu: progression.contenu,
        exercices: progression.exercices ?? null,
      });

      // 3. Si mode déplacer : supprimer l'ancienne fiche de la semaine d'origine
      if (modeTransfert === "deplacer") {
        await supprimerMutation.mutateAsync(progression.id);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setErreur(
        "Erreur lors du transfert du cours. Veuillez vérifier qu'aucun cours n'occupe déjà ce créneau cible.",
      );
    } finally {
      setEnCours(false);
    }
  }

  // Liste ordonnée de semaines pour le sélecteur cible
  const maxS = Math.max(1, ...semainesDisponibles, progression.semaine + 2);
  const optionsSemaines = Array.from({ length: maxS }, (_, i) => i + 1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transférer / Reporter un cours"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Rappel du cours source */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Cours actuel</span>
            <span className="font-mono text-brand-orange font-black">
              S{progression.semaine} · Cours {progression.numeroCours}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {decTheme.titre || progression.theme}
          </p>
          <p className="text-xs text-slate-500">
            {formationNom} · {matiereNom}
          </p>
        </div>

        {erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{erreur}</span>
          </div>
        )}

        {/* Mode de transfert */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Type d&rsquo;opération
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModeTransfert("deplacer")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                modeTransfert === "deplacer"
                  ? "border-brand-orange bg-orange-50/70 text-brand-orange font-bold shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowRightLeft size={16} className="mb-1" />
              <span className="text-xs">Déplacer / Reporter</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Efface l&rsquo;ancienne fiche
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModeTransfert("dupliquer")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                modeTransfert === "dupliquer"
                  ? "border-brand-orange bg-orange-50/70 text-brand-orange font-bold shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles size={16} className="mb-1" />
              <span className="text-xs">Dupliquer (Rattrapage)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Conserve l&rsquo;original
              </span>
            </button>
          </div>
        </div>

        {/* Destination : Semaine et Numéro de cours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Semaine cible *
            </label>
            <div className="relative">
              <select
                value={semaineCible}
                onChange={(e) => {
                  setSemaineCible(Number(e.target.value));
                  setNumeroCoursChoisi("auto");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-brand-orange focus:outline-hidden"
              >
                {optionsSemaines.map((s) => (
                  <option key={s} value={s}>
                    Semaine {s} {s === progression.semaine ? "(Actuelle)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Position dans la semaine *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10}
                value={numeroEffectif}
                onChange={(e) => setNumeroCoursChoisi(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-brand-orange focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Option Rattrapage */}
        <label className="flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs text-purple-900 cursor-pointer">
          <input
            type="checkbox"
            checked={estRattrapage}
            onChange={(e) => setEstRattrapage(e.target.checked)}
            className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <div>
            <span className="font-bold">Marquer comme séance de Rattrapage</span>
            <p className="text-[11px] text-purple-700 mt-0.5">
              Ajoute un badge distinctif « Rattrapage » sur la fiche pour identifier immédiatement ce cours reporté.
            </p>
          </div>
        </label>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={enCours}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleConfirmer}
            disabled={enCours}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold inline-flex items-center gap-1.5"
          >
            {enCours ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Transfert en cours...</span>
              </>
            ) : (
              <span>Confirmer le transfert</span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
