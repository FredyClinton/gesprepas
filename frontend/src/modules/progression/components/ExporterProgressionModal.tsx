"use client";

import React, { useState, useMemo } from "react";
import {
  Printer,
  X,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Calendar,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { Button } from "@/shared/ui";
import type { Formation } from "@/modules/academique";
import type { Matiere } from "@/modules/matieres";
import type { Affectation } from "@/modules/affectation";
import {
  decomposerTheme,
  type Progression,
  type TypeProgression,
} from "../domain/types";
import { trouverCouleurParHex } from "@/modules/matieres/couleurs";

interface ExporterProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formations: Formation[];
  formationIdActive?: string;
  semaineActive?: number | "TOUTES";
  matieres: Matiere[];
  sessionAnnee?: string;
  sessionId?: string;
  progressions: Progression[];
  affectations?: Affectation[];
}

function getQuotaForFormation(
  formationId: string,
  semaine: number,
  matiereId: string,
  defaut: number = 3,
): number {
  if (typeof window === "undefined") return defaut;
  try {
    const raw = localStorage.getItem(`excelis_quotas_${formationId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const key = `${semaine}_${matiereId}`;
      if (parsed[key] !== undefined) return parsed[key];
    }
  } catch {}
  return defaut;
}

function parseContenuLines(contenu?: string | null): string[] {
  if (!contenu) return [""];
  const lines = contenu
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 0);
  return lines.length > 0 ? lines : [""];
}

export function ExporterProgressionModal({
  isOpen,
  onClose,
  formations,
  formationIdActive,
  semaineActive = "TOUTES",
  matieres,
  sessionAnnee = "2026",
  progressions,
  affectations = [],
}: ExporterProgressionModalProps) {
  // Sélection de la formation : "TOUTES" ou formationId
  const [formationSelectionnee, setFormationSelectionnee] = useState<string>(
    formationIdActive || (formations[0]?.id ?? "TOUTES"),
  );

  // Sélection de la semaine : "TOUTES" ou number
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<
    number | "TOUTES"
  >(semaineActive);

  // Masquer les disciplines non programmées (quota 00 et aucun cours)
  const [masquerNonProgrammes, setMasquerNonProgrammes] = useState<boolean>(true);

  // Liste ordonnée de toutes les semaines existantes dans les progressions ou affectations
  const toutesLesSemaines = useMemo(() => {
    const set = new Set<number>();
    progressions.forEach((p) => set.add(p.semaine));
    affectations.forEach((a) => set.add(a.semaine));
    const maxS = Math.max(1, ...Array.from(set));
    return Array.from({ length: maxS }, (_, i) => i + 1);
  }, [progressions, affectations]);

  // Formations à exporter
  const formationsAExporter = useMemo(() => {
    if (formationSelectionnee === "TOUTES") {
      return formations;
    }
    const f = formations.find((item) => item.id === formationSelectionnee);
    return f ? [f] : formations;
  }, [formations, formationSelectionnee]);

  // Semaines à exporter pour le document
  const semainesAExporter = useMemo(() => {
    if (semaineSelectionnee === "TOUTES") {
      return toutesLesSemaines;
    }
    return [semaineSelectionnee];
  }, [semaineSelectionnee, toutesLesSemaines]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Barre de contrôle supérieure (Masquée à l'impression) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-white shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Exportation & Impression du Syllabus Pédagogique
              </h3>
              <p className="text-xs text-slate-500">
                Format optimisé pour impression papier et export PDF haute fidélité (A4 Paysage)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition-colors cursor-pointer active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Lancer l'exportation PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Options de compilation et filtrage (Masquées à l'impression) */}
        <div className="border-b border-slate-200/80 bg-white px-6 py-3.5 space-y-3 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Choix de formation */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Formation à inclure
              </label>
              <select
                value={formationSelectionnee}
                onChange={(e) => setFormationSelectionnee(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
              >
                <option value="TOUTES">
                  🌟 Toutes les formations (Compilation complète)
                </option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Choix de semaine */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Semaines à exporter
              </label>
              <select
                value={semaineSelectionnee}
                onChange={(e) =>
                  setSemaineSelectionnee(
                    e.target.value === "TOUTES" ? "TOUTES" : Number(e.target.value),
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
              >
                <option value="TOUTES">
                  Toutes les semaines (S1 à S{toutesLesSemaines.length || 1})
                </option>
                {toutesLesSemaines.map((s) => (
                  <option key={s} value={s}>
                    Semaine {s} uniquement
                  </option>
                ))}
              </select>
            </div>

            {/* Option : Masquer les disciplines non programmées (00) */}
            <div className="flex items-center pt-5">
              <label
                onClick={() => setMasquerNonProgrammes(!masquerNonProgrammes)}
                className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 hover:text-brand-orange transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    masquerNonProgrammes
                      ? "bg-brand-orange border-brand-orange text-white"
                      : "bg-white border-slate-300 text-transparent"
                  }`}
                >
                  <CheckSquare size={14} />
                </div>
                <span>
                  Masquer les disciplines à quota 00 (gain de place)
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50/60 border border-amber-200/60 rounded-lg px-3 py-1.5">
            <AlertCircle size={13} className="text-amber-600 shrink-0" />
            <span>
              <strong>Note de mise en page :</strong> En sélectionnant « Toutes les formations », chaque formation sera automatiquement imprimée sur une nouvelle page distincte. Les matières dispensées (00) seront résumées en pied de page pour laisser un maximum d'espace aux cours actifs.
            </span>
          </div>
        </div>

        {/* Corps du document imprimable / Aperçu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0">
          <div className="space-y-8 print:space-y-0">
            {formationsAExporter.map((formation, fIndex) => {
              const estDerniereFormation =
                fIndex === formationsAExporter.length - 1;

              return (
                <div
                  key={formation.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
                  style={{
                    pageBreakAfter: estDerniereFormation ? "auto" : "always",
                    breakAfter: estDerniereFormation ? "auto" : "page",
                  }}
                >
                  {/* Cartouche officiel EXCELIS PRÉPAS pour cette formation */}
                  <div className="mb-5 border-2 border-brand-orange rounded-xl bg-orange-50/20 p-4 print:mb-4">
                    <div className="flex items-start justify-between border-b border-orange-200 pb-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black tracking-tight text-slate-900 uppercase">
                            EXCELIS PRÉPAS
                          </span>
                          <span className="text-xs font-bold text-brand-orange">
                            — FICHE DE PROGRESSION PÉDAGOGIQUE
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Classes Préparatoires aux Grandes Écoles & Concours d'Excellence
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <p className="font-bold text-slate-900">
                          SESSION {sessionAnnee}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Édité le {new Date().toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700">
                      <div>
                        FORMATION :{" "}
                        <span className="font-black text-slate-900 uppercase bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {formation.nom}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {semaineSelectionnee === "TOUTES"
                          ? `Semaines : S1 à S${toutesLesSemaines.length || 1}`
                          : `Semaine : Semaine ${semaineSelectionnee}`}
                      </div>
                    </div>
                  </div>

                  {/* Tableaux hebdomadaires de la formation */}
                  <div className="space-y-6 print:space-y-6">
                    {semainesAExporter.map((semaine) => {
                      const progressionsSemaine = progressions.filter(
                        (p) =>
                          p.formationId === formation.id &&
                          p.semaine === semaine,
                      );
                      const affectationsSemaine = affectations.filter(
                        (a) =>
                          a.formationId === formation.id &&
                          a.semaine === semaine,
                      );

                      // Analyser les matières actives et non programmées
                      const matieresActives: {
                        matiere: Matiere;
                        quota: number;
                        progs: Progression[];
                      }[] = [];
                      const matieresNonProgrammes: {
                        matiere: Matiere;
                        quota: number;
                      }[] = [];

                      matieres.forEach((m) => {
                        const nbSeances = affectationsSemaine.filter(
                          (a) => a.matiereId === m.id,
                        ).length;
                        const quota = getQuotaForFormation(
                          formation.id,
                          semaine,
                          m.id,
                          nbSeances > 0 ? nbSeances : 3,
                        );
                        const progsMatiere = progressionsSemaine.filter(
                          (p) => p.matiereId === m.id,
                        );

                        if (
                          masquerNonProgrammes &&
                          quota === 0 &&
                          progsMatiere.length === 0
                        ) {
                          matieresNonProgrammes.push({ matiere: m, quota });
                        } else {
                          matieresActives.push({
                            matiere: m,
                            quota,
                            progs: progsMatiere,
                          });
                        }
                      });

                      // Nombre maximal de cours à afficher (hauteur de grille)
                      const maxLignes = Math.max(
                        3,
                        ...matieresActives.map((item) =>
                          Math.max(
                            item.quota,
                            ...item.progs.map((p) => p.numeroCours || 0),
                          ),
                        ),
                      );

                      const numerosCours = Array.from(
                        { length: maxLignes },
                        (_, i) => i + 1,
                      );

                      return (
                        <div
                          key={semaine}
                          className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs print:border-slate-300"
                        >
                          {/* Barre de semaine */}
                          <div className="bg-slate-100 px-3.5 py-2 text-xs font-black uppercase text-slate-800 flex items-center justify-between border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-orange text-[10px] font-black text-white">
                                S{semaine}
                              </span>
                              <span>Semaine {semaine}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-[11px] font-bold text-slate-600 normal-case">
                                {progressionsSemaine.length} cours rédigé
                                {progressionsSemaine.length > 1 ? "s" : ""}
                              </span>
                            </div>

                            <div className="text-[11px] font-semibold text-slate-500 normal-case">
                              {matieresActives.length} discipline
                              {matieresActives.length > 1 ? "s" : ""} active
                              {matieresActives.length > 1 ? "s" : ""}
                            </div>
                          </div>

                          {/* Tableau grille */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-brand-orange text-white">
                                  <th className="w-20 p-2 text-center font-black uppercase tracking-wider text-[11px] border-r border-orange-600/40">
                                    COURS
                                  </th>
                                  {matieresActives.map(
                                    ({ matiere, quota, progs }) => {
                                      const couleur = trouverCouleurParHex(
                                        matiere.couleur,
                                      );
                                      return (
                                        <th
                                          key={matiere.id}
                                          className="p-2.5 text-center font-black uppercase tracking-wider text-xs border-r border-orange-600/40 last:border-r-0"
                                        >
                                          <div className="flex items-center justify-center gap-1.5">
                                            <span>{matiere.nom}</span>
                                            <span className="font-mono text-[11px] opacity-95">
                                              ({String(quota).padStart(2, "0")})
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-normal opacity-85 normal-case mt-0.5">
                                            {quota === 0
                                              ? "Dispensé"
                                              : `${progs.length}/${quota} cours`}
                                          </div>
                                        </th>
                                      );
                                    },
                                  )}
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-200">
                                {numerosCours.map((numCours) => (
                                  <tr
                                    key={numCours}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    {/* En-tête de ligne COURS 1, COURS 2... */}
                                    <td className="p-2 text-center font-black bg-slate-50/80 text-slate-700 border-r border-slate-200 text-xs whitespace-nowrap">
                                      COURS {numCours}
                                    </td>

                                    {/* Cellule pour chaque matière active */}
                                    {matieresActives.map(
                                      ({ matiere, quota, progs }) => {
                                        const prog = progs.find(
                                          (p) => p.numeroCours === numCours,
                                        );
                                        const estExcedentaire =
                                          numCours > quota;

                                        if (!prog && estExcedentaire) {
                                          return (
                                            <td
                                              key={matiere.id}
                                              className="p-2 text-center bg-slate-50/40 border-r border-slate-200 text-[10px] font-medium text-slate-300 italic last:border-r-0"
                                            >
                                              —
                                            </td>
                                          );
                                        }

                                        if (!prog) {
                                          return (
                                            <td
                                              key={matiere.id}
                                              className="p-2 text-center border-r border-slate-200 text-[11px] text-slate-300 italic last:border-r-0"
                                            >
                                              Non documenté
                                            </td>
                                          );
                                        }

                                        const { type, titre } = decomposerTheme(prog.theme);
                                        const lines = parseContenuLines(prog.contenu);
                                        const couleur = trouverCouleurParHex(
                                          matiere.couleur,
                                        );
                                        const estRattrapage =
                                          prog.theme?.toUpperCase().includes("RATTRAPAGE");

                                        return (
                                          <td
                                            key={matiere.id}
                                            className="p-2.5 align-top border-r border-slate-200 space-y-1.5 last:border-r-0"
                                          >
                                            {/* Type de cours & Badge Rattrapage */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span
                                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                  couleur?.badge ||
                                                  "bg-slate-100 text-slate-700 border border-slate-200"
                                                }`}
                                              >
                                                {type}
                                              </span>
                                              {estRattrapage && (
                                                <span className="text-[9px] font-black uppercase px-1 py-0.5 border border-purple-400 bg-purple-50 text-purple-900 rounded">
                                                  [RATTRAPAGE]
                                                </span>
                                              )}
                                            </div>

                                            {/* Thème principal */}
                                            <p className="font-extrabold text-slate-900 text-xs leading-snug">
                                              {titre || prog.theme || "Sans titre"}
                                            </p>

                                            {/* Points / Contenu de la séance */}
                                            {lines.filter((l) => l.trim().length > 0).length > 0 && (
                                              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 leading-tight">
                                                {lines
                                                  .filter((l) => l.trim().length > 0)
                                                  .map((line, idx) => (
                                                    <li key={idx}>{line}</li>
                                                  ))}
                                              </ul>
                                            )}

                                            {/* Exercices associés */}
                                            {prog.exercices && prog.exercices.trim() && (
                                              <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                                                <strong className="font-bold uppercase text-[9px] text-slate-500">
                                                  Exercices :{" "}
                                                </strong>
                                                <span>{prog.exercices}</span>
                                              </p>
                                            )}
                                          </td>
                                        );
                                      },
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Note de bas de tableau : Disciplines non programmées */}
                          {matieresNonProgrammes.length > 0 && (
                            <div className="bg-slate-50/90 border-t border-slate-200 px-3.5 py-2 text-[11px] text-slate-600 flex items-center gap-2">
                              <span className="font-bold text-slate-700">
                                Disciplines non programmées cette semaine :
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {matieresNonProgrammes.map(({ matiere }) => (
                                  <span
                                    key={matiere.id}
                                    className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                                  >
                                    <span>{matiere.nom}</span>
                                    <span className="font-mono text-slate-400">
                                      (00)
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bloc de signature officiel EXCELIS en fin de page */}
                  <div className="mt-8 pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
                    <div>
                      <p className="font-bold uppercase text-slate-700 mb-8">
                        Visa du Chef de Département / Enseignants :
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Date et signature : ........................................
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold uppercase text-slate-700 mb-8">
                        Visa de la Direction Académique :
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Cachet & Approbation : ........................................
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

