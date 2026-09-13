"use client";

import React, { useState } from "react";
import { Modal, Button, Input } from "@/shared/ui";
import { Layers, GraduationCap, Coins, FileText, Check } from "lucide-react";
import { usePhases, useFormations } from "@/modules/academique";
import { useCreerContratPhase } from "@/modules/apprenants";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apprenantId: string;
  nomApprenant: string;
  phasesDejaSuivies?: string[];
}

export function NegocierContratPhaseModal({
  isOpen,
  onClose,
  apprenantId,
  nomApprenant,
  phasesDejaSuivies = [],
}: Props) {
  const { data: phases = [] } = usePhases();
  const { data: formations = [] } = useFormations();
  const creerContratMutation = useCreerContratPhase();

  const [phaseId, setPhaseId] = useState<string>("");
  const [formationId, setFormationId] = useState<string>("");
  const [montant, setMontant] = useState<string>("");
  const [observations, setObservations] = useState<string>("");
  const [erreur, setErreur] = useState<string>("");

  // Pré-sélectionner la première phase non encore suivie si possible
  React.useEffect(() => {
    if (phases.length > 0 && !phaseId) {
      const nonSuivie = phases.find((p) => !phasesDejaSuivies.includes(p.id));
      setPhaseId(nonSuivie?.id || phases[0].id);
    }
  }, [phases, phasesDejaSuivies, phaseId]);

  React.useEffect(() => {
    if (formations.length > 0 && !formationId) {
      setFormationId(formations[0].id);
    }
  }, [formations, formationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");

    const montantNum = Number(montant.replace(/\D/g, ""));
    if (!phaseId) {
      setErreur("Veuillez sélectionner la phase pédagogique.");
      return;
    }
    if (!formationId) {
      setErreur("Veuillez sélectionner la filière / formation.");
      return;
    }
    if (!montantNum || montantNum <= 0) {
      setErreur("Veuillez indiquer un montant de contrat valide supérieur à 0 FCFA.");
      return;
    }

    try {
      await creerContratMutation.mutateAsync({
        apprenantId,
        payload: {
          phaseId,
          formationId,
          montantContrat: montantNum,
          observations: observations.trim() || undefined,
        },
      });
      onClose();
      setMontant("");
      setObservations("");
    } catch (err) {
      console.error(err);
      setErreur("Une erreur est survenue lors de l'enregistrement du contrat.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Négocier un Contrat pour une Nouvelle Phase">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 text-xs text-brand-anthracite">
          <p className="font-bold text-brand-orange">
            Apprenant : {nomApprenant}
          </p>
          <p className="text-slate-600 mt-0.5">
            L&rsquo;enregistrement d&rsquo;une nouvelle phase génère un contrat dédié sans écraser les filières et contrats des phases antérieures.
          </p>
        </div>

        {erreur && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
            {erreur}
          </div>
        )}

        {/* 1. Sélection de la Phase */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Layers size={13} className="text-brand-orange" />
            <span>Phase Pédagogique cible</span>
          </label>
          <select
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange"
          >
            {phases.map((p) => {
              const dejaFaite = phasesDejaSuivies.includes(p.id);
              return (
                <option key={p.id} value={p.id}>
                  {p.libelle} ({p.code}) {dejaFaite ? "— Déjà suivie" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Sélection de la Filière pour cette Phase */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-brand-orange" />
            <span>Filière / Formation pour cette phase</span>
          </label>
          <select
            value={formationId}
            onChange={(e) => setFormationId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange"
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            L&rsquo;élève peut choisir une filière différente de sa phase précédente (ex: AHN en Phase 1 puis SANTÉ en Phase 2).
          </p>
        </div>

        {/* 3. Montant du Contrat convenu */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Coins size={13} className="text-brand-orange" />
            <span>Montant convenu pour cette phase (FCFA)</span>
          </label>
          <input
            type="number"
            min={0}
            step={5000}
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Ex: 150000"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange"
          />
        </div>

        {/* 4. Observations */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText size={13} className="text-slate-400" />
            <span>Observations ou modalités spécifiques (optionnel)</span>
          </label>
          <input
            type="text"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex: Remise accordée, Avenant spécial Phase 2..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={creerContratMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>
              {creerContratMutation.isPending ? "Enregistrement..." : "Valider le nouveau contrat"}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

