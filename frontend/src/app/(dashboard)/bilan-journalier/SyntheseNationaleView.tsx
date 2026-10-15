"use client";

import React, { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Printer,
  ArrowUpRight,
  Coins,
  RefreshCw,
  Users,
  ExternalLink,
  GraduationCap,
  PieChart,
} from "lucide-react";
import { useSessionActive } from "@/modules/centres-sessions";
import { useBilanConsolideDuJour } from "@/modules/financier/data/queries";
import { FicheSyntheseNationalePrintModal } from "@/modules/financier/components/FicheSyntheseNationalePrintModal";
import type { BilanCentreResume } from "@/modules/financier/domain/types";

const FCFA = new Intl.NumberFormat("fr-FR");

function formaterDateFr(dateIso: string): string {
  if (!dateIso) return "";
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  const d = new Date(annee, mois - 1, jour);
  const formatted = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

interface SyntheseNationaleViewProps {
  date: string;
  onChangerDate: (date: string) => void;
  onChangerJour: (decalage: number) => void;
  onSelectCentre: (centreId: string) => void;
}

export function SyntheseNationaleView({
  date,
  onChangerDate,
  onChangerJour,
  onSelectCentre,
}: SyntheseNationaleViewProps) {
  const { data: sessionActive } = useSessionActive();
  const { data: consolide, isLoading, isError } = useBilanConsolideDuJour(
    sessionActive?.id,
    date,
  );

  const [expandedCentres, setExpandedCentres] = useState<Record<string, boolean>>({});
  const [modalPrintOuverte, setModalPrintOuverte] = useState(false);
  const [activeTabDetail, setActiveTabDetail] = useState<"entrees" | "sorties" | "effectifs">("entrees");

  const estAujourdhui = date === new Date().toISOString().slice(0, 10);

  const toggleExpand = (centreId: string) => {
    setExpandedCentres((prev) => ({
      ...prev,
      [centreId]: !prev[centreId],
    }));
  };

  const totalEntrees = consolide?.totalEntreesNational ?? 0;
  const totalSorties = consolide?.totalSortiesNational ?? 0;
  const netConsolide = consolide?.netAVerserNational ?? totalEntrees - totalSorties;
  const totalNouveaux = consolide?.totalNouveauxElevesNational ?? 0;
  const totalEffectif = consolide?.totalEffectifNational ?? 0;
  const centresClotures = consolide?.centresCloturesCount ?? 0;
  const centresTotal = consolide?.centresTotalCount ?? (consolide?.centres.length || 0);

  const centres = consolide?.centres || [];
  const entreesNationales = consolide?.entreesNationalesDetaillees || [];
  const sortiesNationales = consolide?.sortiesNationalesDetaillees || [];
  const effectifsNationaux = consolide?.effectifsNationauxParFormation || [];

  const nbOperationsEntrees = entreesNationales.reduce((acc, e) => acc + e.nombreOperations, 0);
  const nbOperationsSorties = sortiesNationales.reduce((acc, s) => acc + s.nombreOperations, 0);

  const renderStatutPillBadge = (c: BilanCentreResume) => {
    switch (c.statut) {
      case "CLOTURE":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            Caisse Fermée
          </span>
        );
      case "EN_ATTENTE_CONTROLEUR":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            En Validation
          </span>
        );
      case "SOUMIS_CAISSIER":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            Visée Caisse
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            Caisse Ouverte
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── BARRE DE CONTRÔLE DATE & ACTION RAPPORT (Style Image 1) ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Sélecteur de date style dropdown moderne avec boutons navigation */}
          <div className="flex items-center rounded-xl bg-white border border-slate-200/80 shadow-2xs p-1">
            <button
              onClick={() => onChangerJour(-1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              title="Jour précédent"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-slate-800">
              <Calendar className="h-4 w-4 text-[#0e4a56]" />
              <span>{formaterDateFr(date)}</span>
            </div>
            <button
              onClick={() => onChangerJour(1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              title="Jour suivant"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && onChangerDate(e.target.value)}
              className="sr-only"
              id="date-picker-synthese"
            />
            <label
              htmlFor="date-picker-synthese"
              className="cursor-pointer p-2 text-slate-400 hover:text-slate-700 transition-colors"
              title="Choisir une date spécifique"
            >
              <Calendar className="h-4 w-4" />
            </label>
          </div>

          {!estAujourdhui && (
            <button
              onClick={() => onChangerDate(new Date().toISOString().slice(0, 10))}
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              type="button"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>

        {/* Bouton d'action Générer Rapport Officiel (Bouton pétrole Image 1) */}
        <div>
          <button
            onClick={() => setModalPrintOuverte(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0e4a56] hover:bg-[#0b3c48] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
            type="button"
          >
            <Printer className="h-4 w-4" />
            <span>Générer Rapport Officiel</span>
          </button>
        </div>
      </div>

      {/* ── BENTO GRID ÉPURÉ (Style Image 1) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Solde Net Consolidé (Carte Héroïque Foncée Pétrole) */}
        <div className="relative flex flex-col justify-between rounded-2xl bg-[#0e4a56] p-6 text-white shadow-sm transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-200/80">
              SOLDE NET CONSOLIDÉ
            </span>
            <div className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-white">
              {FCFA.format(netConsolide)}{" "}
              <span className="text-sm font-medium text-teal-200">XAF</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-normal text-teal-100/70">
            Total net à centraliser
          </p>
        </div>

        {/* 2. Total Entrées Réseau */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <Coins className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              TOTAL ENTRÉES RÉSEAU
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalEntrees)}{" "}
              <span className="text-xs font-normal text-slate-400">XAF</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              {nbOperationsEntrees} opération{nbOperationsEntrees > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* 3. Total Sorties Réseau */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              TOTAL SORTIES RÉSEAU
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalSorties)}{" "}
              <span className="text-xs font-normal text-slate-400">XAF</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              {nbOperationsSorties} opération{nbOperationsSorties > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* 4. Total Effectif Réseau & Clôtures */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              EFFECTIFS DU RÉSEAU
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalEffectif}{" "}
              <span className="text-xs font-normal text-slate-400">élèves</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              +{totalNouveaux} inscrits • {centresClotures}/{centresTotal} clôturés
            </p>
          </div>
        </div>
      </div>

      {/* ── TABLEAU DES CAISSES (Data Grid Moderne Style Image 1) ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Récapitulatif des Caisses par Centre{" "}
            <span className="font-normal text-slate-500 text-xs">
              ({centres.length} centre{centres.length > 1 ? "s" : ""})
            </span>
          </h2>
          <div className="text-xs text-slate-400">
            Cliquez sur un centre pour dérouler ses écritures détaillées
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0e4a56] border-t-transparent mb-2" />
            <p>Chargement des données consolidées...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            Une erreur est survenue lors du chargement des données.
          </div>
        ) : centres.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Aucun centre actif trouvé pour cette session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 pl-6 pr-2 w-10 text-slate-400 font-normal">#</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700">Centre</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700">Caissier</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700 text-center">Statut</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700 text-right">Entrées du Jour</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700 text-right">Sorties du Jour</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700 text-right">Net Caisse</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-700 text-center">Effectif (Actif)</th>
                  <th className="py-3.5 pl-4 pr-6 font-semibold text-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {centres.map((c, index) => {
                  const isExpanded = !!expandedCentres[c.centreId];
                  return (
                    <React.Fragment key={c.centreId}>
                      <tr
                        onClick={() => toggleExpand(c.centreId)}
                        className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-4 pl-6 pr-2 text-slate-400 font-normal">{index + 1}</td>
                        <td className="py-4 px-4 font-medium text-slate-900 flex items-center gap-2">
                          <button
                            type="button"
                            className="text-slate-400 group-hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <span>{c.centreNom}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({c.centreVille})
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {c.nomCaissier || c.nomChefCentre || "—"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {renderStatutPillBadge(c)}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-slate-800 tabular-nums">
                          {FCFA.format(c.totalEntrees)} XAF
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-rose-600 tabular-nums">
                          {FCFA.format(c.totalSorties)} XAF
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-slate-900 tabular-nums">
                          {FCFA.format(c.netAVerser)} XAF
                        </td>
                        <td className="py-4 px-4 text-center font-medium text-slate-700 tabular-nums">
                          {c.effectifTotalCentre}
                        </td>
                        <td className="py-4 pl-4 pr-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCentre(c.centreId);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0e4a56] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
                            title="Consulter le journal de ce centre"
                            type="button"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Consulter</span>
                          </button>
                        </td>
                      </tr>

                      {/* ── VOLET DÉROULANT DES DÉTAILS DU CENTRE ── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={9} className="p-4 sm:p-6 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* 1. Entrées par formation & livres */}
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <GraduationCap className="h-3.5 w-3.5 text-[#0e4a56]" />
                                    <span>Recettes par Filière / Livres</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {c.entreesDetaillees.length} ligne(s)
                                  </span>
                                </div>
                                {c.entreesDetaillees.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {c.entreesDetaillees.map((e, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                                      >
                                        <div>
                                          <div className="font-medium text-slate-800">{e.libelle}</div>
                                          <div className="text-[10px] text-slate-400">
                                            {e.nombreOperations} op. • {e.categorie}
                                          </div>
                                        </div>
                                        <div className="font-bold text-slate-900 tabular-nums">
                                          {FCFA.format(e.montant)} XAF
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic py-2">
                                    Aucune recette enregistrée aujourd&apos;hui.
                                  </p>
                                )}
                              </div>

                              {/* 2. Sorties par motif */}
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Dépenses par Motif</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {c.sortiesDetaillees.length} motif(s)
                                  </span>
                                </div>
                                {c.sortiesDetaillees.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {c.sortiesDetaillees.map((s, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                                      >
                                        <div>
                                          <div className="font-medium text-slate-800">{s.libelleMotif}</div>
                                          <div className="text-[10px] text-slate-400">
                                            {s.nombreOperations} sortie(s)
                                          </div>
                                        </div>
                                        <div className="font-bold text-rose-600 tabular-nums">
                                          {FCFA.format(s.montant)} XAF
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic py-2">
                                    Aucune sortie effectuée ce jour.
                                  </p>
                                )}
                              </div>

                              {/* 3. Effectifs par filière */}
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-teal-600" />
                                    <span>Effectifs par Filière</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    Total : {c.effectifTotalCentre}
                                  </span>
                                </div>
                                {c.effectifsParFormation.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {c.effectifsParFormation.map((eff) => (
                                      <div
                                        key={eff.formationId}
                                        className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                                      >
                                        <div>
                                          <div className="font-medium text-slate-800">{eff.formationNom}</div>
                                          <div className="text-[10px] text-slate-400">
                                            +{eff.nouveauxElevesJour} nouveaux auj.
                                          </div>
                                        </div>
                                        <div className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded">
                                          {eff.effectifTotal}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic py-2">
                                    Aucun apprenant actif.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── VENTILATION DU RÉSEAU NATIONAL ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#0e4a56]" />
              <span>Ventilation Consolidée du Réseau</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Répartition des encaissements, dépenses et effectifs cumulés
            </p>
          </div>

          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 mt-3 sm:mt-0 text-xs">
            <button
              onClick={() => setActiveTabDetail("entrees")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTabDetail === "entrees"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              type="button"
            >
              Entrées ({entreesNationales.length})
            </button>
            <button
              onClick={() => setActiveTabDetail("sorties")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTabDetail === "sorties"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              type="button"
            >
              Sorties ({sortiesNationales.length})
            </button>
            <button
              onClick={() => setActiveTabDetail("effectifs")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTabDetail === "effectifs"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              type="button"
            >
              Effectifs ({effectifsNationaux.length})
            </button>
          </div>
        </div>

        {activeTabDetail === "entrees" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entreesNationales.map((e, idx) => {
              const pct = totalEntrees > 0 ? (e.montant / totalEntrees) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{e.libelle}</div>
                      <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {e.categorie}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm tabular-nums">
                        {FCFA.format(e.montant)} XAF
                      </div>
                      <div className="text-[10px] text-slate-400">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0e4a56] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTabDetail === "sorties" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortiesNationales.map((s, idx) => {
              const pct = totalSorties > 0 ? (s.montant / totalSorties) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{s.libelleMotif}</div>
                      <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        DÉPENSE
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-600 text-sm tabular-nums">
                        {FCFA.format(s.montant)} XAF
                      </div>
                      <div className="text-[10px] text-slate-400">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTabDetail === "effectifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {effectifsNationaux.map((eff) => {
              const pct = totalEffectif > 0 ? (eff.effectifTotal / totalEffectif) * 100 : 0;
              return (
                <div
                  key={eff.formationId}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{eff.formationNom}</div>
                      <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        FILIÈRE
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm tabular-nums">
                        {eff.effectifTotal} élèves
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        +{eff.nouveauxElevesJour} nouveaux auj.
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale d'impression officielle A4 */}
      <FicheSyntheseNationalePrintModal
        isOpen={modalPrintOuverte}
        onClose={() => setModalPrintOuverte(false)}
        date={date}
        nomSession={sessionActive ? `Session ${sessionActive.annee}` : undefined}
        consolide={consolide}
      />
    </div>
  );
}
