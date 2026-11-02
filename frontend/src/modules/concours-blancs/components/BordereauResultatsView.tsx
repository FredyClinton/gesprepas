"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Pencil,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";
import type { Formation } from "@/modules/academique";
import type { Centre } from "@/modules/centres-sessions";
import type { Matiere } from "@/modules/matieres";
import type { ConcoursBlanc } from "../types/concours-blanc.types";
import {
  useBordereauConcoursBlanc,
  useCompilerResultatsConcoursBlanc,
} from "../hooks/useConcoursBlancs";
import { messageErreurApi } from "@/shared/lib/api-client";

interface BordereauResultatsViewProps {
  concoursBlanc: ConcoursBlanc;
  formations: Formation[];
  centres: Centre[];
  matieres: Matiere[];
  formationIdActive?: string;
  centreIdFiltre?: string;
  verrouillerCentre?: boolean;
  role?: string;
  userCentreId?: string;
  onOuvrirExportModal?: (formationId?: string) => void;
  onSaisieNotes?: (formationId: string, centreId?: string) => void;
}

type SortKey =
  | "rang"
  | "rangCentre"
  | "deltaRang"
  | "nomComplet"
  | "centre"
  | "etablissement"
  | "totalPondere"
  | "moyennePonderee"
  | `epreuve_${string}`;

