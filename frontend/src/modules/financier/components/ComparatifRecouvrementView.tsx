"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  AlignLeft,
  PieChart,
  LayoutGrid,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  Building2,
  Calendar,
  GraduationCap,
  Layers,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Modal, Button } from "@/shared/ui";

const FCFA = new Intl.NumberFormat("fr-FR");

export type DetailFormationItem = {
  id: string;
  nom: string;
  code?: string;
  attendu: number;
  encaisse: number;
  reste?: number;
  taux?: number;
  effectif?: number;
};

export type ItemComparatifRecouvrement = {
  id: string;
  nom: string;
  sousTitre?: string; // ex. Ville ou Filière
  attendu: number;
  encaisse: number;
  resteARecouvrer?: number;
  tauxRecouvrement?: number;
  effectif?: number;
  detailsUrl?: string;
  echeanceCourtTerme?: number;
  formations?: DetailFormationItem[];
};

export type ComparatifRecouvrementProps = {
  titre?: string;
  sousTitre?: string;
  items: ItemComparatifRecouvrement[];
  itemsFormations?: ItemComparatifRecouvrement[];
  vueParDefaut?: "barres" | "colonnes" | "synthese" | "grille";
  className?: string;
  isCentreScope?: boolean;
  nomEntiteLabel?: string;
};

