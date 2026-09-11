"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Copy,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Layers,
  Calendar,
  Loader2,
  Check,
} from "lucide-react";

import { Modal, Button } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import type { Formation } from "@/modules/academique";
import type { Salle } from "@/modules/salle";
import { useMatieres, type Matiere } from "@/modules/matieres";
import { trouverCouleurParHex } from "@/modules/matieres/couleurs";
import {
  decomposerTheme,
  type Progression,
  type CreerProgressionPayload,
} from "../domain/types";
import {
  useCreerProgression,
  useMettreAJourContenuProgression,
} from "../data/queries";

export interface DupliquerSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationActuelleId: string;
  formationActuelleNom: string;
  formations: Formation[];
  salles: Salle[];
  matiereId: string;
  sessionId: string;
  phaseId?: string;
  toutesProgressions: Progression[];
  matieres?: Matiere[];
}

interface ConfigurationCoursCible {
  coursSource: Progression;
  selected: boolean;
  semaineCible: number;
  numeroCoursCible: number;
  ecraserSiOccupe: boolean;
}

export function DupliquerSyllabusModal({
  isOpen,
  onClose,
  formationActuelleId,
  formationActuelleNom,
  formations,
  salles,
  matiereId,
  sessionId,
  phaseId,
  toutesProgressions,
  matieres: propMatieres,
}: DupliquerSyllabusModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplication flexible de syllabus"
      description="Choisissez précisément les cours à copier, personnalisez les semaines et séances cibles selon vos besoins."
      maxWidth="max-w-5xl"
    >
      <DupliquerSyllabusForm
        onClose={onClose}
        formationActuelleId={formationActuelleId}
        formationActuelleNom={formationActuelleNom}
        formations={formations}
        salles={salles}
        matiereId={matiereId}
        sessionId={sessionId}
        phaseId={phaseId}
        toutesProgressions={toutesProgressions}
        matieres={propMatieres}
      />
    </Modal>
  );
}

