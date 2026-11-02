"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  CalendarRange,
  Layers,
  Building2,
  Mail,
  Phone,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  UserX,
  GraduationCap,
  Briefcase,
  Lock,
  Unlock,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Key,
  UserPlus,
} from "lucide-react";

import {
  Card,
  Pagination,
  Modal,
  SkeletonCard,
  SkeletonTable,
  SortableHeader,
} from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { compareStrings, type SortDirection } from "@/shared/lib/sort-utils";
import {
  usePersonnelList,
  useEnseignants,
  useAccesPersonnelList,
  useGererAccesPersonnel,
  CreerPersonnelModal,
  ModifierPersonnelModal,
  GestionCompteModal,
  SupprimerPersonnelModal,
  type PersonnelMembre,
  type StatutAcces,
} from "@/modules/personnel";
import { useUtilisateurs, type Utilisateur } from "@/modules/utilisateurs";
import { useSessions, useSessionActive, useCentres } from "@/modules/centres-sessions";
import { usePhases, type Phase } from "@/modules/academique";
import { ROLE_LABELS, type Role } from "@/types/roles";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-orange-100 text-orange-700 border-orange-200",
];

function getAvatarStyles(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(prenom?: string, nom?: string) {
  const p = prenom?.trim().charAt(0) ?? "";
  const n = nom?.trim().charAt(0) ?? "";
  return `${p}${n}`.toUpperCase() || "EP";
}

type PersonnelFusionne = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  numeroCni: string | null;
  utilisateur?: Utilisateur;
  rolePrincipal?: Role | "MEMBRE";
  centreId?: string | null;
  hasUserAccount: boolean;
};

