"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  MapPin,
  Info,
  Users,
  LineChart,
  CalendarRange,
  GraduationCap,
  DoorOpen,
  Plus,
  ChevronDown,
  Ban,
  RotateCcw,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Mail,
  UserRound,
  Building2,
  AlertTriangle,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button, Card, Input, Modal, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useCentres,
  useSessionActive,
  useSessions,
  useRelocaliserCentre,
  useLocalisations,
  useFermerCentre,
  useRouvrirCentre,
  useRejoindreSession,
  relocalisationSchema,
  ComparatifSessionsCentreGraphique,
  type Centre,
  type RelocalisationFormValues,
} from "@/modules/centres-sessions";
import {
  useFormations,
  type Formation,
} from "@/modules/academique";
import {
  useFormationsAbonneesCentre,
  useAbonnerCentreFormation,
  useDesabonnerCentreFormation,
} from "@/modules/abonnement";
import {
  useSalles,
  useCreateSalle,
  useRenommerSalle,
  useReaffecterFormationSalle,
  useSupprimerSalle,
  type Salle,
} from "@/modules/salle";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { useEnseignants } from "@/modules/personnel";
import { useApprenants } from "@/modules/apprenants";
import {
  listMouvementsFinanciers,
  type MouvementFinancier,
} from "@/modules/financier/data/client";
import { ROLE_LABELS, type Role } from "@/types/roles";

const FCFA = new Intl.NumberFormat("fr-FR");

type Onglet = "informations" | "personnel" | "performances";

const ORDRE_ROLES_PERSONNEL: Role[] = [
  "CHEF_CENTRE",
  "CHARGE_DOSSIER",
  "CAISSIER",
];

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

function getInitials(prenom: string, nom: string) {
  const p = prenom?.trim().charAt(0) ?? "";
  const n = nom?.trim().charAt(0) ?? "";
  return `${p}${n}`.toUpperCase() || "-";
}

