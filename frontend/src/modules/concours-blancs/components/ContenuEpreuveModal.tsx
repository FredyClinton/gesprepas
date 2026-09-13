"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, FileText, Check, Clock, Award, Lock, ShieldAlert } from "lucide-react";
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

  const [epreuveCourante, setEpreuveCourante] = useState<EpreuveConcoursBlanc | null>(epreuve);
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

  const estDA = role === "DIRECTEUR_ACADEMIQUE" || role === "DIRECTEUR";
  const aDroitMatiere = mesMatiereIds
    ? mesMatiereIds.has(epreuveCourante.matiereId)
    : peutEditer;
  const peutEditerActuelle = estDA || (estChefDept ? aDroitMatiere : peutEditer);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {epreuveCourante.intitule || "Épreuve du Concours Blanc"}
              </h2>
              <p className="text-xs text-slate-500">
                {concoursBlancTitre} · Durée : {epreuveCourante.dureeMinutes} min · Barème : sur {epreuveCourante.noteMax} · Coef : {epreuveCourante.coefficient}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Onglets pour TOUTES LES MATIÈRES du concours blanc si plusieurs */}
        {toutesLesEpreuves && toutesLesEpreuves.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-b border-slate-100 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Matières :
            </span>
            {toutesLesEpreuves.map((ep) => {
              const actif = ep.id === epreuveCourante.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setEpreuveCourante(ep)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    actif
                      ? "bg-brand-orange text-white border-brand-orange shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{ep.intitule}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-semibold ${
                      actif ? "bg-white/25 text-white" : "bg-slate-200/80 text-slate-600"
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
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
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Lock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Mode consultation uniquement (Matière hors de votre département)</p>
                <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                  Cette épreuve relève du département {departementNom ? <strong>« {departementNom} »</strong> : "concerné"}.
                  En tant que chef de département, vous pouvez uniquement définir les contenus des matières rattachées à votre département.
                  Seul son chef de département ou la Direction Académique peut modifier ce contenu.
                </p>
              </div>
            </div>
          )}

          {!peutEditerActuelle && !estChefDept && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 flex items-start gap-2.5">
              <Lock size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Mode consultation</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Le contenu de l&apos;évaluation et les consignes sont rédigés par le chef de département responsable de la discipline ou par la Direction Académique.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-brand-orange" />
              <span>Thèmes & Contenus évalués ({epreuveCourante.intitule})</span>
            </label>
            {peutEditerActuelle ? (
              <textarea
                rows={5}
                value={contenuEvaluation}
                onChange={(e) => setContenuEvaluation(e.target.value)}
                placeholder="Indiquez les chapitres, thèmes et notions au programme de cette épreuve..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-brand-orange focus:outline-none"
              />
            ) : (
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap min-h-[100px]">
                {contenuEvaluation || "Aucun contenu renseigné pour le moment."}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Consignes spécifiques ({epreuveCourante.intitule})
            </label>
            {peutEditerActuelle ? (
              <textarea
                rows={3}
                value={consignes}
                onChange={(e) => setConsignes(e.target.value)}
                placeholder="Ex: Calculatrice non autorisée, dictionnaire toléré, papier millimétré fourni..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-brand-orange focus:outline-none"
              />
            ) : (
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap min-h-[60px]">
                {consignes || "Aucune consigne particulière."}
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Fermer
            </button>
            {peutEditerActuelle && (
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-xl bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {mutation.isPending ? "Enregistrement..." : `Enregistrer pour ${epreuveCourante.intitule}`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