export function PersonnelListView() {
  // Données de base
  const { data: personnelList = [], isLoading: chargementPersonnel } = usePersonnelList();
  const { data: utilisateurs = [], isLoading: chargementUtilisateurs } = useUtilisateurs();
  const { data: enseignants = [], isLoading: chargementEnseignants } = useEnseignants();
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive } = useSessionActive();
  const { data: phases = [] } = usePhases();
  const { data: centres = [] } = useCentres();

  // Session & Phase sélectionnées pour le contrôle d'accès
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<string>("");
  const [phaseIdSelectionnee, setPhaseIdSelectionnee] = useState<string>("TOUTES");

  const effectiveSessionId = useMemo(() => {
    return sessionIdSelectionnee || sessionActive?.id || sessions[0]?.id || "";
  }, [sessionIdSelectionnee, sessionActive, sessions]);

  const effectivePhaseId = phaseIdSelectionnee === "TOUTES" ? null : phaseIdSelectionnee;

  // Accès pour la session / phase courante
  const { data: accesList = [], isLoading: chargementAcces } = useAccesPersonnelList(
    effectiveSessionId,
    effectivePhaseId,
  );

  const gererAccesMutation = useGererAccesPersonnel();

  // Filtres UI
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState<string>("TOUS");
  const [filtreStatutAcces, setFiltreStatutAcces] = useState<"TOUS" | "ACCORDE" | "BLOQUE">("TOUS");
  const [filtreCentre, setFiltreCentre] = useState<string>("TOUS");

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const elementsParPage = 10;

  // Tri
  type ColonneTriPersonnel = "collaborateur" | "role" | "centre" | "statutAcces";
  const [triColonne, setTriColonne] = useState<ColonneTriPersonnel>("collaborateur");
  const [triDirection, setTriDirection] = useState<SortDirection>("asc");

  function handleTri(colonne: ColonneTriPersonnel) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
    setPageCourante(1);
  }

  // Modale de modification d'accès
  const [membreCible, setMembreCible] = useState<PersonnelFusionne | null>(null);
  const [statutCible, setStatutCible] = useState<StatutAcces>("ACCORDE");
  const [motifSaisi, setMotifSaisi] = useState("");
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  // Modales CRUD Personnel & Comptes
  const [modalCreerOuvert, setModalCreerOuvert] = useState(false);
  const [membrePourModif, setMembrePourModif] = useState<PersonnelFusionne | null>(null);
  const [membrePourCompte, setMembrePourCompte] = useState<PersonnelFusionne | null>(null);
  const [membrePourSuppr, setMembrePourSuppr] = useState<PersonnelFusionne | null>(null);

  // Map des accès pour lookup instantané
  const mapAcces = useMemo(() => {
    const map = new Map<string, (typeof accesList)[0]>();
    accesList.forEach((a) => {
      map.set(a.personnelId, a);
    });
    return map;
  }, [accesList]);

  // Map des centres
  const mapCentres = useMemo(() => {
    const map = new Map<string, string>();
    centres.forEach((c) => map.set(c.id, c.nom));
    return map;
  }, [centres]);

  // Consolidation de l'annuaire du personnel non-enseignant
  const personnelConsolide = useMemo(() => {
    const enseignantIds = new Set(enseignants.map((e) => e.id));
    const map = new Map<string, PersonnelFusionne>();

    // 1. Base Personnel (en excluant formellement tous les enseignants)
    personnelList
      .filter((p) => !enseignantIds.has(p.id))
      .forEach((p) => {
        map.set(p.id, {
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          email: p.email ?? null,
          telephone: p.telephone ?? null,
          numeroCni: p.numeroCni ?? null,
          hasUserAccount: false,
          rolePrincipal: "MEMBRE",
        });
      });

    // 2. Fusion Utilisateurs (personnel ayant un compte applicatif de connexion)
    utilisateurs
      .filter((u) => !enseignantIds.has(u.id))
      .forEach((u) => {
        const existant = map.get(u.id);
        if (existant) {
          existant.utilisateur = u;
          existant.hasUserAccount = true;
          existant.rolePrincipal = u.role;
          existant.centreId = u.centreId;
          if (!existant.email && u.email) existant.email = u.email;
          if (!existant.telephone && u.telephone) existant.telephone = u.telephone;
        } else {
          map.set(u.id, {
            id: u.id,
            nom: u.nom,
            prenom: u.prenom,
            email: u.email,
            telephone: u.telephone ?? null,
            numeroCni: u.numeroCni ?? null,
            utilisateur: u,
            hasUserAccount: true,
            rolePrincipal: u.role,
            centreId: u.centreId,
          });
        }
      });

    return Array.from(map.values());
  }, [personnelList, utilisateurs, enseignants]);

  // Filtrage et Tri
  const membresFiltres = useMemo(() => {
    const filtres = personnelConsolide.filter((m) => {
      // Recherche
      if (recherche.trim()) {
        const query = recherche.trim().toLowerCase();
        const nomComplet = `${m.prenom} ${m.nom}`.toLowerCase();
        const email = m.email?.toLowerCase() ?? "";
        const tel = m.telephone?.toLowerCase() ?? "";
        if (!nomComplet.includes(query) && !email.includes(query) && !tel.includes(query)) {
          return false;
        }
      }

      // Rôle
      if (filtreRole !== "TOUS") {
        if (filtreRole === "SANS_COMPTE" && m.hasUserAccount) return false;
        if (filtreRole !== "SANS_COMPTE" && m.rolePrincipal !== filtreRole) return false;
      }

      // Centre
      if (filtreCentre !== "TOUS") {
        if (m.centreId !== filtreCentre) return false;
      }

      // Statut d'accès
      if (filtreStatutAcces !== "TOUS") {
        if (!m.hasUserAccount) return false;
        const acces = mapAcces.get(m.id);
        const statut = acces ? acces.statut : "ACCORDE"; // Accordé par défaut sauf si bloqué explicitement
        if (statut !== filtreStatutAcces) return false;
      }

      return true;
    });

    return [...filtres].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "collaborateur") {
        cmp = compareStrings(`${a.nom} ${a.prenom}`, `${b.nom} ${b.prenom}`);
      } else if (triColonne === "role") {
        cmp = compareStrings(a.rolePrincipal, b.rolePrincipal);
      } else if (triColonne === "centre") {
        const nomA = a.centreId ? mapCentres.get(a.centreId) || "" : "";
        const nomB = b.centreId ? mapCentres.get(b.centreId) || "" : "";
        cmp = compareStrings(nomA, nomB);
      } else if (triColonne === "statutAcces") {
        const statA = !a.hasUserAccount ? "Z_SANS" : (mapAcces.get(a.id)?.statut ?? "ACCORDE");
        const statB = !b.hasUserAccount ? "Z_SANS" : (mapAcces.get(b.id)?.statut ?? "ACCORDE");
        cmp = compareStrings(statA, statB);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [
    personnelConsolide,
    recherche,
    filtreRole,
    filtreCentre,
    filtreStatutAcces,
    mapAcces,
    triColonne,
    triDirection,
    mapCentres,
  ]);

  // Pagination
  const totalPages = Math.ceil(membresFiltres.length / elementsParPage) || 1;
  const membresPageCourante = useMemo(() => {
    const debut = (pageCourante - 1) * elementsParPage;
    return membresFiltres.slice(debut, debut + elementsParPage);
  }, [membresFiltres, pageCourante, elementsParPage]);

  // KPIs
  const stats = useMemo(() => {
    const total = personnelConsolide.length;
    const comptes = personnelConsolide.filter((m) => m.hasUserAccount).length;
    const centresSet = new Set(
      personnelConsolide
        .map((m) => m.centreId)
        .filter((cid): cid is string => Boolean(cid)),
    );
    const centresCouverts = centresSet.size;

    let accordes = 0;
    let bloques = 0;
    personnelConsolide.forEach((m) => {
      if (!m.hasUserAccount) return;
      const a = mapAcces.get(m.id);
      if (a && a.statut === "BLOQUE") {
        bloques++;
      } else {
        accordes++;
      }
    });

    return { total, comptes, centresCouverts, accordes, bloques };
  }, [personnelConsolide, mapAcces]);

  // Ouverture modale pour accorder ou bloquer (comptes utilisateurs uniquement, hors Directeur)
  const handleOuvrirGestionAcces = (membre: PersonnelFusionne, nouveauStatut: StatutAcces) => {
    if (!membre.hasUserAccount || membre.utilisateur?.role === "DIRECTEUR") return;
    const accesExistant = mapAcces.get(membre.id);
    setMembreCible(membre);
    setStatutCible(nouveauStatut);
    setMotifSaisi(accesExistant?.motif ?? "");
    setErreurAction(null);
  };

  const handleConfirmerAcces = async () => {
    if (!membreCible || !effectiveSessionId) return;
    setErreurAction(null);
    try {
      await gererAccesMutation.mutateAsync({
        personnelId: membreCible.id,
        input: {
          sessionId: effectiveSessionId,
          phaseId: effectivePhaseId,
          statut: statutCible,
          motif: motifSaisi.trim() || undefined,
        },
      });
      setMembreCible(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const chargementInitial =
    chargementPersonnel && chargementUtilisateurs && chargementEnseignants;

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── En-tête Sobre & Compact ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Gestion du Personnel & Accès
          </h1>
          <p className="text-xs text-slate-500">
            Annuaire des collaborateurs, habilitations applicatives et contrôle par session & phase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de Contexte Temporel */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs">
            <CalendarRange size={13} className="text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">Session :</span>
            <select
              value={effectiveSessionId}
              onChange={(e) => {
                setSessionIdSelectionnee(e.target.value);
                setPageCourante(1);
              }}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.annee} {s.statut === "EN_COURS" ? "(Active)" : `(${s.statut})`}
                </option>
              ))}
            </select>

            <span className="text-slate-200">|</span>

            <Layers size={13} className="text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">Phase :</span>
            <select
              value={phaseIdSelectionnee}
              onChange={(e) => {
                setPhaseIdSelectionnee(e.target.value);
                setPageCourante(1);
              }}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="TOUTES">Toutes les phases</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.libelle}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setModalCreerOuvert(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Nouveau Collaborateur</span>
          </button>
        </div>
      </div>

      {/* ── Synthèse Métier ERP Sobre ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-3 sm:gap-0 text-xs">
          <div className="sm:px-3 first:pl-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Effectif Total
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-xs text-slate-400">collaborateurs</span>
            </div>
          </div>

          <div className="sm:px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Comptes Utilisateurs
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{stats.comptes}</span>
              <span className="text-xs text-slate-400">avec accès logiciel</span>
            </div>
          </div>

          <div className="sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Réseau de Centres
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{stats.centresCouverts}</span>
              <span className="text-xs text-slate-400">centres pourvus</span>
            </div>
          </div>

          <div className="sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Habilitations (Session)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-700">{stats.accordes}</span>
              <span className="text-xs text-slate-400">actifs</span>
              {stats.bloques > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-bold text-rose-600">{stats.bloques} bloqués</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de recherche et filtres ── */}
      <Card className="p-4 border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPageCourante(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtre Rôle */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Rôle :</span>
            </div>
            <select
              value={filtreRole}
              onChange={(e) => {
                setFiltreRole(e.target.value);
                setPageCourante(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-orange"
            >
              <option value="TOUS">Tous les rôles administratifs</option>
              <option value="DIRECTEUR">Directeur</option>
              <option value="DIRECTEUR_ACADEMIQUE">Directeur Académique</option>
              <option value="CHEF_CENTRE">Chef de centre</option>
              <option value="CHEF_DEPARTEMENT">Chef de département</option>
              <option value="COMPTABLE">Contrôleur financier</option>
              <option value="CAISSIER">Caissier</option>
              <option value="CHARGE_DOSSIER">Chargé de dossier</option>
              <option value="SUPERVISEUR_DOSSIERS">Superviseur des dossiers</option>
              <option value="SANS_COMPTE">Sans compte utilisateur</option>
            </select>

            {/* Filtre Centre */}
            <select
              value={filtreCentre}
              onChange={(e) => {
                setFiltreCentre(e.target.value);
                setPageCourante(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-orange"
            >
              <option value="TOUS">Tous les centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>

            {/* Filtre Statut d'accès */}
            <select
              value={filtreStatutAcces}
              onChange={(e) => {
                setFiltreStatutAcces(e.target.value as "TOUS" | "ACCORDE" | "BLOQUE");
                setPageCourante(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TOUS">Tous statuts d&apos;accès</option>
              <option value="ACCORDE">Accès accordé</option>
              <option value="BLOQUE">Accès bloqué</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Tableau du personnel ── */}
      <Card className="border-slate-200/80 bg-white overflow-hidden shadow-xs">
        {chargementInitial || chargementAcces ? (
          <div className="p-6">
            <SkeletonTable rows={7} />
          </div>
        ) : membresPageCourante.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Aucun membre trouvé</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Aucun collaborateur ne correspond aux critères de recherche ou aux filtres sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <SortableHeader
                    columnKey="collaborateur"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Collaborateur
                  </SortableHeader>
                  <SortableHeader
                    columnKey="role"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Rôle / Fonction
                  </SortableHeader>
                  <SortableHeader
                    columnKey="centre"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="py-3.5 px-4"
                  >
                    Centre de rattachement
                  </SortableHeader>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Coordonnées
                  </th>
                  <SortableHeader
                    columnKey="statutAcces"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    align="center"
                    className="py-3.5 px-4 text-center"
                  >
                    Statut Accès
                  </SortableHeader>
                  <th className="py-3.5 px-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions Direction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membresPageCourante.map((membre) => {
                  const acces = mapAcces.get(membre.id);
                  const estBloque = acces?.statut === "BLOQUE";
                  const avatarClasses = getAvatarStyles(membre.nom + membre.prenom);
                  const nomCentre = membre.centreId ? mapCentres.get(membre.centreId) : null;

                  return (
                    <tr
                      key={membre.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        estBloque ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Collaborateur */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${avatarClasses}`}
                          >
                            {getInitials(membre.prenom, membre.nom)}
                          </div>
                          <div>
                            <Link
                              href={`/personnel/${membre.id}`}
                              className="font-semibold text-slate-900 hover:text-brand-orange transition-colors block"
                            >
                              {membre.prenom} {membre.nom}
                            </Link>
                            <span className="text-xs text-slate-400">
                              ID: {membre.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {membre.utilisateur ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                              {ROLE_LABELS[membre.utilisateur.role] || membre.utilisateur.role}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Personnel administratif (Sans compte)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Centre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{nomCentre || "National / Tous centres"}</span>
                        </div>
                      </td>

                      {/* Coordonnées */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          {membre.email && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{membre.email}</span>
                            </div>
                          )}
                          {membre.telephone && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{membre.telephone}</span>
                            </div>
                          )}
                          {!membre.email && !membre.telephone && (
                            <span className="text-slate-400 italic">Non renseigné</span>
                          )}
                        </div>
                      </td>

                      {/* Statut d'accès */}
                      <td className="py-3.5 px-4 text-center">
                        {!membre.hasUserAccount ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Sans compte utilisateur
                          </span>
                        ) : membre.utilisateur?.role === "DIRECTEUR" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Accès Permanent (Directeur)
                          </span>
                        ) : estBloque ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              Accès Bloqué
                            </span>
                            {acces?.motif && (
                              <span
                                className="text-[11px] text-rose-600 font-medium truncate max-w-[140px] mt-1"
                                title={acces.motif}
                              >
                                {acces.motif}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Accès Accordé
                          </span>
                        )}
                      </td>

                      {/* Actions Direction */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Voir la fiche détaillée */}
                          <Link
                            href={`/personnel/${membre.id}`}
                            title="Consulter la fiche détaillée"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span className="sr-only sm:not-sr-only sm:ml-0.5">Fiche</span>
                          </Link>

                          {/* 2. Modifier les coordonnées RH */}
                          <button
                            type="button"
                            onClick={() => setMembrePourModif(membre)}
                            title="Modifier les coordonnées RH"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-600 hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            <span className="sr-only sm:not-sr-only sm:ml-0.5">Modifier</span>
                          </button>

                          {/* 3. Gérer le compte applicatif */}
                          <button
                            type="button"
                            onClick={() => setMembrePourCompte(membre)}
                            title={membre.hasUserAccount ? "Paramètres du compte utilisateur" : "Créer un compte d'accès"}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                              membre.hasUserAccount
                                ? "text-purple-700 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/60"
                                : "text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-dashed border-slate-300"
                            }`}
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span className="sr-only sm:not-sr-only sm:ml-0.5">
                              {membre.hasUserAccount ? "Compte" : "+ Compte"}
                            </span>
                          </button>

                          {/* 4. Toggle Accorder / Bloquer UNIQUEMENT pour les comptes utilisateurs hors Directeur */}
                          {!membre.hasUserAccount ? null : membre.utilisateur?.role === "DIRECTEUR" ? (
                            <span className="text-[11px] text-amber-600 font-medium px-1">
                              Protégé
                            </span>
                          ) : estBloque ? (
                            <button
                              type="button"
                              onClick={() => handleOuvrirGestionAcces(membre, "ACCORDE")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border text-emerald-700 bg-white border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-2xs"
                              title="Débloquer l'accès pour cette session/phase"
                            >
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="sr-only sm:not-sr-only sm:ml-0.5">Débloquer</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOuvrirGestionAcces(membre, "BLOQUE")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border text-rose-700 bg-white border-rose-300 hover:bg-rose-50 hover:border-rose-400 transition-colors shadow-2xs"
                              title="Bloquer l'accès pour cette session/phase"
                            >
                              <Lock className="w-3.5 h-3.5 text-rose-600" />
                              <span className="sr-only sm:not-sr-only sm:ml-0.5">Bloquer</span>
                            </button>
                          )}

                          {/* 5. Supprimer le collaborateur */}
                          <button
                            type="button"
                            onClick={() => setMembrePourSuppr(membre)}
                            title="Supprimer définitivement ce collaborateur"
                            className="inline-flex items-center p-1.5 text-xs font-medium rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={pageCourante}
            totalPages={totalPages}
            onChange={setPageCourante}
            totalItems={membresFiltres.length}
            pageSize={elementsParPage}
            label="collaborateur"
          />
        )}
      </Card>

      {/* ── Modale de Confirmation Accorder / Bloquer Accès ── */}
      {membreCible && (
        <Modal
          isOpen={Boolean(membreCible)}
          onClose={() => setMembreCible(null)}
          title={
            statutCible === "BLOQUE"
              ? "Bloquer l'accès d'un collaborateur"
              : "Accorder l'accès d'un collaborateur"
          }
        >
          <div className="space-y-4 pt-1">
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                statutCible === "BLOQUE"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              {statutCible === "BLOQUE" ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-semibold">
                  {statutCible === "BLOQUE" ? "Blocage de l'accès" : "Réactivation / Attribution de l'accès"}
                </p>
                <p className="text-xs mt-0.5 opacity-90">
                  Collaborateur :{" "}
                  <strong>
                    {membreCible.prenom} {membreCible.nom}
                  </strong>
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  Périmètre : Session {sessions.find((s) => s.id === effectiveSessionId)?.annee || "en cours"}
                  {effectivePhaseId
                    ? ` • Phase ${phases.find((p) => p.id === effectivePhaseId)?.code || ""}`
                    : " (Toutes phases confondues)"}
                </p>
              </div>
            </div>

            {erreurAction && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{erreurAction}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Motif ou commentaire de la décision (optionnel) :
              </label>
              <textarea
                value={motifSaisi}
                onChange={(e) => setMotifSaisi(e.target.value)}
                placeholder={
                  statutCible === "BLOQUE"
                    ? "Ex: Congé sabbatique, suspension administrative, fin de contrat..."
                    : "Ex: Reprise d'activité, réintégration validée par la direction..."
                }
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMembreCible(null)}
                disabled={gererAccesMutation.isPending}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmerAcces}
                disabled={gererAccesMutation.isPending}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-2xs transition-all min-w-[120px] ${
                  statutCible === "BLOQUE"
                    ? "bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                    : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                }`}
              >
                {gererAccesMutation.isPending
                  ? "Enregistrement..."
                  : statutCible === "BLOQUE"
                  ? "Confirmer le blocage"
                  : "Accorder l'accès"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modales CRUD Personnel & Comptes ── */}
      <CreerPersonnelModal
        isOpen={modalCreerOuvert}
        onClose={() => setModalCreerOuvert(false)}
        centres={centres}
      />

      <ModifierPersonnelModal
        isOpen={Boolean(membrePourModif)}
        onClose={() => setMembrePourModif(null)}
        personnel={membrePourModif}
      />

      <GestionCompteModal
        isOpen={Boolean(membrePourCompte)}
        onClose={() => setMembrePourCompte(null)}
        personnel={membrePourCompte}
        centres={centres}
      />

      <SupprimerPersonnelModal
        isOpen={Boolean(membrePourSuppr)}
        onClose={() => setMembrePourSuppr(null)}
        personnel={membrePourSuppr}
      />
    </div>
  );
}
