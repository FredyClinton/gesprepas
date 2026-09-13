"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button } from "@/shared/ui";
import { useMotifs, useModifierEntree } from "../data/queries";
import {
  Coins,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  User,
} from "lucide-react";

const FCFA = new Intl.NumberFormat("fr-FR");

export interface VersementItem {
  id: string;
  montant: number;
  date: string;
  motifId: string;
  motifNom?: string;
  apprenantId?: string | null;
  apprenantNom?: string | null;
  bilanValide?: boolean;
}

interface ModifierVersementModalProps {
  isOpen: boolean;
  onClose: () => void;
  versement: VersementItem | null;
  soldeRestant?: number;
}

export function ModifierVersementModal({
  isOpen,
  onClose,
  versement,
  soldeRestant,
}: ModifierVersementModalProps) {
  const { data: motifs = [] } = useMotifs("ENTREE");
  const motifsActifs = useMemo(
    () => motifs.filter((m) => m.actif !== false),
    [motifs],
  );

  const [montant, setMontant] = useState<number | "">("");
  const [motifId, setMotifId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    if (versement) {
      setMontant(versement.montant);
      setMotifId(versement.motifId);
      setDate(versement.date ? versement.date.slice(0, 10) : "");
      setErreur(null);
      setSucces(false);
    }
  }, [versement]);

  const modifierEntreeMutation = useModifierEntree();

  // Max montant allowed if soldeRestant is known
  // (current soldeRestant + the previous versement amount)
  const maxMontant = useMemo(() => {
    if (soldeRestant === undefined || !versement) return undefined;
    return soldeRestant + versement.montant;
  }, [soldeRestant, versement]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!versement) return;
    setErreur(null);

    const m = Number(montant);
    if (!m || m <= 0) {
      setErreur("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    if (maxMontant !== undefined && maxMontant > 0 && m > maxMontant) {
      setErreur(
        `Le montant saisi (${FCFA.format(m)} FCFA) dépasse le solde restant autorisé (${FCFA.format(
          maxMontant,
        )} FCFA).`,
      );
      return;
    }

    if (!motifId) {
      setErreur("Veuillez sélectionner un motif.");
      return;
    }

    if (!date) {
      setErreur("Veuillez renseigner une date valide.");
      return;
    }

    try {
      await modifierEntreeMutation.mutateAsync({
        id: versement.id,
        input: {
          montant: m,
          date,
          motifId,
          apprenantId: versement.apprenantId || undefined,
        },
      });

      setSucces(true);
      setTimeout(() => {
        setSucces(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du versement. Vérifiez que le bilan n'a pas été validé.";
      setErreur(msg);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le versement"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{erreur}</span>
          </div>
        )}

        {succes && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>Versement modifié avec succès !</span>
          </div>
        )}

        {/* Bénéficiaire / Apprenant info */}
        {versement?.apprenantNom && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2.5">
            <User size={16} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Apprenant
              </span>
              <span className="text-xs font-bold text-slate-800">
                {versement.apprenantNom}
              </span>
            </div>
          </div>
        )}

        {/* Motif */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Tag size={13} className="text-slate-400" />
            <span>Motif</span> <span className="text-rose-500">*</span>
          </label>
          <select
            value={motifId}
            onChange={(e) => {
              setMotifId(e.target.value);
              setErreur(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
          >
            {motifsActifs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Coins size={13} className="text-brand-orange" />
              <span>Montant (FCFA)</span> <span className="text-rose-500">*</span>
            </span>
            {maxMontant !== undefined && maxMontant > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                Max : {FCFA.format(maxMontant)} F
              </span>
            )}
          </label>
          <input
            type="number"
            required
            min={1}
            max={maxMontant}
            value={montant}
            onChange={(e) => setMontant(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-black text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span>Date</span> <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Note: La modification n'est autorisée que si le bilan du jour n'a pas encore été clôturé.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={modifierEntreeMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={modifierEntreeMutation.isPending}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold"
          >
            {modifierEntreeMutation.isPending ? "Modification..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

