import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MapPin,
  CalendarClock,
  Wallet,
  Settings,
  BarChart3,
  CalendarRange,
  Banknote,
  Archive,
  Users,
  UserPlus,
  FolderOpen,
  ClipboardCheck,
  Building2,
  ClipboardList,
  UserRound,
  TrendingUp,
  GraduationCap,
  BookOpen,
} from "lucide-react";

import type { Role } from "@/types/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_DIRECTEUR: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: CalendarRange },
  { href: "/centres", label: "Centres", icon: MapPin },
  { href: "/departements", label: "Départements", icon: Building2 },
  { href: "/planification", label: "Planification", icon: CalendarClock },
  { href: "/concours-blancs", label: "Concours blancs", icon: ClipboardList },
  { href: "/finances", label: "Finances", icon: Wallet },
  { href: "/livres", label: "Livres & Supports", icon: BookOpen },
  { href: "/paie", label: "Paie", icon: Banknote },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

const NAV_PAR_DEFAUT: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
];

const NAV_CHEF_CENTRE: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mon-centre", label: "Mon centre", icon: MapPin },
  { href: "/inscription", label: "Inscription", icon: UserPlus },
  { href: "/apprenants", label: "Apprenants", icon: Users },
  { href: "/planification", label: "Planification", icon: CalendarClock },
  { href: "/concours-blancs", label: "Concours blancs", icon: ClipboardList },
  { href: "/dossiers", label: "Dossiers", icon: FolderOpen },
  { href: "/finances", label: "Finances", icon: Wallet },
  { href: "/livres", label: "Livres & Supports", icon: BookOpen },
  {
    href: "/bilan-journalier",
    label: "Bilan Journalier",
    icon: ClipboardCheck,
  },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

const NAV_DIRECTEUR_ACADEMIQUE: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/centres", label: "Centres", icon: MapPin },
  { href: "/departements", label: "Départements", icon: Building2 },
  { href: "/formations", label: "Formations", icon: GraduationCap },
  { href: "/enseignants", label: "Enseignants", icon: UserRound },
  { href: "/planification", label: "Planification", icon: CalendarClock },
  { href: "/progression", label: "Progression", icon: TrendingUp },
  { href: "/concours-blancs", label: "Concours blancs", icon: ClipboardList },
  { href: "/livres", label: "Livres & Supports", icon: BookOpen },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

const NAV_CHEF_DEPARTEMENT: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/enseignants", label: "Enseignants", icon: UserRound },
  { href: "/planification", label: "Planification", icon: CalendarClock },
  { href: "/progression", label: "Progression", icon: TrendingUp },
  { href: "/concours-blancs", label: "Concours blancs", icon: ClipboardList },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

const NAV_COMPTABLE: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/finances", label: "Finances", icon: Wallet },
  {
    href: "/bilan-journalier",
    label: "Bilan Journalier",
    icon: ClipboardCheck,
  },
  { href: "/paie", label: "Paie", icon: Banknote },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
];

const NAV_CAISSIER: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/finances", label: "Finances", icon: Wallet },
  {
    href: "/bilan-journalier",
    label: "Bilan Journalier",
    icon: ClipboardCheck,
  },
  { href: "/paie", label: "Paie", icon: Banknote },
];

const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  DIRECTEUR: NAV_DIRECTEUR,
  DIRECTEUR_ACADEMIQUE: NAV_DIRECTEUR_ACADEMIQUE,
  CHEF_CENTRE: NAV_CHEF_CENTRE,
  CHEF_DEPARTEMENT: NAV_CHEF_DEPARTEMENT,
  CHARGE_DOSSIER: NAV_PAR_DEFAUT,
  SUPERVISEUR_DOSSIERS: NAV_PAR_DEFAUT,
  CAISSIER: NAV_CAISSIER,
  COMPTABLE: NAV_COMPTABLE,
};

export function getNavItems(role: Role): NavItem[] {
  return NAV_ITEMS_BY_ROLE[role];
}
