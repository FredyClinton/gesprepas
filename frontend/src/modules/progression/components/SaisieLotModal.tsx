"use client";

import { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Table,
  CheckCircle2,
} from "lucide-react";

import { Modal, Button } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  type Progression,
  type CreerProgressionPayload,
  decomposerTheme,
  recomposerTheme,
} from "../domain/types";
import { useCreerProgressionsLot } from "../data/queries";

interface SaisieLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationNom: string;
  matiereId: string;
  sessionId: string;
  phaseId: string;
  coursExistants: Progression[];
}

interface LigneLot {
  id: string;
  semaine: number;
  numeroCours: number;
  theme: string;
  contenu: string;
  exercices: string;
}

export function SaisieLotModal({
  isOpen,
  onClose,
  formationId,
  formationNom,
  matiereId,
  sessionId,
  phaseId,
  coursExistants,
}: SaisieLotModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Saisie rapide en lot · ${formationNom}`}
      description="Renseignez ou importez plusieurs thèmes en quelques secondes pour constituer le syllabus."
    >
      <SaisieLotForm
        onClose={onClose}
        formationId={formationId}
        matiereId={matiereId}
        sessionId={sessionId}
        phaseId={phaseId}
        coursExistants={coursExistants}
      />
    </Modal>
  );
}

function SaisieLotForm({
  onClose,
  formationId,
  matiereId,
  sessionId,
  phaseId,
  coursExistants,
}: Omit<SaisieLotModalProps, "isOpen" | "formationNom">) {
  const [onglet, setOnglet] = useState<"texte" | "tableau">("texte");

  // Mode texte brut (collage)
  const [texteColle, setTexteColle] = useState("");
  const [semaineDepart, setSemaineDepart] = useState(() => {
    if (coursExistants.length === 0) return 1;
    return Math.max(...coursExistants.map((p) => p.semaine)) + 1;
  });
  const [coursParSemaine, setCoursParSemaine] = useState(2);

  // Mode tableau
  const [lignes, setLignes] = useState<LigneLot[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [progressionImport, setProgressionImport] = useState<{
    total: number;
    actuel: number;
  } | null>(null);

  const mutationLot = useCreerProgressionsLot();

  // Convertit le texte collé en lignes de tableau
  function convertirTexteEnTableau() {
    setErreur(null);
    const elements = texteColle
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (elements.length === 0) {
      setErreur("Veuillez coller au moins un thème.");
      return;
    }

    let sem = semaineDepart;
    let nCours = 1;
    const nouvellesLignes: LigneLot[] = [];

    elements.forEach((elem, index) => {
      nouvellesLignes.push({
        id: `lot-${Date.now()}-${index}`,
        semaine: sem,
        numeroCours: nCours,
        theme: elem,
        contenu: `Traitement du thème : ${elem}`,
        exercices: "",
      });

      if (nCours < coursParSemaine) {
        nCours += 1;
      } else {
        sem += 1;
        nCours = 1;
      }
    });

    setLignes(nouvellesLignes);
    setOnglet("tableau");
  }

  function ajouterLigneTableau() {
    const derniere = lignes[lignes.length - 1];
    let sem = derniere ? derniere.semaine : semaineDepart;
    let nCours = derniere ? derniere.numeroCours + 1 : 1;
    if (nCours > coursParSemaine) {
      sem += 1;
      nCours = 1;
    }

    setLignes([
      ...lignes,
      {
        id: `lot-${Date.now()}-${lignes.length}`,
        semaine: sem,
        numeroCours: nCours,
        theme: "",
        contenu: "",
        exercices: "",
      },
    ]);
  }

  function modifierLigne(id: string, champ: keyof LigneLot, valeur: string | number) {
    setLignes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)),
    );
  }

  function supprimerLigne(id: string) {
    setLignes((prev) => prev.filter((l) => l.id !== id));
  }

  async function enregistrerTout() {
    setErreur(null);
    if (lignes.length === 0) {
      setErreur("Le tableau ne contient aucun cours à enregistrer.");
      return;
    }

    for (const l of lignes) {
      if (!l.theme.trim()) {
        setErreur(
          `Le thème de la Semaine ${l.semaine} · Cours ${l.numeroCours} ne peut pas être vide.`,
        );
        return;
      }
    }

    const payloads: CreerProgressionPayload[] = lignes.map((l) => ({
      formationId,
      sessionId,
      phaseId,
      matiereId,
      semaine: l.semaine,
      numeroCours: l.numeroCours,
      theme: l.theme.trim(),
      contenu: l.contenu.trim() || l.theme.trim(),
      exercices: l.exercices.trim() || null,
    }));

    setEnCours(true);
    setProgressionImport({ total: payloads.length, actuel: 0 });

    try {
      await mutationLot.mutateAsync(payloads);
      onClose();
    } catch (err) {
      setErreur(
        messageErreurApi(
          err,
          "Erreur lors de l'enregistrement du lot. Vérifiez qu'aucun cours n'est en doublon.",
        ),
      );
    } finally {
      setEnCours(false);
      setProgressionImport(null);
    }
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Onglets : Mode Collage Rapide / Mode Tableau */}
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setOnglet("texte")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
            onglet === "texte"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText size={13} />
          <span>Collage de thèmes (Rapide)</span>
        </button>
        <button
          type="button"
          onClick={() => setOnglet("tableau")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
            onglet === "tableau"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Table size={13} />
          <span>Tableau éditable ({lignes.length})</span>
        </button>
      </div>

      {onglet === "texte" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
            <p className="font-semibold">Comment ça marche ?</p>
            <p className="mt-0.5 text-blue-700/90 text-[11px]">
              Collez la liste de vos titres de chapitres ou thèmes (un par ligne).
              Le système découpera automatiquement le programme par semaine et numéro de cours.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Semaine de départ
              </label>
              <input
                type="number"
                min={1}
                value={semaineDepart}
                onChange={(e) => setSemaineDepart(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Cours par semaine
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={coursParSemaine}
                onChange={(e) => setCoursParSemaine(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Liste des thèmes (1 par ligne)
            </label>
            <textarea
              rows={8}
              value={texteColle}
              onChange={(e) => setTexteColle(e.target.value)}
              placeholder="Exemple :&#10;Suites numériques et limites&#10;Continuité et théorèmes fondamentaux&#10;Dérivation et étude locale&#10;Espaces vectoriels et familles libres"
              className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3 text-slate-800 focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={convertirTexteEnTableau}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-orange/90 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Générer la grille pour relecture →</span>
            </button>
          </div>
        </div>
      )}

      {onglet === "tableau" && (
        <div className="space-y-3">
          {lignes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              <p>Aucune ligne dans la grille.</p>
              <button
                type="button"
                onClick={ajouterLigneTableau}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline cursor-pointer"
              >
                <Plus size={13} />
                <span>Ajouter une première ligne manuellement</span>
              </button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="p-2 w-16">Sem.</th>
                    <th className="p-2 w-16">Cours</th>
                    <th className="p-2">Thème *</th>
                    <th className="p-2">Contenu</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lignes.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="p-1.5">
                        <input
                          type="number"
                          min={1}
                          value={l.semaine}
                          onChange={(e) =>
                            modifierLigne(l.id, "semaine", Number(e.target.value) || 1)
                          }
                          className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={l.numeroCours}
                          onChange={(e) =>
                            modifierLigne(
                              l.id,
                              "numeroCours",
                              Number(e.target.value) || 1,
                            )
                          }
                          className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const dec = decomposerTheme(l.theme);
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextType =
                                      dec.type === "THEME" ? "TD" : "THEME";
                                    modifierLigne(
                                      l.id,
                                      "theme",
                                      recomposerTheme(nextType, dec.titre),
                                    );
                                  }}
                                  className={`px-1.5 py-1 text-[10px] font-black rounded border cursor-pointer select-none shrink-0 transition-colors ${
                                    dec.type === "TD"
                                      ? "bg-brand-orange text-white border-brand-orange shadow-2xs"
                                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                  }`}
                                  title="Cliquer pour basculer entre THÈME et TD"
                                >
                                  {dec.type === "TD" ? "TD" : "THÈME"}
                                </button>
                                <input
                                  type="text"
                                  value={dec.titre}
                                  onChange={(e) =>
                                    modifierLigne(
                                      l.id,
                                      "theme",
                                      recomposerTheme(dec.type, e.target.value),
                                    )
                                  }
                                  placeholder={
                                    dec.type === "TD"
                                      ? "Titre du TD..."
                                      : "Titre du thème..."
                                  }
                                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium"
                                />
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={l.contenu}
                          onChange={(e) =>
                            modifierLigne(l.id, "contenu", e.target.value)
                          }
                          placeholder="Description du contenu"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => supprimerLigne(l.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={ajouterLigneTableau}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-orange cursor-pointer"
            >
              <Plus size={13} />
              <span>Ajouter une ligne</span>
            </button>

            <span className="text-[11px] text-slate-500">
              {lignes.length} cours prêt{lignes.length > 1 ? "s" : ""} à être enregistré{lignes.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={enCours || lignes.length === 0}
              onClick={enregistrerTout}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {enCours ? (
                <span>Enregistrement en lot...</span>
              ) : (
                <span>Enregistrer tout le syllabus ({lignes.length})</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

