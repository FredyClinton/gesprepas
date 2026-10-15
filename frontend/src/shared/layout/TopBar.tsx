"use client";

import { Bell, MapPin, ChevronDown, UserCircle, Menu } from "lucide-react";

import { ROLE_LABELS, type Role } from "@/types/roles";

type TopBarProps = {
  role: Role;
  // Nom du centre déjà résolu par (dashboard)/layout.tsx (Server Component) -
  // absent pour les rôles non centre-scope (Directeur...).
  centreName?: string;
  onOpenMobileNav?: () => void;
};

// Barre fine du haut - commune à tous les écrans, peu importe le rôle.
// Intègre le bouton hamburger sur mobile pour ouvrir le tiroir de navigation.
export function TopBar({ role, centreName, onOpenMobileNav }: TopBarProps) {
  return (
    <header className="border-brand-gray/20 fixed top-0 right-0 left-0 z-30 flex h-20 items-center justify-between border-b bg-white px-4 md:left-64 md:px-8">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Bouton Hamburger sur mobile */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs transition hover:bg-slate-100 active:scale-95 md:hidden"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu size={22} />
        </button>

        {/* Logo textuel miniature sur mobile */}
        <span className="text-brand-orange text-sm font-black tracking-tight select-none md:hidden">
          EXCELIS
        </span>

        {/* Badge Rôle + Centre */}
        <button
          type="button"
          className="border-brand-gray/20 text-brand-anthracite flex max-w-[170px] sm:max-w-none items-center gap-1.5 sm:gap-2 rounded-full border bg-white px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold truncate"
        >
          <MapPin size={13} className="text-brand-orange shrink-0" />
          <span className="truncate">
            {ROLE_LABELS[role]}
            {centreName ? ` - ${centreName}` : ""}
          </span>
          <ChevronDown size={13} className="shrink-0 text-slate-400" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="text-brand-gray hover:bg-brand-gray/10 rounded-full p-2 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <button
          type="button"
          className="text-brand-gray hover:bg-brand-gray/10 rounded-full p-2 transition-colors"
          aria-label="Compte"
        >
          <UserCircle size={20} />
        </button>
      </div>
    </header>
  );
}
