"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AlertCircle, Sparkles } from "lucide-react";

import { Modal, Button } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import type { Formation } from "@/modules/academique";
import type { Matiere } from "@/modules/matieres";
import type { Salle } from "@/modules/salle";

import {
  useCreerProgression,
  useMettreAJourContenuProgression,
} from "../data/queries";
import {
  decomposerTheme,
  recomposerTheme,
  type Progression,
  type TypeProgression,
} from "../domain/types";

// Pré-remplissage venant d'une séance concrète (ex: "séance effectuée sans contenu
// saisi" cliquée dans le tableau de bord) - formation/matière/semaine/n° de cours
// connus d'avance, il ne reste que le contenu pédagogique à décrire.
export type PrefillProgression = {
  formationId: string;
  matiereId?: string;
  semaine: number;
  numeroCours: number;
};

interface ProgressionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  formations: Formation[];
  salles: Salle[];
  // Fixe (Chef de Département : sa propre matière) ou sélectionnable (Directeur
  // Académique : doit choisir un département/matière).
  matiereIdFixe?: string;
  matieres?: Matiere[];
  prefill?: PrefillProgression;
  // Présent = mode édition (thème/contenu/exercices uniquement, le reste est figé
  // côté backend une fois la progression créée).
  progressionExistante?: Progression;
  // Liste des progressions existantes pour déduction intelligente du n° de cours et phase
  progressionsExistantes?: Progression[];
}

export function ProgressionFormModal({
  isOpen,
  onClose,
  progressionExistante,
  ...formProps
}: ProgressionFormModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        progressionExistante
          ? "Modifier le contenu dispensé"
          : "Progression pédagogique · Saisie de cours"
      }
      description="Thème, contenu et exercices. Si le cours existe déjà sur ce créneau, ses informations sont chargées pour modification."
    >
      {/* Remonté à chaque ouverture / changement de cible (clé) plutôt que
          réinitialisé via un effet : évite un rendu en cascade au montage. */}
      <ProgressionForm
        key={progressionExistante?.id ?? "creation"}
        onClose={onClose}
        progressionExistante={progressionExistante}
        {...formProps}
      />
    </Modal>
  );
}