export function CentreDetailView({
  centreId,
  peutGererAcademique,
  peutAbonnerFormations,
  peutGererSalles,
  peutRelocaliser,
  peutFermerCentre = false,
  peutRejoindreSession = false,
  masquerRetour = false,
}: {
  centreId: string;
  peutGererAcademique: boolean;
  peutAbonnerFormations?: boolean;
  peutGererSalles?: boolean;
  peutRelocaliser: boolean;
  peutFermerCentre?: boolean;
  peutRejoindreSession?: boolean;
  masquerRetour?: boolean;
}) {
  const droitAbonnerFormations = peutAbonnerFormations ?? peutGererAcademique;
  const droitGererSalles = peutGererSalles ?? peutGererAcademique;

  const { data: centres, isLoading: chargementCentres } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const { data: formationsDuCentre = [] } = useFormationsAbonneesCentre(
    centreId,
    sessionActive?.id,
  );
  const { data: salles = [] } = useSalles(sessionActive?.id);
  const { data: utilisateurs = [] } = useUtilisateurs();

  const [onglet, setOnglet] = useState<Onglet>("informations");
  const fermerCentre = useFermerCentre();
  const rouvrirCentre = useRouvrirCentre();

  const centre = centres?.find((c) => c.id === centreId);
  const rejointSessionActive =
    centre && sessionActive
      ? centre.sessionIds.includes(sessionActive.id)
      : false;

  const formationsAbonneesIds = useMemo(
    () => new Set(formationsDuCentre.map((f) => f.id)),
    [formationsDuCentre],
  );

  const sallesDuCentre = useMemo(() => {
    if (!rejointSessionActive) return [];
    return salles.filter(
      (s) =>
        s.centreId === centreId && formationsAbonneesIds.has(s.formationId),
    );
  }, [salles, centreId, rejointSessionActive, formationsAbonneesIds]);

  const personnelDuCentre = useMemo(
    () =>
      utilisateurs
        .filter(
          (u) =>
            u.centreId === centreId && ORDRE_ROLES_PERSONNEL.includes(u.role),
        )
        .sort(
          (a, b) =>
            ORDRE_ROLES_PERSONNEL.indexOf(a.role) -
            ORDRE_ROLES_PERSONNEL.indexOf(b.role),
        ),
    [utilisateurs, centreId],
  );

  async function toggleStatutCentre() {
    if (!centre) return;
    if (centre.statut === "OUVERT") {
      await fermerCentre.mutateAsync(centre.id);
    } else {
      await rouvrirCentre.mutateAsync(centre.id);
    }
  }

  if (chargementCentres) {
    return (
      <div className="w-full">
        <p className="text-slate-400 p-12 text-center text-sm">
          Chargement du centre...
        </p>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="w-full">
        <Card className="p-10 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-800 text-lg font-bold">
            Centre introuvable
          </p>
          {!masquerRetour && (
            <Link
              href="/centres"
              className="text-brand-orange mt-3 inline-block text-sm font-bold hover:underline"
            >
              Retour à la liste des centres
            </Link>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Fil d'Ariane */}
      {!masquerRetour && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/centres"
            className="hover:text-brand-orange inline-flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Centres
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900 truncate">
            {centre.nom}
          </span>
        </div>
      )}

      {/* Hero Banner d'identité du Centre */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-r from-white via-white to-slate-50/70 border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar / Icône du Centre */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-brand-orange/20">
                <Building2 size={30} />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                  centre.statut === "OUVERT" ? "bg-emerald-500" : "bg-slate-400"
                }`}
                title={
                  centre.statut === "OUVERT"
                    ? "Centre ouvert"
                    : "Centre fermé"
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {centre.nom}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    centre.statut === "OUVERT"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      centre.statut === "OUVERT"
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {centre.statut === "OUVERT" ? "Ouvert" : "Fermé"}
                </span>

                {rejointSessionActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                    <CalendarRange size={12} />
                    Session active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                    Non rattaché à la session active
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-brand-orange" />
                  <span className="font-semibold text-slate-700">
                    {centre.villeActuelle}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{centre.adresseActuelle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions d'administration du centre */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {peutFermerCentre && (
              <Button
                type="button"
                variant="secondary"
                onClick={toggleStatutCentre}
                disabled={fermerCentre.isPending || rouvrirCentre.isPending}
                className="text-xs h-9 px-3.5"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  {centre.statut === "OUVERT" ? (
                    <>
                      <Ban size={14} className="text-red-500" />
                      Fermer le centre
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} className="text-emerald-600" />
                      Rouvrir le centre
                    </>
                  )}
                </span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation par Onglets moderne */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px">
        <button
          type="button"
          onClick={() => setOnglet("informations")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all ${
            onglet === "informations"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Info size={16} />
          Informations &amp; Infrastructure
        </button>
        <button
          type="button"
          onClick={() => setOnglet("personnel")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all ${
            onglet === "personnel"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          Personnel du Centre
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              onglet === "personnel"
                ? "bg-orange-100 text-brand-orange"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {personnelDuCentre.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOnglet("performances")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all ${
            onglet === "performances"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LineChart size={16} />
          Performances &amp; Évolution
        </button>
      </div>

      {/* Contenu des Onglets */}
      {onglet === "informations" && (
        <div className="space-y-6">
          {/* Synthèse Infrastructure du Centre */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1 : Sessions */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
              <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <CalendarRange size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Sessions
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {centre.sessionIds.length}
                  </span>
                  <span className="text-xs text-slate-400">rejointe(s)</span>
                </div>
              </div>
            </div>

            {/* KPI 2 : Formations */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange shrink-0">
                <GraduationCap size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Formations
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {formationsDuCentre.length}
                  </span>
                  <span className="text-xs text-slate-400">filière(s)</span>
                </div>
              </div>
            </div>

            {/* KPI 3 : Salles */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <DoorOpen size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Salles
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {sallesDuCentre.length}
                  </span>
                  <span className="text-xs text-slate-400">aménagée(s)</span>
                </div>
              </div>
            </div>

            {/* KPI 4 : Personnel */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Users size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Personnel
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {personnelDuCentre.length}
                  </span>
                  <span className="text-xs text-slate-400">collaborateur(s)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            <div className="space-y-6">
              <SessionsRejointes
                centreId={centre.id}
                sessionIds={centre.sessionIds}
                peutRejoindreSession={peutRejoindreSession}
              />
              <InformationsDuCentre
                centre={centre}
                peutRelocaliser={peutRelocaliser}
              />
            </div>

            <FormationsEtSalles
              centreId={centre.id}
              sessionId={sessionActive?.id}
              rejointSessionActive={rejointSessionActive}
              peutGererAcademique={peutGererAcademique}
              peutAbonnerFormations={droitAbonnerFormations}
              peutGererSalles={droitGererSalles}
            />
          </div>
        </div>
      )}

      {onglet === "personnel" && (
        <PersonnelDuCentre personnel={personnelDuCentre} />
      )}

      {onglet === "performances" && (
        <PerformancesDuCentre
          centre={centre}
          sessionActiveId={sessionActive?.id}
        />
      )}
    </div>
  );
}

// ── Onglet Performances : Synthèse, Évolution & Répartition par filière ──
function PerformancesDuCentre({
  centre,
  sessionActiveId,
}: {
  centre: Centre;
  sessionActiveId?: string;
}) {
  const { data: allSessions = [], isLoading: chargementSessions } = useSessions();
  const { data: allApprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [] } = useFormations();

  // Mouvements financiers par session pour ce centre
  const { data: mouvementsParSession = {}, isLoading: chargementMouvements } = useQuery({
    queryKey: ["mouvements-toutes-sessions", centre.id, centre.sessionIds],
    queryFn: async () => {
      const map: Record<string, MouvementFinancier[]> = {};
      await Promise.all(
        centre.sessionIds.map(async (sId) => {
          try {
            const list = await listMouvementsFinanciers(sId, centre.id);
            map[sId] = list;
          } catch {
            map[sId] = [];
          }
        }),
      );
      return map;
    },
    enabled: centre.sessionIds.length > 0,
  });

  // Sessions du centre triées par dateDebut décroissante (plus récente en premier)
  const sessionsTriees = useMemo(() => {
    return allSessions
      .filter((s) => centre.sessionIds.includes(s.id))
      .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());
  }, [allSessions, centre.sessionIds]);

  // Agrégation des métriques par session pour ce centre
  const statsParSession = useMemo(() => {
    return sessionsTriees.map((s, index) => {
      const apprenantsSession = allApprenants.filter(
        (a) => a.centreId === centre.id && a.sessionId === s.id,
      );
      const effectifTotal = apprenantsSession.length;
      const preInscrits = apprenantsSession.filter((a) => a.preInscrit).length;
      const definitifs = effectifTotal - preInscrits;
      const montantSouscrit = apprenantsSession.reduce(
        (somme, a) => somme + (a.montantContrat || 0),
        0,
      );
      const mouvements = mouvementsParSession[s.id] || [];
      const montantEncaisse = mouvements
        .filter((m) => m.type === "ENTREE" && m.statut !== "REJETE")
        .reduce((somme, m) => somme + m.montant, 0);
      const soldeRestant = Math.max(0, montantSouscrit - montantEncaisse);
      const tauxRecouvrement =
        montantSouscrit > 0
          ? Math.min(100, Math.round((montantEncaisse / montantSouscrit) * 100))
          : 0;

      // Ventilation par filière ordonnée par effectif décroissant
      const parFormation = formations
        .map((f) => {
          const apprenantsF = apprenantsSession.filter((a) => a.formationId === f.id);
          const nb = apprenantsF.length;
          const preInscritsF = apprenantsF.filter((a) => a.preInscrit).length;
          const definitifsF = nb - preInscritsF;
          return {
            formation: f,
            effectif: nb,
            definitifs: definitifsF,
            preInscrits: preInscritsF,
          };
        })
        .filter((item) => item.effectif > 0)
        .sort((a, b) => b.effectif - a.effectif);

      return {
        session: s,
        index,
        effectifTotal,
        definitifs,
        preInscrits,
        montantSouscrit,
        montantEncaisse,
        soldeRestant,
        tauxRecouvrement,
        parFormation,
      };
    });
  }, [sessionsTriees, allApprenants, centre.id, mouvementsParSession, formations]);

  // 1. Session de référence pour la synthèse : session active en priorité, sinon plus récente
  const sessionActiveData = useMemo(() => {
    if (sessionActiveId) {
      const active = statsParSession.find((s) => s.session.id === sessionActiveId);
      if (active) return active;
    }
    return statsParSession[0] ?? null;
  }, [statsParSession, sessionActiveId]);

  // Session chronologiquement précédente pour calcul des deltas
  const sessionPrecedente = useMemo(() => {
    if (!sessionActiveData) return null;
    const idx = statsParSession.findIndex((s) => s.session.id === sessionActiveData.session.id);
    return idx >= 0 && idx + 1 < statsParSession.length ? statsParSession[idx + 1] : null;
  }, [statsParSession, sessionActiveData]);

  const diffEffectif =
    sessionActiveData && sessionPrecedente
      ? sessionActiveData.effectifTotal - sessionPrecedente.effectifTotal
      : null;
  const pctDiffEffectif =
    sessionPrecedente && sessionPrecedente.effectifTotal > 0 && diffEffectif !== null
      ? Math.round((diffEffectif / sessionPrecedente.effectifTotal) * 100)
      : null;

  const diffSouscrit =
    sessionActiveData && sessionPrecedente
      ? sessionActiveData.montantSouscrit - sessionPrecedente.montantSouscrit
      : null;

  const diffEncaisse =
    sessionActiveData && sessionPrecedente
      ? sessionActiveData.montantEncaisse - sessionPrecedente.montantEncaisse
      : null;

  // Tri interactif du tableau comparatif inter-sessions
  type TriSessionColonne = "session" | "statut" | "effectif" | "definitifs" | "souscrit" | "encaisse" | "taux";
  const [triSessionColonne, setTriSessionColonne] = useState<TriSessionColonne>("session");
  const [triSessionDirection, setTriSessionDirection] = useState<SortDirection>("desc");

  function handleTriSession(colonne: TriSessionColonne) {
    if (triSessionColonne === colonne) {
      setTriSessionDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriSessionColonne(colonne);
      setTriSessionDirection(colonne === "session" || colonne === "statut" ? "asc" : "desc");
    }
  }

  const statsParSessionTriees = useMemo(() => {
    return [...statsParSession].sort((a, b) => {
      let res = 0;
      switch (triSessionColonne) {
        case "session":
          res = compareStrings(a.session.annee, b.session.annee);
          break;
        case "statut":
          res = compareStrings(a.session.statut, b.session.statut);
          break;
        case "effectif":
          res = compareNumbers(a.effectifTotal, b.effectifTotal);
          break;
        case "definitifs":
          res = compareNumbers(a.definitifs, b.definitifs);
          break;
        case "souscrit":
          res = compareNumbers(a.montantSouscrit, b.montantSouscrit);
          break;
        case "encaisse":
          res = compareNumbers(a.montantEncaisse, b.montantEncaisse);
          break;
        case "taux":
          res = compareNumbers(a.tauxRecouvrement, b.tauxRecouvrement);
          break;
      }
      return triSessionDirection === "asc" ? res : -res;
    });
  }, [statsParSession, triSessionColonne, triSessionDirection]);

  // Session sélectionnée pour la ventilation par filière
  const [sessionFiliereId, setSessionFiliereId] = useState<string>("");
  const sessionFiliereCourante = useMemo(() => {
    if (sessionFiliereId) {
      const trouvee = statsParSession.find((s) => s.session.id === sessionFiliereId);
      if (trouvee) return trouvee;
    }
    return sessionActiveData;
  }, [statsParSession, sessionFiliereId, sessionActiveData]);

  const chargement = chargementSessions || chargementApprenants || chargementMouvements;

  if (chargement) {
    return (
      <Card className="p-12 text-center rounded-2xl border border-slate-200/80">
        <p className="text-sm font-semibold text-slate-400">
          Chargement et consolidation des données inter-sessions...
        </p>
      </Card>
    );
  }

  if (statsParSession.length === 0) {
    return (
      <Card className="p-12 text-center rounded-2xl border border-slate-200/80 space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto">
          <LineChart size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Aucune session historique trouvée
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Ce centre n&rsquo;est rattaché à aucune session académique pour le moment.
        </p>
      </Card>
    );
  }

  const estSessionActive = sessionActiveData?.session.id === sessionActiveId;
  const pctDefinitifs =
    sessionActiveData && sessionActiveData.effectifTotal > 0
      ? Math.round((sessionActiveData.definitifs / sessionActiveData.effectifTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── NIVEAU A. Synthèse de la session active ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <span>Synthèse de la session {sessionActiveData ? sessionActiveData.session.annee : ""}</span>
              {estSessionActive && (
                <span className="rounded-full bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">
                  Active
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Indicateurs essentiels de pilotage pour la session en cours
            </p>
          </div>
          {sessionPrecedente && (
            <span className="text-xs text-slate-500 self-start sm:self-auto">
              Référence précédente : <strong className="text-slate-700">Session {sessionPrecedente.session.annee}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Indicateur 1 : Effectif actuel */}
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Effectif actuel
                </span>
                <div className="h-8 w-8 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {sessionActiveData?.effectifTotal ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  élève{(sessionActiveData?.effectifTotal ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              {diffEffectif !== null && sessionPrecedente ? (
                diffEffectif >= 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <TrendingUp size={13} />
                    +{diffEffectif} ({pctDiffEffectif! >= 0 ? `+${pctDiffEffectif}%` : `${pctDiffEffectif}%`})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                    <TrendingDown size={13} />
                    {diffEffectif} ({pctDiffEffectif}%)
                  </span>
                )
              ) : (
                <span className="text-slate-400 font-medium">Session de référence</span>
              )}
              {sessionPrecedente && (
                <span className="text-[11px] text-slate-400">vs {sessionPrecedente.session.annee}</span>
              )}
            </div>
          </Card>

          {/* Indicateur 2 : Inscriptions définitives & préinscriptions */}
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Inscriptions
                </span>
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {sessionActiveData?.definitifs ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  définitif{(sessionActiveData?.definitifs ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
              {/* Mini barre proportionnelle définitifs / préinscrits */}
              <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                <div
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                  style={{ width: `${pctDefinitifs}%` }}
                  title={`${sessionActiveData?.definitifs ?? 0} définitifs (${pctDefinitifs}%)`}
                />
                <div
                  className="h-full bg-amber-400 rounded-r-full transition-all duration-300"
                  style={{ width: `${100 - pctDefinitifs}%` }}
                  title={`${sessionActiveData?.preInscrits ?? 0} préinscrits`}
                />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700">
                {pctDefinitifs}% confirmés
              </span>
              <span className="text-amber-800 font-semibold">
                {sessionActiveData?.preInscrits ?? 0} pré-inscrit{(sessionActiveData?.preInscrits ?? 0) > 1 ? "s" : ""}
              </span>
            </div>
          </Card>

          {/* Indicateur 3 : Montant souscrit */}
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Montant souscrit
                </span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Wallet size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {FCFA.format(sessionActiveData?.montantSouscrit ?? 0)}
                </span>
                <span className="text-xs text-slate-500 font-bold">F CFA</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              {diffSouscrit !== null && sessionPrecedente ? (
                diffSouscrit >= 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <TrendingUp size={13} />
                    +{FCFA.format(diffSouscrit)} F
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                    <TrendingDown size={13} />
                    {FCFA.format(diffSouscrit)} F
                  </span>
                )
              ) : (
                <span className="text-slate-400 font-medium">Total des contrats</span>
              )}
              {sessionPrecedente && (
                <span className="text-[11px] text-slate-400">vs {sessionPrecedente.session.annee}</span>
              )}
            </div>
          </Card>

          {/* Indicateur 4 : Montant encaissé & Taux de recouvrement */}
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Montant encaissé
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Coins size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {FCFA.format(sessionActiveData?.montantEncaisse ?? 0)}
                </span>
                <span className="text-xs text-slate-500 font-bold">F CFA</span>
              </div>
              {/* Mini barre de recouvrement */}
              <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${sessionActiveData?.tauxRecouvrement ?? 0}%` }}
                />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              {diffEncaisse !== null && sessionPrecedente ? (
                diffEncaisse >= 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <TrendingUp size={13} />
                    +{FCFA.format(diffEncaisse)} F
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                    <TrendingDown size={13} />
                    {FCFA.format(diffEncaisse)} F
                  </span>
                )
              ) : (
                <span className="font-bold text-emerald-700">
                  {sessionActiveData?.tauxRecouvrement ?? 0}% recouvré
                </span>
              )}
              <span className="text-slate-500 font-medium">
                Reste : {FCFA.format(sessionActiveData?.soldeRestant ?? 0)} F
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── NIVEAU B. Visualisation Graphique : Comparatif des performances inter-sessions ── */}
      {sessionsTriees.length > 0 && (
        <ComparatifSessionsCentreGraphique
          nomCentre={centre.nom}
          centreId={centre.id}
          sessions={sessionsTriees}
          sessionActiveId={sessionActiveId}
          allApprenants={allApprenants}
          mouvementsParSession={mouvementsParSession}
        />
      )}

      {/* ── NIVEAU C. Historique détaillé des sessions ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden bg-white">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarRange size={18} className="text-brand-orange" />
              <span>Historique chiffré des sessions</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidation des effectifs, contrats souscrits et recouvrements par session académique
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {statsParSession.length} session{statsParSession.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Tableau compact comparatif */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <SortableHeader
                  label="Session"
                  columnKey="session"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="left"
                />
                <SortableHeader
                  label="Statut"
                  columnKey="statut"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="center"
                />
                <SortableHeader
                  label="Effectif"
                  columnKey="effectif"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="center"
                />
                <SortableHeader
                  label="Définitifs / Préinscriptions"
                  columnKey="definitifs"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="center"
                />
                <SortableHeader
                  label="Montant souscrit"
                  columnKey="souscrit"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="right"
                />
                <SortableHeader
                  label="Montant encaissé"
                  columnKey="encaisse"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="right"
                />
                <SortableHeader
                  label="Taux de recouvrement"
                  columnKey="taux"
                  currentSortColumn={triSessionColonne}
                  currentSortDirection={triSessionDirection}
                  onSort={handleTriSession}
                  align="center"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statsParSessionTriees.map((row) => {
                const idxChrono = statsParSession.findIndex((s) => s.session.id === row.session.id);
                const sessionPrec = idxChrono >= 0 ? statsParSession[idxChrono + 1] : null;
                const evol = sessionPrec
                  ? row.effectifTotal - sessionPrec.effectifTotal
                  : null;
                const estLigneActive = row.session.id === sessionActiveId;

                return (
                  <tr
                    key={row.session.id}
                    className={`transition-colors ${
                      estLigneActive
                        ? "bg-orange-50/30 hover:bg-orange-50/50"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{row.session.annee}</span>
                        {estLigneActive && (
                          <span className="rounded bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.2 uppercase">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          row.session.statut === "EN_COURS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {row.session.statut === "EN_COURS" ? "En cours" : "Clôturée"}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-black text-slate-900 text-sm tabular-nums">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{row.effectifTotal}</span>
                        {evol !== null && (
                          evol >= 0 ? (
                            <span className="text-[11px] font-bold text-emerald-700">
                              (+{evol})
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-700">
                              ({evol})
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center text-xs">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-emerald-800">{row.definitifs} déf.</span>
                        <span className="text-slate-300">/</span>
                        <span className="font-semibold text-amber-800">{row.preInscrits} pré.</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 tabular-nums">
                      {FCFA.format(row.montantSouscrit)} F
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-700 tabular-nums">
                      {FCFA.format(row.montantEncaisse)} F
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-14 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${row.tauxRecouvrement}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-xs tabular-nums w-8 text-right">
                          {row.tauxRecouvrement}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── NIVEAU C. Répartition par filière ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden bg-white">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <GraduationCap size={18} className="text-brand-orange" />
              <span>Répartition par filière</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ventilation des effectifs par formation pour la session sélectionnée
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500">Session :</span>
            <select
              value={sessionFiliereCourante?.session.id || ""}
              onChange={(e) => setSessionFiliereId(e.target.value)}
              aria-label="Sélectionner une session"
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-orange transition-colors"
            >
              {statsParSession.map((item) => (
                <option key={item.session.id} value={item.session.id}>
                  Session {item.session.annee} {item.session.id === sessionActiveId ? "(Active)" : ""}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-brand-orange border border-orange-200/60">
              {sessionFiliereCourante?.parFormation.length ?? 0} filière{(sessionFiliereCourante?.parFormation.length ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Tableau sobre des filières */}
        {!sessionFiliereCourante || sessionFiliereCourante.parFormation.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun élève inscrit dans les filières de ce centre pour cette session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 font-bold text-center w-12">#</th>
                  <th className="p-3 font-bold">Filière</th>
                  <th className="p-3 font-bold text-center">Effectif</th>
                  <th className="p-3 font-bold text-center">Définitifs / Préinscriptions</th>
                  <th className="p-3 font-bold text-left min-w-[200px]">
                    Part de l&rsquo;effectif ({sessionFiliereCourante.effectifTotal} élèves)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessionFiliereCourante.parFormation.map((item, index) => {
                  const part =
                    sessionFiliereCourante.effectifTotal > 0
                      ? Math.round((item.effectif / sessionFiliereCourante.effectifTotal) * 100)
                      : 0;

                  return (
                    <tr key={item.formation.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 text-center text-slate-400 font-bold tabular-nums">
                        {index + 1}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.formation.nom}
                      </td>
                      <td className="p-3.5 text-center font-black text-slate-900 text-sm tabular-nums">
                        {item.effectif}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-emerald-800">{item.definitifs} déf.</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-semibold text-amber-800">{item.preInscrits} pré.</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-orange rounded-full transition-all duration-300"
                              style={{ width: `${part}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-slate-700 tabular-nums w-10 text-right">
                            {part}%
                          </span>
                        </div>
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
  );
}

// Personnel rattaché au centre
function PersonnelDuCentre({
  personnel,
}: {
  personnel: ReturnType<typeof useUtilisateurs>["data"];
}) {
  const personnelList = personnel ?? [];
  const { data: enseignants = [] } = useEnseignants();

  // Détection de statut enseignant pour chaque membre du personnel
  const trouverEnseignantAssocie = (u: {
    id: string;
    email?: string | null;
    telephone?: string | null;
    nom: string;
    prenom: string;
  }) => {
    return enseignants.find(
      (e) =>
        e.id === u.id ||
        (u.email && e.email && e.email.toLowerCase() === u.email.toLowerCase()) ||
        (u.telephone && e.telephone && e.telephone === u.telephone) ||
        (e.nom.trim().toLowerCase() === u.nom.trim().toLowerCase() &&
          e.prenom.trim().toLowerCase() === u.prenom.trim().toLowerCase()),
    );
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Personnel Administratif &amp; Opérationnel
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Membres de l&rsquo;équipe assignés à la gestion de ce centre
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {personnelList.length} collaborateur{personnelList.length > 1 ? "s" : ""}
        </span>
      </div>

      {personnelList.length === 0 ? (
        <div className="p-12 text-center">
          <UserRound className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Aucun personnel rattaché à ce centre
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Les collaborateurs rattachés au centre apparaîtront automatiquement dans cette liste.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {personnelList.map((u) => {
            const enseignantAssocie = trouverEnseignantAssocie(u);
            return (
              <li key={u.id}>
                <Link
                  href={`/personnel/${u.id}`}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-amber-50/60 transition-colors group cursor-pointer"
                  title="Cliquer pour voir la fiche détaillée de ce personnel"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${getAvatarStyles(
                        `${u.prenom} ${u.nom}`,
                      )}`}
                    >
                      {getInitials(u.prenom, u.nom)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors truncate">
                          {u.prenom} {u.nom}
                        </p>
                        {enseignantAssocie && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-brand-orange border border-orange-200/80"
                            title="Ce collaborateur exerce également en tant qu'enseignant"
                          >
                            <GraduationCap size={12} />
                            Enseignant
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="bg-slate-100 text-slate-700 font-bold border border-slate-200/80 rounded-full px-3 py-1 text-xs">
                      {ROLE_LABELS[u.role]}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// Sessions rejointes par ce centre
function SessionsRejointes({
  centreId,
  sessionIds,
  peutRejoindreSession,
}: {
  centreId: string;
  sessionIds: string[];
  peutRejoindreSession: boolean;
}) {
  const { data: sessions, isLoading } = useSessions();
  const sessionsDuCentre = sessions?.filter((s) => sessionIds.includes(s.id));
  const sessionsDisponibles = sessions?.filter(
    (s) => !sessionIds.includes(s.id) && s.statut !== "CLOTUREE",
  );

  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  const rejoindre = useRejoindreSession();

  async function rejoindreSession(sessionId: string) {
    await rejoindre.mutateAsync({ id: centreId, sessionId });
    setSelecteurOuvert(false);
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <CalendarRange size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sessions Rejointes
            </h2>
            <p className="text-xs text-slate-400">
              Années académiques associées à ce centre
            </p>
          </div>
        </div>

        {peutRejoindreSession &&
          sessionsDisponibles &&
          sessionsDisponibles.length > 0 && (
            <button
              type="button"
              onClick={() => setSelecteurOuvert((o) => !o)}
              className="text-brand-orange hover:text-brand-orange/80 inline-flex items-center gap-1 text-xs font-bold transition-colors"
            >
              <Plus size={14} />
              Rejoindre une session
            </button>
          )}
      </div>

      {selecteurOuvert && (
        <div className="p-4 bg-purple-50/50 border-b border-purple-100/60 space-y-2">
          <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">
            Sélectionner une session disponible :
          </p>
          <div className="flex flex-wrap gap-2">
            {sessionsDisponibles?.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => rejoindreSession(session.id)}
                disabled={rejoindre.isPending}
                className="bg-white border border-purple-200 text-purple-900 hover:border-brand-orange hover:text-brand-orange rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {session.annee} -{" "}
                {session.statut === "EN_COURS" ? "En cours" : "Planifiée"}
              </button>
            ))}
          </div>
        </div>
      )}

      {rejoindre.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold border-b border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <span>Échec du rattachement à la session. Veuillez réessayer.</span>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {isLoading && (
          <p className="p-5 text-center text-xs text-slate-400">
            Chargement des sessions...
          </p>
        )}
        {!isLoading && sessionsDuCentre?.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-400">
            Ce centre n&rsquo;a rejoint aucune session pour l&rsquo;instant.
          </p>
        )}
        {sessionsDuCentre?.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {session.annee}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(session.dateDebut).toLocaleDateString("fr-FR")} -{" "}
                  {new Date(session.dateFin).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                session.statut === "EN_COURS"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  : session.statut === "PLANIFIEE"
                    ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {session.statut === "EN_COURS"
                ? "En cours"
                : session.statut === "PLANIFIEE"
                  ? "Planifiée"
                  : "Clôturée"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Localisation et historique des adresses
function InformationsDuCentre({
  centre,
  peutRelocaliser,
}: {
  centre: Centre;
  peutRelocaliser: boolean;
}) {
  const [ouvrirFormulaire, setOuvrirFormulaire] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const relocaliser = useRelocaliserCentre();
  const { data: historique, isLoading: chargementHistorique } =
    useLocalisations(centre.id);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RelocalisationFormValues>({
    resolver: zodResolver(relocalisationSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await relocaliser.mutateAsync({ id: centre.id, ...values });
      reset();
      setOuvrirFormulaire(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Relocalisation impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  const historiqueTrie = [...(historique ?? [])].sort(
    (a, b) =>
      new Date(b.dateDebutValidite).getTime() -
      new Date(a.dateDebutValidite).getTime(),
  );

  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-orange-50 text-brand-orange border border-orange-100">
            <MapPin size={18} />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Adresse &amp; Localisation
            </h3>
            <p className="text-xs text-slate-400">
              Emplacement géographique actuel du centre
            </p>
          </div>
        </div>

        {peutRelocaliser && (
          <Button
            type="button"
            variant="secondary"
            className="text-xs h-8 px-3 font-semibold"
            onClick={() => setOuvrirFormulaire((o) => !o)}
          >
            {ouvrirFormulaire ? "Annuler" : "Relocaliser"}
          </Button>
        )}
      </div>

      {!ouvrirFormulaire || !peutRelocaliser ? (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Adresse courante</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {centre.adresseActuelle}, {centre.villeActuelle}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
            Actuelle
          </span>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
          noValidate
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Nouvelle adresse"
              placeholder="Ex : Avenue Kennedy"
              error={errors.adresse?.message}
              {...register("adresse")}
            />
            <Input
              label="Nouvelle ville"
              placeholder="Ex : Yaoundé"
              error={errors.ville?.message}
              {...register("ville")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => setOuvrirFormulaire(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs font-bold">
              {isSubmitting ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
          {errors.root && (
            <p className="text-xs font-bold text-red-600">
              {errors.root.message}
            </p>
          )}
        </form>
      )}

      {/* Accordéon Historique */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setHistoriqueOuvert((o) => !o)}
          className="flex w-full items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
        >
          <span>Historique des adresses ({historiqueTrie.length})</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              historiqueOuvert ? "rotate-180 text-brand-orange" : "text-slate-400"
            }`}
          />
        </button>

        {historiqueOuvert && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200/70">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Adresse</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Ville</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Période</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargementHistorique && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Chargement...
                    </td>
                  </tr>
                )}
                {!chargementHistorique && historiqueTrie.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Aucun historique d&rsquo;adresse enregistré.
                    </td>
                  </tr>
                )}
                {historiqueTrie.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-2.5 font-semibold text-slate-900">{loc.adresse}</td>
                    <td className="p-2.5 text-slate-600">{loc.ville}</td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                      {new Date(loc.dateDebutValidite).toLocaleDateString("fr-FR")}{" "}
                      -{" "}
                      {loc.dateFinValidite
                        ? new Date(loc.dateFinValidite).toLocaleDateString("fr-FR")
                        : "Aujourd'hui"}
                    </td>
                    <td className="p-2.5">
                      {loc.dateFinValidite ? (
                        <span className="text-slate-400 font-medium">Archivée</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 border border-emerald-200/60">
                          Actuelle
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

// Formations & Salles associées
function FormationsEtSalles({
  centreId,
  sessionId,
  rejointSessionActive,
  peutGererAcademique,
  peutAbonnerFormations,
  peutGererSalles,
}: {
  centreId: string;
  sessionId: string | undefined;
  rejointSessionActive: boolean;
  peutGererAcademique: boolean;
  peutAbonnerFormations?: boolean;
  peutGererSalles?: boolean;
}) {
  const droitAbonner = peutAbonnerFormations ?? peutGererAcademique;
  const droitSalles = peutGererSalles ?? peutGererAcademique;

  const { data: formationsDuCentre = [], isLoading: chargementFormations } =
    useFormationsAbonneesCentre(centreId, sessionId);
  const { data: catalogueFormations = [] } = useFormations();
  const { data: salles = [] } = useSalles(sessionId);
  const rejoindreSession = useRejoindreSession();

  const [modalAbonnementOuvert, setModalAbonnementOuvert] = useState(false);

  const formationsAbonneesIds = useMemo(
    () => new Set(formationsDuCentre.map((f) => f.id)),
    [formationsDuCentre],
  );

  const sallesDuCentre = useMemo(() => {
    if (!rejointSessionActive) return [];
    return salles.filter(
      (s) =>
        s.centreId === centreId && formationsAbonneesIds.has(s.formationId),
    );
  }, [salles, centreId, rejointSessionActive, formationsAbonneesIds]);

  // Formations disponibles à l'abonnement
  const formationsDisponibles = useMemo(() => {
    return catalogueFormations.filter(
      (f) => !formationsDuCentre.some((fa) => fa.id === f.id),
    );
  }, [catalogueFormations, formationsDuCentre]);

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-50 text-brand-orange border border-orange-100">
              <GraduationCap size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Formations &amp; Salles
              </h2>
              <p className="text-xs text-slate-400">
                Filières et salles de cours hébergées dans ce centre pour la session active
              </p>
            </div>
          </div>

          {droitAbonner && rejointSessionActive && (
            <Button
              type="button"
              className="text-xs h-8 px-3 font-semibold flex items-center gap-1.5"
              onClick={() => setModalAbonnementOuvert(true)}
            >
              <Plus size={14} />
              Abonner à une formation
            </Button>
          )}
        </div>

        {droitAbonner && !rejointSessionActive && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p>
                Ce centre n&rsquo;a pas encore rejoint la session active. Veuillez d&rsquo;abord rattacher ce centre à la session active pour l&rsquo;abonner à des formations et aménager des salles.
              </p>
            </div>
            {sessionId && (
              <Button
                type="button"
                variant="secondary"
                disabled={rejoindreSession.isPending}
                onClick={async () => {
                  await rejoindreSession.mutateAsync({ id: centreId, sessionId });
                }}
                className="shrink-0 text-xs font-semibold bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 h-8 px-3"
              >
                <CalendarRange size={13} className="mr-1.5" />
                Rattacher à la session active
              </Button>
            )}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {chargementFormations && (
            <p className="p-6 text-center text-xs text-slate-400">
              Chargement des formations du centre...
            </p>
          )}
          {!chargementFormations && formationsDuCentre.length === 0 && (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200">
              <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">
                Aucune formation abonnée pour ce centre
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {rejointSessionActive
                  ? "Abonnez ce centre aux formations du catalogue pour y rattacher des salles et des cours."
                  : "Rattachez d'abord ce centre à la session active pour pouvoir l'abonner."}
              </p>
              {droitAbonner && rejointSessionActive && (
                <Button
                  type="button"
                  onClick={() => setModalAbonnementOuvert(true)}
                  className="mt-3 text-xs inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Abonner à une formation
                </Button>
              )}
            </div>
          )}

          {formationsDuCentre.map((formation) => (
            <CarteFormation
              key={formation.id}
              formation={formation}
              autresFormationsDuCentre={
                formationsDuCentre.filter((f) => f.id !== formation.id)
              }
              salles={
                sallesDuCentre.filter((s) => s.formationId === formation.id)
              }
              centreId={centreId}
              sessionId={sessionId}
              peutDesabonner={droitAbonner}
              peutGererSalles={droitSalles}
            />
          ))}
        </div>
      </Card>

      {modalAbonnementOuvert && (
        <ModalAbonnerCentreFormation
          isOpen={modalAbonnementOuvert}
          onClose={() => setModalAbonnementOuvert(false)}
          centreId={centreId}
          sessionId={sessionId}
          formationsDisponibles={formationsDisponibles}
        />
      )}
    </div>
  );
}

function ModalAbonnerCentreFormation({
  isOpen,
  onClose,
  centreId,
  sessionId,
  formationsDisponibles,
}: {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  sessionId: string | undefined;
  formationsDisponibles: Formation[];
}) {
  const [formationSelectionneeId, setFormationSelectionneeId] = useState<string>("");
  const [erreur, setErreur] = useState<string | null>(null);
  const abonnerCentre = useAbonnerCentreFormation();

  async function handleAbonner() {
    if (!sessionId || !formationSelectionneeId) return;
    setErreur(null);
    try {
      await abonnerCentre.mutateAsync({
        centreId,
        sessionId,
        formationId: formationSelectionneeId,
      });
      setFormationSelectionneeId("");
      onClose();
    } catch (err) {
      setErreur(
        messageErreurApi(
          err,
          "Impossible d'abonner le centre à cette formation.",
        ),
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Abonner à une formation"
      description="Sélectionnez une filière du catalogue permanent pour l'activer dans ce centre pour la session en cours."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-2">
        {erreur && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {formationsDisponibles.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-200">
            <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">
              Toutes les formations du catalogue sont déjà rattachées à ce centre.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Choisir une formation parmi le catalogue *
            </label>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {formationsDisponibles.map((formation) => {
                const estSelectionnee = formationSelectionneeId === formation.id;
                const nbMatieres = formation.matiereIds?.length || 0;

                return (
                  <label
                    key={formation.id}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                      estSelectionnee ? "bg-orange-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="formationAbonnement"
                        checked={estSelectionnee}
                        onChange={() => setFormationSelectionneeId(formation.id)}
                        className="text-brand-orange focus:ring-brand-orange h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {formation.nom}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {nbMatieres} matière{nbMatieres > 1 ? "s" : ""} au programme
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
            Annuler
          </Button>
          {formationsDisponibles.length > 0 && (
            <Button
              type="button"
              disabled={!formationSelectionneeId || abonnerCentre.isPending || !sessionId}
              onClick={handleAbonner}
              className="text-xs font-bold"
            >
              {abonnerCentre.isPending ? "Abonnement..." : "Confirmer l'abonnement"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const nomInlineSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
});
type NomInlineFormValues = z.infer<typeof nomInlineSchema>;

function CarteFormation({
  formation,
  autresFormationsDuCentre,
  salles,
  centreId,
  sessionId,
  peutDesabonner = true,
  peutGererSalles = true,
}: {
  formation: Formation;
  autresFormationsDuCentre: Formation[];
  salles: Salle[];
  centreId: string;
  sessionId: string | undefined;
  peutDesabonner?: boolean;
  peutGererSalles?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [confirmationDesabonnement, setConfirmationDesabonnement] = useState(false);
  const [erreurDesabonnement, setErreurDesabonnement] = useState<string | null>(null);

  const creerSalle = useCreateSalle();
  const desabonnerCentre = useDesabonnerCentreFormation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof nomInlineSchema>>({
    resolver: zodResolver(nomInlineSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!sessionId) return;
    try {
      await creerSalle.mutateAsync({
        nom: values.nom,
        centreId,
        sessionId,
        formationId: formation.id,
      });
      reset();
      setAjoutOuvert(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Création impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  async function confirmerDesabonnement() {
    if (!sessionId) return;
    setErreurDesabonnement(null);
    try {
      await desabonnerCentre.mutateAsync({
        centreId,
        sessionId,
        formationId: formation.id,
      });
      setConfirmationDesabonnement(false);
    } catch (erreur) {
      setErreurDesabonnement(
        messageErreurApi(
          erreur,
          "Impossible de désabonner le centre de cette formation. Des salles y sont peut-être encore rattachées.",
        ),
      );
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300">
      <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/40">
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange shrink-0">
            <GraduationCap size={16} />
          </div>

          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            className="text-sm font-bold text-slate-800 hover:text-brand-orange text-left truncate flex-1"
          >
            {formation.nom}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {salles.length} salle{salles.length > 1 ? "s" : ""}
          </span>

          {peutDesabonner && (
            <button
              type="button"
              onClick={() => {
                setErreurDesabonnement(null);
                setConfirmationDesabonnement(true);
              }}
              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
              title="Désabonner le centre de cette formation"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${
                ouvert ? "rotate-180 text-brand-orange" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {confirmationDesabonnement && (
        <div className="m-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
          <p className="font-bold">
            Désabonner le centre de la formation « {formation.nom} » ?
          </p>
          {salles.length > 0 ? (
            <p className="text-red-700 text-[11px]">
              Impossible de désabonner le centre : il possède encore {salles.length} salle(s) rattachée(s) à cette formation. Veuillez d&rsquo;abord supprimer ou réaffecter ces salles.
            </p>
          ) : (
            <p className="text-slate-600 text-[11px]">
              Cette action retirera cette filière de ce centre pour la session en cours.
            </p>
          )}

          {erreurDesabonnement && (
            <p className="text-red-600 font-semibold text-[11px]">
              {erreurDesabonnement}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {salles.length === 0 && (
              <button
                type="button"
                onClick={confirmerDesabonnement}
                disabled={desabonnerCentre.isPending}
                className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs hover:bg-red-700 disabled:opacity-50"
              >
                {desabonnerCentre.isPending ? "Désabonnement..." : "Confirmer le désabonnement"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setConfirmationDesabonnement(false);
                setErreurDesabonnement(null);
              }}
              className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-white"
            >
              {salles.length > 0 ? "Fermer" : "Annuler"}
            </button>
          </div>
        </div>
      )}

      {ouvert && (
        <div className="p-3.5 border-t border-slate-100 bg-white space-y-3">
          {salles.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Aucune salle configurée pour cette formation.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {salles.map((salle) => (
                <SalleItem
                  key={salle.id}
                  salle={salle}
                  autresFormationsDuCentre={autresFormationsDuCentre}
                  peutGerer={peutGererSalles}
                />
              ))}
            </ul>
          )}

          {peutGererSalles &&
            (ajoutOuvert ? (
              <form
                onSubmit={onSubmit}
                className="flex items-center gap-2 pt-1"
                noValidate
              >
                <input
                  autoFocus
                  placeholder="Nom de la salle (ex: Salle 102)"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                  {...register("nom")}
                />
                <Button type="submit" disabled={isSubmitting || !sessionId} className="text-xs h-8 px-3">
                  {isSubmitting ? "..." : "Ajouter"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    reset();
                    setAjoutOuvert(false);
                  }}
                  className="text-xs h-8 px-3"
                >
                  Annuler
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAjoutOuvert(true)}
                disabled={!sessionId}
                className="w-full py-2 rounded-lg border border-dashed border-slate-200 text-xs font-semibold text-slate-500 hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={13} />
                Ajouter une salle
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// Salle individuelle
function SalleItem({
  salle,
  autresFormationsDuCentre,
  peutGerer,
}: {
  salle: Salle;
  autresFormationsDuCentre: Formation[];
  peutGerer: boolean;
}) {
  const [renommageOuvert, setRenommageOuvert] = useState(false);
  const [reaffectationOuverte, setReaffectationOuverte] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);

  const renommerSalle = useRenommerSalle();
  const reaffecterFormation = useReaffecterFormationSalle();
  const supprimerSalle = useSupprimerSalle();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<NomInlineFormValues>({ resolver: zodResolver(nomInlineSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await renommerSalle.mutateAsync({ id: salle.id, ...values });
      setRenommageOuvert(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Renommage impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  async function reaffecter(formationId: string) {
    await reaffecterFormation.mutateAsync({ id: salle.id, formationId });
    setReaffectationOuverte(false);
  }

  async function confirmerSuppression() {
    await supprimerSalle.mutateAsync(salle.id);
  }

  if (renommageOuvert) {
    return (
      <li className="p-2 bg-slate-50">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2"
          noValidate
        >
          <DoorOpen size={14} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-800"
            defaultValue={salle.nom}
            {...register("nom")}
          />
          <Button type="submit" disabled={isSubmitting} className="text-xs h-7 px-2">
            OK
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              setRenommageOuvert(false);
            }}
            className="text-xs h-7 px-2"
          >
            Annuler
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors">
      <div className="flex items-center gap-2">
        <DoorOpen size={14} className="text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-800">{salle.nom}</span>
      </div>

      {peutGerer && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              reset({ nom: salle.nom });
              setRenommageOuvert(true);
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            title="Renommer la salle"
          >
            <Pencil size={12} />
          </button>
          {autresFormationsDuCentre.length > 0 && (
            <button
              type="button"
              onClick={() => setReaffectationOuverte((o) => !o)}
              className="p-1 text-slate-400 hover:text-brand-orange rounded transition-colors"
              title="Déplacer vers une autre formation"
            >
              <ArrowRightLeft size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmationSuppression(true)}
            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
            title="Supprimer la salle"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {reaffectationOuverte && (
        <div className="w-full mt-2 p-2 rounded-lg bg-orange-50/50 border border-orange-100 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 w-full">
            Déplacer vers :
          </span>
          {autresFormationsDuCentre.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => reaffecter(f.id)}
              disabled={reaffecterFormation.isPending}
              className="px-2 py-0.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:border-brand-orange hover:text-brand-orange"
            >
              {f.nom}
            </button>
          ))}
        </div>
      )}

      {confirmationSuppression && (
        <div className="w-full mt-2 p-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-800 flex items-center justify-between">
          <span>Supprimer « {salle.nom} » ?</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={confirmerSuppression}
              disabled={supprimerSalle.isPending}
              className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[11px]"
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setConfirmationSuppression(false)}
              className="px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700 text-[11px]"
            >
              Non
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
