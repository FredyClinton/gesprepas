"use client";

import React, { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import { GraduationCap, ArrowRight, Check } from "lucide-react";
import { useFormations } from "@/modules/academique";
import { useChangerFormationPhase, type InscriptionPhase } from "@/modules/apprenants";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apprenantId: string;
  nomApprenant: string;
  inscriptionActive?: InscriptionPhase | null;
  nomFormationActuelle?: string;
  nomPhaseActuelle?: string;
}

export function ChangerFormationModal({
  isOpen,
  onClose,
  apprenantId,
  nomApprenant,
  inscriptionActive,
  nomFormationActuelle = "Filière actuelle",
  nomPhaseActuelle = "Phase active",
}: Props) {
  const { data: formations = [] } = useFormations();
  const changerMutation = useChangerFormationPhase();

  const [nouvelleFormationId, setNouvelleFormationId] = useState<string>("");
  const [erreur, setErreur] = useState<string>("");

  React.useEffect(() => {
    if (formations.length > 0 && !nouvelleFormationId) {
      const autre = formations.find((f) => f.id !== inscriptionActive?.formationId);
      setNouvelleFormationId(autre?.id || formations[0].id);
    }
  }, [formations, inscriptionActive, nouvelleFormationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");

    if (!inscriptionActive) {
      setErreur("Aucune phase active éligible au changement n'a été détectée.");
      return;
    }

    if (!nouvelleFormationId || nouvelleFormationId === inscriptionActive.formationId) {
      setErreur("Veuillez sélectionner une filière distincte de la filière actuelle.");
      return;
    }

    try {
      await changerMutation.mutateAsync({
        apprenantId,
        phaseId: inscriptionActive.phaseId,
        nouvelleFormationId,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErreur("Une erreur est survenue lors de la réaffectation de la formation.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Changer de Filière en cours de Phase">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
          <p className="font-bold text-slate-900">
            Apprenant : {nomApprenant}
          </p>
          <div className="flex items-center gap-2 mt-2 font-semibold">
            <span className="rounded-lg bg-orange-100 text-brand-orange px-2 py-0.5">
              {nomPhaseActuelle}
            </span>
            <span className="text-slate-800 font-bold">{nomFormationActuelle}</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="text-emerald-700 font-bold">Nouvelle filière</span>
          </div>
        </div>

        {erreur && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
            {erreur}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-brand-orange" />
            <span>Sélectionner la nouvelle filière d&rsquo;accueil</span>
          </label>
          <select
            value={nouvelleFormationId}
            onChange={(e) => setNouvelleFormationId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange"
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id} disabled={f.id === inscriptionActive?.formationId}>
                {f.nom} {f.id === inscriptionActive?.formationId ? "(Filière actuelle)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            L&rsquo;historique de l&rsquo;ancienne filière est conservé et les règlements financiers restent acquis à l&rsquo;élève.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={changerMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>
              {changerMutation.isPending ? "Transfert en cours..." : "Confirmer le changement"}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

