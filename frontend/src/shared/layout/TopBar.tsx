"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/shared/ui";
import {
  Bell,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  User,
} from "lucide-react";

import { ROLE_LABELS, type Role } from "@/types/roles";

type TopBarProps = {
  role: Role;
  centreName?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileNav?: () => void;
};

function getTitreSection(pathname: string): string {
  if (pathname.startsWith("/apprenants")) return "Gestion des Apprenants";
  if (pathname.startsWith("/dossiers")) return "Dossiers de Concours";
  if (pathname.startsWith("/personnel") || pathname.startsWith("/personnels")) return "Personnel Administratif";
  if (pathname.startsWith("/enseignants")) return "Corps Enseignant";
  if (pathname.startsWith("/finances")) return "Gestion Financière";
  if (pathname.startsWith("/bilan-journalier")) return "Bilan Journalier de Caisse";
  if (pathname.startsWith("/paie")) return "Gestion de la Paie";
  if (pathname.startsWith("/concours-blancs")) return "Concours Blancs & Épreuves";
  if (pathname.startsWith("/progression")) return "Progression Pédagogique";
  if (pathname.startsWith("/livres")) return "Gestion des Livres";
  if (pathname.startsWith("/centres")) return "Centres & Infrastructures";
  if (pathname.startsWith("/formations")) return "Offre de Formations";
  if (pathname.startsWith("/departements")) return "Départements Académiques";
  if (pathname.startsWith("/sessions")) return "Sessions & Phases";
  if (pathname.startsWith("/audit")) return "Journal d'Audit";
  if (pathname.startsWith("/mon-centre")) return "Mon Centre";
  if (pathname.startsWith("/inscription")) return "Nouvelle Inscription";
  if (pathname.startsWith("/planification")) return "Planification des Cours";
  return "Navigation";
}

// Barre supérieure professionnelle EXCELIS PRÉPAS
// Style moderne SaaS inspiré des principes de navigation fluide :
// - Hauteur affinée (64px)
// - Affichage du logo officiel sur mobile
// - Commande unique de réduction/expansion de la navigation latérale
// - Recherche transversale active sur le dashboard, contextualisation sur les autres pages
// - Badge institutionnel rôle & centre en bleu pourpre #2D2E80
// - Alignement rigoureux garantissant l'absence de vide visuel
export function TopBar({
  role,
  centreName,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenMobileNav,
}: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/";
  const [rechercheGlobale, setRechercheGlobale] = useState("");

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rechercheGlobale.trim()) {
      router.push(`/apprenants?recherche=${encodeURIComponent(rechercheGlobale.trim())}`);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-all duration-300 ease-in-out md:px-6 ${
        isSidebarCollapsed ? "md:left-20" : "md:left-64"
      }`}
    >
      {/* Côté gauche : Basculeurs de navigation & Contexte / Recherche transversale */}
      <div className="flex items-center gap-3">
        {/* Bouton Hamburger sur mobile */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs transition hover:bg-slate-100 active:scale-95 md:hidden"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu size={20} />
        </button>

        {/* Logo officiel complet sur mobile */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <Logo className="h-7 w-auto object-contain" priority />
        </Link>

        {/* Bouton Desktop UNIQUE pour réduire/agrandir la Sidebar */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 text-slate-600 shadow-2xs transition-colors hover:bg-slate-100 hover:text-brand-anthracite md:flex cursor-pointer"
            title={
              isSidebarCollapsed
                ? "Déplier la barre latérale"
                : "Replier la barre latérale"
            }
            aria-label="Contrôle de la barre latérale"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}

        {/* Recherche transversale sur le Dashboard UNIQUEMENT */}
        {isDashboard ? (
          <form onSubmit={handleGlobalSearchSubmit} className="relative hidden lg:block">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={rechercheGlobale}
              onChange={(e) => setRechercheGlobale(e.target.value)}
              placeholder="Recherche rapide... (apprenant, matricule)"
              className="h-9 w-64 rounded-xl border border-slate-200/90 bg-slate-50/60 pl-9 pr-3 text-xs text-brand-anthracite placeholder:text-slate-400 transition-all duration-150 focus:w-80 focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15 focus:outline-none"
            />
          </form>
        ) : (
          /* Indicateur de contexte pour équilibrer le header sur toutes les autres pages sans vide */
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Accueil</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800 tracking-tight">
              {getTitreSection(pathname)}
            </span>
          </div>
        )}
      </div>

      {/* Côté droit : Badge Rôle/Centre, Notifications & Profil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Badge Institutionnel Rôle & Centre - Bleu pourpre officiel #2D2E80 */}
        <div className="flex max-w-[180px] sm:max-w-none items-center gap-2 rounded-xl border border-[#2D2E80]/20 bg-[#2D2E80]/5 px-3 py-1.5 text-xs font-semibold text-[#2D2E80]">
          <span className="flex h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
          <span className="truncate">
            {ROLE_LABELS[role]}
            {centreName ? ` • ${centreName}` : ""}
          </span>
          {centreName && (
            <MapPin size={12} className="shrink-0 text-brand-orange hidden sm:inline" />
          )}
        </div>

        {/* Bouton Notifications avec voyant */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-brand-anthracite cursor-pointer"
          aria-label="Centre de notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-orange ring-2 ring-white" />
        </button>

        {/* Profil utilisateur connecté */}
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D2E80] text-white shadow-xs font-bold text-xs">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
}
