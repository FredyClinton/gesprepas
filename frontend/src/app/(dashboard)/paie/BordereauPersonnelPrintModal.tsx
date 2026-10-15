"use client";

import { useMemo } from "react";
import {
  X,
  Printer,
  ClipboardList,
  Calendar,
  Users,
  Building2,
  Banknote,
} from "lucide-react";
import type { BordereauPaiePersonnel } from "@/modules/remuneration/domain/types";
import { usePersonnelList } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { ROLE_LABELS, type Role } from "@/types/roles";

interface BordereauPersonnelPrintModalProps {
  bordereau: BordereauPaiePersonnel | null;
  sessionName?: string;
  onClose: () => void;
}

export function BordereauPersonnelPrintModal({
  bordereau,
  sessionName,
  onClose,
}: BordereauPersonnelPrintModalProps) {
  const { data: personnelList = [] } = usePersonnelList();
  const { data: utilisateurs = [] } = useUtilisateurs();

  const personnelMap = useMemo(() => {
    const map = new Map<string, (typeof personnelList)[0]>();
    personnelList.forEach((p) => map.set(p.id, p));
    return map;
  }, [personnelList]);

  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    utilisateurs.forEach((u) => {
      if (u.id && u.role) {
        map.set(u.id, u.role as Role);
      }
    });
    return map;
  }, [utilisateurs]);

  if (!bordereau) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 print:static print:block print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:max-h-none print:w-auto print:inset-auto print:z-auto">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:static print:block print:max-h-none print:h-auto print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bordereau de Paie - Personnel Administratif
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
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block">
          <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 font-sans text-slate-900 shadow-sm print:border-none print:shadow-none print:p-4">
            {/* Document Header */}
            <div className="mb-6 border-b-2 border-slate-900 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-black tracking-tight text-orange-600">
                    EXCELIS PREPAS
                  </span>
                  <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Classes Préparatoires & Concours d&apos;Excellence
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Direction Générale — Service de la Paie et des Ressources Humaines
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-slate-900 px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
                    BORDEREAU DE PAIE DU PERSONNEL
                  </span>
                  <p className="mt-1 font-mono text-xs text-slate-600">
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
                  <span className="font-semibold text-slate-700">Date de paiement :</span>
                  <span>{bordereau.datePaiement}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="font-semibold text-slate-700">Intitulé :</span>
                  <span>{bordereau.intitule || "Paie administrative"}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-l border-slate-200 pl-4">
                {sessionName && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">Session :</span>
                    <span className="font-medium text-slate-900">{sessionName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Effectif payé :</span>
                  <span className="font-bold text-slate-900">
                    {bordereau.nombrePersonnelsPayes} collaborateur(s)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-l border-slate-200 pl-4">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Banknote className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Montant total global :</span>
                </div>
                <div className="font-mono text-base font-black text-orange-600">
                  {Number(bordereau.montantTotalGlobal).toLocaleString("fr-FR")} FCFA
                </div>
              </div>
            </div>

            {/* Fiches Roster Table */}
            <div className="mb-6">
              <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                État Récapitulatif Nominatif ({bordereau.fiches?.length || 0} agents)
              </h4>
              <div className="overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700">
                    <tr>
                      <th className="w-8 p-2.5 text-center">N°</th>
                      <th className="p-2.5">Collaborateur</th>
                      <th className="p-2.5">Fonction / Rôle</th>
                      <th className="p-2.5 text-right">Salaire Réf.</th>
                      <th className="p-2.5 text-right">Montant Payé</th>
                      <th className="p-2.5">Observations</th>
                      <th className="w-28 p-2.5 text-center print:table-cell">Émargement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bordereau.fiches?.map((fiche, idx) => {
                      const pers = personnelMap.get(fiche.personnelId);
                      const role = roleMap.get(fiche.personnelId);
                      return (
                        <tr key={fiche.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">
                              {pers ? `${pers.nom} ${pers.prenom}` : "Personnel inconnu"}
                            </div>
                            {pers?.telephone && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {pers.telephone}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {role ? ROLE_LABELS[role] : "Personnel"}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {Number(fiche.salaireReference).toLocaleString("fr-FR")} F
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {Number(fiche.montantPaye).toLocaleString("fr-FR")} F
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-500 italic max-w-xs truncate">
                            {fiche.observations || "—"}
                          </td>
                          <td className="p-2.5 text-center border-l border-slate-200 print:table-cell">
                            <span className="text-[10px] text-slate-300 print:hidden">
                              Pour acquit
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Block */}
            <div className="mb-8 flex justify-end">
              <div className="w-80 rounded-xl border-2 border-slate-900 bg-slate-50/50 p-4">
                <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                  <span>Effectif total rémunéré :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {bordereau.nombrePersonnelsPayes}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                  <span>TOTAL GLOBAL DÉCAISSÉ :</span>
                  <span className="font-mono text-orange-600">
                    {Number(bordereau.montantTotalGlobal).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures Block */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-4 text-xs text-slate-600">
              <div className="space-y-12">
                <p className="font-semibold text-slate-800">
                  Visa & Approbation de la Direction :
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  Fait le : {bordereau.datePaiement}
                </p>
              </div>
              <div className="space-y-12 text-right">
                <p className="font-semibold text-slate-800">
                  Visa de la Comptabilité / Caisse :
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  Cachet & Signature de l&apos;Opérateur
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

