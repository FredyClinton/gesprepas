"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  Building2,
  Award,
  Filter,
} from "lucide-react";
import type { Formation } from "@/modules/academique";
import type { Centre } from "@/modules/centres-sessions";
import type { ConcoursBlanc } from "../types/concours-blanc.types";
import { useBordereauConcoursBlanc } from "../hooks/useConcoursBlancs";

interface ExporterBordereauModalProps {
  isOpen: boolean;
  onClose: () => void;
  concoursBlanc: ConcoursBlanc;
  formations: Formation[];
  centres: Centre[];
  formationIdActive: string;
  centreIdFiltre?: string;
  sessionAnnee?: string;
  role?: string;
  userCentreId?: string;
}

interface BordereauFiliereSheetProps {
  concoursBlanc: ConcoursBlanc;
  formation: Formation;
  centreIdFiltre?: string;
  centres: Centre[];
  sessionAnnee: string;
  role?: string;
  userCentreId?: string;
  estDerniere?: boolean;
}

function BordereauFiliereSheet({
  concoursBlanc,
  formation,
  centreIdFiltre,
  centres,
  sessionAnnee,
  role,
  userCentreId,
  estDerniere = false,
}: BordereauFiliereSheetProps) {
  const { data: bordereau, isLoading } = useBordereauConcoursBlanc(
    concoursBlanc.id,
    formation.id,
    centreIdFiltre === "TOUS" ? undefined : centreIdFiltre,
    role,
    userCentreId,
  );

  const centre = centres.find((c) => c.id === centreIdFiltre);

  const tousMemeCoef = useMemo(() => {
    if (!bordereau || bordereau.epreuves.length <= 1) return true;
    const premier = bordereau.epreuves[0].coefficient;
    return bordereau.epreuves.every((ep) => ep.coefficient === premier);
  }, [bordereau]);

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center text-xs text-slate-400 py-12 mb-6">
        Chargement du bordereau pour {formation.nom}...
      </div>
    );
  }

  return (
    <div
      className={`bordereau-sheet-page bg-white p-8 rounded-lg shadow-md border border-slate-300/80 mb-6 print:mb-0 print:shadow-none print:border-none print:p-4 ${
        !estDerniere ? "print:break-after-page" : ""
      }`}
      style={{
        pageBreakAfter: estDerniere ? "auto" : "always",
        breakAfter: estDerniere ? "auto" : "page",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      {/* Cartouche officiel EXCELIS PRÉPAS */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
            EXCELIS PRÉPAS
          </h1>
          <p className="text-xs font-bold text-brand-orange uppercase">
            Préparation aux Grandes Écoles d&rsquo;Ingénieurs & de Santé
          </p>
          <p className="text-[11px] text-slate-500">
            Session Académique {sessionAnnee} · {centre?.nom ? `Centre ${centre.nom}` : "Tous Centres Réunis"}
          </p>
        </div>

        <div className="text-right">
          <div className="inline-block rounded-lg bg-brand-orange px-3 py-1 text-xs font-black text-white uppercase tracking-wider mb-1">
            {concoursBlanc.titre}
          </div>
          <div className="text-xs font-bold text-slate-800">
            Filière : <span className="uppercase text-brand-orange">{formation.nom}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Date de l&rsquo;épreuve : {concoursBlanc.dateEpreuve} ({concoursBlanc.jour})
          </div>
        </div>
      </div>

      {/* Titre du bordereau */}
      <div className="text-center my-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 border-b border-t border-slate-300 py-1.5 inline-block px-8">
          BORDEREAU OFFICIEL DES RÉSULTATS & CLASSEMENT — {formation.nom}
        </h2>
      </div>

      {/* Tableau des notes A4 Paysage */}
      {!bordereau || bordereau.candidats.length === 0 ? (
        <p className="text-center text-xs text-slate-400 py-8 italic">
          Aucun résultat enregistré pour la filière {formation.nom}.
        </p>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-left text-xs border border-slate-400 my-3">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2 px-2 border-r border-slate-300 text-center w-12">Rang</th>
                <th className="py-2 px-2 border-r border-slate-300 text-center w-14">Rang Ctre</th>
                <th className="py-2 px-3 border-r border-slate-300 min-w-[170px]">Noms & Prénoms</th>
                <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">Centre</th>
                <th className="py-2 px-2 border-r border-slate-300 min-w-[100px]">Établissement</th>
                {bordereau.epreuves.map((ep) => (
                  <th key={ep.id} className="py-2 px-2 border-r border-slate-300 text-center">
                    <div>{ep.intitule}</div>
                    {!tousMemeCoef && (
                      <div className="text-[9px] font-normal text-slate-500 lowercase">
                        coef {ep.coefficient}
                      </div>
                    )}
                  </th>
                ))}
                <th className="py-2 px-2 text-center w-20 bg-slate-200/60 font-black">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {bordereau.candidats.map((c) => (
                <tr key={c.id} className="border-b border-slate-300 text-[11px]">
                  <td className="py-1.5 px-2 text-center font-bold border-r border-slate-300">
                    {c.rang ?? "-"}
                  </td>
                  <td className="py-1.5 px-2 text-center font-semibold text-slate-700 border-r border-slate-300">
                    {c.rangCentre ?? "-"}
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 border-r border-slate-300">
                    {c.nomComplet}
                  </td>
                  <td className="py-1.5 px-2 text-slate-700 font-medium border-r border-slate-300 text-[10px]">
                    {centres.find((ct) => ct.id === c.centreId)?.nom || "—"}
                  </td>
                  <td className="py-1.5 px-2 text-slate-600 border-r border-slate-300 text-[10px]">
                    {c.etablissementOrigine || "—"}
                  </td>
                  {bordereau.epreuves.map((ep) => {
                    const noteObj = c.notes.find((n) => n.epreuveId === ep.id);
                    const noteVal = noteObj?.note;
                    const statut = noteObj?.statut ?? "NOTE";
                    const maxNote = bordereau.meilleuresNotesParEpreuve[ep.id];
                    const estMeilleur =
                      statut === "NOTE" &&
                      noteVal !== null &&
                      noteVal !== undefined &&
                      maxNote !== undefined &&
                      noteVal >= maxNote &&
                      noteVal > 0;

                    return (
                      <td key={ep.id} className="py-1.5 px-2 text-center border-r border-slate-300 font-mono">
                        {statut === "NOTE" ? (
                          noteVal !== null && noteVal !== undefined ? (
                            <span className={estMeilleur ? "font-black text-amber-700 underline" : ""}>
                              {noteVal} {estMeilleur ? "★" : ""}
                            </span>
                          ) : (
                            "-"
                          )
                        ) : (
                          <span className="font-bold text-[9px] text-red-700">{statut}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-2 text-center font-mono font-bold bg-slate-50">
                    {c.totalPondere ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note de bas de tableau */}
      <p className="text-[10px] text-slate-500 italic mb-6">
        ★ Indique la meilleure note obtenue dans la matière sur l&rsquo;ensemble des centres.
      </p>

      {/* Bloc officiel de signature des visas */}
      <div
        className="grid grid-cols-2 gap-12 mt-8 pt-4 border-t border-slate-300 text-xs"
        style={{
          breakInside: "avoid",
          pageBreakInside: "avoid",
        }}
      >
        <div className="text-center">
          <p className="font-bold text-slate-800 uppercase tracking-wider mb-12">
            VISA DU CHEF DE DÉPARTEMENT
          </p>
          <div className="border-t border-dashed border-slate-400 w-48 mx-auto" />
          <p className="text-[10px] text-slate-400 mt-1">Signature & Date</p>
        </div>

        <div className="text-center">
          <p className="font-bold text-slate-800 uppercase tracking-wider mb-12">
            VISA DE LA DIRECTION ACADÉMIQUE
          </p>
          <div className="border-t border-dashed border-slate-400 w-48 mx-auto" />
          <p className="text-[10px] text-slate-400 mt-1">Signature & Cachet</p>
        </div>
      </div>
    </div>
  );
}

export function ExporterBordereauModal({
  isOpen,
  onClose,
  concoursBlanc,
  formations,
  centres,
  formationIdActive,
  centreIdFiltre,
  sessionAnnee = "2026",
  role,
  userCentreId,
}: ExporterBordereauModalProps) {
  const [filiereSelectionnee, setFiliereSelectionnee] = useState<string>(
    formationIdActive || (formations[0]?.id ?? "TOUTES"),
  );

  useEffect(() => {
    if (formationIdActive) {
      setFiliereSelectionnee(formationIdActive);
    }
  }, [formationIdActive, isOpen]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.classList.add("bordereau-export-open");
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("bordereau-export-open");
    }
    return () => {
      document.body.classList.remove("bordereau-export-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const formationsAffichees =
    filiereSelectionnee === "TOUTES"
      ? formations
      : formations.filter((f) => f.id === filiereSelectionnee);

  const modalContent = (
    <div
      id="printable-bordereau-modal"
      className="printable-modal fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:static print:block print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:max-h-none print:w-full print:inset-auto print:z-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-6xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden print:static print:block print:max-h-none print:h-auto print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-none print:shadow-none print:m-0 print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre d'actions en haut (Masquée à l'impression) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 shrink-0 no-print print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-white">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Aperçu avant impression — Bordereau Officiel du Concours Blanc
              </h3>
              <p className="text-xs text-slate-500">
                Format officiel A4 Paysage avec palmarès, totaux pondérés et visas
              </p>
            </div>
          </div>

          {/* Filtres de sélection et Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sélecteur de filière */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Filière :
              </span>
              <select
                value={filiereSelectionnee}
                onChange={(e) => setFiliereSelectionnee(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="TOUTES">Toutes les filières ({formations.length})</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Imprimer / Exporter en PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corps de la feuille de prévisualisation */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/70 -mx-6 print:m-0 print:p-0 print:bg-white print:overflow-visible print:h-auto print:max-h-none print:block">
          <div className="mx-auto max-w-[1050px] print:max-w-none print:w-full print:m-0 print:p-0">
            {formationsAffichees.map((f, idx) => (
              <BordereauFiliereSheet
                key={f.id}
                concoursBlanc={concoursBlanc}
                formation={f}
                centreIdFiltre={centreIdFiltre}
                centres={centres}
                sessionAnnee={sessionAnnee}
                role={role}
                userCentreId={userCentreId}
                estDerniere={idx === formationsAffichees.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
