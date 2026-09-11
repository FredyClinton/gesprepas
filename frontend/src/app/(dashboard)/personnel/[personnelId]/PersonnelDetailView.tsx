"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  Building2,
  GraduationCap,
  Calendar,
  Coins,
  Receipt,
  Search,
  X,
  RotateCcw,
  Eye,
  UserCheck,
  Briefcase,
  Banknote,
  ShieldCheck,
} from "lucide-react";

import { Card, Modal } from "@/shared/ui";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import {
  useUtilisateur,
  useUtilisateurs,
  type Utilisateur,
} from "@/modules/utilisateurs";
import {
  usePersonnel,
  useEnseignants,
  useAncienneteEnseignant,
  useHistoriqueSalairePersonnel,
  useDefinirSalairePersonnel,
  type Enseignant,
} from "@/modules/personnel";
import { useDepartements } from "@/modules/departement";
import { useRostersDepartements } from "@/modules/affectation-departementale";
import {
  useAffectationsParEnseignant,
  LABELS_JOUR,
} from "@/modules/affectation";
import {
  useFichesPaieEnseignant,
  usePaiementsPersonnelSession,
  type FichePaieEnseignant,
  type PaiementPhasePersonnel,
  CLASSES_STATUT_FICHE_PAIE,
  LABELS_STATUT_FICHE_PAIE,
} from "@/modules/remuneration";
import { useMatieres } from "@/modules/matieres";
import { useSalles } from "@/modules/salle";
import { FichePaieModal } from "@/app/(dashboard)/paie/FichePaieModal";
import { ROLE_LABELS, type Role } from "@/types/roles";

const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_SEANCE: Record<string, string> = {
  PLANIFIEE: "Planifiée",
  ASSIGNEE: "Assignée",
  EFFECTUEE: "Effectuée",
  ANNULEE: "Annulée",
};

const CLASSES_STATUT_SEANCE: Record<string, string> = {
  PLANIFIEE: "bg-slate-100 text-slate-700 border border-slate-200",
  ASSIGNEE: "bg-amber-50 text-amber-700 border border-amber-200/80",
  EFFECTUEE: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  ANNULEE: "bg-red-50 text-red-700 border border-red-200/80",
};

const AVATAR_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-orange-50 text-brand-orange border-orange-200",
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
  return `${p}${n}`.toUpperCase() || "-";
}

