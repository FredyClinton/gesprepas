"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, ShieldCheck, GraduationCap, Layers, CheckCircle2 } from "lucide-react";
import { Logo } from "@/shared/ui";
import { formaterDateHeureGeneration } from "@/shared/lib/format-document-date";
import type { Apprenant } from "@/modules/apprenants";
import type { Phase, Formation } from "@/modules/academique";
import { montantEnLettresFCFA } from "@/shared/lib/nombre-en-lettres";

const FCFA = new Intl.NumberFormat("fr-FR");

export interface ContratFicheDetail {
  id: string;
  reference: string;
  dateSignature: string;
  montantTotal: number;
  montantImpute: number;
  soldeRestantContrat: number;
  tauxCouverture: number;
  observations?: string | null;
  estInitial: boolean;
  index: number;
  phaseAssociee?: Phase;
  formationAssociee?: Formation;
}

interface FicheContratPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrat: ContratFicheDetail | null;
  apprenant: Apprenant;
  nomCentre?: string;
}

export function FicheContratPrintModal({
  isOpen,
  onClose,
  contrat,
  apprenant,
  nomCentre = "Centre EXCELIS PRÉPAS",
}: FicheContratPrintModalProps) {
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

  if (!isOpen || !mounted || !contrat) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      className="printable-modal print-portrait fixed inset-0 z-50 flex items-center justify-center bg-brand-anthracite/60 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:overflow-visible print:static"
      onClick={onClose}
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@page { size: A4 portrait; margin: 10mm 10mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }",
        }}
      />

      <div
        className="printable-dialog relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre d'outils écran (masquée à l'impression) */}
        <div className="no-print print:hidden flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-orange" />
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Fiche d&rsquo;Engagement Contractuel & Pédagogique
              </h3>
              <p className="text-xs text-slate-500">
                Réf : <span className="font-mono font-bold text-slate-700">{contrat.reference}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-orange-600 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer le Contrat</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corps imprimable (A4 Portrait) */}
        <div className="printable-body overflow-y-auto p-6 sm:p-8 print:p-0 print:overflow-visible">
          <div className="mx-auto max-w-[190mm] bg-white text-slate-900 font-sans print:w-full print:max-w-none text-xs leading-normal space-y-4">
            
            {/* ── EN-TÊTE OFFICIEL ── */}
            <div className="flex items-stretch justify-between gap-4 border-b-2 border-slate-900 pb-3">
              <div className="flex flex-col justify-center">
                <Logo className="h-10 w-auto object-contain" priority />
                <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                  Préparation aux Grandes Écoles & Concours
                </p>
              </div>

              <div className="text-right flex flex-col justify-center">
                <p className="text-[11px] font-black uppercase text-slate-900">
                  RÉPUBLIQUE DU CAMEROUN
                </p>
                <p className="text-[9px] font-semibold text-slate-500 italic">
                  Paix - Travail - Patrie
                </p>
                <p className="text-[10px] font-bold text-brand-orange mt-1">
                  {nomCentre}
                </p>
              </div>
            </div>

            {/* Titre du document */}
            <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900">
                {contrat.estInitial
                  ? "CONTRAT D'ENGAGEMENT PÉDAGOGIQUE & FINANCIER"
                  : `AVENANT CONTRACTUEL N° ${contrat.index}`}
              </h1>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                RÉFÉRENCE OFFICIELLE : <strong className="text-slate-900">{contrat.reference}</strong> • Signé le : {new Date(contrat.dateSignature).toLocaleDateString("fr-FR")} • {formaterDateHeureGeneration()}
              </p>
            </div>

            {/* Informations Bénéficiaire & Filière */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
                  Identité de l&rsquo;Apprenant(e)
                </span>
                <p className="text-sm font-black text-slate-900">
                  {apprenant.nom.toUpperCase()} {apprenant.prenom}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-700">Réf. Inscription :</span>{" "}
                  {apprenant.referenceRecu || apprenant.id.slice(0, 8)}
                </p>
                {apprenant.contactApprenant && (
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-700">Téléphone :</span> {apprenant.contactApprenant}
                  </p>
                )}
                {apprenant.etablissementOrigine && (
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-700">Établissement d&rsquo;origine :</span> {apprenant.etablissementOrigine}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
                  Programme & Inscription
                </span>
                <p className="text-sm font-black text-brand-orange">
                  {contrat.formationAssociee?.nom || "Programme Prépa Assigné"}
                </p>
                <p className="text-slate-700 font-medium">
                  <span className="font-semibold text-slate-700">Phase contractuelle :</span> {contrat.phaseAssociee?.libelle || "Cursus Annuel"}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-700">Statut du contrat :</span>{" "}
                  <strong className={contrat.soldeRestantContrat === 0 ? "text-emerald-700" : "text-amber-700"}>
                    {contrat.soldeRestantContrat === 0 ? "Intégralement soldé" : "En cours de règlement"}
                  </strong>
                </p>
              </div>
            </div>

            {/* Bilan financier de l'engagement */}
            <div className="rounded-lg border border-slate-300 overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-[10px] uppercase tracking-wide text-slate-700">
                Dispositions Financières de l&rsquo;Engagement
              </div>
              <table className="w-full text-left text-xs">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 text-slate-600 font-medium">
                      Montant souscrit au titre de cet engagement
                    </td>
                    <td className="p-2.5 text-right font-black text-slate-900 text-sm">
                      {FCFA.format(contrat.montantTotal)} FCFA
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="p-2.5 text-slate-600 font-medium">
                      Montant total des versements imputés
                    </td>
                    <td className="p-2.5 text-right font-black text-emerald-700 text-sm">
                      {FCFA.format(contrat.montantImpute)} FCFA
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 text-slate-700 font-bold">
                      Solde restant exigible à ce jour
                    </td>
                    <td className="p-2.5 text-right font-black text-brand-orange text-sm">
                      {FCFA.format(contrat.soldeRestantContrat)} FCFA
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2 text-[10px] text-slate-500 italic">
                      Taux d&rsquo;apurement du présent contrat : {contrat.tauxCouverture}%
                    </td>
                    <td className="p-2 text-right text-[10px] text-slate-500 font-medium italic">
                      {montantEnLettresFCFA(contrat.montantTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Justificatif / Observations */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-[11px]">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-0.5">
                Clauses et Observations Particulières
              </span>
              <p className="text-slate-700">
                {contrat.observations ||
                  "Le présent engagement tient lieu d'accord contractuel entre l'apprenant(e) et EXCELIS PRÉPAS. Tout montant versé pour la scolarité est conforme à la grille officielle arrêtée par la direction."}
              </p>
            </div>

            {/* Cadre de signatures officielles */}
            <div className="pt-4 border-t border-slate-200 avoid-break">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border border-dashed border-slate-300 rounded-lg p-3 min-h-[90px] flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-800 uppercase text-[10px]">
                      L&rsquo;Apprenant(e) ou son Tuteur Légal
                    </p>
                    <p className="text-[9px] text-slate-400 italic">
                      (Mention manuscrite « Lu et approuvé »)
                    </p>
                  </div>
                  <div className="pt-8 text-[9px] text-slate-400">
                    Signature :
                  </div>
                </div>

                <div className="border border-dashed border-slate-300 rounded-lg p-3 min-h-[90px] flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-800 uppercase text-[10px]">
                      Pour la Direction d&rsquo;EXCELIS PRÉPAS
                    </p>
                    <p className="text-[9px] text-slate-400 italic">
                      Visa & Cachet Officiel du Centre
                    </p>
                  </div>
                  <div className="pt-8 text-[9px] text-slate-400">
                    Signature & Date :
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de page officiel */}
            <div className="text-center pt-2 border-t border-slate-200 text-[9px] text-slate-400">
              Document officiel généré par le Système Intégré de Gestion EXCELIS PRÉPAS • {formaterDateHeureGeneration()} — Toute altération invalide le document.
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
