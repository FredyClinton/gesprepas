import React from "react";
import { Logo } from "./Logo";
import { formaterDateHeureGeneration } from "@/shared/lib/format-document-date";

export interface PrintDocumentHeaderProps {
  titre: string;
  sousTitre?: string;
  reference?: string;
  dateGeneration?: Date | string | null;
  orientation?: "portrait" | "landscape" | "compact";
  session?: string;
  centre?: string;
  className?: string;
  extraMeta?: React.ReactNode;
}

/**
 * En-tête officiel partagé pour tous les documents imprimés et exportés EXCELIS PRÉPAS.
 *
 * Le logo officiel EXCELIS intègre déjà le nom de marque de façon vectorielle et fidèle.
 * Aucun texte textuel "EXCELIS" ou "EXCELIS PRÉPAS" redondant n'est donc dupliqué à côté du logo.
 */
export function PrintDocumentHeader({
  titre,
  sousTitre = "Classes Préparatoires aux Grandes Écoles & Concours d'Excellence",
  reference,
  dateGeneration,
  orientation = "portrait",
  session,
  centre,
  className = "",
  extraMeta,
}: PrintDocumentHeaderProps) {
  const dateEtHeure = formaterDateHeureGeneration(dateGeneration);

  if (orientation === "compact") {
    return (
      <div className={`flex items-start justify-between border-b border-slate-300 pb-3 mb-3 ${className}`}>
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-auto object-contain shrink-0" priority />
          <div>
            <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">
              {centre ? `Centre ${centre}` : sousTitre}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {titre}
          </span>
          {reference && (
            <p className="font-mono text-[10px] text-slate-700 font-semibold mt-0.5">
              Réf : {reference}
            </p>
          )}
          <p className="text-[9px] text-slate-400 mt-0.5">{dateEtHeure}</p>
        </div>
      </div>
    );
  }

  if (orientation === "landscape") {
    return (
      <div className={`border-b-2 border-slate-900 pb-4 mb-4 ${className}`}>
        <div className="flex items-start justify-between gap-4">
          {/* Logo officiel EXCELIS (sans texte de marque redondant) & Sous-titre */}
          <div className="flex items-center gap-4">
            <Logo className="h-12 w-auto object-contain shrink-0" priority />
            <div className="border-l border-slate-300 pl-4">
              <p className="text-xs font-bold text-brand-orange uppercase tracking-wide">
                {sousTitre}
              </p>
              {(session || centre) && (
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {session ? `Session Académique ${session}` : ""}
                  {session && centre ? " · " : ""}
                  {centre ? `Centre ${centre}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Badge Titre Document, Réf & Date/Heure */}
          <div className="text-right shrink-0">
            <div className="inline-block rounded-lg bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-wider text-white mb-1 shadow-2xs">
              {titre}
            </div>
            {reference && (
              <p className="font-mono text-xs font-bold text-slate-800">
                Réf : <span className="font-mono text-slate-900">{reference}</span>
              </p>
            )}
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">
              {dateEtHeure}
            </p>
            {extraMeta && <div className="mt-1">{extraMeta}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Orientation par défaut : Portrait
  return (
    <div className={`border-b-2 border-slate-900 pb-4 mb-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Gauche : Logo officiel & Mention d'excellence */}
        <div className="flex items-center gap-4">
          <Logo className="h-11 sm:h-12 w-auto object-contain shrink-0" priority />
          <div className="border-l border-slate-300 pl-3.5">
            <p className="text-xs font-bold text-brand-orange uppercase tracking-wide">
              {sousTitre}
            </p>
            {(session || centre) && (
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {session ? `Session ${session}` : ""}
                {session && centre ? " • " : ""}
                {centre ? `Centre : ${centre}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Droite : Type de document, référence et horodatage */}
        <div className="text-right shrink-0">
          <span className="inline-block rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-2xs">
            {titre}
          </span>
          {reference && (
            <p className="mt-1 font-mono text-xs font-bold text-slate-800">
              Réf : {reference}
            </p>
          )}
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">
            {dateEtHeure}
          </p>
          {extraMeta && <div className="mt-1">{extraMeta}</div>}
        </div>
      </div>
    </div>
  );
}
