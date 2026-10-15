"use client";

import React, { useState } from "react";
import { AlertCircle, Coins, Loader2 } from "lucide-react";
import { Modal, Button } from "@/shared/ui";
import { useSession } from "next-auth/react";
import {
  useEnregistrerPaiementDossier,
  useSoldeDossierConcours,
  type DossierConcours,
} from "@/modules/dossiers";
import { useMotifs } from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

interface EnregistrerPaiementDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierConcours: DossierConcours | null;
  nomConcours?: string;
  nomApprenant?: string;
  onSuccess?: () => void;
}

export function EnregistrerPaiementDossierModal(props: EnregistrerPaiementDossierModalProps) {
  if (!props.isOpen || !props.dossierConcours) return null;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Encaisser les frais de dossier"
      maxWidth="max-w-lg"
    >
      <EnregistrerPaiementDossierForm
        key={props.dossierConcours.id}
        {...props}
        dossierConcours={props.dossierConcours}
      />
    </Modal>
  );
}

function EnregistrerPaiementDossierForm({
  onClose,
  dossierConcours,
  nomConcours,
  nomApprenant,
  onSuccess,
}: EnregistrerPaiementDossierModalProps & { dossierConcours: DossierConcours }) {
  const { data: session } = useSession();
  const { data: solde } = useSoldeDossierConcours(dossierConcours.id);
  const { data: motifs = [] } = useMotifs("ENTREE");

  const defaultMotif =
    motifs.find(
      (m) =>
        m.nom.toLowerCase().includes("dossier") ||
        m.nom.toLowerCase().includes("concours"),
    ) || motifs[0];

  const [montant, setMontant] = useState<number>(solde?.soldeRestant ?? 0);
  const [motifId, setMotifId] = useState(defaultMotif?.id || "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrerPaiementMutation = useEnregistrerPaiementDossier();

  const effectiveMotifId = motifId || defaultMotif?.id || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (montant <= 0) {
      setErreur("Le montant doit être supérieur à 0 FCFA.");
      return;
    }
    if (!effectiveMotifId) {
      setErreur("Veuillez sélectionner un motif d'encaissement.");
      return;
    }
    if (!session?.user?.id) {
      setErreur("Session utilisateur non valide.");
      return;
    }

    try {
      await enregistrerPaiementMutation.mutateAsync({
        dossierConcoursId: dossierConcours.id,
        input: {
          motifId: effectiveMotifId,
          montant,
          date,
          saisiParUtilisateurId: session.user.id,
        },
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErreur(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'enregistrement du versement.",
      );
    }
  }

  const soldeRestant = solde ? solde.soldeRestant : dossierConcours.montantTotal;
  const montantPaye = solde ? solde.montantPaye : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erreur && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Cartouche récapitulatif */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Candidat :</span>
          <span className="text-slate-900 font-bold">{nomApprenant || "Élève"}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Concours :</span>
          <span className="text-brand-orange font-bold">{nomConcours || "Concours"}</span>
        </div>
        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total dû</span>
            <span className="font-mono font-bold text-slate-800">
              {FCFA.format(dossierConcours.montantTotal)} FCFA
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Déjà réglé</span>
            <span className="font-mono font-bold text-emerald-700">
              {FCFA.format(montantPaye)} FCFA
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Reste dû</span>
            <span className="font-mono font-bold text-brand-orange">
              {FCFA.format(soldeRestant)} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* Raccourcis de tranches / paiement en plusieurs étapes */}
      {soldeRestant > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500">
            Paiement par étapes (acomptes / tranches) :
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMontant(soldeRestant)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                montant === soldeRestant
                  ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange"
              }`}
            >
              Tout solder ({FCFA.format(soldeRestant)} F)
            </button>
            {soldeRestant >= 2000 && (
              <button
                type="button"
                onClick={() => setMontant(Math.round(soldeRestant / 2 / 100) * 100)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  montant === Math.round(soldeRestant / 2 / 100) * 100
                    ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange"
                }`}
              >
                Acompte 50% ({FCFA.format(Math.round(soldeRestant / 2 / 100) * 100)} F)
              </button>
            )}
            {soldeRestant >= 10000 && (
              <button
                type="button"
                onClick={() => setMontant(10000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  montant === 10000
                    ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange"
                }`}
              >
                Tranche 10 000 F
              </button>
            )}
            {soldeRestant >= 5000 && soldeRestant !== 5000 && (
              <button
                type="button"
                onClick={() => setMontant(5000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  montant === 5000
                    ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange"
                }`}
              >
                Tranche 5 000 F
              </button>
            )}
          </div>
        </div>
      )}

      {/* Montant à encaisser */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Coins size={14} className="text-brand-orange" />
            Montant de cette étape (FCFA)
          </label>
        </div>
        <div className="relative">
          <input
            type="number"
            min={100}
            step={100}
            max={soldeRestant > 0 ? soldeRestant : undefined}
            value={montant || ""}
            onChange={(e) => setMontant(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="Ex : 10000"
            className="w-full p-2.5 pr-16 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
            required
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            FCFA
          </span>
        </div>
      </div>

      {/* Simulation / Feedback de l'étape de versement */}
      {montant > 0 && (
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-medium">Nouveau solde après cette étape :</span>
            <span
              className={`font-mono font-bold ${
                soldeRestant - montant <= 0 ? "text-emerald-700" : "text-brand-orange"
              }`}
            >
              {soldeRestant - montant <= 0
                ? "0 FCFA (Soldé intégralement)"
                : `${FCFA.format(soldeRestant - montant)} FCFA restant`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {soldeRestant - montant <= 0
              ? "✅ Ce versement régularise entièrement les frais de ce concours."
              : `ℹ️ Versement partiel : l'apprenant pourra solder les ${FCFA.format(
                  soldeRestant - montant,
                )} FCFA restants lors d'une étape ultérieure.`}
          </p>
        </div>
      )}

      {/* Motif d'encaissement */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Motif comptable / Journal
        </label>
        <select
          value={effectiveMotifId}
          onChange={(e) => setMotifId(e.target.value)}
          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all font-medium cursor-pointer"
          required
        >
          {motifs.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Date du versement */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Date du versement
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={enregistrerPaiementMutation.isPending}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={enregistrerPaiementMutation.isPending || montant <= 0}
          className="bg-brand-orange text-white hover:bg-brand-orange/90 font-semibold"
        >
          {enregistrerPaiementMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" /> Enregistrement...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Coins size={15} /> Valider l&rsquo;encaissement
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
