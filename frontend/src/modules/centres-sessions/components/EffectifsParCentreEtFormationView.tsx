"use client";

import React, { useMemo } from "react";
import { Users, GraduationCap, Building2 } from "lucide-react";

export interface FormationBreakdown {
  id: string;
  nom: string;
  effectif: number;
  pct?: number;
}

export interface CentreEffectifItem {
  id: string;
  nom: string;
  ville?: string;
  effectif: number;
  capacite?: number;
  taux?: number;
  formations: FormationBreakdown[];
}

export interface EffectifsParCentreEtFormationViewProps {
  titre?: string;
  sousTitre?: string;
  centres?: CentreEffectifItem[];
  // Données brutes optionnelles pour calcul dynamique automatique
  rawCentres?: { id: string; nom: string; villeActuelle?: string; adresseActuelle?: string; statut?: string }[];
  rawFormations?: { id: string; nom: string }[];
  rawApprenants?: { id: string; centreId: string; formationId?: string; sessionId?: string }[];
  activeSessionId?: string;
  capacitesParCentre?: Record<string, number>;
  layout?: "horizontal" | "vertical";
  className?: string;
  useDemoFallbackIfEmpty?: boolean;
}

// Couleurs harmonieuses des filières (fidèles à la charte)
const FORMATION_PALETTE = [
  { dot: "bg-amber-500", text: "text-amber-500", hex: "#F59E0B" },
  { dot: "bg-blue-500", text: "text-blue-500", hex: "#3B82F6" },
  { dot: "bg-emerald-500", text: "text-emerald-500", hex: "#10B981" },
  { dot: "bg-purple-500", text: "text-purple-500", hex: "#8B5CF6" },
  { dot: "bg-rose-500", text: "text-rose-500", hex: "#F43F5E" },
  { dot: "bg-indigo-500", text: "text-indigo-500", hex: "#6366F1" },
  { dot: "bg-teal-500", text: "text-teal-500", hex: "#14B8A6" },
];

// Données étalons haute fidélité (fidèles à la maquette de l'utilisateur)
const DEMO_CENTRES_EFFECTIFS: CentreEffectifItem[] = [
  {
    id: "campus-nil",
    nom: "Campus NIL",
    ville: "Yaoundé Centre",
    effectif: 385,
    capacite: 420,
    taux: 91.6,
    formations: [
      { id: "f-ing", nom: "Ingénieurs", effectif: 195, pct: 50.6 },
      { id: "f-med", nom: "Médecine & Santé", effectif: 140, pct: 36.4 },
      { id: "f-adm", nom: "Admin & ENAM", effectif: 50, pct: 13.0 },
    ],
  },
  {
    id: "sainte-famille",
    nom: "Sainte Famille",
    ville: "Yaoundé Ouest",
    effectif: 240,
    capacite: 300,
    taux: 80.0,
    formations: [
      { id: "f-ing", nom: "Ingénieurs", effectif: 110, pct: 45.8 },
      { id: "f-med", nom: "Médecine & Santé", effectif: 85, pct: 35.4 },
      { id: "f-adm", nom: "Admin & ENAM", effectif: 45, pct: 18.8 },
    ],
  },
  {
    id: "cesam-crera",
    nom: "CESAM-CRERA",
    ville: "Yaoundé Nord",
    effectif: 155,
    capacite: 230,
    taux: 67.4,
    formations: [
      { id: "f-ing", nom: "Ingénieurs", effectif: 35, pct: 22.6 },
      { id: "f-med", nom: "Médecine & Santé", effectif: 40, pct: 25.8 },
      { id: "f-adm", nom: "Admin & ENAM", effectif: 80, pct: 51.6 },
    ],
  },
];

// Capacités par défaut estimées pour les centres connus
const CAPACITES_CONNUES: Record<string, number> = {
  "campus nil": 420,
  "nil": 420,
  "sainte famille": 300,
  "sainte-famille": 300,
  "cesam-crera": 230,
  "cesam": 230,
  "crera": 230,
};