export function BordereauResultatsView({
  concoursBlanc,
  formations,
  centres,
  formationIdActive,
  centreIdFiltre: initCentreId,
  verrouillerCentre = false,
  role,
  userCentreId,
  onOuvrirExportModal,
  onSaisieNotes,
}: BordereauResultatsViewProps) {
  const [formationId, setFormationId] = useState<string>(
    formationIdActive || formations[0]?.id || "",
  );
  const [centreIdFiltre, setCentreIdFiltre] = useState<string>(
    initCentreId || "TOUS",
  );
  const [menuExportOuvert, setMenuExportOuvert] = useState(false);
  const [rechercheCandidat, setRechercheCandidat] = useState("");
  const [filtreStatutCandidat, setFiltreStatutCandidat] = useState<
    "TOUS" | "CLASSES" | "TOP10" | "ABSENTS"
  >("TOUS");
  const [sortKey, setSortKey] = useState<SortKey>("rang");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [messageCompilation, setMessageCompilation] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const compilerMutation = useCompilerResultatsConcoursBlanc();

  const filtreEffective =
    verrouillerCentre && initCentreId ? initCentreId : centreIdFiltre;

  const { data: bordereau, isLoading } = useBordereauConcoursBlanc(
    concoursBlanc.id,
    formationId,
    filtreEffective === "TOUS" ? undefined : filtreEffective,
    role,
    userCentreId,
  );

  const estDA = role === "DIRECTEUR_ACADEMIQUE" || role === "DIRECTEUR";
  const estChefDept = role === "CHEF_DEPARTEMENT";
  const estVerrouilleSaisie =
    concoursBlanc.statut === "CLOTURE" ||
    (Boolean(concoursBlanc.saisieNotesBloqueeCentre) && !estDA);

  const formation = formations.find((f) => f.id === formationId);

  // Fonction utilitaire : absent(e) si aucune note enregistrée
  const estCandidatAbsent = (c: { notes?: { statut: string; note?: number | null }[] }) => {
    if (!c.notes || c.notes.length === 0) return true;
    return !c.notes.some(
      (n) => n.statut === "NOTE" && n.note !== null && n.note !== undefined,
    );
  };

  // Gestion du tri interactif
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      if (
        key === "totalPondere" ||
        key === "moyennePonderee" ||
        key.startsWith("epreuve_") ||
        key === "deltaRang"
      ) {
        setSortOrder("desc");
      } else {
        setSortOrder("asc");
      }
    }
  };

  // Tri robuste de tous les candidats retournés par le bordereau
  const candidatsTries = useMemo(() => {
    if (!bordereau?.candidats) return [];
    const estFiltreCentre = filtreEffective && filtreEffective !== "TOUS";

    return [...bordereau.candidats].sort((a, b) => {
      const aAbs = estCandidatAbsent(a);
      const bAbs = estCandidatAbsent(b);

      // Les absents vont toujours en bas, sauf s'ils sont tous les deux absents
      if (aAbs && !bAbs) return 1;
      if (!aAbs && bAbs) return -1;
      if (aAbs && bAbs) {
        return (a.nomComplet || "").localeCompare(b.nomComplet || "");
      }

      let comparison = 0;

      if (sortKey === "rang") {
        const rA = estFiltreCentre ? (a.rangCentre ?? 9999) : (a.rang ?? 9999);
        const rB = estFiltreCentre ? (b.rangCentre ?? 9999) : (b.rang ?? 9999);
        comparison = rA - rB;
      } else if (sortKey === "rangCentre") {
        const rA = a.rangCentre ?? 9999;
        const rB = b.rangCentre ?? 9999;
        comparison = rA - rB;
      } else if (sortKey === "deltaRang") {
        const dA = a.deltaRang ?? -999;
        const dB = b.deltaRang ?? -999;
        comparison = dA - dB;
      } else if (sortKey === "nomComplet") {
        comparison = (a.nomComplet || "").localeCompare(b.nomComplet || "");
      } else if (sortKey === "centre") {
        const nomA = centres.find((c) => c.id === a.centreId)?.nom || "";
        const nomB = centres.find((c) => c.id === b.centreId)?.nom || "";
        comparison = nomA.localeCompare(nomB);
      } else if (sortKey === "etablissement") {
        const etabA = a.etablissementOrigine || "";
        const etabB = b.etablissementOrigine || "";
        comparison = etabA.localeCompare(etabB);
      } else if (sortKey === "totalPondere") {
        const tA = a.totalPondere ?? 0;
        const tB = b.totalPondere ?? 0;
        comparison = tA - tB;
      } else if (sortKey === "moyennePonderee") {
        const mA = a.moyennePonderee ?? 0;
        const mB = b.moyennePonderee ?? 0;
        comparison = mA - mB;
      } else if (sortKey.startsWith("epreuve_")) {
        const epId = sortKey.replace("epreuve_", "");
        const nA = a.notes?.find((n) => n.epreuveId === epId)?.note ?? -1;
        const nB = b.notes?.find((n) => n.epreuveId === epId)?.note ?? -1;
        comparison = nA - nB;
      }

      if (comparison !== 0) {
        return sortOrder === "asc" ? comparison : -comparison;
      }

      // Tie-breaker stable : ordre alphabétique
      return (a.nomComplet || "").localeCompare(b.nomComplet || "");
    });
  }, [bordereau?.candidats, filtreEffective, sortKey, sortOrder, centres]);

  // Effectifs globaux
  const totalInscrits = bordereau?.candidats?.length ?? 0;
  const nbAbsents = useMemo(() => {
    if (!bordereau?.candidats) return 0;
    return bordereau.candidats.filter(estCandidatAbsent).length;
  }, [bordereau?.candidats]);
  const nbPresents = totalInscrits - nbAbsents;

  // Filtrage selon le statut et la barre de recherche
  const candidatsFiltres = useMemo(() => {
    let list = candidatsTries;

    if (filtreStatutCandidat === "CLASSES") {
      list = list.filter((c) => !estCandidatAbsent(c));
    } else if (filtreStatutCandidat === "ABSENTS") {
      list = list.filter((c) => estCandidatAbsent(c));
    } else if (filtreStatutCandidat === "TOP10") {
      list = list.filter((c) => !estCandidatAbsent(c)).slice(0, 10);
    }

    if (rechercheCandidat.trim()) {
      const q = rechercheCandidat.toLowerCase().trim();
      list = list.filter((c) => {
        const nom = (c.nomComplet || "").toLowerCase();
        const etab = (c.etablissementOrigine || "").toLowerCase();
        const centreNom = (
          centres.find((ct) => ct.id === c.centreId)?.nom || ""
        ).toLowerCase();
        return nom.includes(q) || etab.includes(q) || centreNom.includes(q);
      });
    }

    return list;
  }, [candidatsTries, filtreStatutCandidat, rechercheCandidat, centres]);

  // Pagination et navigation fluide
  const [lignesParPage, setLignesParPage] = useState<number | "TOUS">(50);
  const currentFilterKey = `${formationId}_${centreIdFiltre}_${rechercheCandidat}_${filtreStatutCandidat}_${sortKey}_${sortOrder}`;
  const [prevFilterKey, setPrevFilterKey] = useState(currentFilterKey);
  const [pageCourante, setPageCourante] = useState<number>(1);

  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setPageCourante(1);
  }

  const totalPages = useMemo(() => {
    if (lignesParPage === "TOUS" || candidatsFiltres.length === 0) return 1;
    return Math.ceil(candidatsFiltres.length / lignesParPage);
  }, [candidatsFiltres.length, lignesParPage]);

  const candidatsAffiches = useMemo(() => {
    if (lignesParPage === "TOUS") return candidatsFiltres;
    const debut = (pageCourante - 1) * lignesParPage;
    return candidatsFiltres.slice(debut, debut + lignesParPage);
  }, [candidatsFiltres, pageCourante, lignesParPage]);

  // Synthèse calculée STRICTEMENT sur les candidats affichés dans le tableau (périmètre visible)
  const syntheseTableau = useMemo(() => {
    if (!bordereau || candidatsFiltres.length === 0) {
      return {
        nbPresentsAffiches: 0,
        statsParEpreuve: {} as Record<string, { moyenne: number; noteMax: number; nbNotes: number }>,
        moyenneTotalPoints: null as number | null,
        moyenneGenerale: null as number | null,
      };
    }

    const presentsAffiches = candidatsFiltres.filter((c) => !estCandidatAbsent(c));
    const nbPresentsAffiches = presentsAffiches.length;

    // Stats par épreuve
    const statsParEpreuve: Record<string, { moyenne: number; noteMax: number; nbNotes: number }> = {};
    bordereau.epreuves.forEach((ep) => {
      const notesEpreuve = presentsAffiches
        .map((c) => c.notes.find((n) => n.epreuveId === ep.id))
        .filter((n) => n && n.statut === "NOTE" && n.note !== null && n.note !== undefined)
        .map((n) => n!.note!);

      if (notesEpreuve.length > 0) {
        const somme = notesEpreuve.reduce((a, b) => a + b, 0);
        const max = Math.max(...notesEpreuve);
        statsParEpreuve[ep.id] = {
          moyenne: Number((somme / notesEpreuve.length).toFixed(2)),
          noteMax: max,
          nbNotes: notesEpreuve.length,
        };
      }
    });

    // Moyenne des totaux de points
    const totaux = presentsAffiches
      .map((c) => c.totalPondere)
      .filter((t): t is number => t !== null && t !== undefined);
    const moyenneTotalPoints =
      totaux.length > 0
        ? Number((totaux.reduce((a, b) => a + b, 0) / totaux.length).toFixed(2))
        : null;

    // Moyenne générale sur 20 des candidats affichés
    const moyennes = presentsAffiches
      .map((c) => c.moyennePonderee)
      .filter((m): m is number => m !== null && m !== undefined);
    const moyenneGenerale =
      moyennes.length > 0
        ? Number((moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2))
        : null;

    return {
      nbPresentsAffiches,
      statsParEpreuve,
      moyenneTotalPoints,
      moyenneGenerale,
    };
  }, [bordereau, candidatsFiltres]);

  // Indicateurs globaux de pilotage (sur l'ensemble de la promotion ou du centre filtré)
  const statsPilotage = useMemo(() => {
    if (!bordereau || candidatsTries.length === 0) {
      return {
        tauxPresence: 0,
        tauxReussite: 0,
        nbReussite: 0,
        moyenneGenerale: null as number | null,
        majorCandidat: null as (typeof candidatsTries)[0] | null,
        coefTotal: 0,
      };
    }

    const presents = candidatsTries.filter((c) => !estCandidatAbsent(c));
    const tauxPresence = totalInscrits > 0 ? Math.round((nbPresents / totalInscrits) * 100) : 0;

    // Taux de réussite (moyenne générale >= 10/20)
    const admis = presents.filter((c) => (c.moyennePonderee ?? 0) >= 10);
    const tauxReussite = presents.length > 0 ? Math.round((admis.length / presents.length) * 100) : 0;

    // Moyenne générale globale
    const candidatsAvecMoyenne = presents.filter(
      (c) => c.moyennePonderee !== null && c.moyennePonderee !== undefined,
    );
    const moyenneGenerale =
      candidatsAvecMoyenne.length > 0
        ? Number(
            (
              candidatsAvecMoyenne.reduce((acc, c) => acc + (c.moyennePonderee ?? 0), 0) /
              candidatsAvecMoyenne.length
            ).toFixed(2),
          )
        : null;

    // Major de promotion (1er classé parmi les présents)
    const presentsTriesParRang = [...presents].sort((a, b) => {
      const rA = a.rang ?? 9999;
      const rB = b.rang ?? 9999;
      if (rA !== rB) return rA - rB;
      return (b.totalPondere ?? 0) - (a.totalPondere ?? 0);
    });
    const major = presentsTriesParRang[0] || null;

    const coefTotal = bordereau.epreuves.reduce((acc, ep) => acc + (ep.coefficient || 1), 0);

    return {
      tauxPresence,
      tauxReussite,
      nbReussite: admis.length,
      moyenneGenerale,
      majorCandidat: major,
      coefTotal,
    };
  }, [bordereau, candidatsTries, totalInscrits, nbPresents]);

  // Export Excel direct (.csv avec encodage UTF-8 BOM lisible directement dans Microsoft Excel)
  const exporterExcel = () => {
    if (!bordereau || candidatsFiltres.length === 0) return;

    const sep = ";";
    const headers = [
      "Rang Général",
      "Rang Centre",
      "Évolution",
      "Nom et Prénom",
      "Centre",
      "Établissement",
      ...bordereau.epreuves.map((e) => `${e.intitule} (Coef ${e.coefficient} / ${e.noteMax})`),
      "Total Pondéré (pts)",
    ];

    const rows = candidatsFiltres.map((c) => {
      const deltaStr =
        c.deltaRang !== null && c.deltaRang !== undefined
          ? c.deltaRang > 0
            ? `+${c.deltaRang}`
            : `${c.deltaRang}`
          : "-";

      const ctreNom = centres.find((ct) => ct.id === c.centreId)?.nom || "";

      const notesCols = bordereau.epreuves.map((ep) => {
        const n = c.notes.find((note) => note.epreuveId === ep.id);
        if (!n) return "-";
        if (n.statut !== "NOTE") return n.statut;
        return n.note !== null && n.note !== undefined
          ? n.note.toFixed(2).replace(".", ",")
          : "-";
      });

      const estAbs = estCandidatAbsent(c);
      return [
        estAbs ? "ABS" : (c.rang ?? "-"),
        estAbs ? "ABS" : (c.rangCentre ?? "-"),
        deltaStr,
        `"${c.nomComplet.replace(/"/g, '""')}"`,
        `"${ctreNom.replace(/"/g, '""')}"`,
        `"${(c.etablissementOrigine || "").replace(/"/g, '""')}"`,
        ...notesCols,
        estAbs ? "ABS" : (c.totalPondere ? c.totalPondere.toFixed(2).replace(".", ",") : "0"),
      ].join(sep);
    });

    const csvContent = "\uFEFF" + [headers.join(sep), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Bordereau_${concoursBlanc.titre.replace(/\s+/g, "_")}_${formation?.nom || "Filiere"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper pour l'icône de tri
  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ChevronsUpDown size={12} className="text-slate-300 group-hover:text-slate-500" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp size={13} className="text-brand-orange" />
    ) : (
      <ChevronDown size={13} className="text-brand-orange" />
    );
  };

  return (
    <div className="space-y-2">
      {/* ── B. Barre d'outils unifiée sur une seule ligne ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-2xs">
        {/* Filtres et Recherche */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Sélecteur de Filière */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Filière
            </span>
            <select
              value={formationId}
              onChange={(e) => setFormationId(e.target.value)}
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange"
            >
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-300">|</span>

          {/* Sélecteur de Centre */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Centre
            </span>
            {verrouillerCentre ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Building2 size={12} className="text-slate-400" />
                {centres.find((c) => c.id === initCentreId)?.nom || "Mon centre"}
              </span>
            ) : (
              <select
                value={centreIdFiltre}
                onChange={(e) => setCentreIdFiltre(e.target.value)}
                className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange"
              >
                <option value="TOUS">Tous les centres (Général)</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            )}
          </div>

          <span className="text-slate-300">|</span>

          {/* Barre de Recherche rapide */}
          <div className="relative w-44 sm:w-56 shrink-0">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={rechercheCandidat}
              onChange={(e) => setRechercheCandidat(e.target.value)}
              placeholder="Rechercher nom, lycée..."
              className="w-full rounded-md border border-slate-300 bg-white py-1 pl-7 pr-6 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-orange focus:outline-none"
            />
            {rechercheCandidat && (
              <button
                type="button"
                onClick={() => setRechercheCandidat("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Effacer la recherche"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filtres de statut compacts */}
          <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setFiltreStatutCandidat("TOUS")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filtreStatutCandidat === "TOUS"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tous ({totalInscrits})
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatutCandidat("CLASSES")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filtreStatutCandidat === "CLASSES"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Classés ({nbPresents})
            </button>
            {nbPresents >= 10 && (
              <button
                type="button"
                onClick={() => setFiltreStatutCandidat("TOP10")}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  filtreStatutCandidat === "TOP10"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top 10
              </button>
            )}
            {nbAbsents > 0 && (
              <button
                type="button"
                onClick={() => setFiltreStatutCandidat("ABSENTS")}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  filtreStatutCandidat === "ABSENTS"
                    ? "bg-rose-700 text-white font-bold"
                    : "text-slate-600 hover:text-rose-700"
                }`}
              >
                Absents ({nbAbsents})
              </button>
            )}
          </div>
        </div>

        {/* Actions Métier : Saisie, Compilation, Exporter */}
        <div className="flex items-center gap-2 shrink-0">
          {onSaisieNotes && !estChefDept && (
            <button
              type="button"
              onClick={() =>
                onSaisieNotes(
                  formationId,
                  filtreEffective === "TOUS" ? undefined : filtreEffective,
                )
              }
              disabled={estVerrouilleSaisie}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                estVerrouilleSaisie
                  ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                  : "bg-brand-orange hover:bg-brand-orange/90 text-white shadow-2xs"
              }`}
              title={
                estVerrouilleSaisie
                  ? "Saisie des notes verrouillée pour ce concours"
                  : `Saisir ou modifier les notes pour la filière ${formation?.nom || ""}`
              }
            >
              <Pencil size={13} />
              <span>Saisir les notes</span>
            </button>
          )}

          {estDA && (
            <button
              type="button"
              disabled={compilerMutation.isPending}
              onClick={() => {
                setMessageCompilation(null);
                compilerMutation.mutate(
                  { id: concoursBlanc.id, role },
                  {
                    onSuccess: () => {
                      setMessageCompilation({
                        type: "success",
                        text: "Classements et moyennes recalculés avec succès !",
                      });
                      setTimeout(() => setMessageCompilation(null), 5000);
                    },
                    onError: (err) => {
                      setMessageCompilation({
                        type: "error",
                        text: messageErreurApi(
                          err,
                          "Erreur lors de la compilation des notes.",
                        ),
                      });
                      setTimeout(() => setMessageCompilation(null), 5000);
                    },
                  },
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-orange transition-colors cursor-pointer disabled:opacity-50"
              title="Recalculer les moyennes pondérées et les classements"
            >
              <RefreshCw
                size={13}
                className={
                  compilerMutation.isPending
                    ? "animate-spin text-brand-orange"
                    : "text-slate-400"
                }
              />
              <span>Compiler</span>
            </button>
          )}

          {!estChefDept && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuExportOuvert(!menuExportOuvert)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download size={13} className="text-slate-400" />
                <span>Exporter</span>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 transition-transform duration-200 ${
                    menuExportOuvert ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuExportOuvert && (
                <div
                  className="absolute top-full right-0 z-30 mt-1 w-52 space-y-0.5 rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-lg"
                  onMouseLeave={() => setMenuExportOuvert(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      exporterExcel();
                      setMenuExportOuvert(false);
                    }}
                    className="flex w-full items-center gap-2 rounded p-1.5 text-left font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <span>Tableau Excel (.csv)</span>
                  </button>

                  {onOuvrirExportModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOuvrirExportModal(formationId);
                        setMenuExportOuvert(false);
                      }}
                      className="flex w-full items-center gap-2 rounded p-1.5 text-left font-medium text-slate-700 hover:bg-orange-50 hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      <Printer size={14} className="text-brand-orange" />
                      <span>Fiche Officielle (PDF)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bannière de notification de compilation */}
      {messageCompilation && (
        <div
          className={`flex items-center gap-2 rounded-lg p-2 text-xs font-semibold ${
            messageCompilation.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {messageCompilation.type === "success" ? (
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle size={14} className="shrink-0 text-red-600" />
          )}
          <span>{messageCompilation.text}</span>
        </div>
      )}

      {/* ── C. Bordereau de Notes Officiel (Tableau Métier Dominant) ── */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Chargement des résultats et des classements...
          </div>
        ) : !bordereau || candidatsTries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Aucun résultat enregistré pour cette filière dans ce concours blanc.
          </div>
        ) : candidatsFiltres.length === 0 ? (
          <div className="p-12 text-center text-xs space-y-2">
            <p className="text-slate-600 font-medium">
              Aucun candidat ne correspond à vos filtres actifs.
            </p>
            <button
              type="button"
              onClick={() => {
                setRechercheCandidat("");
                setFiltreStatutCandidat("TOUS");
              }}
              className="text-xs font-bold text-brand-orange hover:underline cursor-pointer"
            >
              Réinitialiser les filtres pour afficher tous les candidats
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 tracking-wider uppercase select-none shadow-xs">
                <tr>
                  {/* Colonne Rang Général (Sticky Left) */}
                  <th className="sticky left-0 z-30 w-12 bg-slate-50 px-2 py-2 text-center border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("rang")}
                      className="group inline-flex items-center justify-center gap-1 w-full font-bold uppercase text-slate-700 hover:text-slate-900 cursor-pointer"
                      title="Trier par Rang Général"
                    >
                      <span>Rang</span>
                      {renderSortIcon("rang")}
                    </button>
                  </th>

                  {/* Colonne Rang Centre */}
                  <th className="w-14 px-2 py-2 text-center border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("rangCentre")}
                      className="group inline-flex items-center justify-center gap-1 w-full font-semibold uppercase text-slate-600 hover:text-slate-900 cursor-pointer"
                      title="Trier par Rang au sein du Centre"
                    >
                      <span>R. Ctre</span>
                      {renderSortIcon("rangCentre")}
                    </button>
                  </th>

                  {/* Colonne Évolution */}
                  <th className="w-12 px-1.5 py-2 text-center border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("deltaRang")}
                      className="group inline-flex items-center justify-center gap-0.5 w-full font-semibold uppercase text-slate-600 hover:text-slate-900 cursor-pointer"
                      title="Trier par Progression (Delta)"
                    >
                      <span>Évol.</span>
                      {renderSortIcon("deltaRang")}
                    </button>
                  </th>

                  {/* Colonne Nom & Prénom (Sticky Left 12) */}
                  <th className="sticky left-12 z-30 min-w-[200px] bg-slate-50 px-3 py-2 text-left border-b border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    <button
                      type="button"
                      onClick={() => handleSort("nomComplet")}
                      className="group inline-flex items-center gap-1 font-bold uppercase text-slate-700 hover:text-slate-900 cursor-pointer"
                      title="Trier par Nom alphabétique"
                    >
                      <span>Noms & Prénoms</span>
                      {renderSortIcon("nomComplet")}
                    </button>
                  </th>

                  {/* Colonne Centre */}
                  <th className="min-w-[110px] px-3 py-2 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("centre")}
                      className="group inline-flex items-center gap-1 font-semibold uppercase text-slate-600 hover:text-slate-900 cursor-pointer"
                      title="Trier par Centre"
                    >
                      <span>Centre</span>
                      {renderSortIcon("centre")}
                    </button>
                  </th>

                  {/* Colonne Établissement d'origine */}
                  <th className="min-w-[130px] px-3 py-2 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("etablissement")}
                      className="group inline-flex items-center gap-1 font-semibold uppercase text-slate-600 hover:text-slate-900 cursor-pointer"
                      title="Trier par Établissement"
                    >
                      <span>Établissement</span>
                      {renderSortIcon("etablissement")}
                    </button>
                  </th>

                  {/* Colonnes Matières / Épreuves */}
                  {bordereau.epreuves.map((ep) => {
                    const epreuveSortKey: SortKey = `epreuve_${ep.id}`;
                    return (
                      <th
                        key={ep.id}
                        className="min-w-[105px] px-2.5 py-1.5 text-right border-b border-slate-200"
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(epreuveSortKey)}
                          className="group inline-flex flex-col items-end w-full cursor-pointer"
                          title={`Trier par note en ${ep.intitule}`}
                        >
                          <div className="inline-flex items-center gap-1 font-bold text-slate-800 uppercase line-clamp-1">
                            <span>{ep.intitule}</span>
                            {renderSortIcon(epreuveSortKey)}
                          </div>
                          <span className="text-[10px] font-normal text-slate-400 normal-case">
                            /{ep.noteMax} · c.{ep.coefficient}
                          </span>
                        </button>
                      </th>
                    );
                  })}

                  {/* Colonne Total Pondéré (pts) (Sticky Right) */}
                  <th className="sticky right-0 z-30 w-24 bg-slate-50 px-3 py-2 text-right border-b border-slate-200 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    <button
                      type="button"
                      onClick={() => handleSort("totalPondere")}
                      className="group inline-flex flex-col items-end w-full cursor-pointer"
                      title="Trier par Total des points"
                    >
                      <div className="inline-flex items-center gap-1 font-bold uppercase text-slate-900">
                        <span>Total</span>
                        {renderSortIcon("totalPondere")}
                      </div>
                      <span className="text-[10px] font-normal text-slate-400 normal-case">
                        pts
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {candidatsAffiches.map((c, idx) => {
                  const estAbsent = estCandidatAbsent(c);
                  const delta = c.deltaRang;

                  return (
                    <tr
                      key={c.id || idx}
                      className={`group transition-colors ${
                        estAbsent
                          ? "bg-rose-50/15 text-slate-400 hover:bg-rose-50/25"
                          : c.rang === 1
                            ? "bg-amber-50/25 font-medium hover:bg-amber-50/40"
                            : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Rang Général (Sticky Left) */}
                      <td
                        className={`sticky left-0 z-10 px-2 py-1.5 text-center transition-colors ${
                          estAbsent
                            ? "bg-rose-50 group-hover:bg-rose-100/70"
                            : c.rang === 1
                              ? "bg-amber-50/80 group-hover:bg-amber-100/70"
                              : "bg-white group-hover:bg-slate-50"
                        }`}
                      >
                        {estAbsent ? (
                          <span
                            className="inline-flex items-center justify-center rounded px-1.5 py-0.2 text-[10px] font-bold uppercase bg-rose-100 text-rose-700"
                            title="Absent(e)"
                          >
                            ABS
                          </span>
                        ) : (
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                              c.rang === 1
                                ? "bg-amber-400 text-slate-950 font-black shadow-2xs"
                                : c.rang === 2
                                  ? "bg-slate-200 text-slate-800 font-bold"
                                  : c.rang === 3
                                    ? "bg-amber-700/80 text-white font-bold"
                                    : "text-slate-600"
                            }`}
                          >
                            {c.rang ?? "-"}
                          </span>
                        )}
                      </td>

                      {/* Rang Centre */}
                      <td className="px-2 py-1.5 text-center text-xs font-semibold text-slate-600 tabular-nums">
                        {estAbsent ? (
                          <span className="text-[10px] text-rose-500 font-medium">ABS</span>
                        ) : (
                          c.rangCentre ?? "-"
                        )}
                      </td>

                      {/* Évolution (Delta) */}
                      <td className="px-1.5 py-1.5 text-center">
                        {delta !== null && delta !== undefined ? (
                          delta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 tabular-nums">
                              <TrendingUp size={11} />+{delta}
                            </span>
                          ) : delta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 tabular-nums">
                              <TrendingDown size={11} />
                              {delta}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
                              <Minus size={11} />
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-300 font-medium">—</span>
                        )}
                      </td>

                      {/* Noms et Prénoms (Sticky Left 12) */}
                      <td
                        className={`sticky left-12 z-10 px-3 py-1.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                          estAbsent
                            ? "bg-rose-50 group-hover:bg-rose-100/70"
                            : c.rang === 1
                              ? "bg-amber-50/80 group-hover:bg-amber-100/70"
                              : "bg-white group-hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 line-clamp-1">
                            {c.nomComplet}
                          </span>
                          {c.horsListe && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 shrink-0">
                              HL
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Centre EXCELIS */}
                      <td className="px-3 py-1.5 text-xs text-slate-600 truncate max-w-[130px]">
                        {centres.find((ct) => ct.id === c.centreId)?.nom || "—"}
                      </td>

                      {/* Établissement d'origine */}
                      <td className="px-3 py-1.5 text-xs text-slate-500 truncate max-w-[150px]">
                        {c.etablissementOrigine || "—"}
                      </td>

                      {/* Notes par Épreuve (Sobres, rigoureuses, lisibles) */}
                      {bordereau.epreuves.map((ep) => {
                        const noteObj = c.notes.find((n) => n.epreuveId === ep.id);
                        const noteVal = noteObj?.note;
                        const statut = noteObj?.statut ?? "NOTE";
                        const maxNoteEpreuve = bordereau.meilleuresNotesParEpreuve[ep.id];
                        const estMeilleureNote =
                          statut === "NOTE" &&
                          noteVal !== null &&
                          noteVal !== undefined &&
                          maxNoteEpreuve !== undefined &&
                          noteVal >= maxNoteEpreuve &&
                          noteVal > 0;

                        return (
                          <td key={ep.id} className="px-2.5 py-1.5 text-right font-mono text-xs tabular-nums">
                            {statut === "NOTE" ? (
                              noteVal !== null && noteVal !== undefined ? (
                                <span
                                  className={
                                    estMeilleureNote
                                      ? "font-black text-amber-900 font-mono"
                                      : noteVal < 5
                                        ? "font-semibold text-rose-600"
                                        : "font-medium text-slate-800"
                                  }
                                >
                                  {noteVal.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span
                                className={`rounded px-1 py-0.2 text-[10px] font-bold uppercase ${
                                  statut === "ABS"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {statut}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Pondéré (pts) (Sticky Right) */}
                      <td
                        className={`sticky right-0 z-10 px-3 py-1.5 text-right font-mono font-bold text-slate-900 tabular-nums shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                          estAbsent
                            ? "bg-rose-50 group-hover:bg-rose-100/70"
                            : c.rang === 1
                              ? "bg-amber-50/80 group-hover:bg-amber-100/70"
                              : "bg-white group-hover:bg-slate-50"
                        }`}
                      >
                        {estAbsent ? (
                          <span className="font-semibold text-[11px] text-rose-600">ABS</span>
                        ) : c.totalPondere !== null && c.totalPondere !== undefined ? (
                          c.totalPondere.toFixed(2)
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Ligne de synthèse officielle en bas de tableau */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100/95 text-xs font-bold text-slate-900 sticky bottom-0 z-20 shadow-2xs">
                  <td
                    colSpan={6}
                    className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-right uppercase tracking-wider text-[11px] text-slate-700 font-bold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]"
                  >
                    Moyennes & Performances ({syntheseTableau.nbPresentsAffiches} candidats) :
                  </td>
                  {bordereau.epreuves.map((ep) => {
                    const st = syntheseTableau.statsParEpreuve[ep.id];
                    return (
                      <td
                        key={ep.id}
                        className="px-2.5 py-1.5 text-right font-mono tabular-nums"
                      >
                        {st ? (
                          <div className="flex flex-col items-end">
                            <span className="text-slate-900 font-bold">
                              {st.moyenne.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              max {st.noteMax.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                  {/* Total Moyen des points (Sticky Right) */}
                  <td className="sticky right-0 z-10 bg-slate-200 px-3 py-1.5 text-right font-mono font-bold text-slate-900 tabular-nums shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    {syntheseTableau.moyenneTotalPoints !== null
                      ? syntheseTableau.moyenneTotalPoints.toFixed(2)
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── D. Bande de Synthèse Compacte (Indicateurs Secondaires après le tableau) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Participation */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Participation :
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {statsPilotage.tauxPresence}%
            </span>
            <span className="text-slate-400">
              ({nbPresents}/{totalInscrits})
            </span>
            {nbAbsents > 0 && (
              <span className="text-rose-600 font-semibold text-[11px]">
                · {nbAbsents} abs.
              </span>
            )}
          </div>

          <span className="text-slate-300">·</span>

          {/* Épreuves */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Épreuves :
            </span>
            <span className="font-bold text-slate-800">
              {bordereau?.epreuves?.length || 0} matières
            </span>
            <span className="text-slate-400">· Coef. {statsPilotage.coefTotal}</span>
          </div>

          <span className="text-slate-300">·</span>

          {/* Taux de Réussite */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Taux réussite (≥10) :
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {statsPilotage.tauxReussite}%
            </span>
            <span className="text-slate-400">
              ({statsPilotage.nbReussite}/{nbPresents})
            </span>
          </div>

          <span className="text-slate-300">·</span>

          {/* Moyenne Filière */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Moyenne filière :
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {statsPilotage.moyenneGenerale !== null
                ? `${statsPilotage.moyenneGenerale.toFixed(2)}/20`
                : "—"}
            </span>
          </div>

          {/* Major Promo */}
          {statsPilotage.majorCandidat && (
            <>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Major {filtreEffective !== "TOUS" ? "Centre" : "Promo"} :
                </span>
                <span className="font-bold text-slate-900">
                  {statsPilotage.majorCandidat.nomComplet}
                </span>
                <span className="font-mono text-amber-800 font-bold tabular-nums">
                  ({statsPilotage.majorCandidat.totalPondere?.toFixed(2)} pts)
                </span>
                <span className="text-slate-400 text-[11px]">
                  · {centres.find((c) => c.id === statsPilotage.majorCandidat?.centreId)?.nom || ""}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Navigation et affichage des lignes */}
        <div className="flex items-center gap-2 ml-auto text-[11px] text-slate-500 font-medium">
          <span>
            {candidatsAffiches.length} sur {candidatsFiltres.length} candidat
            {candidatsFiltres.length > 1 ? "s" : ""}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pageCourante === 1}
                onClick={() => setPageCourante((p) => Math.max(1, p - 1))}
                className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                title="Page précédente"
              >
                ‹
              </button>
              <span className="font-mono font-semibold">
                {pageCourante}/{totalPages}
              </span>
              <button
                type="button"
                disabled={pageCourante === totalPages}
                onClick={() => setPageCourante((p) => Math.min(totalPages, p + 1))}
                className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                title="Page suivante"
              >
                ›
              </button>
            </div>
          )}
          <select
            value={lignesParPage}
            onChange={(e) => {
              const val = e.target.value === "TOUS" ? "TOUS" : Number(e.target.value);
              setLignesParPage(val);
            }}
            className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 outline-none cursor-pointer"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value="TOUS">Tous</option>
          </select>
        </div>
      </div>
    </div>
  );
}
