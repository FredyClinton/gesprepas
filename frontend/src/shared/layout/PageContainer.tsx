"use client";

import React from "react";

/**
 * Pages exclues de l'harmonisation standard :
 * - Bordereau (/paie) : calculs et bordereaux de vacations denses
 * - Concours blanc (/concours-blancs) : palmarès consolidé, saisie des notes et bordereau de résultats
 * - Progression (/progression) : syllabus pédagogique multi-matières grand format
 */
export const EXTENDED_LAYOUT_ROUTES = [
  "/paie",
  "/concours-blancs",
  "/progression",
] as const;

/**
 * Vérifie si le chemin actuel fait partie des pages à disposition spécifique étendue.
 */
export function isExtendedLayoutPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return EXTENDED_LAYOUT_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Largeur standardisée des pages ordinaires :
 * Calibrée sur un conteneur centré élégant (max-w-7xl / 1280px),
 * inspiré du standard Facebook et des interfaces SaaS modernes.
 */
export const PAGE_MAX_WIDTH_ORDINARY = "max-w-7xl";

/**
 * Largeur étendue réservée aux trois pages exclues nécessitant un espace plus vaste.
 */
export const PAGE_MAX_WIDTH_EXTENDED = "max-w-[1600px]";

/**
 * Classe réutilisable pour les conteneurs de page standard.
 */
export const PAGE_CONTAINER_CLASS = "mx-auto w-full max-w-7xl space-y-6";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Force explicitement le mode étendu si nécessaire */
  extended?: boolean;
  className?: string;
}

/**
 * Composant de conteneur de page partagé pour assurer des largeurs et alignements uniformes.
 */
export function PageContainer({
  children,
  extended = false,
  className = "",
  ...props
}: PageContainerProps) {
  const maxWidthClass = extended ? PAGE_MAX_WIDTH_EXTENDED : PAGE_MAX_WIDTH_ORDINARY;

  return (
    <div
      className={`mx-auto w-full ${maxWidthClass} space-y-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