export function EffectifsParCentreEtFormationView({
  titre = "Effectifs Détaillés par Centre & Formation",
  sousTitre,
  centres: propsCentres,
  rawCentres,
  rawFormations,
  rawApprenants,
  activeSessionId,
  capacitesParCentre,
  layout = "horizontal",
  className = "",
  useDemoFallbackIfEmpty = false,
}: EffectifsParCentreEtFormationViewProps) {
  // Calcul et consolidation des données
  const donneesTraitees = useMemo(() => {
    // Si des centres déjà préparés sont fournis
    if (propsCentres && propsCentres.length > 0) {
      return propsCentres.map((c) => {
        const effectif = c.effectif;
        const capacite =
          c.capacite ||
          capacitesParCentre?.[c.id] ||
          CAPACITES_CONNUES[c.nom.toLowerCase().trim()] ||
          (effectif > 0 ? Math.max(effectif, Math.ceil((effectif * 1.2) / 10) * 10) : 100);
        const taux =
          c.taux !== undefined
            ? c.taux
            : capacite > 0
            ? Number(((effectif / capacite) * 100).toFixed(1))
            : 0;

        const formations = c.formations.map((f) => ({
          ...f,
          pct:
            f.pct !== undefined
              ? f.pct
              : effectif > 0
              ? Number(((f.effectif / effectif) * 100).toFixed(1))
              : 0,
        }));

        return {
          ...c,
          capacite,
          taux,
          formations,
        };
      });
    }

    // Si des données brutes sont passées
    if (rawCentres && rawCentres.length > 0) {
      const apprenantsFiltres = (rawApprenants || []).filter(
        (a) => !activeSessionId || !a.sessionId || a.sessionId === activeSessionId,
      );

      const items = rawCentres.map((centre) => {
        const apprenantsDuCentre = apprenantsFiltres.filter((a) => a.centreId === centre.id);
        const effectif = apprenantsDuCentre.length;

        const capacite =
          capacitesParCentre?.[centre.id] ||
          CAPACITES_CONNUES[centre.nom.toLowerCase().trim()] ||
          (effectif > 0 ? Math.max(effectif, Math.ceil((effectif * 1.2) / 10) * 10) : 100);

        const taux = capacite > 0 ? Number(((effectif / capacite) * 100).toFixed(1)) : 0;

        // Formations
        const formationsList = (rawFormations || [])
          .map((f) => {
            const count = apprenantsDuCentre.filter((a) => a.formationId === f.id).length;
            const pct = effectif > 0 ? Number(((count / effectif) * 100).toFixed(1)) : 0;
            return {
              id: f.id,
              nom: f.nom,
              effectif: count,
              pct,
            };
          })
          .filter((f) => f.effectif > 0);

        return {
          id: centre.id,
          nom: centre.nom,
          ville: centre.villeActuelle || centre.adresseActuelle || "Implantation",
          effectif,
          capacite,
          taux,
          formations: formationsList,
        };
      });

      const totalEffectifBrut = items.reduce((acc, c) => acc + c.effectif, 0);

      // Si aucune donnée réelle d'apprenants n'existe encore et que le fallback est activé
      if (totalEffectifBrut === 0 && useDemoFallbackIfEmpty) {
        return DEMO_CENTRES_EFFECTIFS;
      }

      return items;
    }

    // Fallback de démonstration par défaut
    return useDemoFallbackIfEmpty ? DEMO_CENTRES_EFFECTIFS : [];
  }, [
    propsCentres,
    rawCentres,
    rawFormations,
    rawApprenants,
    activeSessionId,
    capacitesParCentre,
    useDemoFallbackIfEmpty,
  ]);

  // Totaux globaux consolidés
  const { totalApprenants, totalCapacite, tauxGlobal, recapitulatifFilieres, nbCampus } = useMemo(() => {
    const totalApp = donneesTraitees.reduce((acc, c) => acc + c.effectif, 0);
    const totalCap = donneesTraitees.reduce((acc, c) => acc + (c.capacite || 0), 0);
    const globalRate = totalCap > 0 ? Number(((totalApp / totalCap) * 100).toFixed(1)) : 0;

    // Regroupement consolidé par filière
    const filieresMap = new Map<string, { nom: string; effectif: number }>();
    donneesTraitees.forEach((centre) => {
      centre.formations.forEach((f) => {
        const exist = filieresMap.get(f.nom) || { nom: f.nom, effectif: 0 };
        exist.effectif += f.effectif;
        filieresMap.set(f.nom, exist);
      });
    });

    const recap = Array.from(filieresMap.values())
      .map((f, idx) => ({
        ...f,
        pct: totalApp > 0 ? Number(((f.effectif / totalApp) * 100).toFixed(1)) : 0,
        color: FORMATION_PALETTE[idx % FORMATION_PALETTE.length],
      }))
      .sort((a, b) => b.effectif - a.effectif);

    return {
      totalApprenants: totalApp,
      totalCapacite: totalCap,
      tauxGlobal: globalRate,
      recapitulatifFilieres: recap,
      nbCampus: donneesTraitees.length,
    };
  }, [donneesTraitees]);

  // Mapper chaque nom de filière vers une couleur consistante
  const mapCouleursFilieres = useMemo(() => {
    const map = new Map<string, (typeof FORMATION_PALETTE)[0]>();
    recapitulatifFilieres.forEach((f, idx) => {
      map.set(f.nom, FORMATION_PALETTE[idx % FORMATION_PALETTE.length]);
    });
    return map;
  }, [recapitulatifFilieres]);

  const sousTitreAffiche =
    sousTitre ||
    `Distribution comparative et taux de remplissage des ${totalApprenants.toLocaleString("fr-FR")} apprenants à travers les ${nbCampus} campus opérationnels`;

  // ════════════════════════════════════════════════════════════════════════════
  // A. RENDU SOBRE POUR COLONNE VERTICALE (Caissier & Chef de Centre)
  // ════════════════════════════════════════════════════════════════════════════
  if (layout === "vertical") {
    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
      >
        {/* En-tête sobre aligné avec la charte des cartes d'appoint */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-orange-50 text-brand-orange shrink-0">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider truncate">
                {titre}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                {totalApprenants} apprenants · {nbCampus} campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
              {nbCampus} C.
            </span>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
              {tauxGlobal}%
            </span>
          </div>
        </div>

        {/* Cartes compactes des campus */}
        <div className="flex flex-col gap-3">
          {donneesTraitees.map((centre) => {
            const taux = centre.taux ?? 0;
            const estHautRemplissage = taux >= 80;

            return (
              <div
                key={centre.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all space-y-2.5"
              >
                {/* Nom + Ratio */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        estHautRemplissage ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span
                      className="font-bold text-slate-800 truncate max-w-[145px] sm:max-w-[170px]"
                      title={centre.nom}
                    >
                      {centre.nom}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 tabular-nums">
                      {centre.effectif}
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">
                      {" "}
                      / {centre.capacite}
                    </span>
                  </div>
                </div>

                {/* Localisation & Taux */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate">{centre.ville || "Yaoundé"}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      estHautRemplissage ? "text-emerald-600" : "text-amber-500"
                    }`}
                  >
                    Taux : {taux.toFixed(1)}%
                  </span>
                </div>

                {/* Jauge sobre */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      estHautRemplissage ? "bg-emerald-500" : "bg-brand-orange"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, taux))}%` }}
                  />
                </div>

                {/* Formations du campus */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/40">
                  {centre.formations.map((f, fIdx) => {
                    const couleur =
                      mapCouleursFilieres.get(f.nom) ||
                      FORMATION_PALETTE[fIdx % FORMATION_PALETTE.length];

                    return (
                      <div
                        key={f.id || f.nom}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${couleur.dot}`} />
                          <span
                            className="text-slate-600 font-medium truncate max-w-[140px] sm:max-w-[160px]"
                            title={f.nom}
                          >
                            {f.nom}
                          </span>
                        </div>
                        <div className="shrink-0 text-right tabular-nums">
                          <span className="font-bold text-slate-800">{f.effectif}</span>
                          <span className="text-slate-400 ml-1 text-[10px]">[{f.pct}%]</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer sobre et compact */}
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-slate-800 pb-1.5 border-b border-slate-200/60">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Récapitulatif filières
            </span>
            <span className="text-brand-orange font-black tabular-nums">
              {totalApprenants} apprenants
            </span>
          </div>
          <div className="space-y-1.5">
            {recapitulatifFilieres.map((rf) => (
              <div key={rf.nom} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${rf.color.dot}`} />
                  <span className="text-slate-600 truncate">{rf.nom}</span>
                </div>
                <span className="font-bold text-slate-800 tabular-nums shrink-0">
                  {rf.effectif}{" "}
                  <span className="text-slate-400 font-normal text-[10px]">
                    ({rf.pct}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // B. RENDU HORIZONTAL STANDARD (Cockpit Directeur)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs ${className}`}
    >
      {/* ── 1. EN-TÊTE DU WIDGET (Fidèle à la maquette) ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-brand-orange ring-1 ring-orange-200/50">
              <Users size={17} className="stroke-[2.2]" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              {titre}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
            {sousTitreAffiche}
          </p>
        </div>

        {/* Badges d'état consolidé */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Building2 size={13} className="text-slate-500" />
            <span>
              Réseau consolidé : {nbCampus} Campus
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-2xs">
            <span>Capacité globale :</span>
            <span className="font-extrabold text-amber-600 tabular-nums">
              {tauxGlobal}%
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. CARTES DES CAMPUS EN GRILLE HORIZONTALE ── */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {donneesTraitees.map((centre) => {
          const taux = centre.taux ?? 0;
          const estHautRemplissage = taux >= 80;

          return (
            <div
              key={centre.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition duration-200"
            >
              <div>
                {/* Ligne 1 : Statut + Nom + Effectif / Capacité */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        estHautRemplissage ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      title={estHautRemplissage ? "Capacité optimale (≥ 80%)" : "Sous capacité (< 80%)"}
                    />
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {centre.nom}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-sm sm:text-base text-slate-900 tabular-nums">
                      {centre.effectif}
                    </span>
                    <span className="text-slate-400 font-semibold text-xs sm:text-sm">
                      {" "}
                      / {centre.capacite}
                    </span>
                  </div>
                </div>

                {/* Ligne 2 : Localisation & Taux */}
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">
                    {centre.ville || "Yaoundé"} · Taux :{" "}
                    <span
                      className={`font-bold tabular-nums ${
                        estHautRemplissage ? "text-emerald-600" : "text-amber-500"
                      }`}
                    >
                      {taux.toFixed(1)}%
                    </span>
                  </span>
                </div>

                {/* Ligne 3 : Barre de progression horizontale */}
                <div className="mt-3 mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      estHautRemplissage ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, taux))}%` }}
                  />
                </div>

                {/* Ligne 4 : Liste détaillée des formations du centre */}
                <div className="space-y-2.5 pt-1">
                  {centre.formations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Aucune formation active dans ce centre
                    </p>
                  ) : (
                    centre.formations.map((f, fIdx) => {
                      const couleur =
                        mapCouleursFilieres.get(f.nom) ||
                        FORMATION_PALETTE[fIdx % FORMATION_PALETTE.length];

                      return (
                        <div
                          key={f.id || f.nom}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${couleur.dot}`}
                            />
                            <span className="font-medium text-slate-700 truncate">
                              {f.nom}
                            </span>
                          </div>

                          <div className="shrink-0 text-right tabular-nums">
                            <span className="font-bold text-slate-900">
                              {f.effectif}
                            </span>
                            <span className="text-slate-400 font-normal ml-1 text-[11px]">
                              [{f.pct}%]
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. BANDEAU DE RÉCAPITULATIF CONSOLIDÉ PAR FILIÈRE (Footer) ── */}
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
          <span className="flex items-center gap-1.5 font-black uppercase text-[11px] tracking-wider text-slate-900 shrink-0">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            RÉCAPITULATIF CONSOLIDÉ PAR FILIÈRE :
          </span>

          {recapitulatifFilieres.map((rf) => (
            <span
              key={rf.nom}
              className="flex items-center gap-1.5 text-slate-700 font-medium"
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${rf.color.dot}`} />
              <span>{rf.nom} :</span>
              <strong className="font-black text-slate-900 tabular-nums">
                {rf.effectif} ({rf.pct}%)
              </strong>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 font-black text-slate-900 shrink-0 text-xs border-t md:border-t-0 md:border-l border-slate-200/80 pt-2 md:pt-0 md:pl-4">
          <GraduationCap size={15} className="text-brand-orange" />
          <span className="tabular-nums">{totalApprenants.toLocaleString("fr-FR")} Apprenants</span>
        </div>
      </div>
    </div>
  );
}