function DupliquerSyllabusForm({
  onClose,
  formationActuelleId,
  formationActuelleNom,
  formations,
  salles,
  matiereId: matiereInitialeId,
  sessionId,
  phaseId: propPhaseId,
  toutesProgressions,
  matieres: propMatieres,
}: Omit<DupliquerSyllabusModalProps, "isOpen">) {
  const { data: allMatieres = [] } = useMatieres();
  const matieresList = propMatieres || allMatieres;

  const [activeMatiereId, setActiveMatiereId] = useState<string>(matiereInitialeId);
  const [sourceFormationId, setSourceFormationId] = useState<string>("");
  const [cibleFormationId, setCibleFormationId] = useState<string>(formationActuelleId);
  const [recherche, setRecherche] = useState<string>("");
  const [filtreSemaineSource, setFiltreSemaineSource] = useState<string>("TOUTES");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succesMsg, setSuccesMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const mutationCreer = useCreerProgression();
  const mutationMaj = useMettreAJourContenuProgression();

  // Formations disponibles pour la matière active
  const formationsPourMatiere = useMemo(() => {
    return formations.filter(
      (f) =>
        !f.matiereIds ||
        f.matiereIds.length === 0 ||
        f.matiereIds.includes(activeMatiereId),
    );
  }, [formations, activeMatiereId]);

  // Initialisation de la source dès qu'on a des formations disponibles
  useEffect(() => {
    if (!sourceFormationId) {
      const autre = formationsPourMatiere.find((f) => f.id !== cibleFormationId);
      if (autre) setSourceFormationId(autre.id);
    }
  }, [formationsPourMatiere, cibleFormationId, sourceFormationId]);

  // Cours disponibles dans la formation source pour la matière active
  const coursSource = useMemo(() => {
    if (!sourceFormationId) return [];
    return toutesProgressions
      .filter(
        (p) =>
          p.formationId === sourceFormationId &&
          p.matiereId === activeMatiereId &&
          p.sessionId === sessionId,
      )
      .sort((a, b) => {
        if (a.semaine !== b.semaine) return a.semaine - b.semaine;
        return a.numeroCours - b.numeroCours;
      });
  }, [toutesProgressions, sourceFormationId, activeMatiereId, sessionId]);

  // Cours déjà présents dans la filière cible pour la matière active
  const coursCibleExistants = useMemo(() => {
    if (!cibleFormationId) return [];
    return toutesProgressions.filter(
      (p) =>
        p.formationId === cibleFormationId &&
        p.matiereId === activeMatiereId &&
        p.sessionId === sessionId,
    );
  }, [toutesProgressions, cibleFormationId, activeMatiereId, sessionId]);

  // État local de configuration pour chaque cours source
  const [configs, setConfigs] = useState<Record<string, ConfigurationCoursCible>>({});

  // Réinitialiser les configurations lorsque la source ou la cible change
  useEffect(() => {
    const nextConfigs: Record<string, ConfigurationCoursCible> = {};

    coursSource.forEach((c) => {
      // Déterminer si un cours identique existe déjà en cible au même créneau
      const dejaExistant = coursCibleExistants.some(
        (ex) => ex.semaine === c.semaine && ex.numeroCours === c.numeroCours,
      );

      nextConfigs[c.id] = {
        coursSource: c,
        selected: !dejaExistant, // Ne pas cocher par défaut les doublons stricts
        semaineCible: c.semaine,
        numeroCoursCible: c.numeroCours,
        ecraserSiOccupe: false,
      };
    });

    setConfigs(nextConfigs);
  }, [coursSource, coursCibleExistants]);

  // Liste des semaines sources existantes
  const semainesSources = useMemo(() => {
    const set = new Set<number>();
    coursSource.forEach((c) => set.add(c.semaine));
    return Array.from(set).sort((a, b) => a - b);
  }, [coursSource]);

  // Filtrage des cours affichés
  const coursAffiches = useMemo(() => {
    return coursSource.filter((c) => {
      if (filtreSemaineSource !== "TOUTES") {
        if (c.semaine !== Number(filtreSemaineSource)) return false;
      }
      if (recherche.trim()) {
        const query = recherche.toLowerCase().trim();
        const themeMatch = c.theme.toLowerCase().includes(query);
        const contenuMatch = c.contenu.toLowerCase().includes(query);
        if (!themeMatch && !contenuMatch) return false;
      }
      return true;
    });
  }, [coursSource, filtreSemaineSource, recherche]);

  // Nombre de cours sélectionnés
  const itemsSelectionnes = useMemo(() => {
    return Object.values(configs).filter((cfg) => cfg.selected);
  }, [configs]);

  // Détection des collisions internes (deux cours sélectionnés ciblant le même slot)
  const collisionsInternes = useMemo(() => {
    const counts = new Map<string, number>();
    itemsSelectionnes.forEach((item) => {
      const key = `${item.semaineCible}_${item.numeroCoursCible}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const set = new Set<string>();
    counts.forEach((count, key) => {
      if (count > 1) set.add(key);
    });
    return set;
  }, [itemsSelectionnes]);

  // Handlers de mise à jour d'un cours
  const toggleSelect = (id: string) => {
    setConfigs((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, selected: !current.selected },
      };
    });
  };

  const updateSemaineCible = (id: string, sem: number) => {
    setConfigs((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, semaineCible: sem },
      };
    });
  };

  const updateNumeroCoursCible = (id: string, num: number) => {
    setConfigs((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, numeroCoursCible: num },
      };
    });
  };

  const toggleEcraser = (id: string) => {
    setConfigs((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, ecraserSiOccupe: !current.ecraserSiOccupe },
      };
    });
  };

  // Actions groupées
  const toutSelectionner = (valeur: boolean) => {
    setConfigs((prev) => {
      const updated = { ...prev };
      coursAffiches.forEach((c) => {
        if (updated[c.id]) {
          updated[c.id] = { ...updated[c.id], selected: valeur };
        }
      });
      return updated;
    });
  };

  const decalerSemainesSelectionnees = (offset: number) => {
    setConfigs((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        if (updated[id].selected) {
          updated[id] = {
            ...updated[id],
            semaineCible: Math.max(1, updated[id].semaineCible + offset),
          };
        }
      });
      return updated;
    });
  };

  const assignerSemaineCibleGroupe = (semaine: number) => {
    setConfigs((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        if (updated[id].selected) {
          updated[id] = {
            ...updated[id],
            semaineCible: semaine,
          };
        }
      });
      return updated;
    });
  };

  const autonumeroterSeances = () => {
    setConfigs((prev) => {
      const updated = { ...prev };
      // Regrouper les items sélectionnés par semaine cible
      const groupesParSemaine = new Map<number, ConfigurationCoursCible[]>();

      Object.values(updated)
        .filter((it) => it.selected)
        .forEach((it) => {
          const list = groupesParSemaine.get(it.semaineCible) || [];
          list.push(it);
          groupesParSemaine.set(it.semaineCible, list);
        });

      groupesParSemaine.forEach((itemsList) => {
        // Trier par semaine/numéro d'origine
        itemsList.sort((a, b) => {
          if (a.coursSource.semaine !== b.coursSource.semaine) {
            return a.coursSource.semaine - b.coursSource.semaine;
          }
          return a.coursSource.numeroCours - b.coursSource.numeroCours;
        });

        itemsList.forEach((it, index) => {
          updated[it.coursSource.id] = {
            ...updated[it.coursSource.id],
            numeroCoursCible: index + 1,
          };
        });
      });

      return updated;
    });
  };

  // Exécution de la duplication
  async function executerDuplication() {
    setErreur(null);
    setSuccesMsg(null);

    if (!sourceFormationId || !cibleFormationId) {
      setErreur("Veuillez sélectionner la filière source et la filière cible.");
      return;
    }
    if (sourceFormationId === cibleFormationId) {
      setErreur("La filière source et la filière cible doivent être différentes.");
      return;
    }
    if (itemsSelectionnes.length === 0) {
      setErreur("Veuillez cocher au moins un cours à dupliquer.");
      return;
    }
    if (collisionsInternes.size > 0) {
      setErreur(
        "Certains cours sélectionnés ont le même créneau cible (même semaine et même numéro de séance). Veuillez corriger les collisions avant de valider.",
      );
      return;
    }

    // Vérifier les créneaux occupés non autorisés à écraser
    for (const item of itemsSelectionnes) {
      const occupe = coursCibleExistants.find(
        (c) =>
          c.semaine === item.semaineCible &&
          c.numeroCours === item.numeroCoursCible,
      );
      if (occupe && !item.ecraserSiOccupe) {
        setErreur(
          `Le créneau S${item.semaineCible} · Cours ${item.numeroCoursCible} est déjà occupé dans la filière cible par "${occupe.theme}". Cochez « Écraser » ou modifiez la séance cible.`,
        );
        return;
      }
    }

    // Déterminer la phase
    const salleCible = salles.find((s) => s.formationId === cibleFormationId);
    const phaseCible =
      propPhaseId ||
      salleCible?.phaseId ||
      coursCibleExistants[0]?.phaseId ||
      coursSource[0]?.phaseId ||
      salles[0]?.phaseId;

    if (!phaseCible) {
      setErreur("Impossible d'identifier la phase pédagogique pour la filière cible.");
      return;
    }

    setIsProcessing(true);

    try {
      let nbCrees = 0;
      let nbMisAJour = 0;

      for (const item of itemsSelectionnes) {
        const existant = coursCibleExistants.find(
          (c) =>
            c.semaine === item.semaineCible &&
            c.numeroCours === item.numeroCoursCible,
        );

        if (existant) {
          // Mise à jour / Remplacement
          await mutationMaj.mutateAsync({
            id: existant.id,
            payload: {
              theme: item.coursSource.theme,
              contenu: item.coursSource.contenu,
              exercices: item.coursSource.exercices || null,
            },
          });
          nbMisAJour++;
        } else {
          // Création nouvelle
          const payload: CreerProgressionPayload = {
            formationId: cibleFormationId,
            sessionId,
            phaseId: phaseCible,
            matiereId: activeMatiereId,
            semaine: item.semaineCible,
            numeroCours: item.numeroCoursCible,
            theme: item.coursSource.theme,
            contenu: item.coursSource.contenu,
            exercices: item.coursSource.exercices || null,
          };
          await mutationCreer.mutateAsync(payload);
          nbCrees++;
        }
      }

      setSuccesMsg(
        `Duplication réussie : ${nbCrees} cours créé${nbCrees > 1 ? "s" : ""}${
          nbMisAJour > 0
            ? ` et ${nbMisAJour} cours mis à jour (écrasement)`
            : ""
        }.`,
      );

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErreur(
        messageErreurApi(err, "Erreur lors de la duplication des progressions."),
      );
    } finally {
      setIsProcessing(false);
    }
  }

  const matiereActiveObj = matieresList.find((m) => m.id === activeMatiereId);
  const couleurActive = trouverCouleurParHex(matiereActiveObj?.couleur);

  return (
    <div className="space-y-4 max-h-[75vh] flex flex-col">
      {erreur && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <span>{erreur}</span>
        </div>
      )}

      {succesMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <span>{succesMsg}</span>
        </div>
      )}

      {/* ── 1. Paramétrage de la Matière, Source et Cible ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Matière */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Discipline / Matière
            </label>
            <select
              value={activeMatiereId}
              onChange={(e) => setActiveMatiereId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
            >
              {matieresList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filière source */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Filière source (copier depuis)
            </label>
            <select
              value={sourceFormationId}
              onChange={(e) => setSourceFormationId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
            >
              <option value="">-- Choisir la source --</option>
              {formationsPourMatiere.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filière cible */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Filière cible (coller vers)
            </label>
            <select
              value={cibleFormationId}
              onChange={(e) => setCibleFormationId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
            >
              <option value="">-- Choisir la cible --</option>
              {formationsPourMatiere.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} {f.id === formationActuelleId ? "(Filière actuelle)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sourceFormationId && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  couleurActive?.bg || "bg-brand-orange"
                }`}
              />
              <span>
                Cours disponibles en source :{" "}
                <strong className="text-slate-900">{coursSource.length}</strong>
              </span>
            </div>
            <div className="text-xs">
              Cours existants en cible :{" "}
              <strong className="text-slate-900">{coursCibleExistants.length}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Barre d'outils, Filtres & Actions groupées ── */}
      {sourceFormationId && coursSource.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Recherche & Filtre par semaine */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Filtrer par mot clé..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-orange"
                />
              </div>

              <select
                value={filtreSemaineSource}
                onChange={(e) => setFiltreSemaineSource(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-brand-orange focus:outline-none"
              >
                <option value="TOUTES">Toutes les semaines sources</option>
                {semainesSources.map((s) => (
                  <option key={s} value={s}>
                    Semaine {s} (
                    {coursSource.filter((c) => c.semaine === s).length} cours)
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons de sélection globale */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toutSelectionner(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => toutSelectionner(false)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
              >
                Tout décocher
              </button>
            </div>
          </div>

          {/* Bandeau d'ajustement rapide des cibles pour les cours sélectionnés */}
          {itemsSelectionnes.length > 0 && (
            <div className="bg-orange-50/50 border border-orange-200/70 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-brand-orange font-bold">
                <Sparkles size={14} />
                <span>
                  Actions groupées sur les {itemsSelectionnes.length} cours cochés :
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Décalage rapide de semaines */}
                <div className="inline-flex items-center rounded-md border border-orange-200 bg-white shadow-2xs overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-2">
                    Décaler :
                  </span>
                  <button
                    type="button"
                    onClick={() => decalerSemainesSelectionnees(1)}
                    className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-orange-100/60 border-l border-orange-200 cursor-pointer"
                    title="Ajouter 1 semaine à tous les cours sélectionnés"
                  >
                    +1 Semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => decalerSemainesSelectionnees(2)}
                    className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-orange-100/60 border-l border-orange-200 cursor-pointer"
                    title="Ajouter 2 semaines à tous les cours sélectionnés"
                  >
                    +2 Semaines
                  </button>
                  <button
                    type="button"
                    onClick={() => decalerSemainesSelectionnees(-1)}
                    className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-orange-100/60 border-l border-orange-200 cursor-pointer"
                    title="Soustraire 1 semaine à tous les cours sélectionnés"
                  >
                    -1 Semaine
                  </button>
                </div>

                {/* Auto-numéroter */}
                <button
                  type="button"
                  onClick={autonumeroterSeances}
                  className="px-2.5 py-1 text-xs font-bold rounded-md border border-orange-200 bg-white hover:bg-orange-100/60 text-slate-700 cursor-pointer shadow-2xs"
                  title="Réassigner automatiquement les séances : Cours 1, Cours 2, Cours 3... par semaine"
                >
                  Auto-séances (1, 2, 3...)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. Liste détaillée des cours avec choix Semaine & Séance Cibles ── */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        {!sourceFormationId ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Veuillez choisir une filière source ci-dessus pour charger ses cours.
          </div>
        ) : coursSource.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Aucun cours trouvé dans la filière source pour cette matière.
          </div>
        ) : coursAffiches.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Aucun cours ne correspond à vos filtres de recherche.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* En-tête des colonnes */}
            <div className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-xs px-4 py-2 border-b border-slate-200 text-[11px] font-black uppercase text-slate-700 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-1 text-center">Choix</div>
              <div className="col-span-5">Cours d'origine (Source)</div>
              <div className="col-span-4">Semaine & Séance de Destination</div>
              <div className="col-span-2 text-right">Statut Cible</div>
            </div>

            {coursAffiches.map((c) => {
              const cfg = configs[c.id];
              if (!cfg) return null;

              const { type, titre } = decomposerTheme(c.theme);
              const isSelected = cfg.selected;

              // Vérification du créneau cible
              const collisionCle = `${cfg.semaineCible}_${cfg.numeroCoursCible}`;
              const estCollisionInterne =
                isSelected && collisionsInternes.has(collisionCle);

              const coursOccupeCible = coursCibleExistants.find(
                (ex) =>
                  ex.semaine === cfg.semaineCible &&
                  ex.numeroCours === cfg.numeroCoursCible,
              );

              return (
                <div
                  key={c.id}
                  className={`px-4 py-3 grid grid-cols-12 gap-3 items-center transition-colors text-xs ${
                    isSelected
                      ? "bg-white hover:bg-orange-50/30"
                      : "bg-slate-50/40 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* Colonne 1 : Case à cocher */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => toggleSelect(c.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-brand-orange border-brand-orange text-white shadow-2xs"
                          : "bg-white border-slate-300 text-transparent hover:border-slate-400"
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Colonne 2 : Cours source */}
                  <div className="col-span-5 space-y-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                        S{c.semaine} · C{c.numeroCours}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1 py-0.5 rounded bg-brand-anthracite/10 text-brand-anthracite">
                        {type}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                      {titre || c.theme}
                    </p>

                    {c.contenu && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {c.contenu.replace(/^[-•*]\s*/, "")}
                      </p>
                    )}
                  </div>

                  {/* Colonne 3 : Destination Cible (Semaine + Séance) */}
                  <div className="col-span-4 flex items-center gap-2">
                    <ArrowRight
                      size={14}
                      className={`shrink-0 ${
                        isSelected ? "text-brand-orange" : "text-slate-300"
                      }`}
                    />

                    {/* Sélecteur de Semaine cible */}
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                        Semaine cible
                      </label>
                      <select
                        disabled={!isSelected}
                        value={cfg.semaineCible}
                        onChange={(e) =>
                          updateSemaineCible(c.id, Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((s) => (
                          <option key={s} value={s}>
                            Semaine {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sélecteur de Séance cible */}
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                        Séance cible
                      </label>
                      <select
                        disabled={!isSelected}
                        value={cfg.numeroCoursCible}
                        onChange={(e) =>
                          updateNumeroCoursCible(c.id, Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            Cours {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Colonne 4 : Statut & Conflit */}
                  <div className="col-span-2 text-right space-y-1">
                    {!isSelected ? (
                      <span className="text-[10px] text-slate-400 italic">
                        Ignoré
                      </span>
                    ) : estCollisionInterne ? (
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={11} />
                        <span>Collision</span>
                      </div>
                    ) : coursOccupeCible ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <AlertCircle size={10} />
                          <span>Occupé</span>
                        </span>
                        <label
                          onClick={() => toggleEcraser(c.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 cursor-pointer select-none hover:text-brand-orange"
                          title={`Le cours "${coursOccupeCible.theme}" sera remplacé`}
                        >
                          <input
                            type="checkbox"
                            checked={cfg.ecraserSiOccupe}
                            onChange={() => {}}
                            className="rounded text-brand-orange w-3 h-3 cursor-pointer"
                          />
                          <span>Écraser</span>
                        </label>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <Check size={11} />
                        <span>Libre</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Barre d'action inférieure ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-3 gap-3 shrink-0">
        <div className="text-xs text-slate-600">
          <strong>{itemsSelectionnes.length}</strong> cours sélectionné
          {itemsSelectionnes.length > 1 ? "s" : ""}
          {collisionsInternes.size > 0 && (
            <span className="text-rose-600 font-bold ml-2">
              (⚠️ {collisionsInternes.size} collision
              {collisionsInternes.size > 1 ? "s" : ""} à résoudre)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>

          <Button
            type="button"
            disabled={
              isProcessing ||
              itemsSelectionnes.length === 0 ||
              collisionsInternes.size > 0
            }
            onClick={executerDuplication}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                <span>Duplication en cours...</span>
              </>
            ) : (
              <>
                <Copy size={14} className="mr-1.5" />
                <span>
                  Dupliquer {itemsSelectionnes.length} cours vers la cible
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
