"use client";

import React, { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import { SelecteurEtablissement } from "@/modules/academique/components/SelecteurEtablissement";
import { useModifierApprenant, type Apprenant } from "@/modules/apprenants";
import {
  User,
  Phone,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ModifierApprenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprenant: Apprenant;
}

export function ModifierApprenantModal({
  isOpen,
  onClose,
  apprenant,
}: ModifierApprenantModalProps) {
  const [nom, setNom] = useState(apprenant.nom || "");
  const [prenom, setPrenom] = useState(apprenant.prenom || "");
  const [dateNaissance, setDateNaissance] = useState(
    apprenant.dateNaissance ? apprenant.dateNaissance.slice(0, 10) : "",
  );
  const [contactApprenant, setContactApprenant] = useState(
    apprenant.contactApprenant || "",
  );
  const [etablissementOrigine, setEtablissementOrigine] = useState(
    apprenant.etablissementOrigine || "",
  );
  const [nomParent, setNomParent] = useState(apprenant.nomParent || "");
  const [contactParent, setContactParent] = useState(
    apprenant.contactParent || "",
  );

  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const modifierMutation = useModifierApprenant();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!nom.trim() || !prenom.trim()) {
      setErreur("Le nom et le prénom sont obligatoires.");
      return;
    }
    if (!dateNaissance) {
      setErreur("La date de naissance est obligatoire.");
      return;
    }

    try {
      await modifierMutation.mutateAsync({
        id: apprenant.id,
        input: {
          nom: nom.trim(),
          prenom: prenom.trim(),
          dateNaissance,
          contactApprenant: contactApprenant.trim() || undefined,
          nomParent: nomParent.trim() || undefined,
          contactParent: contactParent.trim() || undefined,
          etablissementOrigine: etablissementOrigine.trim() || undefined,
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
          : "Erreur lors de la modification des informations.";
      setErreur(msg);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier les coordonnées de l'apprenant"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{erreur}</span>
          </div>
        )}

        {succes && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>Informations mises à jour avec succès !</span>
          </div>
        )}

        {/* ── Section Identité ── */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User size={13} className="text-brand-orange" />
            <span>Identité & État civil</span>
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: TCHANA"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: Jean-Luc"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>Date de naissance</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                <span>Téléphone de l'apprenant</span>
              </label>
              <input
                type="tel"
                value={contactApprenant}
                onChange={(e) => setContactApprenant(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: 699 00 11 22"
              />
            </div>
          </div>
        </div>

        {/* ── Section Établissement d'origine ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 size={13} className="text-brand-orange" />
            <span>Établissement ou Lycée d'origine</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lycée d'origine (Saisie ou sélection catalogue)
            </label>
            <SelecteurEtablissement
              value={etablissementOrigine}
              onChange={setEtablissementOrigine}
              placeholder="Rechercher ou ajouter un lycée..."
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Vous pouvez sélectionner un lycée existant ou cliquer sur "Enregistrer au catalogue" pour ajouter un nouvel établissement.
            </p>
          </div>
        </div>

        {/* ── Section Parent / Tuteur ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User size={13} className="text-brand-orange" />
            <span>Parent / Tuteur</span>
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet du parent
              </label>
              <input
                type="text"
                value={nomParent}
                onChange={(e) => setNomParent(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: M. TCHANA Pierre"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                <span>Contact téléphonique du parent</span>
              </label>
              <input
                type="tel"
                value={contactParent}
                onChange={(e) => setContactParent(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: 677 88 99 00"
              />
            </div>
          </div>
        </div>

        {/* ── Actions du formulaire ── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={modifierMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={modifierMutation.isPending}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold"
          >
            {modifierMutation.isPending ? "Enregistrement..." : "Sauvegarder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