export function PersonnelDetailView({ personnelId }: { personnelId: string }) {
  const { data: session } = useSession();
  const utilisateurConnecte = session?.user;
  const roleConnecte = utilisateurConnecte?.role;
  const idConnecte = utilisateurConnecte?.id;

  // Données du collaborateur
  const { data: utilisateur, isLoading: chargementUtilisateur } =
    useUtilisateur(personnelId);
  const { data: tousUtilisateurs = [] } = useUtilisateurs();
  const { data: personnelMembre, isLoading: chargementPersonnel } =
    usePersonnel(personnelId);
  const { data: centres = [] } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;

  // Données pour détection double statut Enseignant
  const { data: enseignants = [] } = useEnseignants();

  // Résolution de l'identité du collaborateur
  const membre = useMemo(() => {
    if (utilisateur) return utilisateur;
    const depuisListe = tousUtilisateurs.find((u) => u.id === personnelId);
    if (depuisListe) return depuisListe;
    if (personnelMembre) {
      return {
        id: personnelMembre.id,
        nom: personnelMembre.nom,
        prenom: personnelMembre.prenom,
        email: personnelMembre.email ?? "",
        role: "CHARGE_DOSSIER" as Role,
        centreId: null,
        departementId: null,
        telephone: personnelMembre.telephone,
        numeroCni: personnelMembre.numeroCni,
      } as Utilisateur;
    }
    return undefined;
  }, [utilisateur, tousUtilisateurs, personnelMembre, personnelId]);

  // Centre d'affectation
  const centre = useMemo(
    () => centres.find((c) => c.id === membre?.centreId),
    [centres, membre?.centreId],
  );

  // Centre du chef connecté
  const centreConnecteId =
    utilisateurConnecte?.centreId ??
    tousUtilisateurs.find((u) => u.id === idConnecte)?.centreId ??
    null;

  // Le chef de centre peut voir la paie du personnel de son propre centre
  const estChefDeCeCentre = useMemo(() => {
    if (roleConnecte !== "CHEF_CENTRE" || !centreConnecteId) return false;
    return Boolean(membre?.centreId && membre.centreId === centreConnecteId);
  }, [roleConnecte, centreConnecteId, membre?.centreId]);

  // Règles de visibilité
  const estLuiMeme = idConnecte === personnelId;
  const peutVoirFinances =
    estLuiMeme ||
    roleConnecte === "DIRECTEUR" ||
    roleConnecte === "COMPTABLE" ||
    estChefDeCeCentre;
  const peutVoirProfilEnseignant =
    estLuiMeme ||
    roleConnecte === "DIRECTEUR" ||
    roleConnecte === "DIRECTEUR_ACADEMIQUE" ||
    roleConnecte === "CHEF_DEPARTEMENT" ||
    estChefDeCeCentre;
  const peutGererSalaire =
    roleConnecte === "DIRECTEUR" || roleConnecte === "COMPTABLE";

  // Recherche du profil enseignant associé (par ID, email, téléphone ou nom/prénom)
  const enseignantAssocie: Enseignant | undefined = useMemo(() => {
    if (!membre) return undefined;
    return enseignants.find(
      (e) =>
        e.id === membre.id ||
        (membre.email &&
          e.email &&
          e.email.trim().toLowerCase() === membre.email.trim().toLowerCase()) ||
        (membre.telephone &&
          e.telephone &&
          e.telephone.trim() === membre.telephone.trim()) ||
        (e.nom.trim().toLowerCase() === membre.nom.trim().toLowerCase() &&
          e.prenom.trim().toLowerCase() === membre.prenom.trim().toLowerCase()),
    );
  }, [enseignants, membre]);

  const estAussiEnseignant = Boolean(enseignantAssocie);
  const enseignantId = enseignantAssocie?.id;

  // Données académiques si enseignant et autorisé
  const { data: anciennete } = useAncienneteEnseignant(
    estAussiEnseignant && peutVoirProfilEnseignant ? enseignantId : undefined,
  );
  const { data: departements } = useDepartements();
  const departementIds = useMemo(
    () => departements?.map((d) => d.id) ?? [],
    [departements],
  );
  const { data: roster } = useRostersDepartements(
    estAussiEnseignant && peutVoirProfilEnseignant ? departementIds : [],
    sessionId,
  );
  const { data: matieres } = useMatieres();
  const { data: salles } = useSalles(sessionId);
  const { data: seances = [] } = useAffectationsParEnseignant(
    estAussiEnseignant && peutVoirProfilEnseignant ? enseignantId : undefined,
    sessionId,
  );
  const { data: fichesPaie = [] } = useFichesPaieEnseignant(
    estAussiEnseignant &&
      (peutVoirFinances || roleConnecte === "DIRECTEUR_ACADEMIQUE")
      ? (enseignantId ?? "")
      : "",
    sessionId,
  );

  // Historique des salaires du personnel
  const { data: historiqueSalaires = [] } = useHistoriqueSalairePersonnel(
    peutVoirFinances ? personnelId : undefined,
    sessionId,
  );
  const salaireReferenceActuel = useMemo(() => {
    if (historiqueSalaires.length === 0) return null;
    return historiqueSalaires[0].salaireReference;
  }, [historiqueSalaires]);

  // Modal définition de salaire
  const [modalSalaireOuvert, setModalSalaireOuvert] = useState(false);
  const [nouveauSalaire, setNouveauSalaire] = useState<number | "">("");
  const definirSalaire = useDefinirSalairePersonnel();

  // Départements de l'enseignant
  const departementsDeCetEnseignant = useMemo(() => {
    if (!roster || !departements || !enseignantId) return [];
    const ids = new Set(
      roster
        .filter((r) => r.enseignantId === enseignantId)
        .map((r) => r.departementId),
    );
    return departements.filter((d) => ids.has(d.id));
  }, [roster, departements, enseignantId]);

  // Séances de cours
  const toutesLesSeances = useMemo(
    () =>
      [...seances].sort(
        (a, b) => a.semaine - b.semaine || a.seance - b.seance,
      ),
    [seances],
  );
  const seancesEffectueesCount = useMemo(
    () => toutesLesSeances.filter((s) => s.statut === "EFFECTUEE").length,
    [toutesLesSeances],
  );
  const tauxRealisation = useMemo(() => {
    if (toutesLesSeances.length === 0) return 0;
    return Math.round((seancesEffectueesCount / toutesLesSeances.length) * 100);
  }, [toutesLesSeances, seancesEffectueesCount]);

  // Stats honoraires d'enseignement
  const statsHonoraires = useMemo(() => {
    const coutParDefaut = enseignantAssocie?.coutParSeance ?? 0;
    let totalAcquis = 0;
    let totalPaye = 0;
    let totalProgramme = 0;
    let totalEnAttente = 0;

    for (const s of toutesLesSeances) {
      if (s.statut === "EFFECTUEE") {
        const montant = s.coutApplique ?? coutParDefaut;
        totalAcquis += montant;
        if (s.statutPaiement === "PAYEE") totalPaye += montant;
        else if (s.statutPaiement === "PROGRAMMEE") totalProgramme += montant;
        else totalEnAttente += montant;
      }
    }
    return { totalAcquis, totalPaye, totalProgramme, totalEnAttente };
  }, [toutesLesSeances, enseignantAssocie?.coutParSeance]);

  // Historique des paiements par phase (Bordereaux Personnel)
  const {
    paiements: paiementsPersonnel = [],
    isLoading: chargementPaiementsPersonnel,
  } = usePaiementsPersonnelSession(
    peutVoirFinances ? personnelId : undefined,
    sessionId,
  );

  const totalPayeAdministration = useMemo(() => {
    return paiementsPersonnel.reduce((acc, p) => acc + (p.montantPaye || 0), 0);
  }, [paiementsPersonnel]);

  // Restrictions d'accès selon le rôle
  const peutVoirAdministration =
    peutVoirFinances && roleConnecte !== "DIRECTEUR_ACADEMIQUE";

  // Volets et filtres
  const [voletActif, setVoletActif] = useState<"administration" | "enseignement">(
    peutVoirAdministration ? "administration" : "enseignement",
  );
  const [sousOngletEnseignement, setSousOngletEnseignement] = useState<
    "fiches" | "seances"
  >("fiches");
  const [recherche, setRecherche] = useState("");
  const [filtreMatiereId, setFiltreMatiereId] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreStatutPaiement, setFiltreStatutPaiement] = useState("");
  const [ficheDetailSelectionnee, setFicheDetailSelectionnee] =
    useState<FichePaieEnseignant | null>(null);
  const [paiementPhaseSelectionne, setPaiementPhaseSelectionne] =
    useState<PaiementPhasePersonnel | null>(null);

  // Filtrage des séances
  const seancesFiltrees = useMemo(() => {
    return toutesLesSeances.filter((s) => {
      if (recherche) {
        const q = recherche.toLowerCase();
        const mat = matieres?.find((m) => m.id === s.matiereId);
        const matchMat = mat?.nom.toLowerCase().includes(q) ?? false;
        if (!matchMat) return false;
      }
      if (filtreMatiereId && s.matiereId !== filtreMatiereId) return false;
      if (filtreStatut && s.statut !== filtreStatut) return false;
      if (filtreStatutPaiement && s.statutPaiement !== filtreStatutPaiement)
        return false;
      return true;
    });
  }, [
    toutesLesSeances,
    recherche,
    filtreMatiereId,
    filtreStatut,
    filtreStatutPaiement,
    matieres,
  ]);

  async function handleEnregistrerSalaire() {
    if (!sessionId || typeof nouveauSalaire !== "number" || nouveauSalaire <= 0)
      return;
    await definirSalaire.mutateAsync({
      personnelId,
      sessionId,
      salaireReference: nouveauSalaire,
    });
    setModalSalaireOuvert(false);
  }

  const chargement = chargementUtilisateur || chargementPersonnel;

  if (chargement) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-slate-400 p-12 text-center text-sm">
          Chargement de la fiche du personnel...
        </p>
      </div>
    );
  }

  if (!membre) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="p-10 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-800 text-lg font-bold">
            Membre du personnel introuvable
          </p>
          <Link
            href="/centres"
            className="text-brand-orange mt-3 inline-block text-sm font-bold hover:underline"
          >
            Retour aux centres
          </Link>
        </Card>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[membre.role] ?? membre.role;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {centre ? (
          <Link
            href={`/centres/${centre.id}`}
            className="hover:text-brand-orange inline-flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            {centre.nom}
          </Link>
        ) : (
          <Link
            href="/centres"
            className="hover:text-brand-orange inline-flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Centres
          </Link>
        )}
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">Personnel</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900 truncate">
          {membre.prenom} {membre.nom}
        </span>
      </div>

      {/* Hero Banner d'identité */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-r from-white via-white to-slate-50/70 border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-xl border shadow-sm ${getAvatarStyles(
                  `${membre.prenom} ${membre.nom}`,
                )}`}
              >
                {getInitials(membre.prenom, membre.nom)}
              </div>
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500"
                title="Personnel rattaché actif"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {membre.prenom} {membre.nom}
                </h1>

                {/* Badge Rôle Administratif */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Briefcase size={13} className="text-slate-500" />
                  {roleLabel}
                </span>

                {/* Double statut Enseignant */}
                {estAussiEnseignant && peutVoirProfilEnseignant && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-brand-orange border border-orange-200/90 shadow-2xs"
                    title="Ce collaborateur assure des cours dans l'établissement"
                  >
                    <GraduationCap size={14} />
                    Également Enseignant
                  </span>
                )}
              </div>

              {/* Ligne d'informations contextuelles */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {centre && (
                  <Link
                    href={`/centres/${centre.id}`}
                    className="flex items-center gap-1.5 hover:text-brand-orange transition-colors font-semibold text-slate-700"
                  >
                    <Building2 size={14} className="text-slate-400" />
                    {centre.nom}
                  </Link>
                )}

                {membre.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />
                    {membre.email}
                  </span>
                )}

                {estAussiEnseignant &&
                  peutVoirProfilEnseignant &&
                  enseignantAssocie && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
                      Matricule: {enseignantAssocie.matricule}
                    </span>
                  )}
              </div>
            </div>
          </div>

          {/* Actions hero */}
          <div className="flex flex-wrap items-center gap-2">
            {estAussiEnseignant && peutVoirProfilEnseignant && enseignantId && (
              <Link
                href={`/enseignants/${enseignantId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-orange-50 text-brand-orange hover:bg-orange-100/80 border border-orange-200 transition-colors shadow-2xs"
              >
                <Eye size={15} />
                Fiche Enseignant dédiée
              </Link>
            )}

            {peutGererSalaire && sessionId && (
              <button
                type="button"
                onClick={() => {
                  setNouveauSalaire(salaireReferenceActuel ?? "");
                  setModalSalaireOuvert(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <Banknote size={15} className="text-slate-500" />
                {salaireReferenceActuel ? "Réviser salaire" : "Définir salaire"}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Ruban de KPIs dynamiques (3 colonnes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Poste & Centre */}
        <Card className="p-5 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Affectation
            </span>
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-900 truncate">
              {centre ? centre.nom : "Non rattaché"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{roleLabel}</p>
          </div>
        </Card>

        {/* KPI 2: Séances de cours (si enseignant) ou Session */}
        {estAussiEnseignant && peutVoirProfilEnseignant ? (
          <Card className="p-5 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Séances Cours
              </span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900">
                  {seancesEffectueesCount}
                </span>
                <span className="text-xs text-slate-400">
                  / {toutesLesSeances.length} faites
                </span>
                <span className="ml-auto text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  {tauxRealisation}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${tauxRealisation}%` }}
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Session Active
              </span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-900">
                {sessionActive?.annee ?? "Aucune"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Année académique</p>
            </div>
          </Card>
        )}

        {/* KPI 3: Cumul honoraires cours (si enseignant) ou Statut Profil */}
        {estAussiEnseignant && peutVoirProfilEnseignant ? (
          <Card className="p-5 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Honoraires Cours
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt size={18} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-900">
                {FORMATEUR_FCFA.format(statsHonoraires.totalAcquis)} FCFA
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {enseignantAssocie?.coutParSeance
                  ? `${FORMATEUR_FCFA.format(enseignantAssocie.coutParSeance)} FCFA / séance`
                  : "Tarif non défini"}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-5 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Statut Profil
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck size={18} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-900">Actif</p>
              <p className="text-xs text-slate-500 mt-0.5">Équipe opérationnelle</p>
            </div>
          </Card>
        )}
      </div>

      {/* Architecture en 2 Colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne gauche (4 / 12) : Fiche d'identité & Profils */}
        <div className="lg:col-span-4 space-y-6">
          {/* Carte Coordonnées */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Mail size={16} className="text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm">
                Coordonnées &amp; Identification
              </h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  Email professionnel
                </span>
                <p className="font-medium text-slate-900 mt-0.5 break-all">
                  {membre.email || "-"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  Téléphone
                </span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {membre.telephone || "-"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-slate-400" />
                  Numéro CNI
                </span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {membre.numeroCni || "-"}
                </p>
              </div>
            </div>
          </Card>

          {/* Carte Affectation & Rôle */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Briefcase size={16} className="text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm">
                Rôle &amp; Affectation
              </h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">
                  Fonction administrative
                </span>
                <p className="font-medium text-slate-900 mt-0.5">{roleLabel}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block">
                  Centre de rattachement
                </span>
                {centre ? (
                  <Link
                    href={`/centres/${centre.id}`}
                    className="inline-flex items-center gap-1.5 text-brand-orange hover:underline font-bold mt-0.5"
                  >
                    <Building2 size={14} />
                    {centre.nom} ({centre.villeActuelle})
                  </Link>
                ) : (
                  <p className="text-slate-400 italic mt-0.5">
                    Aucun centre rattaché
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Carte Profil Académique si Enseignant */}
          {estAussiEnseignant && peutVoirProfilEnseignant && enseignantAssocie && (
            <Card className="rounded-2xl border border-orange-200/80 bg-gradient-to-b from-white to-orange-50/20 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-brand-orange" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Profil Enseignant
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                    enseignantAssocie.statut === "ACTIF"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {enseignantAssocie.statut === "ACTIF" ? "Actif" : "Suspendu"}
                </span>
              </div>

              <div className="p-5 space-y-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">
                    Matricule
                  </span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {enseignantAssocie.matricule}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 block">
                    Honoraires d&rsquo;enseignement
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {FORMATEUR_FCFA.format(enseignantAssocie.coutParSeance)} FCFA{" "}
                    <span className="text-xs font-normal text-slate-400">
                      / séance
                    </span>
                  </p>
                </div>

                {enseignantAssocie.ecoleFonction && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">
                      École / Fonction
                    </span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {enseignantAssocie.ecoleFonction}
                    </p>
                  </div>
                )}

                {enseignantAssocie.niveauGrade && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">
                      Niveau / Grade
                    </span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {enseignantAssocie.niveauGrade}
                    </p>
                  </div>
                )}

                {/* Départements rattachés */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Départements associés
                  </span>
                  {departementsDeCetEnseignant.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Aucun département rattaché sur cette session
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {departementsDeCetEnseignant.map((d) => (
                        <span
                          key={d.id}
                          className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-50 text-brand-orange border border-orange-200"
                        >
                          {d.nom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ancienneté */}
                {anciennete && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Ancienneté</span>
                    <span className="font-bold text-slate-700">
                      {anciennete.ancienneteAnnees} an(s) {anciennete.ancienneteMois} mois
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Carte Rémunération Administrative (Si autorisé) */}
          {peutVoirAdministration && (
            <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-slate-500" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Rémunération Administrative
                  </h3>
                </div>
                {peutGererSalaire && sessionId && (
                  <button
                    type="button"
                    onClick={() => {
                      setNouveauSalaire(salaireReferenceActuel ?? "");
                      setModalSalaireOuvert(true);
                    }}
                    className="text-xs font-bold text-brand-orange hover:underline"
                  >
                    Modifier
                  </button>
                )}
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">
                    Salaire de base de référence
                  </span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {salaireReferenceActuel !== null
                      ? `${FORMATEUR_FCFA.format(salaireReferenceActuel)} FCFA`
                      : "Non défini pour cette session"}
                  </p>
                </div>

                {historiqueSalaires.length > 1 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Historique des révisions
                    </span>
                    <ul className="divide-y divide-slate-50 text-xs">
                      {historiqueSalaires.slice(1, 4).map((h) => (
                        <li
                          key={h.id}
                          className="py-1 flex items-center justify-between text-slate-600"
                        >
                          <span>{FORMATEUR_FCFA.format(h.salaireReference)} FCFA</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {new Date(h.dateDebutEffet).toLocaleDateString("fr-FR")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Colonne droite (8 / 12) : Historiques de paiement (Administration & Enseignement) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Système de Volets : Administration & Enseignement */}
          {peutVoirAdministration ? (
            <div className="border-b border-slate-200">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setVoletActif("administration")}
                  className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    voletActif === "administration"
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Briefcase size={16} />
                  Administration
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      voletActif === "administration"
                        ? "bg-orange-100 text-brand-orange"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {paiementsPersonnel.length} phase{paiementsPersonnel.length > 1 ? "s" : ""}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVoletActif("enseignement")}
                  className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    voletActif === "enseignement"
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <GraduationCap size={16} />
                  Enseignement
                  {estAussiEnseignant && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        voletActif === "enseignement"
                          ? "bg-orange-100 text-brand-orange"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {fichesPaie.length} fiche{fichesPaie.length > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <GraduationCap size={20} className="text-brand-orange" />
                <span>Historique des Rémunérations d&apos;Enseignement</span>
                {estAussiEnseignant && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-brand-orange">
                    {fichesPaie.length} fiche{fichesPaie.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ================= VOLET 1 : ADMINISTRATION ================= */}
          {voletActif === "administration" && peutVoirAdministration && (
            <div className="space-y-6">
              {!peutVoirFinances ? (
                <Card className="p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Accès restreint aux données financières
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    La consultation des règlements administratifs et de paie par phase est strictement réservée à la direction générale, aux comptables, au chef de centre concerné ou au collaborateur lui-même.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Cartes KPI Rémunération par phase */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Coins size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Réglé (Session)
                          </p>
                          <p className="text-base font-bold text-emerald-700">
                            {FORMATEUR_FCFA.format(totalPayeAdministration)} FCFA
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Receipt size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Phases Réglées
                          </p>
                          <p className="text-base font-bold text-slate-900">
                            {paiementsPersonnel.length} bordereau{paiementsPersonnel.length > 1 ? "x" : ""}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Dernier Versement
                          </p>
                          <p className="text-base font-bold text-slate-900">
                            {paiementsPersonnel.length > 0
                              ? new Date(paiementsPersonnel[0].datePaiement).toLocaleDateString("fr-FR")
                              : "Aucun versement"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Tableau des paiements par phase */}
                  <Card className="overflow-hidden border border-slate-200/80 shadow-2xs rounded-2xl">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Historique des Règlements par Phase
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Règlements administratifs validés par bordereaux pour la session active
                        </p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                        {paiementsPersonnel.length} phase{paiementsPersonnel.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {chargementPaiementsPersonnel ? (
                      <div className="p-12 text-center text-xs text-slate-500">
                        Chargement de l&rsquo;historique des paiements...
                      </div>
                    ) : paiementsPersonnel.length === 0 ? (
                      <div className="p-12 text-center space-y-2">
                        <Receipt size={36} className="text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">
                          Aucun règlement par phase émis pour l&rsquo;instant
                        </p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Les paiements du personnel sont décomptés et validés par phase via les bordereaux de paie de la direction ou de la comptabilité.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                              <th className="p-3.5 pl-5">Bordereau / Phase</th>
                              <th className="p-3.5">Date de paiement</th>
                              <th className="p-3.5">Montant versé</th>
                              <th className="p-3.5">Observations</th>
                              <th className="p-3.5">Statut</th>
                              <th className="p-3.5 pr-5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paiementsPersonnel.map((p) => (
                              <tr key={p.ficheId} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3.5 pl-5">
                                  <div className="flex items-center gap-2">
                                    <Receipt size={16} className="text-brand-orange shrink-0" />
                                    <div>
                                      <p className="font-bold text-slate-900">
                                        {p.intituleBordereau || "Règlement Personnel"}
                                      </p>
                                      <p className="font-mono text-[11px] text-slate-400">
                                        {p.referenceBordereau}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 text-slate-600">
                                  {new Date(p.datePaiement).toLocaleDateString("fr-FR")}
                                </td>
                                <td className="p-3.5 font-bold text-emerald-700">
                                  {FORMATEUR_FCFA.format(p.montantPaye)} FCFA
                                </td>
                                <td className="p-3.5 text-slate-500 max-w-xs truncate">
                                  {p.observations || "-"}
                                </td>
                                <td className="p-3.5">
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Validé
                                  </span>
                                </td>
                                <td className="p-3.5 pr-5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setPaiementPhaseSelectionne(p)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                                  >
                                    <Eye size={13} />
                                    Détail
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          )}

          {/* ================= VOLET 2 : ENSEIGNEMENT ================= */}
          {voletActif === "enseignement" && (
            <div className="space-y-6">
              {!estAussiEnseignant ? (
                <Card className="p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto">
                    <GraduationCap size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aucune activité d&rsquo;enseignement
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Ce collaborateur exerce exclusivement une fonction administrative ou logistique pour la session active. Aucune fiche d&rsquo;honoraires de cours n&rsquo;est associée à ce profil.
                  </p>
                </Card>
              ) : !peutVoirProfilEnseignant ? (
                <Card className="p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Accès restreint aux données d&rsquo;enseignement
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    La consultation des cours et fiches d&rsquo;enseignement est réservée à la direction pédagogique, à la direction générale ou à l&rsquo;enseignant lui-même.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Sous-navigation Enseignement : Fiches de Paie / Planning Séances */}
                  <div className="flex items-center justify-between bg-slate-100/70 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setSousOngletEnseignement("fiches")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sousOngletEnseignement === "fiches"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Fiches de Paie &amp; Règlements ({fichesPaie.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSousOngletEnseignement("seances")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sousOngletEnseignement === "seances"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Planning des Séances ({toutesLesSeances.length})
                    </button>
                  </div>

                  {/* KPIs Honoraires Enseignement */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Acquis
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {FORMATEUR_FCFA.format(statsHonoraires.totalAcquis)} FCFA
                      </p>
                    </Card>
                    <Card className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                        Déjà Payé
                      </span>
                      <p className="text-sm font-bold text-emerald-700 mt-1">
                        {FORMATEUR_FCFA.format(statsHonoraires.totalPaye)} FCFA
                      </p>
                    </Card>
                    <Card className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        En Bordereau
                      </span>
                      <p className="text-sm font-bold text-blue-700 mt-1">
                        {FORMATEUR_FCFA.format(statsHonoraires.totalProgramme)} FCFA
                      </p>
                    </Card>
                    <Card className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                        En Attente
                      </span>
                      <p className="text-sm font-bold text-amber-700 mt-1">
                        {FORMATEUR_FCFA.format(statsHonoraires.totalEnAttente)} FCFA
                      </p>
                    </Card>
                  </div>

                  {/* Sous-contenu 1 : Fiches de Paie Enseignement */}
                  {sousOngletEnseignement === "fiches" && (
                    <Card className="overflow-hidden border border-slate-200/80 shadow-2xs rounded-2xl">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Fiches de Paie d&rsquo;Enseignement
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Historique des fiches d&rsquo;honoraires générées par bordereau
                          </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          {fichesPaie.length} fiche{fichesPaie.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {fichesPaie.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                          <Receipt size={36} className="text-slate-300 mx-auto" />
                          <p className="text-sm font-bold text-slate-700">
                            Aucune fiche de paie émise pour le moment
                          </p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Les fiches de paie pour les honoraires de cours sont produites lors de la validation des bordereaux de décompte d&rsquo;enseignement.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                                <th className="p-3.5 pl-5">Réf. Bordereau</th>
                                <th className="p-3.5">Date versement</th>
                                <th className="p-3.5">Séances</th>
                                <th className="p-3.5">Montant net</th>
                                <th className="p-3.5">Statut</th>
                                <th className="p-3.5 pr-5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {fichesPaie.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-3.5 pl-5">
                                    <div className="flex items-center gap-2">
                                      <Receipt size={16} className="text-purple-600 shrink-0" />
                                      <span className="font-mono font-bold text-slate-900">
                                        {f.referenceBordereau}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-slate-600">
                                    {new Date(f.datePaiement).toLocaleDateString("fr-FR")}
                                  </td>
                                  <td className="p-3.5 text-slate-700 font-medium">
                                    {f.nombreSeances} séance{f.nombreSeances > 1 ? "s" : ""}
                                  </td>
                                  <td className="p-3.5 font-bold text-slate-900">
                                    {FORMATEUR_FCFA.format(f.montantTotal)} FCFA
                                  </td>
                                  <td className="p-3.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                        CLASSES_STATUT_FICHE_PAIE[f.statut] ??
                                        "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {LABELS_STATUT_FICHE_PAIE[f.statut] ?? f.statut}
                                    </span>
                                  </td>
                                  <td className="p-3.5 pr-5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setFicheDetailSelectionnee(f)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                                    >
                                      <Eye size={13} />
                                      Détail
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Sous-contenu 2 : Planning des Séances */}
                  {sousOngletEnseignement === "seances" && (
                    <div className="space-y-4">
                      {/* Panneau Filtres */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            placeholder="Rechercher une matière..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pr-9 pl-9 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-orange focus:outline-hidden transition-all"
                          />
                          {recherche && (
                            <button
                              type="button"
                              onClick={() => setRecherche("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        <select
                          value={filtreMatiereId}
                          onChange={(e) => setFiltreMatiereId(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-orange focus:outline-hidden"
                        >
                          <option value="">Toutes les matières</option>
                          {matieres?.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nom}
                            </option>
                          ))}
                        </select>

                        <select
                          value={filtreStatut}
                          onChange={(e) => setFiltreStatut(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-orange focus:outline-hidden"
                        >
                          <option value="">Tous les statuts</option>
                          <option value="PLANIFIEE">Planifiée</option>
                          <option value="ASSIGNEE">Assignée</option>
                          <option value="EFFECTUEE">Effectuée</option>
                          <option value="ANNULEE">Annulée</option>
                        </select>

                        <select
                          value={filtreStatutPaiement}
                          onChange={(e) =>
                            setFiltreStatutPaiement(e.target.value)
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-brand-orange focus:outline-hidden"
                        >
                          <option value="">Tous paiements</option>
                          <option value="A_PAYER">À payer</option>
                          <option value="PROGRAMMEE">Programmée</option>
                          <option value="PAYEE">Payée</option>
                        </select>

                        {(recherche ||
                          filtreMatiereId ||
                          filtreStatut ||
                          filtreStatutPaiement) && (
                          <button
                            type="button"
                            onClick={() => {
                              setRecherche("");
                              setFiltreMatiereId("");
                              setFiltreStatut("");
                              setFiltreStatutPaiement("");
                            }}
                            className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw size={13} />
                            Réinitialiser
                          </button>
                        )}
                      </div>

                      {/* Tableau des séances */}
                      <Card className="overflow-hidden border border-slate-200/80 shadow-2xs rounded-2xl">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900">
                            Séances de cours de l&rsquo;enseignant
                          </h3>
                          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                            {seancesFiltrees.length} séance(s)
                          </span>
                        </div>

                        {seancesFiltrees.length === 0 ? (
                          <div className="p-12 text-center text-xs text-slate-500">
                            Aucune séance ne correspond aux critères de filtre.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                                  <th className="p-3.5 pl-5">Semaine</th>
                                  <th className="p-3.5">Matière</th>
                                  <th className="p-3.5">Salle</th>
                                  <th className="p-3.5">Jour &amp; Heure</th>
                                  <th className="p-3.5">Statut cours</th>
                                  <th className="p-3.5">Coût / séance</th>
                                  <th className="p-3.5 pr-5">Statut paie</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {seancesFiltrees.map((s) => {
                                  const mat = matieres?.find(
                                    (m) => m.id === s.matiereId,
                                  );
                                  const sal = salles?.find(
                                    (sal) => sal.id === s.salleId,
                                  );
                                  return (
                                    <tr
                                      key={s.id}
                                      className="hover:bg-slate-50/60 transition-colors"
                                    >
                                      <td className="p-3.5 pl-5 font-bold text-slate-900">
                                        S{s.semaine} - Séance {s.seance}
                                      </td>
                                      <td className="p-3.5 font-semibold text-slate-800">
                                        {mat ? mat.nom : "-"}
                                      </td>
                                      <td className="p-3.5 text-slate-600">
                                        {sal ? sal.nom : "-"}
                                      </td>
                                      <td className="p-3.5 text-slate-600">
                                        {LABELS_JOUR[s.jour] ?? s.jour} • Séance {s.seance}
                                      </td>
                                      <td className="p-3.5">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                            CLASSES_STATUT_SEANCE[s.statut] ??
                                            "bg-slate-100 text-slate-700"
                                          }`}
                                        >
                                          {LABELS_STATUT_SEANCE[s.statut] ??
                                            s.statut}
                                        </span>
                                      </td>
                                      <td className="p-3.5 font-semibold text-slate-900">
                                        {s.coutApplique
                                          ? `${FORMATEUR_FCFA.format(s.coutApplique)} FCFA`
                                          : enseignantAssocie?.coutParSeance
                                            ? `${FORMATEUR_FCFA.format(enseignantAssocie.coutParSeance)} FCFA`
                                            : "-"}
                                      </td>
                                      <td className="p-3.5 pr-5">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                            s.statutPaiement === "PAYEE"
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              : s.statutPaiement ===
                                                  "PROGRAMMEE"
                                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                          }`}
                                        >
                                          {s.statutPaiement === "PAYEE"
                                            ? "Payée"
                                            : s.statutPaiement === "PROGRAMMEE"
                                              ? "Programmée"
                                              : "À payer"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modale de révision/définition du salaire de référence */}
      <Modal
        isOpen={modalSalaireOuvert}
        onClose={() => setModalSalaireOuvert(false)}
        title="Salaire de référence du personnel"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Définissez ou révisez le salaire mensuel de référence de{" "}
            <span className="font-bold text-slate-700">
              {membre.prenom} {membre.nom}
            </span>{" "}
            pour la session active ({sessionActive?.annee ?? "en cours"}).
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Montant mensuel (FCFA)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Ex: 150000"
              value={nouveauSalaire}
              onChange={(e) =>
                setNouveauSalaire(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              className="w-full h-10 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-brand-orange focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalSalaireOuvert(false)}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleEnregistrerSalaire}
              disabled={
                definirSalaire.isPending ||
                typeof nouveauSalaire !== "number" ||
                nouveauSalaire <= 0
              }
              className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 disabled:opacity-50"
            >
              {definirSalaire.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale détail complète d'une fiche de paie enseignant (séances, thèmes, impressions) */}
      <FichePaieModal
        ficheId={ficheDetailSelectionnee?.id || null}
        onClose={() => setFicheDetailSelectionnee(null)}
      />

      {/* Modale détail d'un règlement par phase (Administration) */}
      {paiementPhaseSelectionne && (
        <Modal
          isOpen={Boolean(paiementPhaseSelectionne)}
          onClose={() => setPaiementPhaseSelectionne(null)}
          title={`Règlement Phase - ${paiementPhaseSelectionne.referenceBordereau}`}
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-slate-400 block">Intitulé de la phase</span>
                <span className="font-bold text-slate-900">
                  {paiementPhaseSelectionne.intituleBordereau || "Règlement Personnel"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Date de versement</span>
                <span className="font-bold text-slate-900">
                  {new Date(
                    paiementPhaseSelectionne.datePaiement,
                  ).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Salaire référence</span>
                <span className="font-bold text-slate-700">
                  {FORMATEUR_FCFA.format(
                    paiementPhaseSelectionne.salaireReference,
                  )}{" "}
                  FCFA
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Montant versé</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {FORMATEUR_FCFA.format(
                    paiementPhaseSelectionne.montantPaye,
                  )}{" "}
                  FCFA
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Statut du bordereau</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Validé &amp; Payé
                </span>
              </div>
              {paiementPhaseSelectionne.observations && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Observations</span>
                  <p className="mt-0.5 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                    {paiementPhaseSelectionne.observations}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPaiementPhaseSelectionne(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
