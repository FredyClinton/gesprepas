"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  FileText,
  Building2,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  User,
  ShieldCheck,
} from "lucide-react";
import { usePersonnelList } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { ROLE_LABELS, type Role } from "@/types/roles";
import { PrintDocumentHeader } from "@/shared/ui";

export interface FichePaiePersonnelData {
  ficheId: string;
  bordereauId: string;
  referenceBordereau: string;
  intituleBordereau?: string;
  datePaiement: string;
  personnelId: string;
  salaireReference: number;
  montantPaye: number;
  observations?: string | null;
  sessionName?: string;
}

interface FichePaiePersonnelModalProps {
  fiche: FichePaiePersonnelData | null;
  onClose: () => void;
}

export function FichePaiePersonnelModal({
  fiche,
  onClose,
}: FichePaiePersonnelModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (fiche) {
      document.body.classList.add("print-modal-open");
    }
    return () => {
      document.body.classList.remove("print-modal-open");
    };
  }, [fiche]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (fiche) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fiche, onClose]);

  const { data: personnelList = [] } = usePersonnelList();
  const { data: utilisateurs = [] } = useUtilisateurs();

  const collaborator = useMemo(() => {
    if (!fiche) return null;
    return personnelList.find((p) => p.id === fiche.personnelId) || null;
  }, [fiche, personnelList]);

  const role = useMemo(() => {
    if (!fiche) return null;
    const u = utilisateurs.find((user) => user.id === fiche.personnelId);
    return (u?.role as Role) || null;
  }, [fiche, utilisateurs]);

  if (!fiche || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const difference = fiche.montantPaye - fiche.salaireReference;

  return createPortal(
    <div
      className="printable-modal print-portrait fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <style dangerouslySetInnerHTML={{ __html: "@page { size: A4 portrait; margin: 8mm 8mm; }" }} />
      <div
        className="printable-dialog relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar (Hidden on print) */}
        <div className="no-print print:hidden flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bulletin de Paie - Personnel Administratif
              </h3>
              <p className="text-[11px] text-slate-500">
                Bordereau : <span className="font-mono font-medium">{fiche.referenceBordereau}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Document */}
        <div
          className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block"
          ref={printContentRef}
        >
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 font-sans text-slate-900 shadow-sm print:border-none print:shadow-none print:p-4">
            {/* Header */}
            <PrintDocumentHeader
              titre="BULLETIN DE SALAIRE"
              sousTitre="Direction des Affaires Administratives & Financières"
              reference={fiche.referenceBordereau}
              orientation="portrait"
              className="mb-6"
            />

            {/* Collaborator & Session Details */}
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-orange-600" />
                  <span className="text-sm font-bold text-slate-900">
                    {collaborator ? `${collaborator.nom} ${collaborator.prenom}` : "Collaborateur"}
                  </span>
                </div>
                {role && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold">Fonction :</span>
                    <span className="font-medium text-slate-900">{ROLE_LABELS[role]}</span>
                  </div>
                )}
                {collaborator?.numeroCni && (
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">CNI : </span>
                    <span className="font-mono">{collaborator.numeroCni}</span>
                  </div>
                )}
                {collaborator?.telephone && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{collaborator.telephone}</span>
                  </div>
                )}
                {collaborator?.email && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{collaborator.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 border-l border-slate-200 pl-4">
                {fiche.sessionName && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">Session :</span>
                    <span className="font-medium text-slate-900">{fiche.sessionName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Date de paiement :</span>
                  <span className="font-medium text-slate-900">{fiche.datePaiement}</span>
                </div>
                {fiche.intituleBordereau && (
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Intitulé : </span>
                    <span>{fiche.intituleBordereau}</span>
                  </div>
                )}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    ACQUITTÉ & DÉCAISSÉ
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700">
                  <tr>
                    <th className="p-3">Désignation des Éléments de Rémunération</th>
                    <th className="p-3 text-right">Base / Réf.</th>
                    <th className="p-3 text-right">Ajustement</th>
                    <th className="p-3 text-right">Montant Net Payé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">Salaire de base administratif</p>
                      <p className="text-[11px] text-slate-500">
                        Rémunération convenue pour la période
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      {Number(fiche.salaireReference).toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      —
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      {Number(fiche.salaireReference).toLocaleString("fr-FR")} FCFA
                    </td>
                  </tr>

                  {difference !== 0 && (
                    <tr className="bg-slate-50/50">
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">
                          {difference > 0 ? "Prime / Indemnité exceptionnelle" : "Retenue / Acompte déduit"}
                        </p>
                        {fiche.observations && (
                          <p className="text-[11px] text-slate-500 italic">
                            Motif : {fiche.observations}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">—</td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          difference > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {difference > 0 ? `+${difference.toLocaleString("fr-FR")}` : difference.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        {difference.toLocaleString("fr-FR")} FCFA
                      </td>
                    </tr>
                  )}

                  {fiche.observations && difference === 0 && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="p-3 text-[11px] text-slate-600 italic">
                        <span className="font-semibold not-italic text-slate-700">Observations : </span>
                        {fiche.observations}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={3} className="p-3.5 text-right font-sans text-xs tracking-wider uppercase">
                      Net à Payer (Total Décaissé) :
                    </td>
                    <td className="p-3.5 text-right font-mono text-sm font-black text-orange-600">
                      {Number(fiche.montantPaye).toLocaleString("fr-FR")} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signatures */}
            <div className="mt-12 grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 text-xs text-slate-600">
              <div className="space-y-16">
                <div>
                  <p className="font-bold text-slate-800">Le Bénéficiaire :</p>
                  <p className="text-[10px] text-slate-400 italic">
                    Mention manuscrite &quot;Pour acquit&quot; et signature
                  </p>
                </div>
                <p className="border-t border-slate-300 pt-1 text-[11px] text-slate-400">
                  {collaborator ? `${collaborator.nom} ${collaborator.prenom}` : ""}
                </p>
              </div>

              <div className="space-y-16 text-right">
                <div>
                  <p className="font-bold text-slate-800">La Direction Administrative & Financière :</p>
                  <p className="text-[10px] text-slate-400 italic">
                    Visa pour validation et ordre de caisse
                  </p>
                </div>
                <p className="border-t border-slate-300 pt-1 text-[11px] text-slate-400">
                  Fait à Yaoundé, le {fiche.datePaiement}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

