"use client";

import React, { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import {
  useCreerPieceRequise,
  useModifierPieceRequise,
  type PieceRequise,
} from "@/modules/dossiers";
import { AlertCircle, FileText, Loader2, Save, Plus } from "lucide-react";

interface CreerModifierPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieceAEditer?: PieceRequise | null;
  onSuccess?: () => void;
}

export function CreerModifierPieceModal({
  isOpen,
  onClose,
  pieceAEditer,
  onSuccess,
}: CreerModifierPieceModalProps) {
  if (!isOpen) return null;

  return (
    <CreerModifierPieceForm
      key={pieceAEditer ? pieceAEditer.id : "nouveau"}
      isOpen={isOpen}
      onClose={onClose}
      pieceAEditer={pieceAEditer}
      onSuccess={onSuccess}
    />
  );
}

function CreerModifierPieceForm({
  isOpen,
  onClose,
  pieceAEditer,
  onSuccess,
}: CreerModifierPieceModalProps) {
  const [nom, setNom] = useState(pieceAEditer ? pieceAEditer.nom : "");
  const [montant, setMontant] = useState<number>(pieceAEditer ? pieceAEditer.montant : 1500);
  const [erreur, setErreur] = useState<string | null>(null);

  const creerMutation = useCreerPieceRequise();
  const modifierMutation = useModifierPieceRequise();

  const isPending = creerMutation.isPending || modifierMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    const nomNettoye = nom.trim();
    if (!nomNettoye) {
      setErreur("Veuillez renseigner le libellé de la pièce.");
      return;
    }
    if (montant < 0) {
      setErreur("Le montant ne peut pas être négatif.");
      return;
    }

    try {
      if (pieceAEditer) {
        await modifierMutation.mutateAsync({
          id: pieceAEditer.id,
          input: { nom: nomNettoye, montant },
        });
      } else {
        await creerMutation.mutateAsync({
          nom: nomNettoye,
          montant,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.",
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pieceAEditer ? "Modifier la pièce requise" : "Ajouter une pièce au catalogue"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erreur && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-brand-orange" />
            Intitulé de la pièce
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Acte de naissance certifié, 4 Photos 4x4..."
            className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Tarif / Frais de confection (FCFA)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={100}
              value={montant}
              onChange={(e) => setMontant(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full p-2.5 pr-16 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              FCFA
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ce montant servira de tarif standard lors de la sélection de cette pièce pour un concours.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending} className="bg-brand-orange text-white hover:bg-brand-orange/90 font-semibold">
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Enregistrement...
              </span>
            ) : pieceAEditer ? (
              <span className="flex items-center gap-2">
                <Save size={15} /> Mettre à jour
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus size={15} /> Ajouter la pièce
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
