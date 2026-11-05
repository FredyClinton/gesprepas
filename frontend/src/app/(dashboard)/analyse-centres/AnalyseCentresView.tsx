"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Search,
  ExternalLink,
  Receipt,
  GraduationCap,
  Scale,
  ShieldAlert,
  Eye,
} from "lucide-react";

import { Card, Button, Modal, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";
import { useCentres, useSessionActive, useSessions } from "@/modules/centres-sessions";
import { useApprenants } from "@/modules/apprenants";
import { useFormations, type Formation } from "@/modules/academique";
import { useMouvementsFinanciers, useMotifs } from "@/modules/financier";
import { useUtilisateurs } from "@/modules/utilisateurs";

const FCFA = new Intl.NumberFormat("fr-FR");

export function AnalyseCentresView() {
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive, isLoading: chargementSessionActive } = useSessionActive();
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<string | null>(null);

  const sessionCourante = useMemo(() => {
    if (sessionIdSelectionnee) {
      return sessions.find((s) => s.id === sessionIdSelectionnee) ?? sessionActive ?? sessions[0];
    }
    return sessionActive ?? sessions[0];
  }, [sessionIdSelectionnee, sessions, sessionActive]);

  const activeSessionId = sessionCourante?.id;

  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [] } = useFormations();
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(activeSessionId);
  const { data: utilisateurs = [] } = useUtilisateurs();
  const { data: motifs = [] } = useMotifs();

  // Recherche et filtres
  const [recherche, setRecherche] = useState("");
  const [filtreAlerte, setFiltreAlerte] = useState<"TOUS" | "ALERTE_RECOUVREMENT" | "ALERTE_SOLDE" | "RETARD_BILAN">("TOUS");
  const [centreSelectionneId, setCentreSelectionneId] = useState<string | null>(null);

  // Tri
  type ColonneTri = "nom" | "effectif" | "facture" | "encaisse" | "depenses" | "solde" | "recouvrement" | "bilansEnAttente";
  const [triColonne, setTriColonne] = useState<ColonneTri>("encaisse");
  const [triDirection, setTriDirection] = useState<SortDirection>("desc");

  function handleTri(colonne: ColonneTri) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("desc");
    }
  }

  // Apprenants filtrés sur la session
  const apprenantsSession = useMemo(() => {
    if (!activeSessionId) return apprenants;
    return apprenants.filter((a) => !a.sessionId || a.sessionId === activeSessionId);
  }, [apprenants, activeSessionId]);

  // Mouvements valides
  const entreesValides = useMemo(
    () => mouvements.filter((m) => m.type === "ENTREE" && m.statut !== "REJETE"),
    [mouvements],
  );
  const sortiesValides = useMemo(
    () => mouvements.filter((m) => m.type === "SORTIE" && m.statut !== "REJETE"),
    [mouvements],
  );

  // Dictionnaire des motifs
  const mapMotifs = useMemo(() => {
    const map = new Map<string, string>();
    motifs.forEach((m) => map.set(m.id, m.nom));
    return map;
  }, [motifs]);

  // Analyse complète par centre
  const donneesCentres = useMemo(() => {
    return centres.map((centre) => {
      const chef = utilisateurs.find((u) => u.role === "CHEF_CENTRE" && u.centreId === centre.id);

      const apprenantsCentre = apprenantsSession.filter((a) => a.centreId === centre.id);
      const effectifTotal = apprenantsCentre.length;
      const preInscrits = apprenantsCentre.filter((a) => a.preInscrit).length;
      const confirmes = effectifTotal - preInscrits;

      // Chiffre d'affaires facturé (contrats)
      const caFacture = apprenantsCentre.reduce((acc, a) => acc + (a.montantContrat || 0), 0);

      // Entrées et sorties du centre
      const entreesCentre = entreesValides.filter((m) => m.centreId === centre.id);
      const sortiesCentre = sortiesValides.filter((m) => m.centreId === centre.id);
      const encaisse = entreesCentre.reduce((acc, m) => acc + m.montant, 0);
      const depenses = sortiesCentre.reduce((acc, m) => acc + m.montant, 0);
      const solde = encaisse - depenses;

      // Recouvrement
      const resteARecouvrer = Math.max(0, caFacture - encaisse);
      const tauxRecouvrement = caFacture > 0 ? Math.min(100, Math.round((encaisse / caFacture) * 100)) : 100;

      // Bilans journaliers rattachés
      const datesBilans = new Set<string>();
      let bilansEnAttente = 0;
      mouvements
        .filter((m) => m.centreId === centre.id && m.date)
        .forEach((m) => {
          const d = m.date.split("T")[0];
          if (!datesBilans.has(d)) {
            datesBilans.add(d);
            if (m.statut === "EN_ATTENTE") bilansEnAttente++;
          }
        });

      return {
        id: centre.id,
        nom: centre.nom,
        ville: centre.villeActuelle,
        statut: centre.statut,
        chefNom: chef ? `${chef.prenom} ${chef.nom}` : "Non assigné",
        effectifTotal,
        confirmes,
        preInscrits,
        caFacture,
        encaisse,
        depenses,
        solde,
        resteARecouvrer,
        tauxRecouvrement,
        bilansEnAttente,
        totalJournees: datesBilans.size,
      };
    });
  }, [centres, apprenantsSession, entreesValides, sortiesValides, mouvements, utilisateurs]);

  // Filtrage
  const centresFiltres = useMemo(() => {
    return donneesCentres.filter((c) => {
      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const matchNom = c.nom.toLowerCase().includes(q);
        const matchVille = (c.ville || "").toLowerCase().includes(q);
        const matchChef = c.chefNom.toLowerCase().includes(q);
        if (!matchNom && !matchVille && !matchChef) return false;
      }

      if (filtreAlerte === "ALERTE_RECOUVREMENT" && c.tauxRecouvrement >= 50) return false;
      if (filtreAlerte === "ALERTE_SOLDE" && c.solde >= 0) return false;
      if (filtreAlerte === "RETARD_BILAN" && c.bilansEnAttente === 0) return false;

      return true;
    });
  }, [donneesCentres, recherche, filtreAlerte]);

  // Tri
  const centresTries = useMemo(() => {
    return [...centresFiltres].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "nom") cmp = compareStrings(a.nom, b.nom);
      else if (triColonne === "effectif") cmp = compareNumbers(a.effectifTotal, b.effectifTotal);
      else if (triColonne === "facture") cmp = compareNumbers(a.caFacture, b.caFacture);
      else if (triColonne === "encaisse") cmp = compareNumbers(a.encaisse, b.encaisse);
      else if (triColonne === "depenses") cmp = compareNumbers(a.depenses, b.depenses);
      else if (triColonne === "solde") cmp = compareNumbers(a.solde, b.solde);
      else if (triColonne === "recouvrement") cmp = compareNumbers(a.tauxRecouvrement, b.tauxRecouvrement);
      else if (triColonne === "bilansEnAttente") cmp = compareNumbers(a.bilansEnAttente, b.bilansEnAttente);
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [centresFiltres, triColonne, triDirection]);

  // Agrégats consolidés
  const totauxConsolides = useMemo(() => {
    const effectif = donneesCentres.reduce((s, c) => s + c.effectifTotal, 0);
    const facture = donneesCentres.reduce((s, c) => s + c.caFacture, 0);
    const encaisse = donneesCentres.reduce((s, c) => s + c.encaisse, 0);
    const depenses = donneesCentres.reduce((s, c) => s + c.depenses, 0);
    const solde = encaisse - depenses;
    const taux = facture > 0 ? Math.min(100, Math.round((encaisse / facture) * 100)) : 100;
    return { effectif, facture, encaisse, depenses, solde, taux };
  }, [donneesCentres]);

  // Centre sélectionné pour le détail approfondi
  const centreSelectionne = useMemo(() => {
    if (!centreSelectionneId) return null;
    return donneesCentres.find((c) => c.id === centreSelectionneId) || null;
  }, [donneesCentres, centreSelectionneId]);

  const chargement =
    chargementSessions ||
    chargementSessionActive ||
    chargementCentres ||
    chargementApprenants ||
    chargementMouvements;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── 1. EN-TÊTE OPÉRATIONNEL ERP ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Analyse Financière par Centre
            </h1>
            {sessionCourante && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-slate-500" />
                Session {sessionCourante.annee}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Comparatif consolidé des performances financières, état des caisses et suivi des recouvrements par centre.
          </p>
        </div>

        {/* Sélecteur de session */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sessionCourante?.id || ""}
              onChange={(e) => setSessionIdSelectionnee(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:border-brand-orange focus:outline-none cursor-pointer"
              aria-label="Sélectionner la session académique"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.annee} {s.statut === "EN_COURS" ? "(En cours)" : `(${s.statut.toLowerCase()})`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* ── 2. SYNTHÈSE COMPTABLE HORIZONTALE ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recettes Globales */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Recettes Encaissées
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-emerald-700 tabular-nums">
              +{FCFA.format(totauxConsolides.encaisse)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Sur {FCFA.format(totauxConsolides.facture)} F facturés ({totauxConsolides.taux}%)
            </p>
          </div>
        </div>

        {/* Dépenses Globales */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Dépenses Décaissées
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <TrendingDown className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-rose-700 tabular-nums">
              -{FCFA.format(totauxConsolides.depenses)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Sorties consolidées des centres
            </p>
          </div>
        </div>

        {/* Solde Net Consolidé */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Solde Net Consolidé
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Scale className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className={`text-xl font-bold tracking-tight tabular-nums ${totauxConsolides.solde >= 0 ? "text-slate-900" : "text-rose-700"}`}>
              {FCFA.format(totauxConsolides.solde)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {totauxConsolides.solde >= 0 ? "Excédent global du réseau" : "Déficit global"}
            </p>
          </div>
        </div>

        {/* Effectifs du réseau */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Effectifs du Réseau
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <Users className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totauxConsolides.effectif}{" "}
              <span className="text-xs font-normal text-slate-400">apprenants</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Répartis sur {centres.length} centres
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. BARRE DE FILTRES COMPTABLES ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un centre, ville, responsable..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
            />
          </div>

          {/* Filtre Vigilance */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium whitespace-nowrap">Vigilance :</span>
            <select
              value={filtreAlerte}
              onChange={(e) => setFiltreAlerte(e.target.value as typeof filtreAlerte)}
              className="rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange focus:outline-none px-2.5 py-1 text-xs text-slate-900 font-medium"
            >
              <option value="TOUS">Tous les centres ({donneesCentres.length})</option>
              <option value="ALERTE_SOLDE">Solde déficitaire</option>
              <option value="ALERTE_RECOUVREMENT">Faible recouvrement (&lt; 50%)</option>
              <option value="RETARD_BILAN">Bilans en attente de visa</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{centresFiltres.length}</span> centre{centresFiltres.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TABLEAU COMPARATIF CONSOLIDÉ ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="text-brand-orange" size={16} />
              <span>Performances Financières par Centre</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tableau comparatif des volumes contractuels, montants encaissés et bilans de caisse.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-5">
            <SkeletonTable rows={6} />
          </div>
        ) : centresTries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Building2 size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">Aucun centre trouvé</h3>
            <p className="font-medium text-slate-500 max-w-sm">
              Aucun centre ne correspond aux critères sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
                <tr>
                  <SortableHeader
                    columnKey="nom"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Centre
                  </SortableHeader>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Responsable</th>
                  <SortableHeader
                    columnKey="effectif"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Effectif
                  </SortableHeader>
                  <SortableHeader
                    columnKey="facture"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Facturé
                  </SortableHeader>
                  <SortableHeader
                    columnKey="encaisse"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Encaissé
                  </SortableHeader>
                  <SortableHeader
                    columnKey="depenses"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Dépenses
                  </SortableHeader>
                  <SortableHeader
                    columnKey="solde"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Solde Net
                  </SortableHeader>
                  <SortableHeader
                    columnKey="recouvrement"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Recouvrement
                  </SortableHeader>
                  <SortableHeader
                    columnKey="bilansEnAttente"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Bilans à viser
                  </SortableHeader>
                  <th className="py-3.5 px-4 text-center text-slate-700 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {centresTries.map((centre) => {
                  const estDeficitaire = centre.solde < 0;
                  const estFaibleRecouvrement = centre.tauxRecouvrement < 50 && centre.effectifTotal > 0;

                  return (
                    <tr
                      key={centre.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setCentreSelectionneId(centre.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{centre.nom}</div>
                        <div className="text-[10px] text-slate-400">{centre.ville || "Sans localisation"}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {centre.chefNom}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 tabular-nums">
                        {centre.effectifTotal}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700 tabular-nums">
                        {FCFA.format(centre.caFacture)} F
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700 tabular-nums">
                        +{FCFA.format(centre.encaisse)} F
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-rose-700 tabular-nums">
                        -{FCFA.format(centre.depenses)} F
                      </td>
                      <td className={`py-3 px-4 text-right font-bold tabular-nums ${estDeficitaire ? "text-rose-700" : "text-slate-900"}`}>
                        {FCFA.format(centre.solde)} F
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                            estFaibleRecouvrement
                              ? "bg-rose-50 text-rose-700 border-rose-200/60"
                              : centre.tauxRecouvrement >= 75
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : "bg-amber-50 text-amber-700 border-amber-200/60"
                          }`}>
                            {centre.tauxRecouvrement}%
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full ${
                                estFaibleRecouvrement
                                  ? "bg-rose-500"
                                  : centre.tauxRecouvrement >= 75
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                              }`}
                              style={{ width: `${centre.tauxRecouvrement}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {centre.bilansEnAttente > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                            {centre.bilansEnAttente} en attente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                            À jour
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          onClick={() => setCentreSelectionneId(centre.id)}
                          className="h-7 px-2.5 text-xs font-semibold"
                        >
                          <Eye size={13} className="text-slate-500" />
                          <span>Fiche</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. MODALE DE FORAGE / DÉTAIL DU CENTRE ── */}
      {centreSelectionne && (
        <Modal
          isOpen={true}
          onClose={() => setCentreSelectionneId(null)}
          title={`Fiche Financière — ${centreSelectionne.nom}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            {/* Résumé KPIs du centre */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Effectif</span>
                <div className="text-lg font-black text-slate-900 mt-1">{centreSelectionne.effectifTotal} élèves</div>
                <div className="text-[10px] text-slate-500">{centreSelectionne.confirmes} confirmés</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Facturé</span>
                <div className="text-lg font-black text-slate-900 mt-1">{FCFA.format(centreSelectionne.caFacture)} F</div>
                <div className="text-[10px] text-slate-500">Contrats prépa</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Encaissé</span>
                <div className="text-lg font-black text-emerald-700 mt-1">+{FCFA.format(centreSelectionne.encaisse)} F</div>
                <div className="text-[10px] text-emerald-700 font-semibold">{centreSelectionne.tauxRecouvrement}% recouvré</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Solde Net</span>
                <div className={`text-lg font-black mt-1 ${centreSelectionne.solde >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                  {FCFA.format(centreSelectionne.solde)} F
                </div>
                <div className="text-[10px] text-slate-500">Dépenses : {FCFA.format(centreSelectionne.depenses)} F</div>
              </div>
            </div>

            {/* Informations de gestion */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Chef de Centre responsable :</span>
                <span className="font-bold text-slate-900">{centreSelectionne.chefNom}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Ville / Emplacement :</span>
                <span className="font-semibold text-slate-800">{centreSelectionne.ville || "Non précisé"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Reste à recouvrer :</span>
                <span className="font-bold text-slate-900">{FCFA.format(centreSelectionne.resteARecouvrer)} FCFA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Journées de caisse enregistrées :</span>
                <span className="font-semibold text-slate-800">{centreSelectionne.totalJournees} journée(s)</span>
              </div>
            </div>

            {/* Actions de redirection */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                href={`/bilan-journalier`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
              >
                <span>Consulter les bilans de ce centre</span>
                <ExternalLink size={13} />
              </Link>
              <Button
                variant="secondary"
                onClick={() => setCentreSelectionneId(null)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
