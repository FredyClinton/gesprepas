"use client";

import React from "react";
import { X, Printer, CheckCircle2 } from "lucide-react";
import type { BilanApercu, MouvementFinancier, Motif } from "../domain/types";
import { nombreEnLettres } from "@/shared/lib/nombre-en-lettres";

const FCFA = new Intl.NumberFormat("fr-FR");

interface FicheBilanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  nomCentre: string;
  codeCentre?: string;
  bilan: BilanApercu | null | undefined;
  mouvements: MouvementFinancier[];
  motifs: Motif[];
}

export function FicheBilanPrintModal({
  isOpen,
  onClose,
  date,
  nomCentre,
  codeCentre = "YA",
  bilan,
  mouvements,
  motifs,
}: FicheBilanPrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Date formatée JJ/MM/AAAA
  const [annee, mois, jour] = (date || "").split("-");
  const refDate = `${codeCentre.toUpperCase()}/${jour || "__"}/${mois || "__"}/${annee || "2026"}`;
  const dateLisible = `${jour || ""}/${mois || ""}/${annee || ""}`;

  // Filtrer les entrées et sorties pour cette date
  const entreesDuJour = mouvements.filter(
    (m) => m.type === "ENTREE" && m.date === date && m.statut !== "REJETE",
  );
  const sortiesDuJour = mouvements.filter(
    (m) => m.type === "SORTIE" && m.date === date && m.statut !== "REJETE",
  );

  // Totaux
  const totalEntreesCalcule = entreesDuJour.reduce((acc, e) => acc + (e.montant || 0), 0);
  const totalSortiesCalcule = sortiesDuJour.reduce((acc, s) => acc + (s.montant || 0), 0);

  const totalEntrees = bilan?.totalEntrees ?? totalEntreesCalcule;
  const totalSorties = bilan?.totalSorties ?? totalSortiesCalcule;
  const netAVerser = bilan?.netAVerser ?? totalEntrees - totalSorties;

  const totalEntreesLettres = nombreEnLettres(totalEntrees);
  const totalSortiesLettres = nombreEnLettres(totalSorties);
  const netAVerserLettres = nombreEnLettres(netAVerser);

  // Associer les motifs
  const getNomMotif = (motifId: string) => {
    return motifs.find((m) => m.id === motifId)?.nom || "Versement / Dépense";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs duration-200 overflow-y-auto">
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Barre d'outils modale (masquée à l'impression) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              Aperçu avant impression – Fiche de Bilan Journalier
            </h3>
            <p className="text-xs text-slate-500">
              Centre : <span className="font-semibold text-slate-700">{nomCentre}</span> • Date :{" "}
              <span className="font-semibold text-slate-700">{dateLisible}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-orange-600"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer la Fiche</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu imprimable (A4 Portrait normalisé) */}
        <div className="overflow-y-auto p-4 sm:p-8 print:p-0 print:overflow-visible">
          <div className="mx-auto max-w-[210mm] bg-white text-slate-900 font-sans print:w-full print:max-w-none text-[11px] leading-tight">
            {/* ── EN-TÊTE OFFICIEL EXCELIS PREPAS ── */}
            <div className="flex items-stretch justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-3">
              {/* Logo & Identité Gauche */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tighter text-slate-900">
                    EX<span className="text-brand-orange">CELIS</span>
                  </span>
                </div>
                <div className="text-[10px] tracking-[0.25em] font-extrabold text-slate-700">
                  P R E P A S
                </div>
              </div>

              {/* Bloc Droite Institutionnel Orange */}
              <div className="bg-[#E65100] text-white px-4 py-2 rounded-md max-w-[65%] flex flex-col justify-center text-right">
                <p className="text-[9.5px] leading-snug font-semibold">
                  Centre d&apos;Excellence académique, d&apos;orientation et de préparation aux concours
                  d&apos;entrée dans les grandes écoles et facultés du Cameroun
                </p>
                <p className="text-xs font-black tracking-wide mt-0.5 text-amber-200">
                  Orientation - Préparation - Réussite
                </p>
              </div>
            </div>

            {/* ── TITRE FICHE & INDICATEURS ── */}
            <div className="border border-slate-900 mb-3">
              <div className="bg-slate-100 py-1 text-center font-black text-xs uppercase tracking-wider border-b border-slate-900">
                FICHE DE BILAN JOURNALIER
              </div>
              <div className="grid grid-cols-5 divide-x divide-slate-900 text-center text-[10px]">
                <div className="p-1.5 font-bold flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Réf_date :</span>
                  <span className="font-mono text-xs font-black text-slate-900">{refDate}</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Nbre Salles</span>
                  <span className="font-bold text-xs text-slate-900">{bilan?.nombreSalles ?? 0}</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Nbre Cours</span>
                  <span className="font-bold text-xs text-slate-900">{bilan?.nombreCours ?? 0}</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Nouveaux Élèves</span>
                  <span className="font-bold text-xs text-slate-900">
                    {bilan?.effectifNouveauxEleves ?? 0}
                  </span>
                </div>
                <div className="p-1.5 flex flex-col justify-center bg-amber-50/50">
                  <span className="text-slate-500 text-[9px]">Effectif Total Centre</span>
                  <span className="font-bold text-xs text-slate-900">
                    {bilan?.effectifTotalCentre ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* ── SECTION 1 : ENTRÉES ── */}
            <div className="mb-3">
              <div className="bg-[#E65100] text-white py-0.5 px-3 font-black text-center text-[11px] uppercase tracking-wider">
                ENTRÉES
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-left">
                    <th className="border border-slate-900 p-1 text-center w-8">N°</th>
                    <th className="border border-slate-900 p-1">Motif</th>
                    <th className="border border-slate-900 p-1 text-center w-16">Effectifs</th>
                    <th className="border border-slate-900 p-1">Nom Caissier</th>
                    <th className="border border-slate-900 p-1 text-right w-28">Montant (XAF)</th>
                    <th className="border border-slate-900 p-1 text-center w-24">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {entreesDuJour.length > 0 ? (
                    entreesDuJour.map((e, index) => (
                      <tr key={e.id} className="border-b border-slate-300">
                        <td className="border border-slate-900 p-1 text-center font-bold">
                          {index + 1}
                        </td>
                        <td className="border border-slate-900 p-1 font-medium">
                          {getNomMotif(e.motifId)}
                        </td>
                        <td className="border border-slate-900 p-1 text-center">1</td>
                        <td className="border border-slate-900 p-1 text-slate-700">
                          {bilan?.nomCaissier || "Caissier du centre"}
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-bold">
                          {FCFA.format(e.montant)}
                        </td>
                        <td className="border border-slate-900 p-1 text-center text-[9px] text-slate-400">
                          {bilan?.dateVisaCaissier ? "Visé" : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr className="border-b border-slate-300">
                        <td className="border border-slate-900 p-1 text-center font-bold">1</td>
                        <td className="border border-slate-900 p-1 text-slate-400 italic">
                          Formations / Concours
                        </td>
                        <td className="border border-slate-900 p-1 text-center text-slate-400">—</td>
                        <td className="border border-slate-900 p-1 text-slate-400">—</td>
                        <td className="border border-slate-900 p-1 text-right font-bold text-slate-400">
                          0
                        </td>
                        <td className="border border-slate-900 p-1 text-center text-slate-400">—</td>
                      </tr>
                    </>
                  )}
                  {/* Ligne Total Entrées */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={4} className="border border-slate-900 p-1 text-right uppercase">
                      Total Entrées :
                    </td>
                    <td className="border border-slate-900 p-1 text-right font-black text-slate-900">
                      {FCFA.format(totalEntrees)} XAF
                    </td>
                    <td className="border border-slate-900 p-1 bg-slate-50"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── SECTION 2 : SORTIES (ORDONNATEURS & VALIDATEURS) ── */}
            <div className="mb-3">
              <div className="bg-red-800 text-white py-0.5 px-3 font-black text-center text-[11px] uppercase tracking-wider">
                SORTIES
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-left">
                    <th className="border border-slate-900 p-1 text-center w-8">N°</th>
                    <th className="border border-slate-900 p-1">Motif de la dépense</th>
                    <th className="border border-slate-900 p-1 text-right w-28">Montant (XAF)</th>
                    <th className="border border-slate-900 p-1">Ordonnateur</th>
                    <th className="border border-slate-900 p-1">Validateur / Caisse</th>
                    <th className="border border-slate-900 p-1 text-center w-24">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {sortiesDuJour.length > 0 ? (
                    sortiesDuJour.map((s, index) => (
                      <tr key={s.id} className="border-b border-slate-300">
                        <td className="border border-slate-900 p-1 text-center font-bold">
                          {index + 1}
                        </td>
                        <td className="border border-slate-900 p-1 font-medium">
                          {getNomMotif(s.motifId)}
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-bold text-red-700">
                          {FCFA.format(s.montant)}
                        </td>
                        <td className="border border-slate-900 p-1 font-semibold text-slate-800">
                          {s.ordonnateur || "Direction"}
                        </td>
                        <td className="border border-slate-900 p-1 text-slate-700">
                          {bilan?.nomCaissier || "Caisse"}
                        </td>
                        <td className="border border-slate-900 p-1 text-center text-[9px] text-slate-400">
                          {bilan?.dateVisaCaissier ? "Validé" : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-slate-900 p-2 text-center text-slate-400 italic">
                        Aucune sortie enregistrée pour cette journée.
                      </td>
                    </tr>
                  )}
                  {/* Ligne Total Sorties */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={2} className="border border-slate-900 p-1 text-right uppercase">
                      Total Sorties :
                    </td>
                    <td className="border border-slate-900 p-1 text-right font-black text-red-800">
                      {FCFA.format(totalSorties)} XAF
                    </td>
                    <td colSpan={3} className="border border-slate-900 p-1 bg-slate-50"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── RÉCAPITULATIF & MONTANTS EN LETTRES ── */}
            <div className="border border-slate-900 mb-3 text-[10px]">
              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-50">
                  Total Général Entrées :
                </div>
                <div className="col-span-3 p-1.5 font-black text-right">
                  {FCFA.format(totalEntrees)} XAF
                </div>
                <div className="col-span-6 p-1.5 italic text-slate-700">
                  {totalEntreesLettres}
                </div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                <div className="col-span-3 p-1.5 font-bold uppercase bg-slate-50">
                  Total Général Sorties :
                </div>
                <div className="col-span-3 p-1.5 font-black text-right text-red-800">
                  {FCFA.format(totalSorties)} XAF
                </div>
                <div className="col-span-6 p-1.5 italic text-slate-700">
                  {totalSortiesLettres}
                </div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900 bg-amber-50/60 font-bold">
                <div className="col-span-3 p-1.5 font-black uppercase text-brand-orange">
                  Net à verser :
                </div>
                <div className="col-span-3 p-1.5 font-black text-right text-brand-orange text-xs">
                  {FCFA.format(netAVerser)} XAF
                </div>
                <div className="col-span-6 p-1.5 font-bold text-slate-900 italic">
                  {netAVerserLettres}
                </div>
              </div>
            </div>

            {/* ── COORDONNÉES BANCAIRES UBA & CONSIGNES ── */}
            <div className="border border-slate-900 p-2 mb-3 text-[9.5px]">
              <div className="font-black text-slate-900 uppercase">
                UNITED BANK FOR AFRICA (UBA) CAMEROON S.A
              </div>
              <div className="text-slate-800 font-medium">
                Noms du Compte : <span className="font-bold">ABEGA FLORE ERNESTINE</span> – N° de
                compte : <span className="font-bold font-mono">12002015501</span> – CODE BANQUE :{" "}
                <span className="font-bold font-mono">10033</span>
              </div>
              <p className="mt-1 text-[8.5px] text-slate-600 italic leading-tight">
                NB : Les versements se font tous les jours au plus tard à 15H, de même cette fiche
                doit parvenir par tous les moyens au responsable administratif de votre centre pour
                contrôle et archivage avant fermeture effective de vos bureaux.
              </p>
            </div>

            {/* ── VISAS (DIRECTEUR, CAISSIER, COMPTABLE) ── */}
            <div className="grid grid-cols-3 border border-slate-900 divide-x divide-slate-900 text-center text-[10px]">
              {/* Visa Directeur de centre */}
              <div className="flex flex-col h-28">
                <div className="bg-slate-100 p-1 font-bold border-b border-slate-900">
                  Visa Directeur(s) de centre
                </div>
                <div className="flex-1 p-2 flex flex-col justify-between items-center">
                  {bilan?.dateValidationChefCentre ? (
                    <>
                      <div className="flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                        <CheckCircle2 size={12} />
                        <span>Visé & Approuvé</span>
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium">
                        {bilan.nomChefCentre || "Chef de centre"}
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        {new Date(bilan.dateValidationChefCentre).toLocaleString("fr-FR")}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto text-[9px] text-slate-300 italic">
                      Cadre réservé au visa
                    </div>
                  )}
                </div>
              </div>

              {/* Visa Caissier */}
              <div className="flex flex-col h-28">
                <div className="bg-slate-100 p-1 font-bold border-b border-slate-900">
                  Visa Caissier(s)
                </div>
                <div className="flex-1 p-2 flex flex-col justify-between items-center">
                  {bilan?.dateVisaCaissier ? (
                    <>
                      <div className="flex items-center gap-1 text-blue-700 font-bold text-[10px]">
                        <CheckCircle2 size={12} />
                        <span>Caisse arrêtée</span>
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium">
                        {bilan.nomCaissier || "Caissier"}
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        {new Date(bilan.dateVisaCaissier).toLocaleString("fr-FR")}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto text-[9px] text-slate-300 italic">
                      Cadre réservé au visa
                    </div>
                  )}
                </div>
              </div>

              {/* Visa Comptable */}
              <div className="flex flex-col h-28">
                <div className="bg-slate-100 p-1 font-bold border-b border-slate-900">
                  Visa Comptable
                </div>
                <div className="flex-1 p-2 flex flex-col justify-between items-center">
                  {bilan?.dateValidationControleur ? (
                    <>
                      <div className="flex items-center gap-1 text-purple-700 font-bold text-[10px]">
                        <CheckCircle2 size={12} />
                        <span>Contrôlé & Clôturé</span>
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium">
                        {bilan.nomControleur || "Comptable"}
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        {new Date(bilan.dateValidationControleur).toLocaleString("fr-FR")}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto text-[9px] text-slate-300 italic">
                      Cadre réservé au visa
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
