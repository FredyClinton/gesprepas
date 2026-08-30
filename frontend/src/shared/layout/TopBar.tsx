"use client";

import { Bell, MapPin, ChevronDown, UserCircle } from "lucide-react";

import { ROLE_LABELS, type Role } from "@/types/roles";

type TopBarProps = {
  role: Role;
  // Nom du centre déjà résolu par (dashboard)/layout.tsx (Server Component) —
  // absent pour les rôles non centre-scope (Directeur...).
  centreName?: string;
};

// Barre fine du haut — commune à tous les écrans, peu importe le rôle. Version
// confirmée par la maquette Chef de Centre : pas de barre de recherche (contrairement
// à la première version, basée sur la maquette Directeur), badge rôle+centre à gauche.
export function TopBar({ role, centreName }: TopBarProps) {
  return (
    <header className="border-brand-gray/20 fixed top-0 right-0 left-0 z-30 flex h-20 items-center justify-between border-b bg-white px-4 md:left-64 md:px-8">
      <button
        type="button"
        className="border-brand-gray/20 text-brand-anthracite flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold"
      >
        <MapPin size={14} className="text-brand-orange" />
        {ROLE_LABELS[role]}
        {centreName ? ` — ${centreName}` : ""}
        <ChevronDown size={14} />
      </button>

      <div className="flex items-center gap-4">
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
