"use client";

import { useState, useMemo, Fragment } from "react";
import {
  Banknote,
  CalendarRange,
  Users,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Search,
  ChevronDown,
  ChevronRight,
  Printer,
  Settings2,
  CheckCheck,
} from "lucide-react";
import { SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";
import {
  useSessions,
  useSessionActive,
} from "@/modules/centres-sessions/data/queries";
import {
  useBordereauxEnseignant,
  useBordereauxPaiePersonnel,
  useExecuterPaiementFiche,
} from "@/modules/remuneration/data/queries";
import { usePersonnelList } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { ROLE_LABELS, type Role } from "@/types/roles";
import { BordereauPlanifieModal } from "./BordereauPlanifieModal";
import { FichePaieModal } from "./FichePaieModal";
import { BordereauPrintModal } from "./BordereauPrintModal";
import { BordereauPersonnelPlanifieModal } from "./BordereauPersonnelPlanifieModal";
import { GestionSalairesPersonnelModal } from "./GestionSalairesPersonnelModal";
import {
  FichePaiePersonnelModal,
  type FichePaiePersonnelData,
} from "./FichePaiePersonnelModal";
import { BordereauPersonnelPrintModal } from "./BordereauPersonnelPrintModal";
import type {
  BordereauPaieEnseignantDetail,
  BordereauPaiePersonnel,
} from "@/modules/remuneration/domain/types";
import { formatVolumeHoraire } from "@/modules/remuneration/domain/volumeHoraire";

function formatDatePaiement(dateStr?: string | null) {
  if (!dateStr) return "Date non définie";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function PaieView() {
  const { data: sessions = [], isLoading: loadingSessions } = useSessions();
  const { data: sessionActive } = useSessionActive();

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"enseignants" | "personnel">(
    "enseignants",
  );

  // Active session resolution
  const effectiveSessionId =
    selectedSessionId || sessionActive?.id || sessions[0]?.id || "";
  const currentSession = sessions.find((s) => s.id === effectiveSessionId);

  // Modals state for Teachers
  const [isPlanifierModalOpen, setIsPlanifierModalOpen] = useState(false);
  const [selectedFicheId, setSelectedFicheId] = useState<string | null>(null);
  const [printBordereauId, setPrintBordereauId] = useState<string | null>(null);

  // Modals state for Personnel
  const [isPlanifierPersonnelOpen, setIsPlanifierPersonnelOpen] = useState(false);
  const [isGestionSalairesOpen, setIsGestionSalairesOpen] = useState(false);
  const [selectedPersonnelBordereauId, setSelectedPersonnelBordereauId] =
    useState<string | null>(null);
  const [selectedPersonnelFiche, setSelectedPersonnelFiche] =
    useState<FichePaiePersonnelData | null>(null);
  const [printPersonnelBordereau, setPrintPersonnelBordereau] =
    useState<BordereauPaiePersonnel | null>(null);
  const [personnelSearch, setPersonnelSearch] = useState("");

  // Data queries
  const {
    data: bordereauxEnseignants = [],
    isLoading: loadingBordereaux,
    refetch: refetchBordereaux,
  } = useBordereauxEnseignant(effectiveSessionId);

  const {
    data: bordereauxPersonnel = [],
    isLoading: loadingPersonnelBordereaux,
    refetch: refetchPersonnelBordereaux,
  } = useBordereauxPaiePersonnel(effectiveSessionId);

  const { data: personnelList = [] } = usePersonnelList();
  const { data: utilisateurs = [] } = useUtilisateurs();

  const personnelMap = useMemo(() => {
    const map = new Map<string, (typeof personnelList)[0]>();
    personnelList.forEach((p) => map.set(p.id, p));
    return map;
  }, [personnelList]);

  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    utilisateurs.forEach((u) => {
      if (u.id && u.role) {
        map.set(u.id, u.role as Role);
      }
    });
    return map;
  }, [utilisateurs]);

  const activePersonnelBordereau = useMemo(() => {
    if (!bordereauxPersonnel || bordereauxPersonnel.length === 0) return undefined;
    if (selectedPersonnelBordereauId) {
      const found = bordereauxPersonnel.find(
        (b) => b.id === selectedPersonnelBordereauId
      );
      if (found) return found;
    }
    return bordereauxPersonnel[0];
  }, [bordereauxPersonnel, selectedPersonnelBordereauId]);

  const totalPersonnelDecaisse = useMemo(() => {
    return bordereauxPersonnel.reduce(
      (sum, b) => sum + Number(b.montantTotalGlobal || 0),
      0
    );
  }, [bordereauxPersonnel]);

  const totalPersonnelsRemuneres = useMemo(() => {
    return bordereauxPersonnel.reduce(
      (sum, b) => sum + Number(b.nombrePersonnelsPayes || 0),
      0
    );
  }, [bordereauxPersonnel]);

  type TriPersonnelFicheColonne = "collaborateur" | "role" | "salaireRef" | "montantPaye";
  const [triPersonnelColonne, setTriPersonnelColonne] = useState<TriPersonnelFicheColonne>("collaborateur");
  const [triPersonnelDirection, setTriPersonnelDirection] = useState<SortDirection>("asc");

  function handleTriPersonnel(colonne: TriPersonnelFicheColonne) {
    if (triPersonnelColonne === colonne) {
      setTriPersonnelDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriPersonnelColonne(colonne);
      setTriPersonnelDirection(
        colonne === "salaireRef" || colonne === "montantPaye" ? "desc" : "asc",
      );
    }
  }

  const filteredPersonnelFiches = useMemo(() => {
    if (!activePersonnelBordereau?.fiches) return [];
    const q = personnelSearch.toLowerCase();
    const list = !personnelSearch.trim()
      ? activePersonnelBordereau.fiches
      : activePersonnelBordereau.fiches.filter((f) => {
          const p = personnelMap.get(f.personnelId);
          const role = roleMap.get(f.personnelId);
          const nomComplet = p ? `${p.nom} ${p.prenom}`.toLowerCase() : "";
          const email = p?.email?.toLowerCase() || "";
          const roleLabel = role ? ROLE_LABELS[role].toLowerCase() : "";
          const obs = f.observations?.toLowerCase() || "";
          return (
            nomComplet.includes(q) ||
            email.includes(q) ||
            roleLabel.includes(q) ||
            obs.includes(q)
          );
        });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triPersonnelColonne === "collaborateur") {
        const pA = personnelMap.get(a.personnelId);
        const pB = personnelMap.get(b.personnelId);
        const nomA = pA ? `${pA.nom} ${pA.prenom}` : "";
        const nomB = pB ? `${pB.nom} ${pB.prenom}` : "";
        cmp = compareStrings(nomA, nomB);
      } else if (triPersonnelColonne === "role") {
        const roleA = roleMap.get(a.personnelId) ? ROLE_LABELS[roleMap.get(a.personnelId)!] : "";
        const roleB = roleMap.get(b.personnelId) ? ROLE_LABELS[roleMap.get(b.personnelId)!] : "";
        cmp = compareStrings(roleA, roleB);
      } else if (triPersonnelColonne === "salaireRef") {
        cmp = compareNumbers(a.salaireReference, b.salaireReference);
      } else if (triPersonnelColonne === "montantPaye") {
        cmp = compareNumbers(a.montantPaye, b.montantPaye);
      }
      return triPersonnelDirection === "asc" ? cmp : -cmp;
    });
  }, [
    activePersonnelBordereau,
    personnelSearch,
    personnelMap,
    roleMap,
    triPersonnelColonne,
    triPersonnelDirection,
  ]);

  // Selected bordereau state
  const [selectedBordereauId, setSelectedBordereauId] = useState<string | null>(
    null,
  );
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherStatutFilter, setTeacherStatutFilter] = useState<
    "TOUS" | "PROGRAMMEE" | "PAYEE"
  >("TOUS");
  const [expandedFicheId, setExpandedFicheId] = useState<string | null>(null);

  type TriEnseignantFicheColonne =
    | "enseignant"
    | "departement"
    | "seances"
    | "totalNet"
    | "statut";
  const [triEnseignantColonne, setTriEnseignantColonne] =
    useState<TriEnseignantFicheColonne>("enseignant");
  const [triEnseignantDirection, setTriEnseignantDirection] =
    useState<SortDirection>("asc");

  function handleTriEnseignant(colonne: TriEnseignantFicheColonne) {
    if (triEnseignantColonne === colonne) {
      setTriEnseignantDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriEnseignantColonne(colonne);
      setTriEnseignantDirection(
        colonne === "seances" || colonne === "totalNet" ? "desc" : "asc",
      );
    }
  }

  const activeBordereau: BordereauPaieEnseignantDetail | undefined =
    useMemo(() => {
      if (!bordereauxEnseignants || bordereauxEnseignants.length === 0)
        return undefined;
      if (selectedBordereauId) {
        const found = bordereauxEnseignants.find(
          (b) => b.id === selectedBordereauId,
        );
        if (found) return found;
      }
      return bordereauxEnseignants[0];
    }, [bordereauxEnseignants, selectedBordereauId]);

  // Métriques consolidées du bordereau actif (paiements, totaux, statut global)
  const bordereauStats = useMemo(() => {
    if (!activeBordereau?.fiches) return null;
    const fiches = activeBordereau.fiches;
    const totalEnseignants = fiches.length;
    const fichesPayees = fiches.filter((f) => f.statut === "PAYEE");
    const nombrePayes = fichesPayees.length;
    const montantPaye = fichesPayees.reduce(
      (acc, f) => acc + Number(f.montantTotal || 0),
      0,
    );
    const montantTotal = Number(activeBordereau.montantTotalGlobal || 0);

    let statutGlobal: "PAYE" | "PARTIEL" | "EN_ATTENTE" = "EN_ATTENTE";
    if (totalEnseignants > 0 && nombrePayes === totalEnseignants) {
      statutGlobal = "PAYE";
    } else if (nombrePayes > 0) {
      statutGlobal = "PARTIEL";
    }

    return {
      totalEnseignants,
      nombrePayes,
      montantPaye,
      montantTotal,
      statutGlobal,
    };
  }, [activeBordereau]);

  // Execute payment mutation
  const executerPaiementMutation = useExecuterPaiementFiche();
  const [executingFicheId, setExecutingFicheId] = useState<string | null>(null);

  const handleExecuterPaiement = async (
    bordereauId: string,
    ficheId: string,
  ) => {
    setExecutingFicheId(ficheId);
    try {
      await executerPaiementMutation.mutateAsync({
        bordereauId,
        ficheId,
        executePar: "CAISSIER",
      });
      await refetchBordereaux();
    } finally {
      setExecutingFicheId(null);
    }
  };

  const filteredFiches = useMemo(() => {
    if (!activeBordereau?.fiches) return [];
    const q = teacherSearch.toLowerCase().trim();
    let list = activeBordereau.fiches;

    if (q) {
      list = list.filter(
        (f) =>
          f.enseignantNom.toLowerCase().includes(q) ||
          f.enseignantPrenom.toLowerCase().includes(q) ||
          f.enseignantMatricule.toLowerCase().includes(q) ||
          f.departementNom.toLowerCase().includes(q),
      );
    }

    if (teacherStatutFilter !== "TOUS") {
      list = list.filter((f) => f.statut === teacherStatutFilter);
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triEnseignantColonne === "enseignant") {
        const nomA = `${a.enseignantNom} ${a.enseignantPrenom}`;
        const nomB = `${b.enseignantNom} ${b.enseignantPrenom}`;
        cmp = compareStrings(nomA, nomB);
      } else if (triEnseignantColonne === "departement") {
        cmp = compareStrings(a.departementNom, b.departementNom);
      } else if (triEnseignantColonne === "seances") {
        cmp = compareNumbers(a.nombreSeances, b.nombreSeances);
      } else if (triEnseignantColonne === "totalNet") {
        cmp = compareNumbers(a.montantTotal, b.montantTotal);
      } else if (triEnseignantColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      }
      return triEnseignantDirection === "asc" ? cmp : -cmp;
    });
  }, [
    activeBordereau,
    teacherSearch,
    teacherStatutFilter,
    triEnseignantColonne,
    triEnseignantDirection,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Rémunération & Paie
            </h1>
            <span className="text-brand-orange rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold">
              Session {currentSession?.annee || "En cours"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Programmation des bordereaux, ajustements des contrats et exécution
            des paiements ligne par ligne.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Session Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            <select
              value={effectiveSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setSelectedBordereauId(null);
              }}
              disabled={loadingSessions}
              className="cursor-pointer bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.annee}{" "}
                  {s.statut === "EN_COURS" ? "(En cours)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button: Programmer une paie (Enseignants) */}
          {activeTab === "enseignants" && (
            <button
              onClick={() => setIsPlanifierModalOpen(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Programmer une paie</span>
            </button>
          )}

          {/* Action Buttons: Personnel Administratif */}
          {activeTab === "personnel" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGestionSalairesOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Settings2 className="h-4 w-4 text-slate-500" />
                <span>Salaires de référence</span>
              </button>
              <button
                onClick={() => setIsPlanifierPersonnelOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-500 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span>Programmer la paie</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("enseignants")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "enseignants"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Enseignants Vacataires</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {bordereauxEnseignants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("personnel")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "personnel"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Personnel Administratif</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {bordereauxPersonnel.length}
          </span>
        </button>
      </div>

      {/* Content for Enseignants */}
      {activeTab === "enseignants" && (
        <div className="space-y-6">
          {loadingBordereaux ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-3">
                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-2 w-full rounded bg-slate-200" />
                </div>
                <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-2 w-full rounded bg-slate-200" />
                </div>
              </div>
              <div className="space-y-4 lg:col-span-2">
                <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="h-6 w-1/3 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                </div>
                <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ) : bordereauxEnseignants.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center">
              <div className="text-brand-orange mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                <Banknote className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Aucun bordereau de paie pour cette session
              </h3>
              <p className="mt-1 mb-6 max-w-md text-sm text-slate-500">
                Lancez la programmation de la paie pour collecter les séances
                effectuées par les enseignants, ajuster les coûts et générer la
                sortie financière.
              </p>
              <button
                onClick={() => setIsPlanifierModalOpen(true)}
                className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Programmer le premier bordereau</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: List of Bordereaux */}
              <div className="space-y-3">
                <h3 className="px-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Bordereaux de la session ({bordereauxEnseignants.length})
                </h3>

                <div className="space-y-2.5">
                  {bordereauxEnseignants.map((b) => {
                    const isSelected = activeBordereau?.id === b.id;
                    const paidCount = b.fiches.filter(
                      (f) => f.statut === "PAYEE",
                    ).length;
                    const isFullyPaid =
                      paidCount === b.fiches.length && b.fiches.length > 0;
                    const progressPercent =
                      b.fiches.length > 0
                        ? (paidCount / b.fiches.length) * 100
                        : 0;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBordereauId(b.id)}
                        className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-brand-orange bg-orange-50/50 shadow-2xs ring-1 ring-brand-orange"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.reference}
                          </span>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              Payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-2.5 w-2.5 text-amber-600" />
                              {paidCount}/{b.fiches.length} payé(s)
                            </span>
                          )}
                        </div>

                        <div className="mb-2.5 text-xs text-slate-500">
                          Prévu le {formatDatePaiement(b.datePaiement)} • {b.nombreTotalEnseignants} ens.
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFullyPaid ? "bg-emerald-500" : "bg-brand-orange"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
                          <span className="text-slate-400">Total</span>
                          <span className="font-mono font-bold text-slate-900">
                            {Number(b.montantTotalGlobal).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            FCFA
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Bordereau Detail */}
              {activeBordereau && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs lg:col-span-2">
                  {/* 2. En-tête simplifié du bordereau */}
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="font-mono text-base font-bold text-slate-900">
                            {activeBordereau.reference}
                          </h2>
                          {bordereauStats?.statutGlobal === "PAYE" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Payé
                            </span>
                          ) : bordereauStats?.statutGlobal === "PARTIEL" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Partiellement payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              <Clock className="h-3 w-3 text-slate-500" />
                              En attente
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Date de paiement prévue :{" "}
                          <span className="font-medium text-slate-700">
                            {formatDatePaiement(activeBordereau.datePaiement)}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => setPrintBordereauId(activeBordereau.id)}
                        title="Imprimer le bordereau"
                        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        <span>Imprimer</span>
                      </button>
                    </div>

                    {/* Synthèse globale : Montant total affiché une seule fois */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-600">
                        <div>
                          <span className="text-slate-400">Enseignants : </span>
                          <span className="font-semibold text-slate-800">
                            {bordereauStats?.totalEnseignants ?? activeBordereau.fiches.length}
                          </span>
                        </div>
                        <span className="text-slate-200">•</span>
                        <div>
                          <span className="text-slate-400">Paiements effectués : </span>
                          <span className="font-semibold text-slate-800">
                            {bordereauStats?.nombrePayes ?? 0} sur {bordereauStats?.totalEnseignants ?? 0}
                          </span>
                          {bordereauStats && bordereauStats.montantPaye > 0 && (
                            <span className="ml-1 font-mono text-emerald-700 font-medium">
                              ({bordereauStats.montantPaye.toLocaleString("fr-FR")} FCFA)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Montant total affiché une seule fois */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-500">Montant total :</span>
                        <span className="font-mono text-base font-bold text-slate-900">
                          {Number(activeBordereau.montantTotalGlobal).toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de recherche et filtres de traitement */}
                  <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                      <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, matricule ou matière..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-800 placeholder-slate-400 transition focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setTeacherStatutFilter("TOUS")}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                          teacherStatutFilter === "TOUS"
                            ? "bg-slate-800 text-white"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        Tous ({activeBordereau.fiches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherStatutFilter("PROGRAMMEE")}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                          teacherStatutFilter === "PROGRAMMEE"
                            ? "bg-amber-600 text-white"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        À payer ({activeBordereau.fiches.filter((f) => f.statut === "PROGRAMMEE").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherStatutFilter("PAYEE")}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                          teacherStatutFilter === "PAYEE"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        Payés ({activeBordereau.fiches.filter((f) => f.statut === "PAYEE").length})
                      </button>
                    </div>
                  </div>

                  {/* 3. Tableau simplifié des enseignants */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                        <tr>
                          <SortableHeader
                            label="Enseignant"
                            sortKey="enseignant"
                            currentSortKey={triEnseignantColonne}
                            direction={triEnseignantDirection}
                            onSort={handleTriEnseignant}
                            className="py-3 pl-5"
                          />
                          <SortableHeader
                            label="Département"
                            sortKey="departement"
                            currentSortKey={triEnseignantColonne}
                            direction={triEnseignantDirection}
                            onSort={handleTriEnseignant}
                            className="py-3 px-3"
                          />
                          <SortableHeader
                            label="Séances / Volume"
                            sortKey="seances"
                            currentSortKey={triEnseignantColonne}
                            direction={triEnseignantDirection}
                            onSort={handleTriEnseignant}
                            align="center"
                            className="py-3 px-3"
                          />
                          <SortableHeader
                            label="Net à payer"
                            sortKey="totalNet"
                            currentSortKey={triEnseignantColonne}
                            direction={triEnseignantDirection}
                            onSort={handleTriEnseignant}
                            align="right"
                            className="py-3 px-3"
                          />
                          <SortableHeader
                            label="Statut"
                            sortKey="statut"
                            currentSortKey={triEnseignantColonne}
                            direction={triEnseignantDirection}
                            onSort={handleTriEnseignant}
                            align="center"
                            className="py-3 px-3"
                          />
                          <th className="py-3 pr-5 pl-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredFiches.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-10 text-center text-xs text-slate-400"
                            >
                              Aucun enseignant ne correspond aux critères.
                            </td>
                          </tr>
                        ) : (
                          filteredFiches.map((fiche) => {
                            const isPayingThis = executingFicheId === fiche.id;
                            const isExpanded = expandedFicheId === fiche.id;

                            return (
                              <Fragment key={fiche.id}>
                                <tr
                                  className={`transition-colors ${
                                    isExpanded
                                      ? "bg-orange-50/30"
                                      : "hover:bg-slate-50/70"
                                  }`}
                                >
                                  {/* Enseignant : nom, prénom et matricule */}
                                  <td className="py-3 pr-3 pl-5">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedFicheId(
                                            isExpanded ? null : fiche.id,
                                          )
                                        }
                                        className={`rounded p-1 transition-colors ${
                                          isExpanded
                                            ? "text-brand-orange bg-orange-100"
                                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                        }`}
                                        title={
                                          isExpanded
                                            ? "Masquer les séances"
                                            : "Consulter les séances"
                                        }
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          {fiche.enseignantNom} {fiche.enseignantPrenom}
                                        </p>
                                        <p className="font-mono text-[11px] text-slate-400">
                                          {fiche.enseignantMatricule || "Sans matricule"}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Département ou matière */}
                                  <td className="px-3 py-3 text-slate-600">
                                    <span className="font-medium text-slate-700">
                                      {fiche.departementNom}
                                    </span>
                                  </td>

                                  {/* Nombre de séances ou volume horaire */}
                                  <td className="px-3 py-3 text-center">
                                    <span className="font-semibold text-slate-800">
                                      {fiche.nombreSeances} sc.
                                    </span>
                                    <span className="ml-1 text-[11px] text-slate-400">
                                      ({formatVolumeHoraire(fiche.nombreSeances)})
                                    </span>
                                  </td>

                                  {/* Montant net à payer */}
                                  <td className="px-3 py-3 text-right">
                                    <span className="font-mono font-bold text-slate-900">
                                      {Number(fiche.montantTotal).toLocaleString("fr-FR")}{" "}
                                      FCFA
                                    </span>
                                  </td>

                                  {/* Statut du paiement */}
                                  <td className="px-3 py-3 text-center">
                                    {fiche.statut === "PAYEE" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Payé
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                        <Clock className="h-3 w-3" />
                                        À payer
                                      </span>
                                    )}
                                  </td>

                                  {/* Action disponible selon le statut */}
                                  <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {fiche.statut === "PROGRAMMEE" ? (
                                        <>
                                          {/* Action principale : Payer */}
                                          <button
                                            disabled={isPayingThis}
                                            onClick={() =>
                                              handleExecuterPaiement(
                                                activeBordereau.id,
                                                fiche.id,
                                              )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 disabled:opacity-50"
                                            title="Valider et exécuter le paiement"
                                          >
                                            {isPayingThis ? (
                                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            ) : (
                                              <Banknote className="h-3.5 w-3.5" />
                                            )}
                                            <span>Payer</span>
                                          </button>

                                          {/* Accès secondaire : Consulter la fiche / bulletin */}
                                          <button
                                            onClick={() => setSelectedFicheId(fiche.id)}
                                            title="Consulter le bulletin individuel"
                                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                          >
                                            <FileText className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        /* Si déjà payé : Action principale "Voir le paiement" */
                                        <button
                                          onClick={() => setSelectedFicheId(fiche.id)}
                                          title="Consulter le reçu et le détail du paiement"
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                                        >
                                          <FileText className="text-brand-orange h-3.5 w-3.5" />
                                          <span>Voir le paiement</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* 4. Ligne dépliable des détails de séances */}
                                {isExpanded && (
                                  <tr className="border-b border-slate-200/80 bg-slate-50/70">
                                    <td colSpan={6} className="px-6 py-3.5">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-slate-600">
                                          <span className="font-semibold text-slate-800">
                                            Détail des séances ({fiche.seances?.length || 0}) — {fiche.enseignantNom} {fiche.enseignantPrenom}
                                          </span>
                                          <span className="font-mono text-[11px] text-slate-500">
                                            Volume horaire : {formatVolumeHoraire(fiche.nombreSeances)}
                                          </span>
                                        </div>

                                        {!fiche.seances || fiche.seances.length === 0 ? (
                                          <p className="py-3 text-center text-xs text-slate-400 italic">
                                            Aucune séance détaillée enregistrée pour cette ligne.
                                          </p>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                              <thead className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                <tr>
                                                  <th className="py-2 pr-3">Date & Horaire</th>
                                                  <th className="py-2 px-3">Formation & Matière</th>
                                                  <th className="py-2 px-3">Thème dispensé</th>
                                                  <th className="py-2 px-3">Centre & Salle</th>
                                                  <th className="py-2 pl-3 text-right">Tarif appliqué</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {fiche.seances.map((s, idx) => {
                                                  const dateTexte = s.dateSeance
                                                    ? new Date(s.dateSeance).toLocaleDateString("fr-FR", {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                      })
                                                    : `Sem. ${s.semaine} • ${s.jour}`;
                                                  return (
                                                    <tr
                                                      key={s.affectationId || idx}
                                                      className="hover:bg-slate-100/50"
                                                    >
                                                      <td className="py-2 pr-3">
                                                        <span className="block font-medium text-slate-900 capitalize">
                                                          {dateTexte}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                                          <Clock className="h-2.5 w-2.5 text-slate-400" />
                                                          {s.horaire || `Séance ${s.creneauSeance}`} ({s.duree || "2h30"})
                                                        </span>
                                                      </td>
                                                      <td className="py-2 px-3">
                                                        <span className="font-medium text-slate-900">
                                                          {s.matiereNom}
                                                        </span>
                                                        <span className="block text-[11px] text-slate-500">
                                                          {s.formationNom}
                                                        </span>
                                                      </td>
                                                      <td className="py-2 px-3 text-slate-600">
                                                        <span className="text-[11px] font-medium text-slate-700">
                                                          {s.theme || "Séance de cours"}
                                                        </span>
                                                      </td>
                                                      <td className="py-2 px-3 text-slate-600">
                                                        <div>{s.centreNom}</div>
                                                        <div className="text-[11px] text-slate-400">
                                                          {s.salleNom}
                                                        </div>
                                                      </td>
                                                      <td className="py-2 pl-3 text-right font-mono font-semibold text-slate-900">
                                                        {Number(
                                                          s.coutApplique || fiche.coutParSeance,
                                                        ).toLocaleString("fr-FR")}{" "}
                                                        FCFA
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content for Personnel Administratif */}
      {activeTab === "personnel" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Banknote className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Décaissé Personnel
                </p>
                <p className="text-lg font-bold font-mono text-slate-900">
                  {totalPersonnelDecaisse.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-[11px] text-slate-400">
                  Session {currentSession?.annee}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Bordereaux Validés
                </p>
                <p className="text-lg font-bold font-mono text-slate-900">
                  {bordereauxPersonnel.length}
                </p>
                <p className="text-[11px] text-slate-400">
                  Cycles de paie enregistrés
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Effectif Cumulé Rémunéré
                </p>
                <p className="text-lg font-bold font-mono text-slate-900">
                  {totalPersonnelsRemuneres}
                </p>
                <p className="text-[11px] text-slate-400">
                  Versements effectués
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          {loadingPersonnelBordereaux ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
              <p className="text-xs">Chargement des bordereaux de paie du personnel...</p>
            </div>
          ) : bordereauxPersonnel.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Building2 className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Aucun bordereau de paie pour cette session
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Vous n&apos;avez pas encore émis de bordereau de salaires pour le personnel administratif
                sur la session {currentSession?.annee}. Configurez d&apos;abord les salaires de référence
                de vos collaborateurs, puis simulez et validez votre premier cycle de paie.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsGestionSalairesOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Settings2 className="h-4 w-4 text-slate-500" />
                  <span>Salaires de référence</span>
                </button>
                <button
                  onClick={() => setIsPlanifierPersonnelOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-500 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Programmer la paie</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Master List of Bordereaux */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Bordereaux émis ({bordereauxPersonnel.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Plus récents d&apos;abord
                  </span>
                </div>

                <div className="space-y-2.5">
                  {bordereauxPersonnel.map((b) => {
                    const isSelected = activePersonnelBordereau?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedPersonnelBordereauId(b.id)}
                        className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/30 shadow-xs ring-1 ring-orange-500"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {b.reference}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCheck className="h-3 w-3" />
                              Validé
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintPersonnelBordereau(b);
                            }}
                            className="rounded p-1 text-slate-400 opacity-80 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Imprimer ce bordereau"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-700">
                          {b.intitule || "Paie Administrative"}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2 text-[11px] text-slate-500">
                          <span>{b.datePaiement}</span>
                          <span className="font-semibold text-slate-700">
                            {b.nombrePersonnelsPayes} agent(s)
                          </span>
                        </div>

                        <div className="mt-1 text-right font-mono text-xs font-bold text-slate-900">
                          {Number(b.montantTotalGlobal).toLocaleString("fr-FR")} FCFA
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Bordereau Detail */}
              <div className="space-y-4 lg:col-span-2">
                {activePersonnelBordereau && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    {/* Header summary of selected bordereau */}
                    <div className="border-b border-slate-100 bg-slate-50/70 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {activePersonnelBordereau.intitule || "Bordereau de Salaires"}
                            </h3>
                            <span className="font-mono text-xs font-bold text-orange-600">
                              {activePersonnelBordereau.reference}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Paiement du {activePersonnelBordereau.datePaiement} • Session{" "}
                            {currentSession?.annee} •{" "}
                            <span className="font-semibold text-slate-700">
                              {activePersonnelBordereau.nombrePersonnelsPayes} collaborateur(s)
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              Montant Total Décaissé
                            </span>
                            <p className="font-mono text-base font-black text-slate-900">
                              {Number(
                                activePersonnelBordereau.montantTotalGlobal
                              ).toLocaleString("fr-FR")}{" "}
                              FCFA
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setPrintPersonnelBordereau(activePersonnelBordereau)
                            }
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                            <span>Imprimer</span>
                          </button>
                        </div>
                      </div>

                      {/* Search in this bordereau */}
                      <div className="relative mt-4">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filtrer les collaborateurs par nom, rôle ou observation..."
                          value={personnelSearch}
                          onChange={(e) => setPersonnelSearch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-4 pl-9 text-xs text-slate-800 placeholder-slate-400 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Table of personnel fiches */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold text-slate-600">
                          <tr>
                            <SortableHeader
                              label="Collaborateur"
                              sortKey="collaborateur"
                              currentSortKey={triPersonnelColonne}
                              direction={triPersonnelDirection}
                              onSort={handleTriPersonnel}
                              className="pl-5"
                            />
                            <SortableHeader
                              label="Rôle"
                              sortKey="role"
                              currentSortKey={triPersonnelColonne}
                              direction={triPersonnelDirection}
                              onSort={handleTriPersonnel}
                            />
                            <SortableHeader
                              label="Salaire Réf."
                              sortKey="salaireRef"
                              currentSortKey={triPersonnelColonne}
                              direction={triPersonnelDirection}
                              onSort={handleTriPersonnel}
                              align="right"
                            />
                            <SortableHeader
                              label="Montant Payé"
                              sortKey="montantPaye"
                              currentSortKey={triPersonnelColonne}
                              direction={triPersonnelDirection}
                              onSort={handleTriPersonnel}
                              align="right"
                            />
                            <th className="px-3 py-3">Observations / Motif</th>
                            <th className="py-3 pr-5 pl-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPersonnelFiches.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-8 text-center text-xs text-slate-400"
                              >
                                Aucun collaborateur ne correspond à la recherche.
                              </td>
                            </tr>
                          ) : (
                            filteredPersonnelFiches.map((fiche) => {
                              const pers = personnelMap.get(fiche.personnelId);
                              const role = roleMap.get(fiche.personnelId);
                              const diff =
                                Number(fiche.montantPaye) -
                                Number(fiche.salaireReference);

                              return (
                                <tr
                                  key={fiche.id}
                                  className="transition-colors hover:bg-slate-50/70"
                                >
                                  {/* Collaborator */}
                                  <td className="py-3 pr-3 pl-5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[11px] text-slate-700 uppercase">
                                        {pers?.prenom?.charAt(0) || ""}
                                        {pers?.nom?.charAt(0) || ""}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900">
                                          {pers
                                            ? `${pers.nom} ${pers.prenom}`
                                            : "Personnel inconnu"}
                                        </p>
                                        {pers?.telephone && (
                                          <p className="font-mono text-[10px] text-slate-400">
                                            {pers.telephone}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Role */}
                                  <td className="px-3 py-3">
                                    {role ? (
                                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                        <ShieldCheck className="h-3 w-3 text-amber-600" />
                                        {ROLE_LABELS[role]}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">
                                        Personnel
                                      </span>
                                    )}
                                  </td>

                                  {/* Reference Salary */}
                                  <td className="px-3 py-3 text-right font-mono text-slate-600 whitespace-nowrap">
                                    {Number(fiche.salaireReference).toLocaleString(
                                      "fr-FR"
                                    )}{" "}
                                    F
                                  </td>

                                  {/* Paid amount & diff */}
                                  <td className="px-3 py-3 text-right whitespace-nowrap">
                                    <span className="font-mono font-bold text-slate-900">
                                      {Number(fiche.montantPaye).toLocaleString(
                                        "fr-FR"
                                      )}{" "}
                                      F
                                    </span>
                                    {diff !== 0 && (
                                      <span
                                        className={`ml-1.5 inline-block text-[10px] font-mono font-bold ${
                                          diff > 0
                                            ? "text-emerald-600"
                                            : "text-rose-600"
                                        }`}
                                      >
                                        ({diff > 0 ? `+${diff}` : diff})
                                      </span>
                                    )}
                                  </td>

                                  {/* Observations */}
                                  <td className="px-3 py-3 text-[11px] text-slate-600">
                                    {fiche.observations ? (
                                      <span>{fiche.observations}</span>
                                    ) : (
                                      <span className="text-slate-300 italic">—</span>
                                    )}
                                  </td>

                                  {/* Action */}
                                  <td className="py-3 pr-5 pl-3 text-center whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        setSelectedPersonnelFiche({
                                          ficheId: fiche.id,
                                          bordereauId: activePersonnelBordereau.id,
                                          referenceBordereau:
                                            activePersonnelBordereau.reference,
                                          intituleBordereau:
                                            activePersonnelBordereau.intitule,
                                          datePaiement:
                                            activePersonnelBordereau.datePaiement,
                                          personnelId: fiche.personnelId,
                                          salaireReference: Number(
                                            fiche.salaireReference
                                          ),
                                          montantPaye: Number(fiche.montantPaye),
                                          observations: fiche.observations,
                                          sessionName: currentSession?.annee,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition hover:border-orange-400 hover:bg-orange-50/50 hover:text-orange-900"
                                    >
                                      <FileText className="h-3 w-3 text-orange-600" />
                                      <span>Bulletin</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals for Teachers */}
      <BordereauPlanifieModal
        isOpen={isPlanifierModalOpen}
        onClose={() => setIsPlanifierModalOpen(false)}
        sessionId={effectiveSessionId}
        sessionName={currentSession?.annee}
        onSuccess={async (newBordereauId) => {
          await refetchBordereaux();
          setSelectedBordereauId(newBordereauId);
        }}
      />

      <FichePaieModal
        ficheId={selectedFicheId}
        onClose={() => setSelectedFicheId(null)}
      />

      <BordereauPrintModal
        bordereau={
          bordereauxEnseignants.find((b) => b.id === printBordereauId) ?? null
        }
        onClose={() => setPrintBordereauId(null)}
      />

      {/* Modals for Administrative Personnel */}
      <BordereauPersonnelPlanifieModal
        isOpen={isPlanifierPersonnelOpen}
        onClose={() => setIsPlanifierPersonnelOpen(false)}
        sessionId={effectiveSessionId}
        sessionName={currentSession?.annee}
        onSuccess={async (newBordereauId) => {
          await refetchPersonnelBordereaux();
          setSelectedPersonnelBordereauId(newBordereauId);
        }}
      />

      <GestionSalairesPersonnelModal
        isOpen={isGestionSalairesOpen}
        onClose={() => setIsGestionSalairesOpen(false)}
        sessionId={effectiveSessionId}
        sessionName={currentSession?.annee}
      />

      <FichePaiePersonnelModal
        fiche={selectedPersonnelFiche}
        onClose={() => setSelectedPersonnelFiche(null)}
      />

      <BordereauPersonnelPrintModal
        bordereau={printPersonnelBordereau}
        sessionName={currentSession?.annee}
        onClose={() => setPrintPersonnelBordereau(null)}
      />
    </div>
  );
}
