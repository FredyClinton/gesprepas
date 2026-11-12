"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  FileText,
  Check,
  Clock,
  Award,
  Lock,
  ShieldAlert,
} from "lucide-react";
import type { EpreuveConcoursBlanc } from "../types/concours-blanc.types";
import { useDefinirContenuEpreuve } from "../hooks/useConcoursBlancs";

interface ContenuEpreuveModalProps {
  isOpen: boolean;
  onClose: () => void;
  concoursBlancId: string;
  concoursBlancTitre: string;
  epreuve: EpreuveConcoursBlanc | null;
  toutesLesEpreuves?: EpreuveConcoursBlanc[];
  peutEditer?: boolean;
  departementNom?: string;
  estChefDept?: boolean;
  role?: string;
  departementId?: string;
  mesMatiereIds?: Set<string>;
}

export function ContenuEpreuveModal({
  isOpen,
  onClose,
  concoursBlancId,
  concoursBlancTitre,
  epreuve,
  toutesLesEpreuves,
  peutEditer = true,
  departementNom,
  estChefDept = false,
  role,
  departementId,
  mesMatiereIds,
}: ContenuEpreuveModalProps) {
  const mutation = useDefinirContenuEpreuve();

  const [epreuveCourante, setEpreuveCourante] =
    useState<EpreuveConcoursBlanc | null>(epreuve);
  const [contenuEvaluation, setContenuEvaluation] = useState("");
  const [consignes, setConsignes] = useState("");

  useEffect(() => {
    setEpreuveCourante(epreuve);
  }, [epreuve]);

  useEffect(() => {
    if (epreuveCourante) {
      setContenuEvaluation(epreuveCourante.contenuEvaluation ?? "");
      setConsignes(epreuveCourante.consignes ?? "");
    }
  }, [epreuveCourante]);

  if (!isOpen || !epreuveCourante) return null;

  // Le Directeur lit le contenu des épreuves sans le modifier.
  const estDA = role === "DIRECTEUR_ACADEMIQUE";
  const aDroitMatiere = mesMatiereIds
    ? mesMatiereIds.has(epreuveCourante.matiereId)
    : peutEditer;
  const peutEditerActuelle =
    estDA || (estChefDept ? aDroitMatiere : peutEditer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peutEditerActuelle) return;
    await mutation.mutateAsync({
      concoursBlancId,
      epreuveId: epreuveCourante.id,
      payload: {
        contenuEvaluation,
        consignes,
      },
      role,
      departementId,
    });
    onClose();
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {epreuveCourante.intitule || "Épreuve du Concours Blanc"}
              </h2>
              <p className="text-xs text-slate-500">
                {concoursBlancTitre} · Durée : {epreuveCourante.dureeMinutes}{" "}
                min · Barème : sur {epreuveCourante.noteMax} · Coef :{" "}
                {epreuveCourante.coefficient}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Onglets pour TOUTES LES MATIÈRES du concours blanc si plusieurs */}
        {toutesLesEpreuves && toutesLesEpreuves.length > 1 && (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-100 py-2.5">
            <span className="shrink-0 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Matières :
            </span>
            {toutesLesEpreuves.map((ep) => {
              const actif = ep.id === epreuveCourante.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setEpreuveCourante(ep)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                    actif
                      ? "bg-brand-orange border-brand-orange text-white shadow-2xs"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{ep.intitule}</span>
                  <span
                    className={`py-0.2 rounded-full px-1.5 text-[9px] font-semibold ${
                      actif
                        ? "bg-white/25 text-white"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {ep.dureeMinutes} min
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Formulaire / Détail */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto py-4"
        >
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-brand-orange" />
              <span>Durée : {epreuveCourante.dureeMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-brand-orange" />
              <span>Note max : /{epreuveCourante.noteMax}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-brand-orange font-bold">×</span>
              <span>Coefficient : {epreuveCourante.coefficient}</span>
            </div>
          </div>

          {/* Bannière de protection / Mode consultation */}
          {!peutEditerActuelle && estChefDept && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900">
              <Lock size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">
                  Matière est hors de votre département
                </p>
                {/* <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                  Cette épreuve relève du département {departementNom ? <strong>« {departementNom} »</strong> : "concerné"}.
                  En tant que chef de département, vous pouvez uniquement définir les contenus des matières rattachées à votre département.
                  Seul son chef de département ou la Direction Académique peut modifier ce contenu.
                </p> */}
              </div>
            </div>
          )}

          {!peutEditerActuelle && !estChefDept && (
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <Lock size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <div>
                <p className="font-bold text-slate-800">Mode consultation</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Le contenu de l&apos;évaluation et les consignes sont rédigés
                  par le chef de département responsable de la discipline ou par
                  la Direction Académique.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <FileText size={14} className="text-brand-orange" />
              <span>Thèmes & Contenus évalués</span>
            </label>
            {peutEditerActuelle ? (
              <textarea
                rows={5}
                value={contenuEvaluation}
                onChange={(e) => setContenuEvaluation(e.target.value)}
                placeholder="Indiquez les chapitres, thèmes et notions au programme de cette épreuve..."
                className="focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none"
              />
            ) : (
              <div className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-800">
                {contenuEvaluation || "Aucun contenu renseigné pour le moment."}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Consignes spécifiques
            </label>
            {peutEditerActuelle ? (
              <textarea
                rows={3}
                value={consignes}
                onChange={(e) => setConsignes(e.target.value)}
                placeholder="Ex: Calculatrice non autorisée, dictionnaire toléré, papier millimétré fourni..."
                className="focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none"
              />
            ) : (
              <div className="min-h-[60px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-800">
                {consignes || "Aucune consigne particulière."}
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Fermer
            </button>
            {peutEditerActuelle && (
              <button
                type="submit"
                disabled={mutation.isPending}
                className="bg-brand-orange hover:bg-brand-orange/90 cursor-pointer rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {mutation.isPending
                  ? "Enregistrement..."
                  : `Enregistrer pour ${epreuveCourante.intitule}`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
