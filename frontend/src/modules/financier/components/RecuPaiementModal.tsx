"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, Logo } from "@/shared/ui";
import { Printer, CheckCircle2, X } from "lucide-react";
import { montantEnLettresFCFA } from "@/shared/lib/nombre-en-lettres";

const FCFA = new Intl.NumberFormat("fr-FR");

export interface DonneesRecuPaiement {
  id?: string;
  referenceRecu?: string;
  date: string;
  heure?: string;
  montant: number;
  nomApprenant: string;
  contactApprenant?: string;
  nomFormation?: string;
  motif: string;
  nomCentre: string;
  nomCaissier: string;
  montantContrat?: number;
  totalVerse?: number;
  soldeRestant?: number;
}

interface RecuPaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  recu: DonneesRecuPaiement | null;
}

export function RecuPaiementModal({ isOpen, onClose, recu }: RecuPaiementModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("print-modal-open");
    }
    return () => {
      document.body.classList.remove("print-modal-open");
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !recu) return null;

  const referenceAffichee =
    recu.referenceRecu ||
    `REC-${recu.date.replace(/-/g, "")}-${(recu.id || "000000").slice(0, 6).toUpperCase()}`;

  const heureAffichee =
    recu.heure ||
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const dateFormatee = new Date(recu.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="printable-modal print-portrait fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-brand-anthracite/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <style dangerouslySetInnerHTML={{ __html: "@page { size: A4 portrait; margin: 6mm 6mm; }" }} />
      <div
        className="printable-dialog relative w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale (masqué à l'impression) */}
        <div className="no-print print:hidden flex items-center justify-between gap-4 pb-4 mb-3 border-b border-brand-gray/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-brand-anthracite">
                Reçu d&apos;encaissement officiel
              </h2>
              <p className="text-xs text-brand-gray font-medium">
                Réf. {referenceAffichee} • Enregistré en caisse
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="primary"
              className="text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le reçu</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Zone Imprimable : Fiche officielle avec 2 volets (Apprenant + Caisse) */}
        <div className="printable-body overflow-y-auto pr-1 text-brand-anthracite bg-white print:p-0 print:overflow-visible">
          {/* VOLET 1 : EXEMPLAIRE APPRENANT */}
          <div className="border-2 border-brand-anthracite rounded-2xl p-6 bg-white shadow-xs relative print:border-brand-anthracite print:shadow-none">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 text-[11px] font-black tracking-wider uppercase bg-brand-anthracite text-white rounded-lg">
                Exemplaire Apprenant
              </span>
            </div>

            {/* En-tête */}
            <div className="flex items-start gap-4 pb-4 border-b border-brand-gray/20">
              <Logo className="h-10 w-auto object-contain shrink-0" priority />
              <div className="flex-1">
                <div>
                  <span className="text-[11px] font-bold text-brand-orange px-2 py-0.5 rounded-md bg-brand-orange/10 border border-brand-orange/20">
                    Prépa Concours & Enseignement Supérieur
                  </span>
                </div>
                <p className="text-xs text-brand-gray mt-1.5">
                  Centre de rattachement : <strong className="text-brand-anthracite">{recu.nomCentre}</strong>
                </p>
              </div>
              <div className="text-right pr-32">
                <p className="text-xs font-black text-brand-anthracite">N° {referenceAffichee}</p>
                <p className="text-[11px] text-brand-gray font-medium">
                  Le {dateFormatee} à {heureAffichee}
                </p>
              </div>
            </div>

            {/* Corps du Reçu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <p className="text-brand-gray font-bold text-[11px] uppercase tracking-wider">Élève bénéficiaire :</p>
                <p className="text-sm font-black text-brand-anthracite uppercase">
                  {recu.nomApprenant}
                </p>
                {recu.contactApprenant && (
                  <p className="text-brand-gray font-medium">Contact : <span className="text-brand-anthracite">{recu.contactApprenant}</span></p>
                )}
                {recu.nomFormation && (
                  <p className="text-brand-gray font-medium">
                    Formation : <strong className="text-brand-anthracite">{recu.nomFormation}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-brand-gray/20">
                <div className="flex justify-between">
                  <span className="text-brand-gray font-bold">Motif du versement :</span>
                  <span className="font-bold text-brand-anthracite">{recu.motif}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray font-bold">Mode de règlement :</span>
                  <span className="font-bold text-brand-anthracite">Espèces / Guichet</span>
                </div>
                {recu.montantContrat !== undefined && (
                  <div className="flex justify-between text-[11px] text-brand-gray pt-1.5 border-t border-brand-gray/20 font-medium">
                    <span>Scolarité contractuelle :</span>
                    <span className="font-bold text-brand-anthracite">{FCFA.format(recu.montantContrat)} FCFA</span>
                  </div>
                )}
              </div>
            </div>

            {/* Montant Payé */}
            <div className="p-4 bg-brand-orange/10 border-2 border-brand-orange/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-black text-brand-anthracite uppercase tracking-wider">
                  Montant Réglé en Espèces :
                </span>
                <p className="text-xs italic text-brand-anthracite font-bold mt-0.5">
                  &laquo; {montantEnLettresFCFA(recu.montant)} &raquo;
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-orange tabular-nums">
                  {FCFA.format(recu.montant)} <span className="text-xs font-bold text-brand-anthracite">FCFA</span>
                </span>
              </div>
            </div>

            {/* Situation Solde */}
            {recu.soldeRestant !== undefined && (
              <div className="mt-3 flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-xl border border-brand-gray/20">
                <span className="text-brand-gray font-bold">Reliquat / Reste à payer après ce versement :</span>
                <span className={`font-black ${recu.soldeRestant > 0 ? "text-brand-orange" : "text-emerald-700"}`}>
                  {FCFA.format(Math.max(0, recu.soldeRestant))} FCFA
                </span>
              </div>
            )}

            {/* Signatures & Mentions */}
            <div className="grid grid-cols-2 gap-4 pt-4 mt-2 text-xs border-t border-brand-gray/20">
              <div>
                <p className="text-[11px] text-brand-gray font-bold mb-10">Signature de l&apos;élève ou parent :</p>
                <div className="border-b border-dashed border-brand-gray/40 w-40"></div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-brand-gray font-medium mb-1">
                  Caissier en service : <strong className="text-brand-anthracite">{recu.nomCaissier}</strong>
                </p>
                <p className="text-[11px] text-brand-gray font-bold mb-8">Cachet officiel de la Caisse</p>
                <div className="border-b border-dashed border-brand-gray/40 w-40 ml-auto"></div>
              </div>
            </div>

            <p className="text-[9px] text-brand-gray text-center mt-3 pt-2 border-t border-slate-100 font-medium">
              Les sommes versées ne sont ni remboursables ni transférables. Conservez précieusement ce reçu original pour tout justificatif.
            </p>
          </div>

          {/* LIGNE DE DÉCOUPE POINTILLÉE POUR L'IMPRESSION */}
          <div className="relative flex py-2 items-center print:py-4">
            <div className="flex-grow border-t-2 border-dashed border-brand-gray/30"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-brand-gray font-bold flex items-center gap-1.5">
              ✂ Ligne de découpe • Souche Caisse ci-dessous
            </span>
            <div className="flex-grow border-t-2 border-dashed border-brand-gray/30"></div>
          </div>

          {/* VOLET 2 : SOUCHE CAISSE / COMPTABILITÉ */}
          <div className="border-2 border-brand-anthracite rounded-2xl p-6 bg-white shadow-xs relative print:border-brand-anthracite print:shadow-none">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 text-[11px] font-black tracking-wider uppercase bg-brand-anthracite text-white rounded-lg">
                Souche Caisse & Contrôle
              </span>
            </div>

            {/* En-tête souche */}
            <div className="flex items-start gap-4 pb-3 border-b border-brand-gray/20">
              <Logo className="h-8 w-auto object-contain shrink-0" priority />
              <div className="flex-1">
                <h2 className="text-sm font-black tracking-wider text-brand-anthracite uppercase">
                  SOUCHE CAISSE & CONTRÔLE
                </h2>
                <p className="text-xs text-brand-gray mt-0.5">
                  Centre : <strong className="text-brand-anthracite">{recu.nomCentre}</strong>
                </p>
              </div>
              <div className="text-right pr-32">
                <p className="text-xs font-black text-brand-anthracite">Réf. {referenceAffichee}</p>
                <p className="text-[11px] text-brand-gray font-medium">
                  {dateFormatee} • {heureAffichee}
                </p>
              </div>
            </div>

            {/* Données de transaction */}
            <div className="grid grid-cols-2 gap-4 py-3 text-xs">
              <div>
                <p className="text-brand-gray font-bold text-[11px] uppercase tracking-wider">Apprenant :</p>
                <p className="text-sm font-black text-brand-anthracite uppercase">{recu.nomApprenant}</p>
                <p className="text-brand-gray mt-0.5">{recu.nomFormation || "Formation régulière"}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-brand-gray">Motif : <strong className="text-brand-anthracite">{recu.motif}</strong></p>
                <p className="text-xl font-black text-brand-orange tabular-nums">
                  {FCFA.format(recu.montant)} FCFA
                </p>
                {recu.soldeRestant !== undefined && (
                  <p className="text-[11px] text-brand-gray font-medium">
                    Solde restant dû : <strong className="text-brand-anthracite">{FCFA.format(Math.max(0, recu.soldeRestant))} FCFA</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end pt-3 mt-1 border-t border-brand-gray/20 text-xs">
              <p className="text-[11px] text-brand-gray font-medium">
                Opérateur caisse : <strong className="text-brand-anthracite">{recu.nomCaissier}</strong>
              </p>
              <div className="text-right">
                <p className="text-[10px] text-brand-gray font-bold mb-6">Visa & Émargement Caissier</p>
                <div className="border-b border-dashed border-brand-gray/40 w-36 ml-auto"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de pied de page pour fermer */}
        <div className="no-print print:hidden flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-xl">
            Fermer
          </Button>
          <Button
            onClick={handlePrint}
            variant="primary"
            className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
