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
} from "lucide-react";
import type { Formation } from "@/modules/academique";
import type { Centre } from "@/modules/centres-sessions";
import type { Matiere } from "@/modules/matieres";
import type { ConcoursBlanc } from "../types/concours-blanc.types";
import { useBordereauConcoursBlanc } from "../hooks/useConcoursBlancs";

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
  const [centreIdFiltre, setCentreIdFiltre] = useState<string>(initCentreId || "TOUS");

  const filtreEffective = verrouillerCentre && initCentreId ? initCentreId : centreIdFiltre;

  const { data: bordereau, isLoading } = useBordereauConcoursBlanc(
    concoursBlanc.id,
    formationId,
    filtreEffective === "TOUS" ? undefined : filtreEffective,
    role,
    userCentreId,
  );

  const estDA = role === "DIRECTEUR_ACADEMIQUE" || role === "DIRECTEUR";
  const estVerrouilleSaisie =
    concoursBlanc.statut === "CLOTURE" ||
    (Boolean(concoursBlanc.saisieNotesBloqueeCentre) && !estDA);

  const formation = formations.find((f) => f.id === formationId);

  // Vérification si tous les coefficients sont identiques
  const tousMemeCoef = useMemo(() => {
    if (!bordereau || bordereau.epreuves.length <= 1) return true;
    const premier = bordereau.epreuves[0].coefficient;
    return bordereau.epreuves.every((ep) => ep.coefficient === premier);
  }, [bordereau]);

  // Export Excel direct (.csv avec encodage UTF-8 BOM lisible directement dans Microsoft Excel)
  const exporterExcel = () => {
    if (!bordereau || bordereau.candidats.length === 0) return;

    const sep = ";";
    const headers = [
      "Rang",
      "Rang Centre",
      "Évolution",
      "Nom et Prénom",
      "Centre",
      "Établissement",
      ...bordereau.epreuves.map((e) =>
        !tousMemeCoef ? `${e.intitule} (Coef ${e.coefficient})` : e.intitule,
      ),
      "Total Pondéré",
    ];

    const rows = bordereau.candidats.map((c) => {
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
        return n.note !== null && n.note !== undefined ? n.note.toString().replace(".", ",") : "-";
      });

      return [
        c.rang ?? "-",
        c.rangCentre ?? "-",
        deltaStr,
        `"${c.nomComplet.replace(/"/g, '""')}"`,
        `"${ctreNom.replace(/"/g, '""')}"`,
        `"${(c.etablissementOrigine || "").replace(/"/g, '""')}"`,
        ...notesCols,
        c.totalPondere ? c.totalPondere.toString().replace(".", ",") : "0",
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

  const [menuExportOuvert, setMenuExportOuvert] = useState(false);

  return (
    <div className="space-y-4">
      {/* Barre de sélection de filière et de filtre par centre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Filière :
            </span>
            <select
              value={formationId}
              onChange={(e) => setFormationId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange cursor-pointer"
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Centre :
            </span>
            {verrouillerCentre ? (
              <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>{centres.find((c) => c.id === initCentreId)?.nom || "Mon centre"}</span>
                <span className="text-[10px] text-slate-400 font-normal">(Verrouillé)</span>
              </div>
            ) : (
              <select
                value={centreIdFiltre}
                onChange={(e) => setCentreIdFiltre(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange cursor-pointer"
              >
                <option value="TOUS">Tous les centres (Classement Général)</option>
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
        <div className="flex items-center gap-2 relative">
          {onSaisieNotes && (
            <button
              type="button"
              onClick={() =>
                onSaisieNotes(
                  formationId,
                  filtreEffective === "TOUS" ? undefined : filtreEffective,
                )
              }
              disabled={estVerrouilleSaisie}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                estVerrouilleSaisie
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-brand-orange bg-brand-orange text-white hover:bg-brand-orange/90"
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

          {/* Menu d'Export Unique */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuExportOuvert(!menuExportOuvert)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <Download size={14} className="text-slate-500" />
              <span>Exporter</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 text-slate-400 ${
                  menuExportOuvert ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuExportOuvert && (
              <div
                className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg space-y-0.5 text-xs"
                onMouseLeave={() => setMenuExportOuvert(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    exporterExcel();
                    setMenuExportOuvert(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold text-left cursor-pointer transition-colors"
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
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-orange-50 hover:text-brand-orange font-semibold text-left cursor-pointer transition-colors"
                  >
                    <Printer size={15} className="text-brand-orange" />
                    <span>Fiche Officielle PDF</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau du bordereau officiel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange text-white text-xs font-black">
              {concoursBlanc.numero}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Bordereau des Notes — {formation?.nom}
              </h3>
              {centreIdFiltre !== "TOUS" && (
                <p className="text-[11px] font-semibold text-brand-orange">
                  Classement restreint au centre {centres.find((c) => c.id === centreIdFiltre)?.nom}
                </p>
              )}
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {bordereau?.candidats.length ?? 0} candidat{(bordereau?.candidats.length ?? 0) > 1 ? "s" : ""} classé{(bordereau?.candidats.length ?? 0) > 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Chargement des résultats et calcul du classement...
          </div>
        ) : !bordereau || bordereau.candidats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucun résultat enregistré pour cette filière dans ce concours blanc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-b-slate-300 bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-14 text-center">Rang</th>
                  <th className="py-3 px-2 w-16 text-center text-slate-600 bg-slate-200/40" title="Rang au sein du centre">
                    Rang Ctre
                  </th>
                  <th className="py-3 px-2 w-14 text-center" title="Progression par rapport au dernier concours blanc">
                    Évol.
                  </th>
                  <th className="py-3 px-4 min-w-[180px]">Noms & Prénoms</th>
                  <th className="py-3 px-3 min-w-[110px]">Centre</th>
                  <th className="py-3 px-3 min-w-[140px]">Établissement</th>
                  {bordereau.epreuves.map((ep) => (
                    <th key={ep.id} className="py-3 px-3 text-center min-w-[120px] border-l border-slate-200">
                      <div>{ep.intitule}</div>
                      <div className="text-[10px] font-normal text-slate-500 lowercase">
                        /{ep.noteMax}{!tousMemeCoef ? ` · coef ${ep.coefficient}` : ""}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 w-28 text-center border-l border-slate-200 bg-slate-100">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bordereau.candidats.map((c, idx) => {
                  const estPodium = c.rang !== null && c.rang !== undefined && c.rang <= 3;
                  const delta = c.deltaRang;

                  return (
                    <tr
                      key={c.id || idx}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        c.rang === 1 ? "bg-amber-50/40 font-medium" : ""
                      }`}
                    >
                      {/* Rang Général */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                            c.rang === 1
                              ? "bg-amber-400 text-slate-950 shadow-xs"
                              : c.rang === 2
                                ? "bg-slate-300 text-slate-800"
                                : c.rang === 3
                                  ? "bg-amber-700 text-white"
                                  : "text-slate-600 font-bold"
                          }`}
                        >
                          {c.rang ?? "-"}
                        </span>
                      </td>

                      {/* Rang Centre */}
                      <td className="py-2.5 px-2 text-center text-xs font-bold text-slate-600 bg-slate-50/60">
                        {c.rangCentre ?? "-"}
                      </td>

                      {/* Évolution (Delta vs concours précédent) */}
                      <td className="py-2.5 px-2 text-center">
                        {delta !== null && delta !== undefined ? (
                          delta > 0 ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold text-[11px] gap-0.5">
                              <TrendingUp size={12} />
                              +{delta}
                            </span>
                          ) : delta < 0 ? (
                            <span className="inline-flex items-center text-red-600 font-bold text-[11px] gap-0.5">
                              <TrendingDown size={12} />
                              {delta}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-slate-400 font-bold text-[11px]">
                              <Minus size={12} />
                            </span>
                          )
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Noms et Prénoms */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{c.nomComplet}</span>
                          {c.horsListe && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                              HL
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Centre EXCELIS */}
                      <td className="py-2.5 px-3 text-xs font-semibold text-slate-700">
                        {centres.find((ct) => ct.id === c.centreId)?.nom || "—"}
                      </td>

                      {/* Établissement d'origine */}
                      <td className="py-2.5 px-3 text-xs text-slate-500">
                        {c.etablissementOrigine || "—"}
                      </td>

                      {/* Notes par Épreuve (avec étoile Major) */}
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
                          <td key={ep.id} className="py-2.5 px-3 text-center border-l border-slate-200">
                            {statut === "NOTE" ? (
                              noteVal !== null && noteVal !== undefined ? (
                                <div className="inline-flex items-center justify-center gap-1">
                                  <span
                                    className={`font-mono font-bold ${
                                      estMeilleureNote
                                        ? "text-amber-600 font-black text-sm"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {noteVal}
                                  </span>
                                  {estMeilleureNote && (
                                    <span title="Major de la promotion pour cette discipline">
                                      <Star
                                        size={12}
                                        className="fill-amber-400 text-amber-500 shrink-0"
                                      />
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )
                            ) : (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                  statut === "ABS"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {statut}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Pondéré */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-slate-50/50 font-mono font-bold text-slate-800">
                        {c.totalPondere !== null && c.totalPondere !== undefined ? c.totalPondere : "-"}
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
