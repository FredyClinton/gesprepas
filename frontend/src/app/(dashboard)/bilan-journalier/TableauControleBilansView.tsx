"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Scale,
  Eye,
  AlertTriangle,
  X,
} from "lucide-react";

import { Card, Button, Modal, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useMouvementsFinanciers } from "@/modules/financier";

const FCFA = new Intl.NumberFormat("fr-FR");

type PeriodeFiltre = "AUJOURDHUI" | "HIER" | "7_JOURS" | "MOIS" | "DATE_SPECIFIQUE" | "TOUS";

interface TableauControleBilansViewProps {
  onSelectBilan: (centreId: string, date: string) => void;
}

export function TableauControleBilansView({ onSelectBilan }: TableauControleBilansViewProps) {
  const { data: sessionActive, isLoading: chargementSession } = useSessionActive();
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(sessionActive?.id);

  // Filtres
  const [centreFiltre, setCentreFiltre] = useState<string>("TOUS");
  const [statutFiltre, setStatutFiltre] = useState<"TOUS" | "EN_ATTENTE" | "CLOTURE">("TOUS");
  const [periode, setPeriode] = useState<PeriodeFiltre>("TOUS");
  const [dateSpecifique, setDateSpecifique] = useState(new Date().toISOString().split("T")[0]);
  const [recherche, setRecherche] = useState("");

  // Tri
  type ColonneTri = "date" | "centre" | "entrees" | "sorties" | "net" | "operations" | "statut";
  const [triColonne, setTriColonne] = useState<ColonneTri>("date");
  const [triDirection, setTriDirection] = useState<SortDirection>("desc");

  function handleTri(colonne: ColonneTri) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("desc");
    }
  }

  // Dictionnaire des centres
  const mapCentres = useMemo(() => {
    const map = new Map<string, { nom: string; ville: string }>();
    centres.forEach((c) => map.set(c.id, { nom: c.nom, ville: c.villeActuelle }));
    return map;
  }, [centres]);

  // Agrégation des bilans par couple (centreId, date)
  const bilansJournaliers = useMemo(() => {
    interface BilanAggrege {
      idCle: string;
      centreId: string;
      date: string;
      totalEntrees: number;
      totalSorties: number;
      netAVerser: number;
      nbOperations: number;
      estCloture: boolean;
      aMouvementsEnAttente: boolean;
    }

    const map = new Map<string, BilanAggrege>();

    mouvements.forEach((m) => {
      if (!m.centreId || !m.date) return;
      const d = m.date.split("T")[0];
      const cle = `${m.centreId}__${d}`;
      const estCloture = m.statut === "VALIDE";

      if (!map.has(cle)) {
        map.set(cle, {
          idCle: cle,
          centreId: m.centreId,
          date: d,
          totalEntrees: 0,
          totalSorties: 0,
          netAVerser: 0,
          nbOperations: 0,
          estCloture,
          aMouvementsEnAttente: false,
        });
      }

      const item = map.get(cle)!;
      item.nbOperations += 1;

      if (m.statut === "EN_ATTENTE") {
        item.aMouvementsEnAttente = true;
      }
      if (estCloture) {
        item.estCloture = true;
      }

      if (m.statut !== "REJETE") {
        if (m.type === "ENTREE") item.totalEntrees += m.montant;
        else if (m.type === "SORTIE") item.totalSorties += m.montant;
      }
      item.netAVerser = item.totalEntrees - item.totalSorties;
    });

    return Array.from(map.values());
  }, [mouvements]);

  // Filtrage
  const bilansFiltres = useMemo(() => {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);

    const septJoursAvant = new Date(aujourdhui);
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    const premierDuMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

    return bilansJournaliers.filter((b) => {
      if (centreFiltre !== "TOUS" && b.centreId !== centreFiltre) return false;

      if (statutFiltre === "CLOTURE" && (!b.estCloture || b.aMouvementsEnAttente)) return false;
      if (statutFiltre === "EN_ATTENTE" && !b.aMouvementsEnAttente) return false;

      const dateBilan = new Date(b.date);
      dateBilan.setHours(0, 0, 0, 0);

      if (periode === "AUJOURDHUI") {
        if (b.date !== new Date().toISOString().split("T")[0]) return false;
      } else if (periode === "HIER") {
        if (b.date !== hier.toISOString().split("T")[0]) return false;
      } else if (periode === "7_JOURS") {
        if (dateBilan < septJoursAvant) return false;
      } else if (periode === "MOIS") {
        if (dateBilan < premierDuMois) return false;
      } else if (periode === "DATE_SPECIFIQUE") {
        if (b.date !== dateSpecifique) return false;
      }

      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const infoCentre = mapCentres.get(b.centreId);
        const nomCentre = infoCentre?.nom.toLowerCase() || "";
        const ville = infoCentre?.ville.toLowerCase() || "";
        const match = nomCentre.includes(q) || ville.includes(q) || b.date.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    bilansJournaliers,
    centreFiltre,
    statutFiltre,
    periode,
    dateSpecifique,
    recherche,
    mapCentres,
  ]);

  // Tri
  const bilansTries = useMemo(() => {
    return [...bilansFiltres].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "date") cmp = compareDates(a.date, b.date);
      else if (triColonne === "centre") {
        const nomA = mapCentres.get(a.centreId)?.nom || "";
        const nomB = mapCentres.get(b.centreId)?.nom || "";
        cmp = compareStrings(nomA, nomB);
      } else if (triColonne === "entrees") cmp = compareNumbers(a.totalEntrees, b.totalEntrees);
      else if (triColonne === "sorties") cmp = compareNumbers(a.totalSorties, b.totalSorties);
      else if (triColonne === "net") cmp = compareNumbers(a.netAVerser, b.netAVerser);
      else if (triColonne === "operations") cmp = compareNumbers(a.nbOperations, b.nbOperations);
      else if (triColonne === "statut") {
        const statA = a.estCloture && !a.aMouvementsEnAttente ? "CLOTURE" : "EN_ATTENTE";
        const statB = b.estCloture && !b.aMouvementsEnAttente ? "CLOTURE" : "EN_ATTENTE";
        cmp = compareStrings(statA, statB);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [bilansFiltres, triColonne, triDirection, mapCentres]);

  // Totaux statistiques
  const totalBilansEnAttente = useMemo(() => {
    return bilansFiltres.filter((b) => b.aMouvementsEnAttente).length;
  }, [bilansFiltres]);

  const totalBilansClotures = useMemo(() => {
    return bilansFiltres.filter((b) => b.estCloture && !b.aMouvementsEnAttente).length;
  }, [bilansFiltres]);

  const totalEntreesFiltrees = useMemo(() => {
    return bilansFiltres.reduce((acc, b) => acc + b.totalEntrees, 0);
  }, [bilansFiltres]);

  const totalSortiesFiltrees = useMemo(() => {
    return bilansFiltres.reduce((acc, b) => acc + b.totalSorties, 0);
  }, [bilansFiltres]);

  const netAVerserFiltre = totalEntreesFiltrees - totalSortiesFiltrees;

  const chargement = chargementSession || chargementCentres || chargementMouvements;

  return (
    <div className="space-y-4">
      {/* ── 1. SYNTHÈSE COMPTABLE HORIZONTALE (Style officiel GESPREPAS) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Bilans en attente */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Bilans à Contrôler
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-amber-800 tabular-nums">
              {totalBilansEnAttente}{" "}
              <span className="text-xs font-normal text-slate-400">journées</span>
            </div>
            <p className="mt-0.5 text-xs text-amber-700 font-medium">
              En attente de visa et clôture
            </p>
          </div>
        </div>

        {/* Bilans clôturés */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Bilans Clôturés
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {totalBilansClotures}{" "}
              <span className="text-xs font-normal text-slate-400">journées</span>
            </div>
            <p className="mt-0.5 text-xs text-emerald-700 font-medium">
              Caisses vérifiées et verrouillées
            </p>
          </div>
        </div>

        {/* Recettes déclarées */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Recettes Déclarées
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
              +{FCFA.format(totalEntreesFiltrees)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Total des entrées de caisse
            </p>
          </div>
        </div>

        {/* Solde net théorique */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Net Théorique à Verser
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Scale className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-1">
            <div className={`text-xl font-bold tracking-tight tabular-nums ${netAVerserFiltre >= 0 ? "text-slate-900" : "text-rose-700"}`}>
              {FCFA.format(netAVerserFiltre)}{" "}
              <span className="text-xs font-normal text-slate-400">FCFA</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Dépenses : {FCFA.format(totalSortiesFiltrees)} FCFA
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. BARRE DE FILTRES COMPTABLES ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Période pills */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Période :
            </span>
            {(["TOUS", "AUJOURDHUI", "HIER", "7_JOURS", "MOIS"] as const).map((p) => {
              const labelMap: Record<string, string> = {
                TOUS: "Tout",
                AUJOURDHUI: "Aujourd'hui",
                HIER: "Hier",
                "7_JOURS": "7 derniers jours",
                MOIS: "Ce mois",
              };
              const active = periode === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriode(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-orange text-white font-semibold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}

            {periode === "DATE_SPECIFIQUE" ? (
              <input
                type="date"
                value={dateSpecifique}
                onChange={(e) => setDateSpecifique(e.target.value)}
                className="rounded-md border border-brand-orange bg-white px-2 py-0.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPeriode("DATE_SPECIFIQUE")}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 cursor-pointer"
              >
                Date précise...
              </button>
            )}
          </div>

          {/* Recherche */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Centre, date (AAAA-MM-JJ)..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        {/* Ligne 2 : Sélecteurs Statut & Centre */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Statut :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 font-medium">
              <button
                type="button"
                onClick={() => setStatutFiltre("TOUS")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  statutFiltre === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setStatutFiltre("EN_ATTENTE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  statutFiltre === "EN_ATTENTE"
                    ? "bg-white text-amber-800 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-amber-800"
                }`}
              >
                À viser
              </button>
              <button
                type="button"
                onClick={() => setStatutFiltre("CLOTURE")}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  statutFiltre === "CLOTURE"
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
              >
                Clôturés
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Centre :</span>
            <select
              value={centreFiltre}
              onChange={(e) => setCentreFiltre(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange focus:outline-none px-2.5 py-1 text-xs text-slate-900 font-medium"
            >
              <option value="TOUS">Tous les centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.villeActuelle})
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              <span className="text-slate-900">{bilansFiltres.length}</span> journée{bilansFiltres.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. TABLEAU DES BILANS JOURNALIERS ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="text-brand-orange" size={16} />
              <span>Contrôle et Validation des Bilans Journaliers</span>
            </h2>
            <p className="text-xs text-slate-500">
              Supervision des arrêtés de caisse transmis par les centres et clôture définitive.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-5">
            <SkeletonTable rows={6} />
          </div>
        ) : bilansTries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ClipboardCheck size={18} />
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800">Aucun bilan trouvé</h3>
            <p className="font-medium text-slate-500 max-w-sm">
              Aucune journée de caisse ne correspond aux critères sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
                <tr>
                  <SortableHeader
                    columnKey="date"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Date
                  </SortableHeader>
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
                    columnKey="entrees"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Recettes (Entrées)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="sorties"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Dépenses (Sorties)
                  </SortableHeader>
                  <SortableHeader
                    columnKey="net"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="right"
                    className="py-3.5 px-4 text-right"
                  >
                    Net Théorique
                  </SortableHeader>
                  <SortableHeader
                    columnKey="operations"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Écritures
                  </SortableHeader>
                  <SortableHeader
                    columnKey="statut"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Statut Bilan
                  </SortableHeader>
                  <th className="py-3.5 px-4 text-center text-slate-700 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bilansTries.map((bilan) => {
                  const infoCentre = mapCentres.get(bilan.centreId);
                  const estCloture = bilan.estCloture && !bilan.aMouvementsEnAttente;

                  return (
                    <tr
                      key={bilan.idCle}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectBilan(bilan.centreId, bilan.date)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {bilan.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{infoCentre?.nom || "Centre"}</div>
                        <div className="text-[10px] text-slate-400">{infoCentre?.ville}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700 tabular-nums">
                        +{FCFA.format(bilan.totalEntrees)} F
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-rose-700 tabular-nums">
                        -{FCFA.format(bilan.totalSorties)} F
                      </td>
                      <td className={`py-3 px-4 text-right font-bold tabular-nums ${bilan.netAVerser >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                        {FCFA.format(bilan.netAVerser)} F
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums text-slate-600">
                        {bilan.nbOperations}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {estCloture ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 size={12} />
                            Clôturé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                            <Clock size={12} />
                            À viser
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          onClick={() => onSelectBilan(bilan.centreId, bilan.date)}
                          className="h-7 px-2.5 text-xs font-semibold"
                        >
                          <Eye size={13} className="text-slate-500" />
                          <span>Examiner</span>
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
    </div>
  );
}
