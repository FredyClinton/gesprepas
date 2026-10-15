"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileSidebar } from "./MobileSidebar";
import type { Role } from "@/types/roles";

type DashboardShellProps = {
  role: Role;
  centreName?: string;
  children: React.ReactNode;
};

export function DashboardShell({
  role,
  centreName,
  children,
}: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleOpenMobileNav = useCallback(() => {
    setIsMobileNavOpen(true);
  }, []);

  const handleCloseMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar role={role} />

      {/* Mobile drawer sidebar with portal to document.body */}
      <MobileSidebar
        role={role}
        centreName={centreName}
        isOpen={isMobileNavOpen}
        onClose={handleCloseMobileNav}
      />

      <div className="flex h-screen flex-col md:ml-64">
        {/* TopBar with mobile menu toggle */}
        <TopBar
          role={role}
          centreName={centreName}
          onOpenMobileNav={handleOpenMobileNav}
        />

        {/* Scrollable page body */}
        <main className="bg-brand-gray/[0.03] flex-1 overflow-y-auto px-4 pt-24 pb-4 md:px-8 md:pt-28 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
