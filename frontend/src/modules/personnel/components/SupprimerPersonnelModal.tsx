"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, AlertCircle } from "lucide-react";

import { Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { useSupprimerPersonnel } from "../data/queries";

type PersonnelCible = {
  id: string;
  nom: string;
  prenom: string;
  hasUserAccount: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  personnel: PersonnelCible | null;
};

export function SupprimerPersonnelModal({ isOpen, onClose, personnel }: Props) {
  const supprimerMutation = useSupprimerPersonnel();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleConfirmer = async () => {
    if (!personnel) return;
    setErreur(null);

    try {
      await supprimerMutation.mutateAsync(personnel.id);
      onClose();
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer un Membre du Personnel"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-rose-800 text-sm">Action irréversible</p>
            <p>
              Êtes-vous sûr de vouloir supprimer définitivement le collaborateur{" "}
              <strong>
                {personnel?.prenom} {personnel?.nom}
              </strong>{" "}
              du registre des ressources humaines ?
            </p>
            {personnel?.hasUserAccount && (
              <p className="text-rose-700 font-semibold pt-1">
                ⚠️ Son compte utilisateur applicatif sera également révoqué.
              </p>
            )}
          </div>
        </div>

        {erreur && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={supprimerMutation.isPending}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmer}
            disabled={supprimerMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{supprimerMutation.isPending ? "Suppression..." : "Supprimer définitivement"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
