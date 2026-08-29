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
    GraduationCap,
    UserPlus,
    DoorOpen,
    FolderOpen,
    ClipboardCheck,
    Building2,
    ClipboardList,
    UserRound,
} from "lucide-react";

import type { Role } from "@/types/roles";


export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon
}

const NAV_DIRECTEUR: NavItem[] = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/centres", label: "Centres", icon: MapPin },
    { href: "/planification", label: "Planification", icon: CalendarClock },
    { href: "/finances", label: "Finances", icon: Wallet },
    { href: "/paie", label: "Paie", icon: Banknote },
    { href: "/archive", label: "Archive", icon: Archive },
    { href: "/sessions", label: "Sessions", icon: CalendarRange },
    { href: "/rapports", label: "Rapports", icon: BarChart3 },
    { href: "/parametres", label: "Paramètres", icon: Settings },
]

const NAV_PAR_DEFAUT: NavItem[] = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
];



const NAV_CHEF_CENTRE: NavItem[] = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/inscription", label: "Inscription", icon: UserPlus },
    { href: "/formations", label: "Formations", icon: GraduationCap },
    { href: "/salles", label: "Salles", icon: DoorOpen },
    { href: "/apprenants", label: "Apprenants", icon: Users },
    { href: "/planification", label: "Planification", icon: CalendarClock },
    { href: "/finances", label: "Finances", icon: Wallet },
    { href: "/bilan-journalier", label: "Bilan Journalier", icon: ClipboardCheck },
    { href: "/dossiers", label: "Dossiers", icon: FolderOpen },
    { href: "/rapports", label: "Rapports", icon: BarChart3 },
    { href: "/parametres", label: "Paramètres", icon: Settings },

];

// Maquette Directeur Académique (Stitch) — troisième maquette confirmée.
const NAV_DIRECTEUR_ACADEMIQUE: NavItem[] = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/enseignants", label: "Enseignants", icon: UserRound },
    { href: "/departements", label: "Départements", icon: Building2 },
    { href: "/planification", label: "Planification", icon: CalendarClock },
    { href: "/concours-blancs", label: "Concours blancs", icon: ClipboardList },
    { href: "/progressions", label: "Progressions", icon: Wallet },
    { href: "/parametres", label: "Paramètres", icon: Settings },
    { href: "/rapports", label: "Rapports", icon: BarChart3 },
];

const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
    DIRECTEUR: NAV_DIRECTEUR,
    DIRECTEUR_ACADEMIQUE: NAV_DIRECTEUR_ACADEMIQUE,
    CHEF_CENTRE: NAV_CHEF_CENTRE,
    CHEF_DEPARTEMENT: NAV_PAR_DEFAUT,
    CHARGE_DOSSIER: NAV_PAR_DEFAUT,
    SUPERVISEUR_DOSSIERS: NAV_PAR_DEFAUT,
    CAISSIER: NAV_PAR_DEFAUT,
    COMPTABLE: NAV_PAR_DEFAUT,
};

export function getNavItems(role: Role): NavItem[] {
    return NAV_ITEMS_BY_ROLE[role];
}