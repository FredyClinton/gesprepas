"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import type { Role } from "@/types/roles";
import { Logo, LogoEmblem } from "@/shared/ui";
import { getNavItems } from "./nav-items";

interface SidebarProps {
  role: Role;
  isCollapsed?: boolean;
}

// Navigation latérale desktop EXCELIS PRÉPAS
// Identité officielle : Fond gris anthracite (#1A1A1A), accents Orange (#F7931E)
// et Bleu pourpre institutionnel (#2D2E80).
// Supporte l'état réduit / étendu avec transitions douces.
export function Sidebar({
  role,
  isCollapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const navBarItems = getNavItems(role);

  return (
    <aside
      className={`bg-brand-anthracite fixed top-0 left-0 z-40 hidden h-full flex-col border-r border-white/5 transition-all duration-300 ease-in-out md:flex ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      aria-label="Navigation principale"
    >
      {/* En-tête de la Sidebar avec le Logo officiel EXCELIS PRÉPAS */}
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        {isCollapsed ? (
          <Link
            href="/"
            className="mx-auto flex items-center justify-center transition-transform hover:scale-105"
            title="EXCELIS PRÉPAS - Tableau de bord"
          >
            <LogoEmblem
              variant="white"
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-95"
            title="EXCELIS PRÉPAS - Accueil"
          >
            <Logo
              variant="white"
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
        )}
      </div>

      {/* Liste des rubriques de navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navBarItems.map(({ href, label, icon: Icon }) => {
          const actif =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl transition-all duration-150 ${
                isCollapsed
                  ? "justify-center p-3"
                  : "px-3.5 py-2.5 text-sm font-medium"
              } ${
                actif
                  ? "bg-brand-orange text-white font-semibold shadow-xs shadow-brand-orange/20"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={actif ? 2.3 : 1.9}
                className={`shrink-0 transition-transform duration-150 ${
                  actif ? "text-white" : "text-white/80 group-hover:text-white group-hover:scale-105"
                }`}
              />

              {!isCollapsed && <span className="truncate">{label}</span>}

              {/* Tooltip flottant lorsque la barre latérale est réduite */}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-brand-anthracite px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-lg ring-1 ring-white/15 group-hover:block z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pied de la Sidebar */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Se déconnecter"
          className={`flex w-full items-center rounded-xl text-white/70 transition-all hover:bg-rose-500/20 hover:text-rose-300 ${
            isCollapsed
              ? "justify-center p-2.5"
              : "justify-center gap-2 px-3 py-2.5 text-sm font-semibold"
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
