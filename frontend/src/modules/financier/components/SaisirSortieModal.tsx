"use client";

import React, { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import { useMotifs, useSaisirSortie } from "../data/queries";
import { UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

const FCFA = new Intl.NumberFormat("fr-FR");

interface SaisirSortieModalProps {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  sessionId: string;
  dateDefaut?: string;
}

export function SaisirSortieModal({
  isOpen,
  onClose,
  centreId,
  sessionId,
  dateDefaut,
}: SaisirSortieModalProps) {
  const { data: session } = useSession();
  const rawUserId = session?.user?.id;
  const isUUID =
    rawUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);
  const userId = isUUID ? rawUserId : "00000000-0000-0000-0000-000000000000";

  const { data: motifs = [], isLoading: chargementMotifs } = useMotifs("SORTIE");
  const { mutate: creerSortie, isPending } = useSaisirSortie();

  const [motifId, setMotifId] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(dateDefaut || new Date().toISOString().slice(0, 10));
  const [ordonnateur, setOrdonnateur] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  // Suggestions usuelles d'ordonnateurs dans l'établissement
  const suggestionsOrdonnateurs = [
    "Directeur Général",
    "Chef de Centre",
    "Directeur Académique",
    "Comptable",
    "Responsable Administratif",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const montantNum = parseFloat(montant.replace(/\s/g, ""));
    if (isNaN(montantNum) || montantNum <= 0) {
      setErreur("Le montant doit être un nombre strictement positif.");
      return;
    }

    if (!motifId) {
      setErreur("Veuillez sélectionner le motif de la dépense.");
      return;
    }

    if (!ordonnateur.trim()) {
      setErreur("Veuillez renseigner le nom ou la qualité de l'ordonnateur.");
      return;
    }

    creerSortie(
      {
        sessionId,
        centreId,
        motifId,
        montant: montantNum,
        date,
        saisiParUtilisateurId: userId,
        ordonnateur: ordonnateur.trim(),
      },
      {
        onSuccess: () => {
          setSucces(true);
          setTimeout(() => {
            setSucces(false);
            setMontant("");
            setMotifId("");
            setOrdonnateur("");
            onClose();
          }, 1200);
        },
        onError: (err: unknown) => {
          const errObj = err as { message?: string };
          setErreur(
            errObj?.message ||
              "Une erreur est survenue lors de l'enregistrement de la sortie. Veuillez vérifier si le bilan de la journée n'est pas déjà clôturé.",
          );
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer une Sortie de Caisse">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {erreur && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{erreur}</span>
          </div>
        )}

        {succes && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Sortie de caisse enregistrée avec succès.</span>
          </div>
        )}

        {/* Motif de la sortie */}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Motif de la dépense <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={motifId}
              onChange={(e) => setMotifId(e.target.value)}
              required
              disabled={chargementMotifs || isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            >
              <option value="">-- Sélectionner un motif de sortie --</option>
              {motifs
                .filter((m) => m.actif)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Montant */}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Montant décaissé (en FCFA) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex : 25000"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm font-semibold text-slate-900 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
              XAF
            </span>
          </div>
          {montant && !isNaN(Number(montant)) && Number(montant) > 0 && (
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Soit : <span className="font-bold text-slate-700">{FCFA.format(Number(montant))} FCFA</span>
            </p>
          )}
        </div>

        {/* Ordonnateur */}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Ordonnateur (Demandeur / Autorisé par) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            list="suggestions-ordonnateurs"
            value={ordonnateur}
            onChange={(e) => setOrdonnateur(e.target.value)}
            placeholder="Ex : M. le Directeur ou Nom du demandeur"
            required
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
          <datalist id="suggestions-ordonnateurs">
            {suggestionsOrdonnateurs.map((sug, i) => (
              <option key={i} value={sug} />
            ))}
          </datalist>
          <p className="mt-1 text-[10px] text-slate-400">
            La personne qui a ordonné ou engagé la dépense pour le centre.
          </p>
        </div>

        {/* Date d'effet */}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Date de l&apos;opération <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        {/* Traçabilité du Validateur / Caissier */}
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-slate-500">
            <UserCheck size={14} className="text-emerald-600" />
            Validateur (agent connecté) :
          </span>
          <span className="font-bold text-slate-800">
            {session?.user?.name || session?.user?.email || "Agent de caisse"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            disabled={isPending || !motifId || !montant || !ordonnateur.trim()}
          >
            {isPending ? "Enregistrement..." : "Enregistrer la sortie"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
