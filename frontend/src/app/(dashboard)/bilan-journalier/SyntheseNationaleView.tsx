"use client";

import React, { useState, useMemo } from "react";
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
import { SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";

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

  // Tri du tableau des centres
  type ColonneTriSynthese = "centre" | "caissier" | "statut" | "entrees" | "sorties" | "net" | "effectif";
  const [triColonne, setTriColonne] = useState<ColonneTriSynthese>("centre");
  const [triDirection, setTriDirection] = useState<SortDirection>("asc");

  function handleTri(colonne: ColonneTriSynthese) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
  }

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

  const centres = useMemo(() => {
    const list = consolide?.centres || [];
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "centre") {
        cmp = compareStrings(a.centreNom, b.centreNom);
      } else if (triColonne === "caissier") {
        cmp = compareStrings(
          a.nomCaissier || a.nomChefCentre || "",
          b.nomCaissier || b.nomChefCentre || "",
        );
      } else if (triColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      } else if (triColonne === "entrees") {
        cmp = compareNumbers(a.totalEntrees, b.totalEntrees);
      } else if (triColonne === "sorties") {
        cmp = compareNumbers(a.totalSorties, b.totalSorties);
      } else if (triColonne === "net") {
        cmp = compareNumbers(a.netAVerser, b.netAVerser);
      } else if (triColonne === "effectif") {
        cmp = compareNumbers(a.effectifTotalCentre, b.effectifTotalCentre);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [consolide?.centres, triColonne, triDirection]);
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
              <Calendar className="h-4 w-4 text-brand-orange" />
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

        {/* Bouton d'action Générer Rapport Officiel */}
        <div>
          <button
            onClick={() => setModalPrintOuverte(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange hover:bg-brand-orange/90 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            type="button"
          >
            <Printer className="h-4 w-4" />
            <span>Générer Rapport Officiel</span>
          </button>
        </div>
      </div>

      {/* ── SYNTHÈSE NATIONALE HORIZONTALE ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Solde Net Consolidé */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Solde Net Consolidé
            </span>
            <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange border border-orange-200/60">
              Réseau
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight tabular-nums text-slate-900">
              {FCFA.format(netConsolide)}{" "}
              <span className="text-xs font-normal text-slate-400">XAF</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Total net à centraliser
            </p>
          </div>
        </div>

        {/* 2. Total Entrées Réseau */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Total Entrées Réseau
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Coins className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-emerald-700 tabular-nums">
              +{FCFA.format(totalEntrees)}{" "}
              <span className="text-xs font-normal text-slate-400">XAF</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {nbOperationsEntrees} opération{nbOperationsEntrees > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* 3. Total Sorties Réseau */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Total Sorties Réseau
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <RefreshCw className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-rose-700 tabular-nums">
              -{FCFA.format(totalSorties)}{" "}
              <span className="text-xs font-normal text-slate-400">XAF</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {nbOperationsSorties} opération{nbOperationsSorties > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* 4. Total Effectif Réseau & Clôtures */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Effectifs du Réseau
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Users className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalEffectif}{" "}
              <span className="text-xs font-normal text-slate-400">élèves</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-orange border-t-transparent mb-2" />
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
                  <SortableHeader
                    columnKey="centre"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Centre
                  </SortableHeader>
                  <SortableHeader
                    columnKey="caissier"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Caissier
                  </SortableHeader>
                  <SortableHeader
                    columnKey="statut"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Statut
                  </SortableHeader>
                  <SortableHeader
                    columnKey="entrees"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Entrées du Jour
                  </SortableHeader>
                  <SortableHeader
                    columnKey="sorties"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Sorties du Jour
                  </SortableHeader>
                  <SortableHeader
                    columnKey="net"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Net Caisse
                  </SortableHeader>
                  <SortableHeader
                    columnKey="effectif"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Effectif (Actif)
                  </SortableHeader>
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-brand-orange hover:text-brand-anthracite hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
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
                            {/* Bandeau indicateurs d'activité du centre */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-medium">Salles occupées :</span>
                                  <span className="font-bold text-slate-800">{c.nombreSalles ?? 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-medium">Cours validés :</span>
                                  <span className="font-bold text-slate-800">{c.nombreCours ?? 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-medium">Nouveaux élèves :</span>
                                  <span className="font-bold text-teal-700">+{c.effectifNouveauxElevesTotal}</span>
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {c.nomCaissier ? `Arrêté de caisse visé par ${c.nomCaissier}` : "En attente de visa caissier"}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* 1. Entrées par formation & livres */}
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <GraduationCap className="h-3.5 w-3.5 text-brand-orange" />
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
                                    <Users className="h-3.5 w-3.5 text-brand-orange" />
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
              <PieChart className="h-4 w-4 text-brand-orange" />
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
                        className="h-full bg-brand-orange rounded-full"
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
                        className="h-full bg-brand-orange rounded-full"
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
