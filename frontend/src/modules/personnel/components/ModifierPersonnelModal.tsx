"use client";

import { useEffect, useState } from "react";
import { Edit3, AlertCircle } from "lucide-react";

import { Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { useModifierPersonnel } from "../data/queries";

type PersonnelCible = {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  numeroCni?: string | null;
  email?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  personnel: PersonnelCible | null;
};

export function ModifierPersonnelModal({ isOpen, onClose, personnel }: Props) {
  const modifierMutation = useModifierPersonnel();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (personnel) {
      setNom(personnel.nom || "");
      setPrenom(personnel.prenom || "");
      setTelephone(personnel.telephone || "");
      setNumeroCni(personnel.numeroCni || "");
      setEmail(personnel.email || "");
      setErreur(null);
    }
  }, [personnel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel) return;
    setErreur(null);

    if (!nom.trim() || !prenom.trim()) {
      setErreur("Le nom et le prénom sont obligatoires.");
      return;
    }

    try {
      await modifierMutation.mutateAsync({
        id: personnel.id,
        input: {
          nom: nom.trim(),
          prenom: prenom.trim(),
          telephone: telephone.trim() || null,
          numeroCni: numeroCni.trim() || null,
          email: email.trim() || null,
        },
      });
      onClose();
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier les Coordonnées du Collaborateur"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {erreur && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prénom <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro CNI</label>
            <input
              type="text"
              value={numeroCni}
              onChange={(e) => setNumeroCni(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={modifierMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={modifierMutation.isPending}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50 min-w-[120px]"
          >
            {modifierMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
