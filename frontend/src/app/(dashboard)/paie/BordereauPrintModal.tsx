"use client";

import {
  X,
  Printer,
  ClipboardList,
  Calendar,
  Users,
  Layers,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { BordereauPaieEnseignantDetail } from "@/modules/remuneration/domain/types";
import { formatVolumeHoraire } from "@/modules/remuneration/domain/volumeHoraire";

interface BordereauPrintModalProps {
  bordereau: BordereauPaieEnseignantDetail | null;
  onClose: () => void;
}

export function BordereauPrintModal({
  bordereau,
  onClose,
}: BordereauPrintModalProps) {
  if (!bordereau) return null;

  const handlePrint = () => {
    window.print();
  };

  const paidCount = bordereau.fiches.filter((f) => f.statut === "PAYEE").length;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-orange flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bordereau de Paie Enseignants
              </h3>
              <p className="font-mono text-[11px] text-slate-500">
                Réf : {bordereau.reference}
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
        <div className="flex-1 overflow-y-auto p-8 print:p-0">
          <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 font-sans text-slate-900 shadow-sm print:border-none print:shadow-none">
            {/* Document Header */}
            <div className="mb-6 border-b-2 border-slate-900 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-brand-orange text-xl font-black tracking-tight">
                    EXCELIS PREPAS
                  </span>
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                    Classes Préparatoires & Concours d&apos;Excellence
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-slate-900 px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
                    Bordereau de Paie - Enseignants Vacataires
                  </span>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    Réf : {bordereau.reference}
                  </p>
                </div>
              </div>
            </div>

            {/* Bordereau Info Grid */}
            <div className="mb-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">
                    Date de paiement :
                  </span>
                  <span>{bordereau.datePaiement}</span>
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">
                    Ordonné par :
                  </span>{" "}
                  <span>{bordereau.saisiPar}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">
                    Enseignants :
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {bordereau.nombreTotalEnseignants}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">
                    Séances :
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {bordereau.nombreTotalSeances}
                  </span>
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">
                    Volume horaire total :
                  </span>{" "}
                  <span className="font-mono font-bold text-slate-900">
                    {formatVolumeHoraire(bordereau.nombreTotalSeances)}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 border-l border-slate-200 pl-4">
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">
                    Statut règlement :
                  </span>
                  <br />
                  <span className="text-brand-orange mt-1 inline-flex items-center gap-1 rounded border border-orange-300 bg-orange-50 px-2 py-0.5 text-[11px] font-bold">
                    <Clock className="h-3 w-3" />
                    {paidCount}/{bordereau.fiches.length} payé(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Enseignants Table */}
            <div className="mb-6">
              <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                Détail par Enseignant ({bordereau.fiches.length})
              </h4>
              <div className="overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-100/90 text-[11px] font-bold text-slate-600">
                    <tr>
                      <th className="w-8 p-2.5 text-center">N°</th>
                      <th className="p-2.5">Enseignant</th>
                      <th className="p-2.5">Matricule</th>
                      <th className="p-2.5">Département</th>
                      <th className="p-2.5 text-center">Séances</th>
                      <th className="p-2.5 text-center">Volume Horaire</th>
                      <th className="p-2.5 text-right">Tarif / Séance</th>
                      <th className="p-2.5 text-right">Total Net</th>
                      <th className="p-2.5 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bordereau.fiches.map((fiche, index) => (
                      <tr
                        key={fiche.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="p-2.5 text-center font-mono font-semibold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {fiche.enseignantNom} {fiche.enseignantPrenom}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">
                          {fiche.enseignantMatricule || "N/A"}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {fiche.departementNom}
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold">
                          {fiche.nombreSeances}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600">
                          {formatVolumeHoraire(fiche.nombreSeances)}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {Number(fiche.coutParSeance).toLocaleString("fr-FR")}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {Number(fiche.montantTotal).toLocaleString("fr-FR")}
                        </td>
                        <td className="p-2.5 text-center">
                          {fiche.statut === "PAYEE" ? (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Payée
                            </span>
                          ) : (
                            <span className="text-brand-orange inline-flex items-center gap-1 rounded border border-orange-300 bg-orange-50 px-2 py-0.5 text-[10px] font-bold">
                              <Clock className="h-2.5 w-2.5" />
                              Programmée
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Block */}
            <div className="mb-8 flex justify-end">
              <div className="w-80 rounded-xl border-2 border-slate-900 bg-slate-50/50 p-4">
                <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                  <span>Nombre total d&apos;enseignants :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {bordereau.nombreTotalEnseignants}
                  </span>
                </div>
                <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                  <span>Nombre total de séances :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {bordereau.nombreTotalSeances}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                  <span>MONTANT GLOBAL ENGAGÉ :</span>
                  <span className="text-brand-orange font-mono">
                    {Number(bordereau.montantTotalGlobal).toLocaleString(
                      "fr-FR",
                    )}{" "}
                    FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures Block */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-4 text-xs text-slate-600">
              <div className="space-y-12">
                <p className="font-semibold text-slate-800">
                  Visa & Cachet de la Direction :
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  Ordonnateur : {bordereau.saisiPar}
                </p>
              </div>
              <div className="space-y-12 text-right">
                <p className="font-semibold text-slate-800">
                  Visa de la Comptabilité / Caissier :
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  Émis le ____________________
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
