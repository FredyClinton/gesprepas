"use client";

import React from "react";
import { X, Printer, Building2, CheckCircle2 } from "lucide-react";
import type { BilanConsolideNational } from "../domain/types";
import { nombreEnLettres } from "@/shared/lib/nombre-en-lettres";

const FCFA = new Intl.NumberFormat("fr-FR");

export interface FicheSyntheseNationalePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  nomSession?: string;
  consolide: BilanConsolideNational | null | undefined;
}

export function FicheSyntheseNationalePrintModal({
  isOpen,
  onClose,
  date,
  nomSession,
  consolide,
}: FicheSyntheseNationalePrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const [annee, mois, jour] = (date || "").split("-");
  const refDate = `NAT/${jour || "__"}/${mois || "__"}/${annee || "2026"}`;
  const dateLisible = `${jour || ""}/${mois || ""}/${annee || ""}`;

  const centres = consolide?.centres || [];
  const entreesNationales = consolide?.entreesNationalesDetaillees || [];
  const sortiesNationales = consolide?.sortiesNationalesDetaillees || [];
  const effectifsNationaux = consolide?.effectifsNationauxParFormation || [];

  const totalEntrees = consolide?.totalEntreesNational ?? 0;
  const totalSorties = consolide?.totalSortiesNational ?? 0;
  const netAVerser = consolide?.netAVerserNational ?? totalEntrees - totalSorties;
  const totalNouveaux = consolide?.totalNouveauxElevesNational ?? 0;
  const totalEffectif = consolide?.totalEffectifNational ?? 0;
  const centresClotures = consolide?.centresCloturesCount ?? 0;
  const centresTotal = consolide?.centresTotalCount ?? (centres.length || 0);

  const netAVerserLettres = nombreEnLettres(netAVerser);

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "CLOTURE":
        return "Clôturé";
      case "EN_ATTENTE_CONTROLEUR":
        return "Validé Chef";
      case "SOUMIS_CAISSIER":
        return "Visé Caisse";
      default:
        return "En cours";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs duration-200 overflow-y-auto">
      <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Barre d'outils modale (masquée à l'impression) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-orange" />
              <span>Aperçu avant impression – Synthèse Nationale Consolidée</span>
            </h3>
            <p className="text-xs text-slate-500">
              Réseau national EXCELIS • Date :{" "}
              <span className="font-semibold text-slate-700">{dateLisible}</span>
              {nomSession ? ` • Session : ${nomSession}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-orange-600 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer la Fiche Officielle</span>
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

        {/* Contenu imprimable (A4 Portrait normalisé) */}
        <div className="overflow-y-auto p-4 sm:p-8 print:p-0 print:overflow-visible">
          <div className="mx-auto max-w-[210mm] bg-white text-slate-900 font-sans print:w-full print:max-w-none text-[10.5px] leading-tight">
            {/* ── EN-TÊTE OFFICIEL EXCELIS PREPAS ── */}
            <div className="flex items-stretch justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-3">
              {/* Logo & Identité */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tighter text-slate-900">
                    EX<span className="text-brand-orange">CELIS</span>
                  </span>
                </div>
                <div className="text-[10px] tracking-[0.25em] font-extrabold text-slate-700">
                  P R E P A S
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                  Direction Générale • Coordination Nationale
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

            {/* ── TITRE FICHE & INDICATEURS NATIONAUX ── */}
            <div className="border border-slate-900 mb-3">
              <div className="bg-slate-100 py-1 text-center font-black text-xs uppercase tracking-wider border-b border-slate-900">
                SYNTHÈSE NATIONALE DU BILAN JOURNALIER DE CAISSE
              </div>
              <div className="grid grid-cols-5 divide-x divide-slate-900 text-center text-[10px]">
                <div className="p-1.5 font-bold flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Réf_nationale :</span>
                  <span className="font-mono text-xs font-black text-slate-900">{refDate}</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Centres Clôturés</span>
                  <span className="font-bold text-xs text-slate-900">
                    {centresClotures} / {centresTotal}
                  </span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-slate-500 text-[9px]">Nouveaux Inscrits</span>
                  <span className="font-bold text-xs text-slate-900">{totalNouveaux}</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center bg-amber-50/50">
                  <span className="text-slate-500 text-[9px]">Effectif Réseau</span>
                  <span className="font-bold text-xs text-slate-900">{totalEffectif}</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center bg-emerald-50/50">
                  <span className="text-slate-500 text-[9px]">Net Consolidé</span>
                  <span className="font-bold text-xs text-emerald-800">
                    {FCFA.format(netAVerser)} XAF
                  </span>
                </div>
              </div>
            </div>

            {/* ── TABLEAU 1 : RÉCAPITULATIF DES CENTRES ── */}
            <div className="mb-3">
              <div className="bg-slate-800 text-white py-0.5 px-3 font-black text-center text-[11px] uppercase tracking-wider">
                1. RÉCAPITULATIF DES CAISSES PAR CENTRE
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-left">
                    <th className="border border-slate-900 p-1 text-center w-7">N°</th>
                    <th className="border border-slate-900 p-1">Centre / Ville</th>
                    <th className="border border-slate-900 p-1 w-24">Responsable Caisse</th>
                    <th className="border border-slate-900 p-1 text-center w-20">Statut</th>
                    <th className="border border-slate-900 p-1 text-right w-24">Total Entrées</th>
                    <th className="border border-slate-900 p-1 text-right w-20">Total Sorties</th>
                    <th className="border border-slate-900 p-1 text-right w-24 bg-amber-50/60 font-black">
                      Net en Caisse
                    </th>
                    <th className="border border-slate-900 p-1 text-center w-14">Nvx J</th>
                    <th className="border border-slate-900 p-1 text-center w-14">Eff. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {centres.length > 0 ? (
                    centres.map((c, idx) => (
                      <tr key={c.centreId} className="border-b border-slate-300">
                        <td className="border border-slate-900 p-1 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-900 p-1 font-semibold text-slate-900">
                          {c.centreNom}{" "}
                          <span className="text-slate-500 font-normal text-[9px]">
                            ({c.centreVille})
                          </span>
                        </td>
                        <td className="border border-slate-900 p-1 text-slate-700">
                          {c.nomCaissier || c.nomChefCentre || "—"}
                        </td>
                        <td className="border border-slate-900 p-1 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                              c.statut === "CLOTURE"
                                ? "bg-purple-100 text-purple-800"
                                : c.statut === "EN_ATTENTE_CONTROLEUR"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {getStatutLabel(c.statut)}
                          </span>
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-semibold">
                          {FCFA.format(c.totalEntrees)}
                        </td>
                        <td className="border border-slate-900 p-1 text-right text-rose-800 font-semibold">
                          {FCFA.format(c.totalSorties)}
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-black text-slate-900 bg-amber-50/40">
                          {FCFA.format(c.netAVerser)}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-bold">
                          {c.effectifNouveauxElevesTotal}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-bold text-slate-800">
                          {c.effectifTotalCentre}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="border border-slate-900 p-2 text-center text-slate-400 italic">
                        Aucun centre actif pour cette date
                      </td>
                    </tr>
                  )}
                  {/* Total Général National */}
                  <tr className="bg-slate-200 font-black border-t-2 border-slate-900 text-slate-900">
                    <td colSpan={4} className="border border-slate-900 p-1 text-right uppercase text-[9.5px]">
                      TOTAL GÉNÉRAL RÉSEAU NATIONAL :
                    </td>
                    <td className="border border-slate-900 p-1 text-right">
                      {FCFA.format(totalEntrees)}
                    </td>
                    <td className="border border-slate-900 p-1 text-right text-rose-900">
                      {FCFA.format(totalSorties)}
                    </td>
                    <td className="border border-slate-900 p-1 text-right text-emerald-900 bg-emerald-100/70 text-[11px]">
                      {FCFA.format(netAVerser)}
                    </td>
                    <td className="border border-slate-900 p-1 text-center">{totalNouveaux}</td>
                    <td className="border border-slate-900 p-1 text-center">{totalEffectif}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── SECTION DOUBLE COLONNE : ENTRÉES & SORTIES DÉTAILLÉES ── */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Tableau 2 : Entrées détaillées */}
              <div>
                <div className="bg-[#E65100] text-white py-0.5 px-2 font-black text-center text-[10.5px] uppercase tracking-wider">
                  2. VENTILATION DES ENTRÉES (FORMATIONS & LIVRES)
                </div>
                <table className="w-full border-collapse border border-slate-900 text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-left">
                      <th className="border border-slate-900 p-1">Filière / Source</th>
                      <th className="border border-slate-900 p-1 text-center w-12">Opér.</th>
                      <th className="border border-slate-900 p-1 text-right w-20">Montant</th>
                      <th className="border border-slate-900 p-1 text-center w-12">% Rec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entreesNationales.length > 0 ? (
                      entreesNationales.map((e, idx) => {
                        const pct = totalEntrees > 0 ? ((e.montant / totalEntrees) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={idx} className="border-b border-slate-300">
                            <td className="border border-slate-900 p-1 font-medium">
                              {e.libelle}
                              {e.categorie === "LIVRE" && (
                                <span className="text-[8.5px] text-amber-700 ml-1">(Support)</span>
                              )}
                            </td>
                            <td className="border border-slate-900 p-1 text-center">
                              {e.nombreOperations}
                            </td>
                            <td className="border border-slate-900 p-1 text-right font-bold">
                              {FCFA.format(e.montant)}
                            </td>
                            <td className="border border-slate-900 p-1 text-center text-slate-600">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="border border-slate-900 p-1 text-center text-slate-400 italic">
                          Aucune recette enregistrée
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-100 font-bold border-t border-slate-900">
                      <td className="border border-slate-900 p-1 uppercase text-right">Total :</td>
                      <td className="border border-slate-900 p-1 text-center">
                        {entreesNationales.reduce((acc, e) => acc + e.nombreOperations, 0)}
                      </td>
                      <td className="border border-slate-900 p-1 text-right font-black">
                        {FCFA.format(totalEntrees)}
                      </td>
                      <td className="border border-slate-900 p-1 text-center">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tableau 3 : Sorties détaillées */}
              <div>
                <div className="bg-red-800 text-white py-0.5 px-2 font-black text-center text-[10.5px] uppercase tracking-wider">
                  3. VENTILATION DES DÉPENSES PAR MOTIF
                </div>
                <table className="w-full border-collapse border border-slate-900 text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-left">
                      <th className="border border-slate-900 p-1">Motif de Dépense</th>
                      <th className="border border-slate-900 p-1 text-center w-12">Opér.</th>
                      <th className="border border-slate-900 p-1 text-right w-20">Montant</th>
                      <th className="border border-slate-900 p-1 text-center w-12">% Dép.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortiesNationales.length > 0 ? (
                      sortiesNationales.map((s, idx) => {
                        const pct = totalSorties > 0 ? ((s.montant / totalSorties) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={idx} className="border-b border-slate-300">
                            <td className="border border-slate-900 p-1 font-medium">{s.libelleMotif}</td>
                            <td className="border border-slate-900 p-1 text-center">{s.nombreOperations}</td>
                            <td className="border border-slate-900 p-1 text-right font-bold text-rose-800">
                              {FCFA.format(s.montant)}
                            </td>
                            <td className="border border-slate-900 p-1 text-center text-slate-600">{pct}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="border border-slate-900 p-1 text-center text-slate-400 italic">
                          Aucun décaissement enregistré
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-100 font-bold border-t border-slate-900">
                      <td className="border border-slate-900 p-1 uppercase text-right">Total :</td>
                      <td className="border border-slate-900 p-1 text-center">
                        {sortiesNationales.reduce((acc, s) => acc + s.nombreOperations, 0)}
                      </td>
                      <td className="border border-slate-900 p-1 text-right font-black text-rose-900">
                        {FCFA.format(totalSorties)}
                      </td>
                      <td className="border border-slate-900 p-1 text-center">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── TABLEAU 4 : RÉPARTITION NATIONALE DES EFFECTIFS PAR FILIÈRE ── */}
            <div className="mb-3">
              <div className="bg-slate-700 text-white py-0.5 px-3 font-black text-center text-[10.5px] uppercase tracking-wider">
                4. RÉPARTITION DES EFFECTIFS DU RÉSEAU PAR FILIÈRE
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-left">
                    <th className="border border-slate-900 p-1">Filière / Programme Prépa</th>
                    <th className="border border-slate-900 p-1 text-center w-28">Nouveaux Inscrits (Jour)</th>
                    <th className="border border-slate-900 p-1 text-center w-28">Effectif Total Actif</th>
                    <th className="border border-slate-900 p-1 text-center w-24">Part du Réseau (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {effectifsNationaux.length > 0 ? (
                    effectifsNationaux.map((eff) => {
                      const pct = totalEffectif > 0 ? ((eff.effectifTotal / totalEffectif) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={eff.formationId} className="border-b border-slate-300">
                          <td className="border border-slate-900 p-1 font-semibold text-slate-900">
                            {eff.formationNom}
                          </td>
                          <td className="border border-slate-900 p-1 text-center font-bold">
                            {eff.nouveauxElevesJour}
                          </td>
                          <td className="border border-slate-900 p-1 text-center font-bold text-slate-800">
                            {eff.effectifTotal}
                          </td>
                          <td className="border border-slate-900 p-1 text-center text-slate-600">{pct}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-slate-900 p-1 text-center text-slate-400 italic">
                        Aucune donnée d&apos;effectif disponible
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold border-t border-slate-900">
                    <td className="border border-slate-900 p-1 uppercase text-right">Total Apprenants :</td>
                    <td className="border border-slate-900 p-1 text-center font-black">{totalNouveaux}</td>
                    <td className="border border-slate-900 p-1 text-center font-black">{totalEffectif}</td>
                    <td className="border border-slate-900 p-1 text-center">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── SYNTHÈSE FINANCIÈRE GLOBALE EN CHIFFRES ET EN LETTRES ── */}
            <div className="border-2 border-slate-900 bg-slate-50 p-2.5 mb-3">
              <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
                <div className="flex gap-4 text-[10px]">
                  <span>
                    Total Entrées Consolidé :{" "}
                    <strong className="text-slate-900">{FCFA.format(totalEntrees)} XAF</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Sorties Consolidé :{" "}
                    <strong className="text-rose-800">{FCFA.format(totalSorties)} XAF</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold mr-2">
                    SOLDE NET CONSOLIDÉ :
                  </span>
                  <span className="text-sm font-black text-emerald-800">
                    {FCFA.format(netAVerser)} XAF
                  </span>
                </div>
              </div>
              <div className="text-[10px] italic text-slate-800">
                <span className="font-bold not-italic text-slate-700">Arrêté le présent solde net à la somme de : </span>
                <span className="font-serif font-semibold underline underline-offset-2">
                  {netAVerserLettres} francs CFA
                </span>
                .
              </div>
            </div>

            {/* ── COORDONNÉES BANCAIRES & VISAS DIRECTION ── */}
            <div className="grid grid-cols-3 gap-3 border border-slate-900 text-[9.5px]">
              {/* Coordonnées Bancaires UBA */}
              <div className="p-2 border-r border-slate-900 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="font-black text-slate-900 uppercase text-[9px] mb-1">
                    Compte Bancaire Principal UBA
                  </div>
                  <div className="text-[9px] space-y-0.5 text-slate-700">
                    <div>
                      <span className="font-semibold">Titulaire :</span> EXCELIS PREPAS
                    </div>
                    <div>
                      <span className="font-semibold">Banque :</span> UBA Cameroon
                    </div>
                    <div>
                      <span className="font-semibold">RIB / N° :</span> 10033 05214 14002000548 82
                    </div>
                    <div>
                      <span className="font-semibold">Objet :</span> Versements centralisés
                    </div>
                  </div>
                </div>
                <div className="text-[8px] text-slate-400 mt-2 font-mono">
                  Généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}
                </div>
              </div>

              {/* Visa Contrôle & Comptabilité Générale */}
              <div className="p-2 border-r border-slate-900 flex flex-col justify-between min-h-[90px]">
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[9px] border-b border-slate-300 pb-0.5 mb-1 flex items-center justify-between">
                    <span>Contrôle & Comptabilité</span>
                    <CheckCircle2 size={11} className="text-emerald-700" />
                  </div>
                  <p className="text-[8.5px] text-slate-600">
                    Attestation de concordance des mouvements des centres.
                  </p>
                </div>
                <div className="mt-4 border-t border-dashed border-slate-300 pt-1 text-center text-[8px] text-slate-400 italic">
                  Signature & Date du Contrôleur
                </div>
              </div>

              {/* Visa Direction Générale */}
              <div className="p-2 flex flex-col justify-between min-h-[90px]">
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[9px] border-b border-slate-300 pb-0.5 mb-1">
                    Direction Générale
                  </div>
                  <p className="text-[8.5px] text-slate-600">
                    Visa d&apos;approbation pour clôture et consolidation nationale.
                  </p>
                </div>
                <div className="mt-4 border-t border-dashed border-slate-300 pt-1 text-center text-[8px] text-slate-400 italic">
                  Cachet officiel & Signature Direction
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
