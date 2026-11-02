import React from "react";
import { formaterDateDocument } from "@/shared/lib/format-document-date";

export interface VisaDirecteurAcademiqueProps {
  dateValidation?: string | Date | null;
  nomDirecteur?: string;
  align?: "left" | "center" | "right";
  className?: string;
  sousTitre?: string;
}

/**
 * Bloc de Visa officiel pour les documents académiques EXCELIS PRÉPAS.
 *
 * RÈGLES MÉTIER :
 * 1. Les documents académiques sont visés UNIQUEMENT par le Directeur académique.
 * 2. Utilise le titre exact « Directeur académique ».
 * 3. Ne simule pas de signature manuscrite si aucune donnée de signature numérique n'existe.
 * 4. Présente un cadre officiel pour le cachet et la signature physique ou l'approbation enregistrée.
 */
export function VisaDirecteurAcademique({
  dateValidation,
  nomDirecteur,
  align = "right",
  className = "",
  sousTitre = "Signature & Cachet officiel",
}: VisaDirecteurAcademiqueProps) {
  const alignClass =
    align === "right"
      ? "flex justify-end"
      : align === "center"
        ? "flex justify-center"
        : "flex justify-start";

  const aValide = Boolean(dateValidation);

  return (
    <div
      className={`${alignClass} mt-6 pt-3 text-xs avoid-break ${className}`}
      style={{
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      <div className="min-w-[260px] max-w-[320px] rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-center print:bg-white print:border-slate-400">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
          Directeur académique
        </p>

        {aValide ? (
          <div className="my-3 py-1">
            <span className="inline-block rounded bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
              Visé et Approuvé
            </span>
            {nomDirecteur && (
              <p className="text-[11px] font-semibold text-slate-800 mt-1">
                {nomDirecteur}
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-0.5">
              Le {formaterDateDocument(dateValidation)}
            </p>
          </div>
        ) : (
          <div className="my-5 border-t border-dashed border-slate-300 print:border-slate-400" />
        )}

        <p className="text-[10px] font-medium text-slate-500 italic">
          {sousTitre}
        </p>
      </div>
    </div>
  );
}

