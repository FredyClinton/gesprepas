"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileSidebar } from "./MobileSidebar";
import {
  isExtendedLayoutPage,
  PAGE_MAX_WIDTH_ORDINARY,
  PAGE_MAX_WIDTH_EXTENDED,
} from "./PageContainer";
import type { Role } from "@/types/roles";

type DashboardShellProps = {
  role: Role;
  centreName?: string;
  children: React.ReactNode;
};

// Coquille principale du tableau de bord EXCELIS PRÉPAS
// Gère l'état rétractable de la Sidebar desktop et le tiroir mobile.
export function DashboardShell({
  role,
  centreName,
  children,
}: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleOpenMobileNav = useCallback(() => {
    setIsMobileNavOpen(true);
  }, []);

  const handleCloseMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const pathname = usePathname();
  const isExtended = isExtendedLayoutPage(pathname);

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      {/* Barre latérale desktop rétractable */}
      <Sidebar
        role={role}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Menu tiroir mobile avec portal vers document.body */}
      <MobileSidebar
        role={role}
        centreName={centreName}
        isOpen={isMobileNavOpen}
        onClose={handleCloseMobileNav}
      />

      {/* Zone de contenu principale */}
      <div
        className={`flex h-screen flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {/* Barre supérieure fine (h-16) */}
        <TopBar
          role={role}
          centreName={centreName}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onOpenMobileNav={handleOpenMobileNav}
        />

        {/* Corps de page défilable avec espacements harmonieux :
            - Largeur standardisée (max-w-7xl) pour les pages ordinaires
            - Largeur étendue (max-w-[1600px]) pour les pages exclues : Bordereau, Concours blanc, Progression */}
        <main className="flex-1 overflow-y-auto px-4 pt-20 pb-8 sm:px-6 md:px-8 md:pt-20">
          <div
            className={`mx-auto w-full animate-in fade-in duration-150 ${
              isExtended ? PAGE_MAX_WIDTH_EXTENDED : PAGE_MAX_WIDTH_ORDINARY
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