export function ComparatifRecouvrementView({
  titre = "Comparatif Financier : Chiffre d'Affaires vs Encaissements Réels",
  sousTitre = "Visualisation graphique de la contractualisation et du recouvrement effectif",
  items,
  itemsFormations,
  vueParDefaut = "barres",
  className = "",
  nomEntiteLabel = "Centre",
}: ComparatifRecouvrementProps) {
  const [vueActive, setVueActive] = useState<"barres" | "colonnes" | "synthese" | "grille">(vueParDefaut);
  const [tri, setTri] = useState<"tauxDesc" | "caDesc" | "encaisseDesc" | "alpha">("caDesc");
  const [filtreSousTitre, setFiltreSousTitre] = useState<string>("TOUS");

  // Axe d'analyse : par Entité (Centre) ou par Filière / Formation
  const [axeAnalyse, setAxeAnalyse] = useState<"entite" | "formations">("entite");
  const [centreSelectionneDetail, setCentreSelectionneDetail] = useState<string>("TOUS");
  const [entiteDetailModal, setEntiteDetailModal] = useState<ItemComparatifRecouvrement | null>(null);

  // Liste des sous-titres distincts (ex: Villes)
  const sousTitresDisponibles = useMemo(() => {
    const sets = new Set<string>();
    items.forEach((i) => {
      if (i.sousTitre && i.sousTitre.trim() !== "") {
        sets.add(i.sousTitre);
      }
    });
    return Array.from(sets);
  }, [items]);

  // Extraction ou consolidation de la liste des formations
  const formationsExtraites = useMemo(() => {
    if (itemsFormations && itemsFormations.length > 0) {
      return itemsFormations;
    }

    const mapF = new Map<string, ItemComparatifRecouvrement>();
    items.forEach((item) => {
      item.formations?.forEach((f) => {
        const existante = mapF.get(f.id);
        if (existante) {
          existante.attendu += f.attendu;
          existante.encaisse += f.encaisse;
          existante.effectif = (existante.effectif || 0) + (f.effectif || 0);
          existante.resteARecouvrer = Math.max(0, existante.attendu - existante.encaisse);
          existante.tauxRecouvrement =
            existante.attendu > 0
              ? Math.min(100, Math.round((existante.encaisse / existante.attendu) * 100))
              : 0;
        } else {
          mapF.set(f.id, {
            id: f.id,
            nom: f.nom,
            sousTitre: f.code || "Filière",
            attendu: f.attendu,
            encaisse: f.encaisse,
            resteARecouvrer: f.reste ?? Math.max(0, f.attendu - f.encaisse),
            tauxRecouvrement:
              f.taux ??
              (f.attendu > 0 ? Math.min(100, Math.round((f.encaisse / f.attendu) * 100)) : 0),
            effectif: f.effectif || 0,
          });
        }
      });
    });

    return Array.from(mapF.values());
  }, [items, itemsFormations]);

  const aDesFormations = formationsExtraites.length > 0;

  // Données actives selon l'axe sélectionné
  const listeActive = axeAnalyse === "formations" && aDesFormations ? formationsExtraites : items;

  // Totaux consolidés
  const totaux = useMemo(() => {
    const totalAttendu = items.reduce((sum, i) => sum + i.attendu, 0);
    const totalEncaisse = items.reduce((sum, i) => sum + i.encaisse, 0);
    const totalReste = Math.max(0, totalAttendu - totalEncaisse);
    const tauxGlobal = totalAttendu > 0 ? Math.min(100, Math.round((totalEncaisse / totalAttendu) * 1000) / 10) : 0;

    const courtTerme = items.reduce((sum, i) => {
      if (typeof i.echeanceCourtTerme === "number") return sum + i.echeanceCourtTerme;
      const reste = Math.max(0, i.attendu - i.encaisse);
      return sum + Math.round(reste * 0.45);
    }, 0);

    const courtTermePlafonne = Math.min(courtTerme, totalReste);
    const soldeFinSession = Math.max(0, totalReste - courtTermePlafonne);

    const pctEncaisse = totalAttendu > 0 ? (totalEncaisse / totalAttendu) * 100 : 0;
    const pctCourtTerme = totalAttendu > 0 ? (courtTermePlafonne / totalAttendu) * 100 : 0;
    const pctFinSession = totalAttendu > 0 ? Math.max(0, 100 - pctEncaisse - pctCourtTerme) : 0;

    const itemsAvecContrats = listeActive.filter((i) => i.attendu > 0);
    const leader = [...itemsAvecContrats].sort(
      (a, b) => (b.tauxRecouvrement ?? (b.encaisse / (b.attendu || 1))) - (a.tauxRecouvrement ?? (a.encaisse / (a.attendu || 1))),
    )[0];

    const aRelancer = [...itemsAvecContrats].sort(
      (a, b) => (a.tauxRecouvrement ?? (a.encaisse / (a.attendu || 1))) - (b.tauxRecouvrement ?? (b.encaisse / (b.attendu || 1))),
    )[0];

    return {
      totalAttendu,
      totalEncaisse,
      totalReste,
      tauxGlobal,
      courtTerme: courtTermePlafonne,
      soldeFinSession,
      pctEncaisse: Math.round(pctEncaisse * 10) / 10,
      pctCourtTerme: Math.round(pctCourtTerme * 10) / 10,
      pctFinSession: Math.round(pctFinSession * 10) / 10,
      leader,
      aRelancer,
    };
  }, [items, listeActive]);

  // Données filtrées et triées
  const itemsTraites = useMemo(() => {
    let res = listeActive.filter((i) => {
      if (filtreSousTitre === "TOUS") return true;
      return i.sousTitre === filtreSousTitre;
    });

    res = [...res].sort((a, b) => {
      const tauxA = a.attendu > 0 ? (a.encaisse / a.attendu) * 100 : 0;
      const tauxB = b.attendu > 0 ? (b.encaisse / b.attendu) * 100 : 0;

      if (tri === "tauxDesc") return tauxB - tauxA;
      if (tri === "caDesc") return b.attendu - a.attendu;
      if (tri === "encaisseDesc") return b.encaisse - a.encaisse;
      if (tri === "alpha") return a.nom.localeCompare(b.nom);
      return 0;
    });

    const maxValeur = Math.max(...res.map((i) => Math.max(i.attendu, i.encaisse)), 1);

    return res.map((i) => {
      const taux = i.attendu > 0 ? Math.min(100, Math.round((i.encaisse / i.attendu) * 100)) : 0;
      const reste = Math.max(0, i.attendu - i.encaisse);
      return {
        ...i,
        taux,
        reste,
        pctAttenduRel: Math.round((i.attendu / maxValeur) * 100),
        pctEncaisseRel: Math.round((i.encaisse / maxValeur) * 100),
      };
    });
  }, [listeActive, filtreSousTitre, tri]);

  // Formations à afficher dans le tiroir de détail
  const formationsPourDetail = useMemo(() => {
    if (centreSelectionneDetail === "TOUS") {
      return formationsExtraites;
    }
    const centre = items.find((c) => c.id === centreSelectionneDetail);
    if (!centre || !centre.formations) return [];
    return centre.formations.map((f) => ({
      id: f.id,
      nom: f.nom,
      sousTitre: f.code || centre.nom,
      attendu: f.attendu,
      encaisse: f.encaisse,
      resteARecouvrer: f.reste ?? Math.max(0, f.attendu - f.encaisse),
      tauxRecouvrement:
        f.taux ??
        (f.attendu > 0 ? Math.min(100, Math.round((f.encaisse / f.attendu) * 100)) : 0),
      effectif: f.effectif || 0,
    }));
  }, [centreSelectionneDetail, items, formationsExtraites]);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}>
      {/* ── En-tête Principal & Sélecteur de Vues ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-orange" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">{titre}</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{sousTitre}</p>
        </div>

        {/* Sélecteur de vues & Tri */}
        <div className="flex flex-wrap items-center gap-2">
          {sousTitresDisponibles.length > 1 && axeAnalyse === "entite" && (
            <select
              value={filtreSousTitre}
              onChange={(e) => setFiltreSousTitre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <option value="TOUS">Toutes les localités ({items.length})</option>
              {sousTitresDisponibles.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setVueActive("barres")}
              title="Vue barres horizontales comparatives"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                vueActive === "barres"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlignLeft size={14} />
              <span className="hidden sm:inline">Barres</span>
            </button>

            <button
              type="button"
              onClick={() => setVueActive("colonnes")}
              title="Vue diagramme en colonnes verticales"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                vueActive === "colonnes"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={14} />
              <span className="hidden sm:inline">Colonnes</span>
            </button>

            <button
              type="button"
              onClick={() => setVueActive("synthese")}
              title="Vue synthèse globale & jauge de recouvrement"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                vueActive === "synthese"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PieChart size={14} />
              <span className="hidden sm:inline">Synthèse</span>
            </button>

            <button
              type="button"
              onClick={() => setVueActive("grille")}
              title="Vue cartes détaillées par entité"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                vueActive === "grille"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Cartes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── BANDEAU TOUJOURS PRÉSENT : PROGRESSION GLOBALE DE RECOUVREMENT (Format Capture Client) ── */}
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-700">Progression globale de recouvrement</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-slate-900">{FCFA.format(totaux.totalEncaisse)}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">{FCFA.format(totaux.totalAttendu)} FCFA</span>
            <span className="text-emerald-700">({totaux.tauxGlobal}%)</span>
          </div>
        </div>

        {/* Barre segmentée continue tricolore */}
        <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-slate-200 flex shadow-inner">
          <div
            className="h-full bg-emerald-600 transition-all duration-700 relative"
            style={{ width: `${totaux.pctEncaisse}%` }}
            title={`Déjà en banque / Encaissé : ${FCFA.format(totaux.totalEncaisse)} FCFA (${totaux.pctEncaisse}%)`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-700 relative"
            style={{ width: `${totaux.pctCourtTerme}%` }}
            title={`Échéances échues sous 15j : ${FCFA.format(totaux.courtTerme)} FCFA (${totaux.pctCourtTerme}%)`}
          />
          <div
            className="h-full bg-slate-300 transition-all duration-700 relative"
            style={{ width: `${totaux.pctFinSession}%` }}
            title={`Solde fin de session : ${FCFA.format(totaux.soldeFinSession)} FCFA (${totaux.pctFinSession}%)`}
          />
        </div>

        {/* Légende détaillée de la jauge */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span>Déjà en banque : <strong className="text-slate-800">{totaux.pctEncaisse}%</strong> ({FCFA.format(totaux.totalEncaisse)} F)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Échéances échues sous 15j : <strong className="text-slate-800">{totaux.pctCourtTerme}%</strong> ({FCFA.format(totaux.courtTerme)} F)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span>Solde fin de session : <strong className="text-slate-800">{totaux.pctFinSession}%</strong> ({FCFA.format(totaux.soldeFinSession)} F)</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VUE 1 : BARRES HORIZONTALES COMPARATIVES                                 */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vueActive === "barres" && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-1">
            <div className="flex items-center gap-2">
              {aDesFormations && (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAxeAnalyse("entite")}
                    className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                      axeAnalyse === "entite"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Par {nomEntiteLabel} ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAxeAnalyse("formations")}
                    className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                      axeAnalyse === "formations"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Par Formation ({formationsExtraites.length})
                  </button>
                </div>
              )}
              <span>Détail ({itemsTraites.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={12} className="text-slate-400" />
              <button
                type="button"
                onClick={() => setTri(tri === "tauxDesc" ? "caDesc" : "tauxDesc")}
                className="hover:text-slate-800 font-semibold cursor-pointer underline decoration-dotted"
              >
                {tri === "tauxDesc" ? "Trié par Taux ↓" : "Trié par CA Attendu ↓"}
              </button>
            </div>
          </div>

          {itemsTraites.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">Aucune donnée disponible.</p>
          ) : (
            itemsTraites.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.nom}</span>
                    {item.sousTitre && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{item.sousTitre}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-semibold">
                    <span className="text-slate-600">
                      Attendu : <strong className="text-slate-900">{FCFA.format(item.attendu)} F</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-emerald-700">
                      Encaissé : <strong className="text-emerald-800">{FCFA.format(item.encaisse)} F</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">
                      Reste : <strong className="text-rose-700">{FCFA.format(item.reste)} F</strong>
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                        item.attendu === 0
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : item.taux >= 80
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : item.taux >= 50
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {item.attendu === 0 ? "Aucun contrat" : `${item.taux}%`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEntiteDetailModal(item)}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
                    >
                      Détail
                    </button>
                    {item.detailsUrl && (
                      <Link
                        href={item.detailsUrl}
                        title="Ouvrir la page de pilotage complet"
                        className="p-1 text-slate-400 hover:text-brand-orange transition-colors"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Double barre relative */}
                <div className="mt-2.5 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all duration-500"
                      style={{ width: `${item.pctAttenduRel}%` }}
                      title={`CA Attendu : ${FCFA.format(item.attendu)} F`}
                    />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${item.pctEncaisseRel}%` }}
                      title={`Encaissé : ${FCFA.format(item.encaisse)} F`}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VUE 2 : DIAGRAMME EN BANDES VERTICALES AVEC DÉTAIL PAR FORMATION          */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vueActive === "colonnes" && (
        <div className="mt-5 space-y-5">
          {/* Barre d'options de la vue colonnes */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Axe d&apos;analyse :</span>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAxeAnalyse("entite")}
                  className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                    axeAnalyse === "entite"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Par {nomEntiteLabel} ({items.length})
                </button>
                {aDesFormations && (
                  <button
                    type="button"
                    onClick={() => setAxeAnalyse("formations")}
                    className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                      axeAnalyse === "formations"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Par Filière ({formationsExtraites.length})
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 font-semibold text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-slate-300" />
                <span className="text-slate-600">CA Attendu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-emerald-600" />
                <span className="text-emerald-800">Encaissé Réel</span>
              </div>
            </div>
          </div>

          {/* Graphique Histogramme Vertical SVG / Tailwind */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 overflow-x-auto">
            <div className="min-w-[560px] h-64 flex items-end justify-between gap-3 pt-8 pb-4 px-2 border-b border-slate-200 relative">
              {/* Repères horizontaux de graduation */}
              <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-200 text-[10px] text-slate-400 pl-1">
                Max : {FCFA.format(Math.max(...itemsTraites.map((i) => Math.max(i.attendu, i.encaisse)), 0))} F
              </div>
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200 text-[10px] text-slate-400 pl-1">
                50%
              </div>

              {itemsTraites.map((item) => (
                <div key={item.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Colonnes bicolores côte à côte */}
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Colonne Attendu */}
                    <div
                      className="w-5 sm:w-7 rounded-t-md bg-slate-300 hover:bg-slate-400 transition-all duration-500 relative flex items-center justify-center cursor-pointer"
                      style={{ height: `${Math.max(item.pctAttenduRel, 2)}%` }}
                      title={`${item.nom} - Attendu : ${FCFA.format(item.attendu)} F`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white transition-opacity pointer-events-none z-10 shadow-sm">
                        Attendu: {FCFA.format(item.attendu)} F
                      </span>
                    </div>

                    {/* Colonne Encaissé */}
                    <div
                      className="w-5 sm:w-7 rounded-t-md bg-emerald-600 hover:bg-emerald-700 transition-all duration-500 relative flex items-center justify-center cursor-pointer"
                      style={{ height: `${Math.max(item.pctEncaisseRel, 2)}%` }}
                      title={`${item.nom} - Encaissé : ${FCFA.format(item.encaisse)} F (${item.taux}%)`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 whitespace-nowrap rounded-md bg-emerald-900 px-2 py-0.5 text-[10px] font-bold text-white transition-opacity pointer-events-none z-10 shadow-sm">
                        Encaissé: {FCFA.format(item.encaisse)} F ({item.taux}%)
                      </span>
                    </div>
                  </div>

                  {/* Libellé Centre ou Formation en dessous */}
                  <div className="mt-2 text-center w-full">
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.nom}>
                      {item.nom}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700">{item.taux}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TIROIR ANALYTIQUE : DÉTAIL PAR FORMATION DANS LA VUE COLONNES ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-brand-orange">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Détail Analytique par Formation / Filière
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ventilation détaillée du volume financier souscrit et perçu
                  </p>
                </div>
              </div>

              {/* Filtre par centre si disponible */}
              {items.length > 1 && aDesFormations && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-600">Filtrer par centre :</span>
                  <select
                    value={centreSelectionneDetail}
                    onChange={(e) => setCentreSelectionneDetail(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="TOUS">Toutes les formations consolidées ({formationsExtraites.length})</option>
                    {items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} {c.formations ? `(${c.formations.length} filières)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Grille de cartes détaillées par filière */}
            {formationsPourDetail.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 italic">
                Aucune filière trouvée pour cette sélection.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formationsPourDetail.map((f) => {
                  const reste = f.resteARecouvrer ?? Math.max(0, f.attendu - f.encaisse);
                  const taux = f.tauxRecouvrement ?? (f.attendu > 0 ? Math.min(100, Math.round((f.encaisse / f.attendu) * 100)) : 0);

                  return (
                    <div
                      key={f.id}
                      className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-brand-orange/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate" title={f.nom}>
                              {f.nom}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {f.effectif ?? 0} apprenant(s) {f.sousTitre ? `• ${f.sousTitre}` : ""}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
                              f.attendu === 0
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : taux >= 80
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : taux >= 50
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {f.attendu === 0 ? "0%" : `${taux}%`}
                          </span>
                        </div>

                        {/* Données chiffrées */}
                        <div className="mt-2.5 space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-600">
                            <span>CA Contrats :</span>
                            <strong className="text-slate-900">{FCFA.format(f.attendu)} F</strong>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span>Encaissé :</span>
                            <strong className="text-emerald-800">{FCFA.format(f.encaisse)} F</strong>
                          </div>
                          <div className="flex justify-between text-rose-700">
                            <span>Reste dû :</span>
                            <strong className="text-rose-800">{FCFA.format(reste)} F</strong>
                          </div>
                        </div>

                        {/* Mini Jauge visuelle */}
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              taux >= 80 ? "bg-emerald-600" : taux >= 50 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(100, taux)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VUE 3 : SYNTHÈSE GLOBALE & PILOTAGE RÉSEAU                                */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vueActive === "synthese" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Carte Total CA Attendu */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold text-slate-500">Chiffre d&apos;Affaires Contractualisé</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {FCFA.format(totaux.totalAttendu)} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Sur l&apos;ensemble des {items.length} {nomEntiteLabel.toLowerCase()}s</p>
            </div>

            {/* Carte Total Encaissé */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-xs font-semibold text-emerald-800">Total Encaissé Réel</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-900">
                {FCFA.format(totaux.totalEncaisse)} <span className="text-xs font-normal text-emerald-700">FCFA</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">Taux global de recouvrement : {totaux.tauxGlobal}%</p>
            </div>

            {/* Carte Reste à Recouvrer */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
              <p className="text-xs font-semibold text-rose-800">Créances à Recouvrer</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-rose-900">
                {FCFA.format(totaux.totalReste)} <span className="text-xs font-normal text-rose-700">FCFA</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-rose-700">
                Solde restant à percevoir ({Math.round(100 - totaux.tauxGlobal)}%)
              </p>
            </div>
          </div>

          {/* Palmarès Directeur : Leader & Relance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {totaux.leader && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Award size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-emerald-800 block">
                    🏆 Leader en Recouvrement
                  </span>
                  <p className="font-bold text-slate-900 truncate text-sm">{totaux.leader.nom}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {totaux.leader.tauxRecouvrement ?? Math.round((totaux.leader.encaisse / (totaux.leader.attendu || 1)) * 100)}% encaissé ({FCFA.format(totaux.leader.encaisse)} F)
                  </p>
                </div>
              </div>
            )}

            {totaux.aRelancer && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <AlertCircle size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-amber-800 block">
                    ⚠️ Nécessitant Relance Prioritaire
                  </span>
                  <p className="font-bold text-slate-900 truncate text-sm">{totaux.aRelancer.nom}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    Reste dû : {FCFA.format(Math.max(0, totaux.aRelancer.attendu - totaux.aRelancer.encaisse))} F ({totaux.aRelancer.tauxRecouvrement ?? Math.round((totaux.aRelancer.encaisse / (totaux.aRelancer.attendu || 1)) * 100)}% encaissé)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VUE 4 : GRILLE DE CARTES KPI                                             */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vueActive === "grille" && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {itemsTraites.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.nom}</h3>
                    {item.sousTitre && <p className="text-xs text-slate-500">{item.sousTitre}</p>}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                      item.attendu === 0
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : item.taux >= 80
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : item.taux >= 50
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {item.attendu === 0 ? "0%" : `${item.taux}%`}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>CA Attendu :</span>
                    <strong className="text-slate-900">{FCFA.format(item.attendu)} F</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Encaissé :</span>
                    <strong className="text-emerald-800">{FCFA.format(item.encaisse)} F</strong>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Reste à percevoir :</span>
                    <strong className="text-rose-800">{FCFA.format(item.reste)} F</strong>
                  </div>
                </div>

                {/* Mini Jauge */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${item.taux}%` }}
                  />
                </div>
              </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setEntiteDetailModal(item)}
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-bold cursor-pointer transition-colors"
                  >
                    <span>Consulter le détail</span>
                    <ChevronRight size={13} />
                  </button>

                  {item.detailsUrl && (
                    <Link
                      href={item.detailsUrl}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
                    >
                      <span>Pilotage complet</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALE D'INSPECTION DÉTAILLÉE DU CENTRE / DE L'ENTITÉ ── */}
      {entiteDetailModal && (
        <Modal
          isOpen={!!entiteDetailModal}
          onClose={() => setEntiteDetailModal(null)}
          title={entiteDetailModal.nom}
          description={
            entiteDetailModal.sousTitre
              ? `${entiteDetailModal.sousTitre} • Synthèse analytique et financière`
              : "Synthèse analytique et financière"
          }
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 pt-2">
            {/* Grille 4 KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Effectif
                </span>
                <div className="mt-1 text-lg font-black text-slate-900 tabular-nums">
                  {entiteDetailModal.effectif ?? 0} élèves
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  CA Contrats
                </span>
                <div className="mt-1 text-lg font-black text-slate-900 tabular-nums">
                  {FCFA.format(entiteDetailModal.attendu)} F
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Encaissé Réel
                </span>
                <div className="mt-1 text-lg font-black text-emerald-800 tabular-nums">
                  {FCFA.format(entiteDetailModal.encaisse)} F
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                  Reste Dû
                </span>
                <div className="mt-1 text-lg font-black text-rose-800 tabular-nums">
                  {FCFA.format(
                    entiteDetailModal.resteARecouvrer ??
                      Math.max(0, entiteDetailModal.attendu - entiteDetailModal.encaisse),
                  )}{" "}
                  F
                </div>
              </div>
            </div>

            {/* Barre de progression du recouvrement */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Taux de recouvrement effectif</span>
                <span
                  className={
                    entiteDetailModal.tauxRecouvrement && entiteDetailModal.tauxRecouvrement >= 80
                      ? "text-emerald-700"
                      : entiteDetailModal.tauxRecouvrement && entiteDetailModal.tauxRecouvrement >= 50
                        ? "text-amber-700"
                        : "text-rose-700"
                  }
                >
                  {entiteDetailModal.tauxRecouvrement ?? 0}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    entiteDetailModal.tauxRecouvrement && entiteDetailModal.tauxRecouvrement >= 80
                      ? "bg-emerald-600"
                      : entiteDetailModal.tauxRecouvrement && entiteDetailModal.tauxRecouvrement >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, entiteDetailModal.tauxRecouvrement ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Tableau des formations du centre */}
            {entiteDetailModal.formations && entiteDetailModal.formations.length > 0 ? (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-brand-orange" />
                  <span>Ventilation par filière ({entiteDetailModal.formations.length})</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="p-3">Filière</th>
                        <th className="p-3 text-center">Effectif</th>
                        <th className="p-3 text-right">CA Contrats</th>
                        <th className="p-3 text-right">Encaissé</th>
                        <th className="p-3 text-right">Reste dû</th>
                        <th className="p-3 text-center">Taux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {entiteDetailModal.formations.map((f) => {
                        const reste = f.reste ?? Math.max(0, f.attendu - f.encaisse);
                        const taux = f.taux ?? (f.attendu > 0 ? Math.min(100, Math.round((f.encaisse / f.attendu) * 100)) : 0);
                        return (
                          <tr key={f.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-bold text-slate-900">{f.nom}</td>
                            <td className="p-3 text-center">{f.effectif ?? 0}</td>
                            <td className="p-3 text-right tabular-nums">{FCFA.format(f.attendu)} F</td>
                            <td className="p-3 text-right tabular-nums text-emerald-700">
                              {FCFA.format(f.encaisse)} F
                            </td>
                            <td className="p-3 text-right tabular-nums text-rose-700">
                              {FCFA.format(reste)} F
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  taux >= 80
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : taux >= 50
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-rose-50 text-rose-800 border-rose-200"
                                }`}
                              >
                                {taux}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                Aucun détail de sous-filière spécifique pour cette entité.
              </p>
            )}

            {/* Boutons d'action pied de page */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEntiteDetailModal(null)}
                className="w-full sm:w-auto text-xs font-semibold"
              >
                Fermer
              </Button>

              {entiteDetailModal.detailsUrl && (
                <Link
                  href={entiteDetailModal.detailsUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
                >
                  <span>Accéder au Pilotage &amp; Ventilation complet</span>
                  <ExternalLink size={14} />
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
