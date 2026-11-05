"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Users } from "lucide-react";
import { PrintDocumentHeader } from "@/shared/ui";
import type { Apprenant } from "@/modules/apprenants";
import type { Formation } from "@/modules/academique";
import type { Centre, SessionAcademique } from "@/modules/centres-sessions";

const FCFA = new Intl.NumberFormat("fr-FR");

interface ListeApprenantsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprenants: Apprenant[];
  formations: Formation[];
  centres: Centre[];
  sessionActive?: SessionAcademique;
  nomCentre?: string;
  paiementsParApprenant: Map<string, number>;
  isTousCentres?: boolean;
}

export function ListeApprenantsPrintModal({
  isOpen,
  onClose,
  apprenants,
  formations,
  centres,
  sessionActive,
  nomCentre,
  paiementsParApprenant,
  isTousCentres = false,
}: ListeApprenantsPrintModalProps) {
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

  if (!isOpen || !mounted) return null;

  const mapFormations = new Map<string, string>();
  formations.forEach((f) => mapFormations.set(f.id, f.nom));

  const mapCentres = new Map<string, string>();
  centres.forEach((c) => mapCentres.set(c.id, c.nom));

  // Calculs financiers consolidés pour l'impression
  let totalContrats = 0;
  let totalPaye = 0;
  let totalRestant = 0;

  apprenants.forEach((a) => {
    const scolarite = a.montantContrat || 0;
    const paye = paiementsParApprenant.get(a.id) ?? 0;
    const restant = Math.max(0, scolarite - paye);
    totalContrats += scolarite;
    totalPaye += paye;
    totalRestant += restant;
  });

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="printable-modal print-landscape fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="printable-content relative my-auto w-full max-w-5xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl transition-all max-h-[92vh] overflow-y-auto text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre d'action d'impression (masquée lors de l'impression physique) */}
        <div className="no-print mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Impression de la liste des apprenants</h2>
              <p className="text-xs text-slate-500">
                {apprenants.length} apprenant{apprenants.length > 1 ? "s" : ""} sélectionné{apprenants.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Document Imprimable Officiel ── */}
        <div className="space-y-4">
          <PrintDocumentHeader
            titre="LISTE OFFICIELLE DES EFFECTIFS APPRENANTS"
            sousTitre="Classes Préparatoires aux Grandes Écoles & Concours d'Excellence"
            session={sessionActive ? `Session ${sessionActive.annee}` : undefined}
            centre={nomCentre || (isTousCentres ? "Réseau National (Tous les campus)" : undefined)}
            dateGeneration={new Date()}
            orientation="landscape"
          />

          {/* Tableau des apprenants */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                  <th className="border border-slate-300 p-2 text-center w-8">N°</th>
                  <th className="border border-slate-300 p-2 w-20">ID / Réf</th>
                  <th className="border border-slate-300 p-2">Nom & Prénoms</th>
                  <th className="border border-slate-300 p-2 text-center w-28">Contact</th>
                  {isTousCentres && (
                    <th className="border border-slate-300 p-2">Campus</th>
                  )}
                  <th className="border border-slate-300 p-2">Filière / Programme</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Statut</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Contrat</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Versé</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Reste</th>
                </tr>
              </thead>
              <tbody>
                {apprenants.map((app, index) => {
                  const scolarite = app.montantContrat || 0;
                  const paye = paiementsParApprenant.get(app.id) ?? 0;
                  const restant = Math.max(0, scolarite - paye);
                  const nomForm = (app.formationId && mapFormations.get(app.formationId)) || "—";
                  const nomC = (app.centreId && mapCentres.get(app.centreId)) || "—";

                  return (
                    <tr
                      key={app.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="border border-slate-300 p-1.5 text-center font-semibold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-900">
                        {app.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-bold text-slate-900">
                        {app.nom} {app.prenom}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px]">
                        {app.contactApprenant || "—"}
                      </td>
                      {isTousCentres && (
                        <td className="border border-slate-300 p-1.5 font-medium text-slate-700">
                          {nomC}
                        </td>
                      )}
                      <td className="border border-slate-300 p-1.5 font-medium text-slate-800">
                        {nomForm}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-semibold">
                        {app.preInscrit ? "Pré-inscrit" : "Définitif"}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium tabular-nums">
                        {FCFA.format(scolarite)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-semibold text-emerald-700 tabular-nums">
                        {FCFA.format(paye)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold text-slate-900 tabular-nums">
                        {restant > 0 ? `${FCFA.format(restant)}` : "Soldé"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                  <td
                    colSpan={isTousCentres ? 7 : 6}
                    className="border border-slate-300 p-2 text-right uppercase tracking-wider text-xs"
                  >
                    Totaux généraux ({apprenants.length} apprenant{apprenants.length > 1 ? "s" : ""}) :
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-xs">
                    {FCFA.format(totalContrats)} F
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-xs text-emerald-800 font-black">
                    {FCFA.format(totalPaye)} F
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-xs font-black">
                    {FCFA.format(totalRestant)} F
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Synthèse globale en pied de page */}
          <div className="mt-4 grid grid-cols-3 gap-3 border border-slate-200 bg-slate-50 p-3 rounded-lg text-xs">
            <div>
              <span className="text-slate-500 font-medium">Effectif total imprimé :</span>
              <p className="font-bold text-slate-900">{apprenants.length} apprenants</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Recouvré :</span>
              <p className="font-bold text-emerald-700">{FCFA.format(totalPaye)} FCFA</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Reste Total à Recouvrer :</span>
              <p className="font-bold text-slate-900">{FCFA.format(totalRestant)} FCFA</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
