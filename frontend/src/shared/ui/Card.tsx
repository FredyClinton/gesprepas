import type { HTMLAttributes } from "react";

// Conteneur de carte standard EXCELIS PRÉPAS (KPI, panneau, section de contenu).
// Fond blanc pur, bordure discrète, coins adoucis et élévation sobre.
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow duration-200 ${className}`}
      {...props}
    />
  );
}
