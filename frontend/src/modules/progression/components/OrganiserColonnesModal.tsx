"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
  Check,
  Columns,
  Sparkles,
} from "lucide-react";
import type { Matiere } from "@/modules/matieres";
import { isCouleurClaire } from "@/modules/matieres/couleurs";

interface OrganiserColonnesModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationNom: string;
  matieres: Matiere[];
  onOrdreChange: (matieresReordonnees: Matiere[]) => void;
}

export function OrganiserColonnesModal({
  isOpen,
  onClose,
  formationId,
  formationNom,
  matieres,
  onOrdreChange,
}: OrganiserColonnesModalProps) {
  const [liste, setListe] = useState<Matiere[]>(matieres);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setListe(matieres);
  }, [matieres, isOpen]);

  if (!isOpen) return null;

  const monter = (index: number) => {
    if (index === 0) return;
    const nouvelleListe = [...liste];
    const [item] = nouvelleListe.splice(index, 1);
    nouvelleListe.splice(index - 1, 0, item);
    setListe(nouvelleListe);
  };

  const descendre = (index: number) => {
    if (index === liste.length - 1) return;
    const nouvelleListe = [...liste];
    const [item] = nouvelleListe.splice(index, 1);
    nouvelleListe.splice(index + 1, 0, item);
    setListe(nouvelleListe);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const nouvelleListe = [...liste];
    const [draggedItem] = nouvelleListe.splice(draggedIndex, 1);
    nouvelleListe.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setListe(nouvelleListe);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const sauvegarder = () => {
    const ids = liste.map((m) => m.id);
    localStorage.setItem(
      `excelis_ordre_matieres_${formationId}`,
      JSON.stringify(ids),
    );
    onOrdreChange(liste);
    onClose();
  };

  const reinitialiser = () => {
    localStorage.removeItem(`excelis_ordre_matieres_${formationId}`);
    setListe(matieres);
    onOrdreChange(matieres);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-white shadow-sm">
              <Columns size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ordre des colonnes de matières
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Filière : <strong className="text-slate-800">{formationNom}</strong> ({liste.length} disciplines)
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

        {/* Instructions */}
        <div className="py-3 text-xs text-slate-600 bg-amber-50/70 border-b border-amber-200/60 px-4 -mx-6 flex items-center gap-2">
          <Sparkles size={14} className="text-brand-orange shrink-0" />
          <span>
            Glissez-déposez les matières ou utilisez les flèches ↑ / ↓ pour ajuster l'ordre des colonnes de gauche à droite.
          </span>
        </div>

        {/* Liste réordonnable */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {liste.map((m, index) => {
            const hex = m.couleur || "#64748b";
            const isLight = isCouleurClaire(hex);
            const estPremier = index === 0;
            const estDernier = index === liste.length - 1;

            return (
              <div
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-2.5 rounded-xl border bg-white transition-all select-none ${
                  draggedIndex === index
                    ? "opacity-40 border-brand-orange scale-98"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                    title="Glisser pour réordonner"
                  >
                    <GripVertical size={16} />
                  </div>

                  {/* Numéro d'ordre */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-600">
                    {index + 1}
                  </span>

                  {/* Pastille et nom de matière */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="truncate text-xs font-bold text-slate-800 uppercase">
                      {m.nom}
                    </span>
                  </div>
                </div>

                {/* Boutons flèches monter/descendre */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => monter(index)}
                    disabled={estPremier}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    title="Déplacer vers la gauche (plus haut)"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => descendre(index)}
                    disabled={estDernier}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    title="Déplacer vers la droite (plus bas)"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied de modale avec boutons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={reinitialiser}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Rétablir l'ordre d'origine de la filière"
          >
            <RotateCcw size={13} />
            <span>Réinitialiser</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={sauvegarder}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>Appliquer l'ordre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

