"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Filter,
  Pencil,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
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

export function BordereauResultatsView({
  concoursBlanc,
  formations,
  centres,
  matieres,
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

  // Fonction utilitaire : sont considérées comme absentes les personnes ayant manqué la totalité des épreuves
  const estCandidatAbsent = (c: { notes?: { statut: string; note?: number | null }[] }) => {
    if (!c.notes || c.notes.length === 0) return true;
    return !c.notes.some((n) => n.statut === "NOTE" && n.note !== null && n.note !== undefined);
  };

  // Tri systématique et robuste des candidats par rang (rang centre ou général selon le filtre actif)
  // Les candidats classés passent en premier, les absents (sans rang) en bas par ordre alphabétique
  const candidatsTries = useMemo(() => {
    if (!bordereau?.candidats) return [];
    const estFiltreCentre = filtreEffective && filtreEffective !== "TOUS";
    return [...bordereau.candidats].sort((a, b) => {
      const rA = estFiltreCentre ? a.rangCentre : a.rang;
      const rB = estFiltreCentre ? b.rangCentre : b.rang;
      if (rA !== null && rA !== undefined && rB !== null && rB !== undefined) {
        if (rA !== rB) return rA - rB;
      } else if (rA !== null && rA !== undefined) {
        return -1;
      } else if (rB !== null && rB !== undefined) {
        return 1;
      }

      const tA = a.totalPondere ?? 0;
      const tB = b.totalPondere ?? 0;
      if (tA !== tB) return tB - tA;

      return (a.nomComplet || "").localeCompare(b.nomComplet || "");
    });
  }, [bordereau?.candidats, filtreEffective]);

  const nbAbsents = useMemo(() => {
    if (!bordereau?.candidats) return 0;
    return bordereau.candidats.filter(estCandidatAbsent).length;
  }, [bordereau?.candidats]);
  const nbPresents = (bordereau?.candidats?.length ?? 0) - nbAbsents;

  // Statistiques calculées pour le Cockpit Académique
  const statsSession = useMemo(() => {
    if (!bordereau || candidatsTries.length === 0) {
      return {
        totalInscrits: 0,
        nbPresents: 0,
        nbAbsents: 0,
        tauxPresence: 0,
        moyenneGenerale: null as number | null,
        majorCandidat: null as (typeof candidatsTries)[0] | null,
        statsParEpreuve: {} as Record<string, { moyenne: number; noteMax: number; nbNotes: number }>,
      };
    }

    const presents = candidatsTries.filter((c) => !estCandidatAbsent(c));
    const totalInscrits = candidatsTries.length;
    const absentsCount = totalInscrits - presents.length;
    const tauxPresence = totalInscrits > 0 ? Math.round((presents.length / totalInscrits) * 100) : 0;

    // Major de promotion (1er candidat présent)
    const major = presents[0] || null;

    // Moyenne générale de la filière (calculée sur moyennes pondérées ou totales)
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

    // Statistiques par épreuve pour le footer du tableau
    const statsParEpreuve: Record<string, { moyenne: number; noteMax: number; nbNotes: number }> = {};
    bordereau.epreuves.forEach((ep) => {
      const notesEpreuve = presents
        .map((c) => c.notes.find((n) => n.epreuveId === ep.id))
        .filter((n) => n && n.statut === "NOTE" && n.note !== null && n.note !== undefined)
        .map((n) => n!.note!);

      if (notesEpreuve.length > 0) {
        const som = notesEpreuve.reduce((a, b) => a + b, 0);
        const max = Math.max(...notesEpreuve);
        statsParEpreuve[ep.id] = {
          moyenne: Number((som / notesEpreuve.length).toFixed(2)),
          noteMax: max,
          nbNotes: notesEpreuve.length,
        };
      }
    });

    return {
      totalInscrits,
      nbPresents: presents.length,
      nbAbsents: absentsCount,
      tauxPresence,
      moyenneGenerale,
      majorCandidat: major,
      statsParEpreuve,
    };
  }, [bordereau, candidatsTries]);

  // Vérification si tous les coefficients sont identiques
  const tousMemeCoef = useMemo(() => {
    if (!bordereau || bordereau.epreuves.length <= 1) return true;
    const premier = bordereau.epreuves[0].coefficient;
    return bordereau.epreuves.every((ep) => ep.coefficient === premier);
  }, [bordereau]);

  // Export Excel direct (.csv avec encodage UTF-8 BOM lisible directement dans Microsoft Excel)
  const exporterExcel = () => {
    if (!bordereau || candidatsTries.length === 0) return;

    const sep = ";";
    const headers = [
      "Rang",
      "Rang Centre",
      "Évol.",
      "Nom et Prénom",
      "Centre",
      "Établissement",
      ...bordereau.epreuves.map((e) =>
        !tousMemeCoef ? `${e.intitule} (Coef ${e.coefficient})` : e.intitule,
      ),
      "Total",
    ];

    const rows = candidatsTries.map((c) => {
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
          ? n.note.toString().replace(".", ",")
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
        estAbs ? "ABS" : (c.totalPondere ? c.totalPondere.toString().replace(".", ",") : "0"),
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

  return (
    <div className="space-y-4">
      {/* ── Cockpit KPIs du Bordereau : 4 Cartes Métier Rigoureuses ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 : Participation */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Participation</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Award size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
              {statsSession.tauxPresence}%
            </span>
            <span className="text-xs text-slate-500">
              ({statsSession.nbPresents}/{statsSession.totalInscrits} présents)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
            <span>Absents :</span>
            <span className="font-bold text-rose-600">{statsSession.nbAbsents}</span>
          </div>
        </div>

        {/* KPI 2 : Épreuves & Coefficients */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Épreuves Écrites</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-brand-orange">
              <FileSpreadsheet size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
              {bordereau?.epreuves?.length || 0}
            </span>
            <span className="text-xs text-slate-500">matières évaluées</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
            <span>Régime :</span>
            <span className="font-bold text-slate-700">
              {tousMemeCoef ? "Coefficients identiques" : "Coefficients pondérés"}
            </span>
          </div>
        </div>

        {/* KPI 3 : Moyenne Générale */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Moyenne Filière</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
              {statsSession.moyenneGenerale !== null ? statsSession.moyenneGenerale : "—"}
            </span>
            <span className="text-xs text-slate-500">/ 20</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
            <span>Candidats classés :</span>
            <span className="font-bold text-slate-700">{statsSession.nbPresents}</span>
          </div>
        </div>

        {/* KPI 4 : Major de Promotion */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>Major de Promotion</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Star size={13} className="fill-amber-600" />
            </span>
          </div>
          <div className="mt-2">
            <div className="font-bold text-sm text-slate-900 line-clamp-1">
              {statsSession.majorCandidat ? statsSession.majorCandidat.nomComplet : "En attente"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5 text-xs text-amber-800">
              <span className="font-mono font-bold tabular-nums">
                {statsSession.majorCandidat?.totalPondere ?? "—"} pts
              </span>
              <span className="text-slate-500 text-[11px]">
                {statsSession.majorCandidat?.moyennePonderee ? `(Moy. ${statsSession.majorCandidat.moyennePonderee}/20)` : ""}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-amber-100 pt-1.5">
            <span>Centre :</span>
            <span className="font-bold text-slate-700 truncate max-w-[130px]">
              {statsSession.majorCandidat
                ? centres.find((c) => c.id === statsSession.majorCandidat?.centreId)?.nom || "—"
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Barre de sélection de filière et de filtre par centre */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Filière :
            </span>
            <select
              value={formationId}
              onChange={(e) => setFormationId(e.target.value)}
              className="focus:border-brand-orange cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
            >
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Centre :
            </span>
            {verrouillerCentre ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                <span>
                  {centres.find((c) => c.id === initCentreId)?.nom ||
                    "Mon centre"}
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  (Verrouillé)
                </span>
              </div>
            ) : (
              <select
                value={centreIdFiltre}
                onChange={(e) => setCentreIdFiltre(e.target.value)}
                className="focus:border-brand-orange cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="TOUS">
                  Tous les centres (Classement Général)
                </option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Actions Contextuelles Unifiées : 1 Bouton Saisie + 1 Menu Export */}
        <div className="relative flex items-center gap-2">
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
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-2xs transition-all ${
                estVerrouilleSaisie
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-brand-orange bg-brand-orange hover:bg-brand-orange/90 text-white"
              }`}
              title={
                estVerrouilleSaisie
                  ? "Saisie des notes verrouillée"
                  : `Saisir ou modifier les notes pour la filière ${formation?.nom || ""}`
              }
            >
              <Pencil size={14} />
              <span>Saisir les notes</span>
            </button>
          )}

          {/* Bouton Compiler les notes / Recalculer le classement */}
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
                        text: messageErreurApi(err, "Erreur lors de la compilation des notes."),
                      });
                      setTimeout(() => setMessageCompilation(null), 5000);
                    },
                  },
                );
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:text-brand-orange disabled:opacity-50"
              title="Compiler et recalculer le classement général et par centre"
            >
              <RefreshCw
                size={14}
                className={
                  compilerMutation.isPending
                    ? "animate-spin text-brand-orange"
                    : "text-slate-500"
                }
              />
              <span>
                {compilerMutation.isPending ? "Compilation..." : "Compiler les notes"}
              </span>
            </button>
          )}

          {/* Menu d'Export Unique */}
          {!estChefDept && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuExportOuvert(!menuExportOuvert)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
              >
                <Download size={14} className="text-slate-500" />
                <span>Exporter</span>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform duration-200 ${
                    menuExportOuvert ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuExportOuvert && (
                <div
                  className="absolute top-full right-0 z-30 mt-1.5 w-52 space-y-0.5 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-lg"
                  onMouseLeave={() => setMenuExportOuvert(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      exporterExcel();
                      setMenuExportOuvert(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    <span>Tableau Excel (.csv)</span>
                  </button>

                  {onOuvrirExportModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOuvrirExportModal(formationId);
                        setMenuExportOuvert(false);
                      }}
                      className="hover:text-brand-orange flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left font-semibold text-slate-700 transition-colors hover:bg-orange-50"
                    >
                      <Printer size={15} className="text-brand-orange" />
                      <span>Fiche Officielle PDF</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bannière de confirmation de compilation */}
      {messageCompilation && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
            messageCompilation.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {messageCompilation.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 text-red-600" />
          )}
          <span>{messageCompilation.text}</span>
        </div>
      )}

      {/* Tableau du bordereau officiel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-orange flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white">
              {concoursBlanc.numero}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bordereau des Notes — {formation?.nom}
              </h3>
              {centreIdFiltre !== "TOUS" && (
                <p className="text-brand-orange text-[11px] font-semibold">
                  Classement restreint au centre{" "}
                  {centres.find((c) => c.id === centreIdFiltre)?.nom}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-600">
              {nbPresents} candidat{nbPresents > 1 ? "s" : ""} classé{nbPresents > 1 ? "s" : ""}
            </span>
            {nbAbsents > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                {nbAbsents} absent{nbAbsents > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Chargement des résultats et calcul du classement...
          </div>
        ) : !bordereau || candidatsTries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Aucun résultat enregistré pour cette filière dans ce concours blanc.
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-b-slate-300 bg-slate-100/95 text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  <th className="sticky left-0 z-20 w-14 bg-slate-100 px-3 py-3 text-center border-r border-slate-200">
                    Rang
                  </th>
                  <th
                    className="w-16 bg-slate-200/40 px-2 py-3 text-center text-slate-600"
                    title="Rang au sein du centre"
                  >
                    Rang Ctre
                  </th>
                  <th
                    className="w-14 px-2 py-3 text-center"
                    title="Progression par rapport au dernier concours blanc"
                  >
                    Évol.
                  </th>
                  <th className="sticky left-14 z-20 min-w-[200px] bg-slate-100 px-4 py-3 border-r border-slate-200 shadow-xs">
                    Noms & Prénoms
                  </th>
                  <th className="min-w-[110px] px-3 py-3">Centre</th>
                  <th className="min-w-[140px] px-3 py-3">Établissement</th>
                  {bordereau.epreuves.map((ep) => (
                    <th
                      key={ep.id}
                      className="min-w-[120px] border-l border-slate-200 px-3 py-3 text-center"
                    >
                      <div className="line-clamp-1">{ep.intitule}</div>
                      <div className="text-[10px] font-normal text-slate-500 lowercase">
                        /{ep.noteMax}
                        {!tousMemeCoef ? ` · coef ${ep.coefficient}` : ""}
                      </div>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 w-28 border-l border-slate-200 bg-slate-100 px-3 py-3 text-center shadow-xs">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidatsTries.map((c, idx) => {
                  const estAbsent = estCandidatAbsent(c);
                  const delta = c.deltaRang;

                  return (
                    <tr
                      key={c.id || idx}
                      className={`group transition-colors ${
                        estAbsent
                          ? "bg-rose-50/15 text-slate-500 hover:bg-rose-50/30"
                          : c.rang === 1
                            ? "bg-amber-50/40 font-medium hover:bg-amber-50/60"
                            : c.rang === 2
                              ? "bg-slate-100/40 hover:bg-slate-100/70"
                              : c.rang === 3
                                ? "bg-orange-50/30 hover:bg-orange-50/50"
                                : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Rang Général (Sticky Left 0) */}
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5 text-center border-r border-slate-200 group-hover:bg-slate-50">
                        {estAbsent ? (
                          <span
                            className="inline-flex h-5 items-center justify-center rounded-md px-1.5 text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200"
                            title="Absent(e) à la totalité des épreuves"
                          >
                            ABS
                          </span>
                        ) : (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black tabular-nums ${
                              c.rang === 1
                                ? "bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300"
                                : c.rang === 2
                                  ? "bg-slate-300 text-slate-800 shadow-2xs"
                                  : c.rang === 3
                                    ? "bg-amber-700 text-white shadow-2xs"
                                    : "font-bold text-slate-600"
                            }`}
                          >
                            {c.rang ?? "-"}
                          </span>
                        )}
                      </td>

                      {/* Rang Centre */}
                      <td className="bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold text-slate-600 tabular-nums">
                        {estAbsent ? (
                          <span className="text-[10px] font-bold text-rose-600">ABS</span>
                        ) : (
                          c.rangCentre ?? "-"
                        )}
                      </td>

                      {/* Évolution (Delta vs concours précédent) */}
                      <td className="px-2 py-2.5 text-center">
                        {delta !== null && delta !== undefined ? (
                          delta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 tabular-nums">
                              <TrendingUp size={12} />+{delta}
                            </span>
                          ) : delta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 tabular-nums">
                              <TrendingDown size={12} />
                              {delta}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-bold text-slate-400">
                              <Minus size={12} />
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* Noms et Prénoms (Sticky Left 14) */}
                      <td className="sticky left-14 z-10 bg-inherit px-4 py-2.5 border-r border-slate-200 group-hover:bg-slate-50 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 line-clamp-1">
                            {c.nomComplet}
                          </span>
                          {c.horsListe && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 shrink-0">
                              HL
                            </span>
                          )}
                          {c.rang === 1 && (
                            <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[9px] font-black shrink-0">
                              1er
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Centre EXCELIS */}
                      <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">
                        {centres.find((ct) => ct.id === c.centreId)?.nom || "—"}
                      </td>

                      {/* Établissement d'origine */}
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {c.etablissementOrigine || "—"}
                      </td>

                      {/* Notes par Épreuve (avec micro-teintes et étoile Major) */}
                      {bordereau.epreuves.map((ep) => {
                        const noteObj = c.notes.find(
                          (n) => n.epreuveId === ep.id,
                        );
                        const noteVal = noteObj?.note;
                        const statut = noteObj?.statut ?? "NOTE";
                        const maxNoteEpreuve =
                          bordereau.meilleuresNotesParEpreuve[ep.id];
                        const estMeilleureNote =
                          statut === "NOTE" &&
                          noteVal !== null &&
                          noteVal !== undefined &&
                          maxNoteEpreuve !== undefined &&
                          noteVal >= maxNoteEpreuve &&
                          noteVal > 0;

                        // Teinte contextuelle de la note
                        const noteBas = noteVal !== null && noteVal !== undefined && noteVal < 5;
                        const noteFaible = noteVal !== null && noteVal !== undefined && noteVal >= 5 && noteVal < 10;
                        const noteExcellente = noteVal !== null && noteVal !== undefined && noteVal >= 14;

                        return (
                          <td
                            key={ep.id}
                            className={`border-l border-slate-200 px-3 py-2.5 text-center ${
                              noteBas
                                ? "bg-rose-50/40"
                                : noteFaible
                                  ? "bg-amber-50/20"
                                  : noteExcellente
                                    ? "bg-emerald-50/20"
                                    : ""
                            }`}
                          >
                            {statut === "NOTE" ? (
                              noteVal !== null && noteVal !== undefined ? (
                                <div className="inline-flex items-center justify-center gap-1">
                                  <span
                                    className={`font-mono tabular-nums font-bold ${
                                      estMeilleureNote
                                        ? "text-sm font-black text-amber-600"
                                        : noteBas
                                          ? "text-rose-700 font-black"
                                          : noteFaible
                                            ? "text-amber-700"
                                            : noteExcellente
                                              ? "text-emerald-700 font-black"
                                              : "text-slate-800"
                                    }`}
                                  >
                                    {noteVal}
                                  </span>
                                  {estMeilleureNote && (
                                    <span title="Major de la promotion pour cette discipline">
                                      <Star
                                        size={12}
                                        className="shrink-0 fill-amber-400 text-amber-500"
                                      />
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="font-mono text-slate-300">
                                  -
                                </span>
                              )
                            ) : (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                  statut === "ABS"
                                    ? "border border-red-200 bg-red-50 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {statut}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Pondéré (Sticky Right) */}
                      <td className="sticky right-0 z-10 border-l border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono font-bold text-slate-900 tabular-nums shadow-xs group-hover:bg-slate-100">
                        {estAbsent ? (
                          <span className="font-bold text-[11px] text-rose-600">ABS</span>
                        ) : c.totalPondere !== null && c.totalPondere !== undefined ? (
                          c.totalPondere
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Ligne de synthèse officielle en bas de tableau (Moyenne & Max par épreuve) */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100/90 text-xs font-bold text-slate-800">
                  <td
                    colSpan={6}
                    className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-right uppercase tracking-wider text-[11px] text-slate-600 border-r border-slate-200"
                  >
                    Moyennes & Performances de l&rsquo;épreuve :
                  </td>
                  {bordereau.epreuves.map((ep) => {
                    const st = statsSession.statsParEpreuve[ep.id];
                    return (
                      <td
                        key={ep.id}
                        className="border-l border-slate-200 px-3 py-2.5 text-center font-mono tabular-nums"
                      >
                        {st ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-900 font-black">
                              {st.moyenne}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-700">
                              max {st.noteMax}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 border-l border-slate-200 bg-slate-200/80 px-3 py-3 text-center font-mono font-black text-slate-900 tabular-nums">
                    {statsSession.moyenneGenerale ? `${statsSession.moyenneGenerale}/20` : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
