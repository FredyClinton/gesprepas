"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import type { Role } from "@/types/roles";

import { getNavItems } from "./nav-items";

// Navigation latérale desktop. Fond anthracite conforme à la charte
// ("navigation, en-têtes"). Client Component : usePathname() (savoir quel onglet est
// actif) n'existe que côté navigateur. `role` est transmis par (dashboard)/layout.tsx,
// qui l'a déjà via auth() côté serveur — pas de deuxième appel réseau ici.
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const navBarItems = getNavItems(role);

  return (
    <aside className="bg-brand-anthracite fixed top-0 left-0 hidden h-full w-64 flex-col py-4 md:flex">
      <div className="px-4 pb-6">
        <h1 className="text-brand-orange text-xl font-bold">EXCELIS PRÉPAS</h1>
        <p className="text-brand-white/60 mt-1 text-xs font-bold tracking-widest uppercase">
          ERP Gesprepas
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {navBarItems.map(({ href, label, icon: Icon }) => {
          const actif =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition-colors ${
                actif
                  ? "bg-brand-orange text-brand-white"
                  : "text-brand-white/70 hover:bg-brand-white/5 hover:text-brand-white"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-brand-white/10 mt-auto border-t px-4 pt-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-brand-white/70 hover:text-brand-white flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
