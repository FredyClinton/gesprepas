import type { HTMLAttributes } from "react";

// Conteneur de carte générique (KPI, panneau, ligne de contenu). Pas de logique
// métier — uniquement la charte visuelle (fond blanc, bordure fine grise).
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-brand-gray/20 bg-brand-white rounded-lg border ${className}`}
      {...props}
    />
  );
}
