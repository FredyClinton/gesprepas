"use client";

import React, { useState } from "react";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/shared/ui";
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

  const expandAll = () => {
    if (!consolide?.centres) return;
    const allExpanded: Record<string, boolean> = {};
    consolide.centres.forEach((c) => {
      allExpanded[c.centreId] = true;
    });
    setExpandedCentres(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCentres({});
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

  const getStatutBadge = (c: BilanCentreResume) => {
    switch (c.statut) {
      case "CLOTURE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Clôturé</span>
          </span>
        );
      case "EN_ATTENTE_CONTROLEUR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Validé Chef</span>
          </span>
        );
      case "SOUMIS_CAISSIER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Visé Caisse</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="h-3.5 w-3.5" />
            <span>En cours</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── BARRE DE CONTRÔLE DE DATE & ACTIONS DIRECTEUR ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-4 shadow-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => onChangerJour(-1)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
              title="Jour précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 font-medium text-slate-800 text-sm">
              <Calendar className="h-4 w-4 text-brand-orange" />
              <span>{formaterDateFr(date)}</span>
            </div>
            <button
              onClick={() => onChangerJour(1)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
              title="Jour suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!estAujourdhui && (
            <button
              onClick={() => onChangerDate(new Date().toISOString().slice(0, 10))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
          )}

          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && onChangerDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 focus:border-brand-orange focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalPrintOuverte(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-brand-orange" />
            <span>Fiche Officielle Consolidée (A4)</span>
          </button>
        </div>
      </div>

      {/* ── 4 CARTES KPIS CONSOLIDÉES ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Entrées National */}
        <Card className="relative overflow-hidden border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Entrées Réseau
            </span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {FCFA.format(totalEntrees)}{" "}
              <span className="text-xs font-semibold text-slate-400">FCFA</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {entreesNationales.reduce((acc, e) => acc + e.nombreOperations, 0)} versement(s) encaissé(s)
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        </Card>

        {/* Total Sorties National */}
        <Card className="relative overflow-hidden border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Sorties Réseau
            </span>
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {FCFA.format(totalSorties)}{" "}
              <span className="text-xs font-semibold text-slate-400">FCFA</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {sortiesNationales.reduce((acc, s) => acc + s.nombreOperations, 0)} décaissement(s) validé(s)
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        </Card>

        {/* Solde Net Consolidé */}
        <Card className="relative overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 p-5 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Solde Net Consolidé
            </span>
            <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400 backdrop-blur-xs">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-emerald-300">
              {FCFA.format(netConsolide)}{" "}
              <span className="text-xs font-semibold text-emerald-400/80">FCFA</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Total net arrêté à centraliser
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-green-300" />
        </Card>

        {/* Clôtures & Effectifs */}
        <Card className="relative overflow-hidden border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Réseau & Clôtures
            </span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {centresClotures} / {centresTotal}{" "}
              <span className="text-xs font-semibold text-slate-400">clôturés</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-brand-orange" />
              <span>
                <strong>{totalEffectif}</strong> élèves (+{totalNouveaux} auj.)
              </span>
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </Card>
      </div>

      {/* ── TABLEAU MULTI-CENTRES INTERACTIF AVEC ACCORDÉONS ── */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-orange" />
              <span>Récapitulatif des Caisses par Centre</span>
              <span className="text-xs font-normal text-slate-500">
                ({centres.length} centre{centres.length > 1 ? "s" : ""})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliquez sur une ligne pour dérouler le détail des formations, dépenses et effectifs
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Tout déplier
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Tout replier
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-orange border-t-transparent mb-2" />
            <p>Chargement de la synthèse consolidée...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            Une erreur est survenue lors du chargement des données consolidées.
          </div>
        ) : centres.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucun centre n&apos;est enregistré pour cette session.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {centres.map((c) => {
              const isExpanded = !!expandedCentres[c.centreId];
              return (
                <div key={c.centreId} className="transition-colors hover:bg-slate-50/50">
                  {/* Ligne principale du centre */}
                  <div
                    onClick={() => toggleExpand(c.centreId)}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 cursor-pointer gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                        title={isExpanded ? "Replier" : "Déplier"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{c.centreNom}</span>
                          <span className="text-xs text-slate-400">({c.centreVille})</span>
                          {getStatutBadge(c)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Caissier : <span className="font-medium text-slate-700">{c.nomCaissier || "—"}</span>
                          {c.nomChefCentre ? ` • Chef : ${c.nomChefCentre}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Entrées</span>
                        <span className="font-semibold text-slate-800">{FCFA.format(c.totalEntrees)} XAF</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Sorties</span>
                        <span className="font-semibold text-rose-700">{FCFA.format(c.totalSorties)} XAF</span>
                      </div>
                      <div className="text-right bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-200/60">
                        <span className="text-amber-800 block text-[10px] uppercase font-bold">Net Caisse</span>
                        <span className="font-black text-slate-900 text-sm">{FCFA.format(c.netAVerser)} XAF</span>
                      </div>
                      <div className="text-center px-2 py-1 rounded-md bg-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Effectif</span>
                        <span className="font-bold text-slate-800">
                          {c.effectifTotalCentre}{" "}
                          <span className="text-[10px] text-emerald-600 font-normal">
                            (+{c.effectifNouveauxElevesTotal})
                          </span>
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCentre(c.centreId);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Consulter le journal détaillé de ce centre"
                      >
                        <span>Consulter</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* ── VOLET DÉPLIABLE DU CENTRE (ACCORDÉON) ── */}
                  {isExpanded && (
                    <div className="bg-slate-50/90 border-t border-slate-200 p-4 sm:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Sous-panneau Entrées par Formation & Livres */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5 text-brand-orange" />
                              <span>Entrées par Filière / Livres</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {c.entreesDetaillees.length} ligne{c.entreesDetaillees.length > 1 ? "s" : ""}
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
                                    <div className="font-semibold text-slate-800">{e.libelle}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {e.nombreOperations} versement(s) •{" "}
                                      <span className="text-amber-700">{e.categorie}</span>
                                    </div>
                                  </div>
                                  <div className="font-bold text-slate-900">
                                    {FCFA.format(e.montant)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">
                              Aucune entrée enregistrée ce jour.
                            </p>
                          )}
                        </div>

                        {/* 2. Sous-panneau Sorties par Motif */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" />
                              <span>Sorties par Motif de Dépense</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {c.sortiesDetaillees.length} motif{c.sortiesDetaillees.length > 1 ? "s" : ""}
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
                                    <div className="font-semibold text-slate-800">{s.libelleMotif}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {s.nombreOperations} opération(s)
                                    </div>
                                  </div>
                                  <div className="font-bold text-rose-700">
                                    {FCFA.format(s.montant)}
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

                        {/* 3. Sous-panneau Effectifs par Formation */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-blue-600" />
                              <span>Effectifs par Filière</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
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
                                    <div className="font-semibold text-slate-800">{eff.formationNom}</div>
                                    <div className="text-[10px] text-slate-400">
                                      +{eff.nouveauxElevesJour} nouveaux auj.
                                    </div>
                                  </div>
                                  <div className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                    {eff.effectifTotal} élèves
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">
                              Aucun élève inscrit dans ce centre.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Timestamps des visas */}
                      <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-4">
                          <span>
                            Visa Caisse :{" "}
                            <strong className="text-slate-700">
                              {c.dateVisaCaissier
                                ? new Date(c.dateVisaCaissier).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                : "En attente"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Validation Chef :{" "}
                            <strong className="text-slate-700">
                              {c.dateValidationChefCentre
                                ? new Date(c.dateValidationChefCentre).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                : "En attente"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Clôture Comptable :{" "}
                            <strong className="text-slate-700">
                              {c.dateValidationControleur
                                ? new Date(c.dateValidationControleur).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                : "En attente"}
                            </strong>
                          </span>
                        </div>
                        <button
                          onClick={() => onSelectCentre(c.centreId)}
                          className="font-bold text-brand-orange hover:underline text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>Voir les mouvements complets</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── SECTION VENTILATION CONSOLIDÉE NATIONALE DU RÉSEAU ── */}
      <Card className="overflow-hidden border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-brand-orange" />
              <span>Ventilation Consolidée Nationale du Réseau</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Analyse macroscopique des recettes, dépenses et effectifs cumulés
            </p>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 mt-3 sm:mt-0 text-xs">
            <button
              onClick={() => setActiveTabDetail("entrees")}
              className={`rounded-md px-3 py-1 font-semibold transition-colors cursor-pointer ${
                activeTabDetail === "entrees"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Entrées ({entreesNationales.length})
            </button>
            <button
              onClick={() => setActiveTabDetail("sorties")}
              className={`rounded-md px-3 py-1 font-semibold transition-colors cursor-pointer ${
                activeTabDetail === "sorties"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sorties ({sortiesNationales.length})
            </button>
            <button
              onClick={() => setActiveTabDetail("effectifs")}
              className={`rounded-md px-3 py-1 font-semibold transition-colors cursor-pointer ${
                activeTabDetail === "effectifs"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Effectifs ({effectifsNationaux.length})
            </button>
          </div>
        </div>

        {/* Contenu de l'onglet actif */}
        {activeTabDetail === "entrees" && (
          <div className="space-y-3">
            {entreesNationales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entreesNationales.map((e, idx) => {
                  const pct = totalEntrees > 0 ? (e.montant / totalEntrees) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{e.libelle}</div>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                            {e.categorie}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900 text-sm">
                            {FCFA.format(e.montant)} XAF
                          </div>
                          <div className="text-[10px] text-slate-500">{pct.toFixed(1)}% du total</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{e.nombreOperations} opération(s)</span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucune recette enregistrée pour cette date.
              </p>
            )}
          </div>
        )}

        {activeTabDetail === "sorties" && (
          <div className="space-y-3">
            {sortiesNationales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortiesNationales.map((s, idx) => {
                  const pct = totalSorties > 0 ? (s.montant / totalSorties) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.libelleMotif}</div>
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/50">
                            DÉPENSE
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-rose-700 text-sm">
                            {FCFA.format(s.montant)} XAF
                          </div>
                          <div className="text-[10px] text-slate-500">{pct.toFixed(1)}% des sorties</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{s.nombreOperations} opération(s)</span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>
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
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucun décaissement enregistré pour cette date.
              </p>
            )}
          </div>
        )}

        {activeTabDetail === "effectifs" && (
          <div className="space-y-3">
            {effectifsNationaux.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {effectifsNationaux.map((eff) => {
                  const pct = totalEffectif > 0 ? (eff.effectifTotal / totalEffectif) * 100 : 0;
                  return (
                    <div
                      key={eff.formationId}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{eff.formationNom}</div>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                            FILIÈRE PRÉPA
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900 text-sm">
                            {eff.effectifTotal} élèves
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            +{eff.nouveauxElevesJour} nouveaux auj.
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Part du réseau</span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucune donnée d&apos;effectif disponible.
              </p>
            )}
          </div>
        )}
      </Card>

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