function ProgressionForm({
  onClose,
  sessionId,
  formations,
  salles,
  matiereIdFixe,
  matieres,
  prefill,
  progressionExistante,
  progressionsExistantes = [],
}: Omit<ProgressionFormModalProps, "isOpen">) {
  const modeEdition = Boolean(progressionExistante);

  const [matiereId, setMatiereId] = useState(
    () =>
      progressionExistante?.matiereId ??
      matiereIdFixe ??
      prefill?.matiereId ??
      "",
  );
  const [formationId, setFormationId] = useState(
    () => progressionExistante?.formationId ?? prefill?.formationId ?? "",
  );
  const [semaine, setSemaine] = useState(
    () => progressionExistante?.semaine ?? prefill?.semaine ?? 1,
  );
  const [numeroCours, setNumeroCours] = useState(
    () => progressionExistante?.numeroCours ?? prefill?.numeroCours ?? 1,
  );

  // Détecter dynamiquement si une fiche de progression existe déjà pour le créneau sélectionné
  const progressionTrouvee = useMemo(() => {
    if (progressionExistante) return progressionExistante;
    if (!formationId || !matiereId || !semaine || !numeroCours) return null;
    return (
      progressionsExistantes?.find(
        (p) =>
          p.formationId === formationId &&
          p.matiereId === matiereId &&
          Number(p.semaine) === Number(semaine) &&
          Number(p.numeroCours) === Number(numeroCours),
      ) ?? null
    );
  }, [
    progressionExistante,
    progressionsExistantes,
    formationId,
    matiereId,
    semaine,
    numeroCours,
  ]);

  const estEnModeModification = Boolean(progressionExistante || progressionTrouvee);
  const progressionActive = progressionExistante ?? progressionTrouvee;

  const initThemeData = decomposerTheme(
    progressionExistante?.theme ?? progressionTrouvee?.theme,
  );
  const [typeProgression, setTypeProgression] = useState<TypeProgression>(
    initThemeData.type,
  );
  const [titreTheme, setTitreTheme] = useState(initThemeData.titre);
  const [contenu, setContenu] = useState(
    progressionExistante?.contenu ?? progressionTrouvee?.contenu ?? "",
  );
  const [exercices, setExercices] = useState(
    progressionExistante?.exercices ?? progressionTrouvee?.exercices ?? "",
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [succesInfo, setSuccesInfo] = useState<string | null>(null);

  // Référence du dernier créneau chargé pour synchroniser proprement
  const dernierCreneauChargeRef = useRef<string | null>(null);

  // Synchronisation automatique : quand on sélectionne un créneau existant, pré-remplir les données
  useEffect(() => {
    const cleCreneau = `${formationId}:${matiereId}:${semaine}:${numeroCours}`;
    if (progressionTrouvee) {
      const dec = decomposerTheme(progressionTrouvee.theme);
      setTypeProgression(dec.type);
      setTitreTheme(dec.titre);
      setContenu(progressionTrouvee.contenu);
      setExercices(progressionTrouvee.exercices ?? "");
      dernierCreneauChargeRef.current = cleCreneau;
    } else if (
      dernierCreneauChargeRef.current &&
      dernierCreneauChargeRef.current !== cleCreneau &&
      !progressionExistante
    ) {
      setTypeProgression("THEME");
      setTitreTheme("");
      setContenu("");
      setExercices("");
      dernierCreneauChargeRef.current = null;
    }
  }, [
    progressionTrouvee,
    formationId,
    matiereId,
    semaine,
    numeroCours,
    progressionExistante,
  ]);

  const formationsDisponibles = matiereId
    ? formations.filter((f) => f.matiereIds?.includes(matiereId))
    : formations;

  const creer = useCreerProgression();
  const modifier = useMettreAJourContenuProgression();
  const enCours = creer.isPending || modifier.isPending;

  async function enregistrer(enchainer: boolean) {
    setErreur(null);
    setSuccesInfo(null);

    const themeFinal = recomposerTheme(typeProgression, titreTheme);

    if (!themeFinal.trim() || !titreTheme.trim() || !contenu.trim()) {
      setErreur(
        `Le titre du ${typeProgression === "TD" ? "TD" : "thème"} et le contenu sont obligatoires.`,
      );
      return;
    }

    try {
      if (estEnModeModification && progressionActive) {
        await modifier.mutateAsync({
          id: progressionActive.id,
          payload: {
            theme: themeFinal,
            contenu: contenu.trim(),
            exercices: exercices.trim() || null,
          },
        });
        if (enchainer) {
          setSuccesInfo(
            `Cours N°${numeroCours} (semaine ${semaine}) mis à jour avec succès !`,
          );
          if (numeroCours < 2) {
            setNumeroCours(numeroCours + 1);
          } else {
            setSemaine(semaine + 1);
            setNumeroCours(1);
          }
        } else {
          onClose();
        }
      } else {
        if (!matiereId || !formationId) {
          setErreur("La matière et la formation sont obligatoires.");
          return;
        }
        const salle = salles.find((s) => s.formationId === formationId);
        const phaseIdSelectionnee =
          salle?.phaseId ||
          progressionsExistantes?.find((p) => p.formationId === formationId)?.phaseId ||
          salles[0]?.phaseId;

        if (!phaseIdSelectionnee) {
          setErreur(
            "Aucune salle configurée pour cette formation cette session - impossible de déterminer la phase du cursus.",
          );
          return;
        }

        await creer.mutateAsync({
          formationId,
          sessionId,
          phaseId: phaseIdSelectionnee,
          matiereId,
          semaine,
          numeroCours,
          theme: themeFinal,
          contenu: contenu.trim(),
          exercices: exercices.trim() || null,
        });

        if (enchainer) {
          setSuccesInfo(
            `Cours N°${numeroCours} (semaine ${semaine}) enregistré avec succès ! Saisissez le suivant.`,
          );
          // Avancement automatique du cours
          if (numeroCours < 2) {
            setNumeroCours(numeroCours + 1);
          } else {
            setSemaine(semaine + 1);
            setNumeroCours(1);
          }
          setTypeProgression("THEME");
          setTitreTheme("");
          setContenu("");
          setExercices("");
        } else {
          onClose();
        }
      }
    } catch (err) {
      setErreur(messageErreurApi(err, "Échec de l'enregistrement. Réessayez."));
    }
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    enregistrer(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      enregistrer(!modeEdition);
    }
  }

  return (
    <form onSubmit={soumettre} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      {succesInfo && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <span>✓ {succesInfo}</span>
        </div>
      )}

      {progressionTrouvee && !progressionExistante && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 shadow-2xs">
          <Sparkles size={16} className="text-brand-orange shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900">
              Cours existant détecté pour ce créneau (S{semaine} · Cours {numeroCours})
            </p>
            <p className="text-[11px] text-slate-600">
              Les informations déjà saisies ont été chargées automatiquement. Vous pouvez les modifier directement ci-dessous.
            </p>
          </div>
        </div>
      )}

      {erreur && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{erreur}</span>
        </div>
      )}

      {!modeEdition && matieres && (
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase">
            Département / Matière *
          </label>
          <select
            value={matiereId}
            onChange={(e) => {
              setMatiereId(e.target.value);
              setFormationId("");
            }}
            className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:outline-none"
          >
            <option value="" className="bg-white text-slate-800">-- Choisir --</option>
            {matieres.map((m) => (
              <option key={m.id} value={m.id} className="bg-white text-slate-800">
                {m.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase">
          Formation *
        </label>
        {modeEdition ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
            {formations.find((f) => f.id === formationId)?.nom ?? "Formation"}
          </p>
        ) : (
          <select
            value={formationId}
            onChange={(e) => setFormationId(e.target.value)}
            disabled={!matiereId}
            className="focus:border-brand-orange focus:ring-brand-orange/20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" className="bg-white text-slate-800">-- Choisir --</option>
            {formationsDisponibles.map((f) => (
              <option key={f.id} value={f.id} className="bg-white text-slate-800">
                {f.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase">
            Semaine *
          </label>
          {modeEdition ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              Semaine {semaine}
            </p>
          ) : (
            <input
              type="number"
              min={1}
              value={semaine}
              onChange={(e) => setSemaine(Number(e.target.value) || 1)}
              className="focus:border-brand-orange focus:ring-brand-orange/10 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:outline-none"
            />
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase">
            N° de cours *
          </label>
          {modeEdition ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              Cours {numeroCours}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                max={6}
                value={numeroCours}
                onChange={(e) => setNumeroCours(Number(e.target.value) || 1)}
                className="focus:border-brand-orange focus:ring-brand-orange/10 w-16 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:outline-none"
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((n) => {
                  const existe = progressionsExistantes?.some(
                    (p) =>
                      p.formationId === formationId &&
                      p.matiereId === matiereId &&
                      Number(p.semaine) === Number(semaine) &&
                      Number(p.numeroCours) === n,
                  );
                  const actif = numeroCours === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumeroCours(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        actif
                          ? "bg-brand-orange text-white shadow-2xs"
                          : existe
                            ? "bg-orange-100 text-brand-orange border border-orange-200 hover:bg-orange-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={existe ? `Cours ${n} (Déjà saisi - cliquer pour charger et modifier)` : `Cours ${n} (Nouveau)`}
                    >
                      C{n}{existe ? " •" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
            Type &amp; Thème *
          </label>
          <span className="text-[11px] text-slate-400">Thème de cours ou séance de TD</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Sélecteur THEME ou TD */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 shrink-0 select-none shadow-2xs">
            <button
              type="button"
              onClick={() => setTypeProgression("THEME")}
              className={`px-3 py-2 text-xs font-black tracking-wider rounded-lg transition-all cursor-pointer ${
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
              onClick={() => setTypeProgression("TD")}
              className={`px-3 py-2 text-xs font-black tracking-wider rounded-lg transition-all cursor-pointer ${
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
            type="text"
            value={titreTheme}
            onChange={(e) => setTitreTheme(e.target.value)}
            placeholder={
              typeProgression === "TD"
                ? "Ex : Planche N° 1 - Matrices et déterminants"
                : "Ex : Suites numériques - critères de convergence"
            }
            autoFocus
            className="focus:border-brand-orange focus:ring-brand-orange/10 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
            Contenu *
          </label>
          <span className="text-[11px] text-slate-400">Notions, définitions et théorèmes clés</span>
        </div>
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={3}
          placeholder="Ex : Définition des limites, théorème de Bolzano-Weierstrass, suites adjacentes..."
          className="focus:border-brand-orange focus:ring-brand-orange/10 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
            Exercices (facultatif)
          </label>
          <span className="text-[11px] text-slate-400">TD ou devoirs</span>
        </div>
        <textarea
          value={exercices}
          onChange={(e) => setExercices(e.target.value)}
          rows={2}
          placeholder="Ex : Exercices 3 et 5 de la fiche 2, DM N°1 rendu"
          className="focus:border-brand-orange focus:ring-brand-orange/10 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="mt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Astuce : <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">Ctrl + Entrée</kbd> pour valider
        </span>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {succesInfo ? "Terminer" : "Annuler"}
          </Button>

          {!modeEdition && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => enregistrer(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-orange/30 bg-orange-50 px-3.5 py-2 text-xs font-bold text-brand-orange hover:bg-orange-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>
                {enCours
                  ? "En cours..."
                  : estEnModeModification
                    ? "Mettre à jour et cours suivant"
                    : "Enregistrer et cours suivant"}
              </span>
              <span className="text-[10px] opacity-75">→</span>
            </button>
          )}

          <Button
            type="submit"
            disabled={enCours}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            {enCours
              ? "Enregistrement..."
              : estEnModeModification
                ? "Enregistrer les modifications"
                : "Ajouter et fermer"}
          </Button>
        </div>
      </div>
    </form>
  );
}

