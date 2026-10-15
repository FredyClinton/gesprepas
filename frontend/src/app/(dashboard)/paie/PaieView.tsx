"use client";

import { useState, useMemo } from "react";
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
  BookOpen,
  Printer,
  Settings2,
  Coins,
  CheckCheck,
} from "lucide-react";
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

  const filteredPersonnelFiches = useMemo(() => {
    if (!activePersonnelBordereau?.fiches) return [];
    if (!personnelSearch.trim()) return activePersonnelBordereau.fiches;
    const q = personnelSearch.toLowerCase();
    return activePersonnelBordereau.fiches.filter((f) => {
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
  }, [activePersonnelBordereau, personnelSearch, personnelMap, roleMap]);

  // Selected bordereau state
  const [selectedBordereauId, setSelectedBordereauId] = useState<string | null>(
    null,
  );
  const [teacherSearch, setTeacherSearch] = useState("");
  const [expandedFicheId, setExpandedFicheId] = useState<string | null>(null);

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
    if (!teacherSearch.trim()) return activeBordereau.fiches;
    const q = teacherSearch.toLowerCase();
    return activeBordereau.fiches.filter(
      (f) =>
        f.enseignantNom.toLowerCase().includes(q) ||
        f.enseignantPrenom.toLowerCase().includes(q) ||
        f.enseignantMatricule.toLowerCase().includes(q) ||
        f.departementNom.toLowerCase().includes(q),
    );
  }, [activeBordereau, teacherSearch]);

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
                        className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-brand-orange shadow-brand-orange/10 ring-brand-orange bg-orange-50/70 shadow-sm ring-1"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.reference}
                          </span>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Totalement payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-2.5 w-2.5" />
                              {paidCount}/{b.fiches.length} payé(s)
                            </span>
                          )}
                        </div>

                        <div className="mb-3 text-xs text-slate-500">
                          Émis le {b.datePaiement} • {b.nombreTotalEnseignants}{" "}
                          ens. • {b.nombreTotalSeances} séances (
                          {formatVolumeHoraire(b.nombreTotalSeances)})
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

                        <div className="flex items-center justify-between border-t border-slate-100/80 pt-1 text-xs">
                          <span className="text-slate-500">Montant engagé</span>
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
                <div className="space-y-4 lg:col-span-2">
                  {/* Bordereau Summary Banner */}
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-mono text-lg font-bold text-slate-900">
                            {activeBordereau.reference}
                          </h2>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Sortie engagée
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Date de paiement : {activeBordereau.datePaiement} •
                          Ordonné par : {activeBordereau.saisiPar}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {activeBordereau.nombreTotalSeances} séance(s) •
                          Volume horaire total :{" "}
                          <span className="font-semibold text-slate-700">
                            {formatVolumeHoraire(
                              activeBordereau.nombreTotalSeances,
                            )}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <span className="block text-xs text-slate-500">
                            Montant Global de la Sortie
                          </span>
                          <span className="text-brand-orange font-mono text-xl font-black">
                            {Number(
                              activeBordereau.montantTotalGlobal,
                            ).toLocaleString("fr-FR")}{" "}
                            FCFA
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setPrintBordereauId(activeBordereau.id)
                          }
                          title="Imprimer le bordereau"
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                          <FileText className="text-brand-orange h-3.5 w-3.5" />
                          <span>Imprimer</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter and Search inside Bordereau */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un enseignant ou département..."
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          className="focus:ring-brand-orange/20 focus:border-brand-orange w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs focus:ring-2 focus:outline-none"
                        />
                      </div>

                      <div className="text-xs font-medium text-slate-500">
                        {
                          activeBordereau.fiches.filter(
                            (f) => f.statut === "PAYEE",
                          ).length
                        }{" "}
                        sur {activeBordereau.fiches.length} enseignant(s)
                        payé(s)
                      </div>
                    </div>
                  </div>

                  {/* Teacher Lines Table */}
                  <div className="overflow-hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Enseignant</th>
                          <th className="p-3.5">Département</th>
                          <th className="p-3.5 text-center">Séances</th>
                          <th className="p-3.5 text-right">Tarif / Séance</th>
                          <th className="p-3.5 text-right">Total Net</th>
                          <th className="p-3.5 text-center">Statut</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      {filteredFiches.map((fiche) => {
                        const isPayingThis = executingFicheId === fiche.id;
                        const isExpanded = expandedFicheId === fiche.id;

                        return (
                          <tbody
                            key={fiche.id}
                            className="divide-y divide-slate-100 text-slate-700"
                          >
                            <tr
                              className={`transition-colors ${
                                isExpanded
                                  ? "bg-orange-50/20"
                                  : "hover:bg-slate-50/60"
                              }`}
                            >
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedFicheId(
                                        isExpanded ? null : fiche.id,
                                      )
                                    }
                                    className={`rounded-md p-1 transition-colors ${
                                      isExpanded
                                        ? "text-brand-orange bg-orange-100"
                                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    }`}
                                    title={
                                      isExpanded
                                        ? "Replier les séances"
                                        : "Voir les séances"
                                    }
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      {fiche.enseignantNom}{" "}
                                      {fiche.enseignantPrenom}
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-400">
                                      {fiche.enseignantMatricule || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 text-slate-600">
                                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  {fiche.departementNom}
                                </span>
                              </td>
                              <td className="p-3.5 text-center font-mono font-semibold text-slate-800">
                                {fiche.nombreSeances}
                              </td>
                              <td className="p-3.5 text-right font-mono text-slate-700">
                                {Number(fiche.coutParSeance).toLocaleString(
                                  "fr-FR",
                                )}{" "}
                                FCFA
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                                {Number(fiche.montantTotal).toLocaleString(
                                  "fr-FR",
                                )}{" "}
                                FCFA
                              </td>
                              <td className="p-3.5 text-center">
                                {fiche.statut === "PAYEE" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Payée
                                  </span>
                                ) : (
                                  <span className="text-brand-orange inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold">
                                    <Clock className="h-3 w-3" />
                                    Programmée
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Button: Voir la fiche de paie */}
                                  <button
                                    onClick={() => setSelectedFicheId(fiche.id)}
                                    title="Voir la fiche de paie individuelle"
                                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                                  >
                                    <FileText className="text-brand-orange h-3.5 w-3.5" />
                                    <span>Fiche</span>
                                  </button>

                                  {/* Button: Exécuter le paiement */}
                                  {fiche.statut === "PROGRAMMEE" && (
                                    <button
                                      disabled={isPayingThis}
                                      onClick={() =>
                                        handleExecuterPaiement(
                                          activeBordereau.id,
                                          fiche.id,
                                        )
                                      }
                                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      {isPayingThis ? (
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                      ) : (
                                        <Banknote className="h-3.5 w-3.5" />
                                      )}
                                      <span>Payer</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/70">
                                <td colSpan={7} className="p-4 pl-8">
                                  <div className="overflow-hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-4 py-2.5 text-xs font-semibold text-slate-700">
                                      <span className="flex items-center gap-1.5">
                                        <BookOpen className="text-brand-orange h-3.5 w-3.5" />
                                        Détail des séances (
                                        {fiche.nombreSeances}) -{" "}
                                        {fiche.enseignantNom}{" "}
                                        {fiche.enseignantPrenom}
                                      </span>
                                      <span className="font-mono text-[11px] text-slate-500">
                                        Volume horaire :{" "}
                                        {formatVolumeHoraire(
                                          fiche.nombreSeances,
                                        )}
                                      </span>
                                    </div>

                                    {!fiche.seances ||
                                    fiche.seances.length === 0 ? (
                                      <div className="p-4 text-center text-xs text-slate-400">
                                        Aucune séance détaillée trouvée pour
                                        cette fiche.
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                                            <tr>
                                              <th className="w-8 px-3 py-2.5 text-center">
                                                N°
                                              </th>
                                              <th className="px-3 py-2.5">
                                                Date & Horaire
                                              </th>
                                              <th className="px-3 py-2.5">
                                                Formation & Matière
                                              </th>
                                              <th className="px-3 py-2.5">
                                                Thème / Leçon Dispensée
                                              </th>
                                              <th className="px-3 py-2.5">
                                                Centre & Salle
                                              </th>
                                              <th className="px-3 py-2.5 text-right">
                                                Tarif Appliqué
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {fiche.seances.map((s, idx) => {
                                              const dateTexte = s.dateSeance
                                                ? new Date(
                                                    s.dateSeance,
                                                  ).toLocaleDateString(
                                                    "fr-FR",
                                                    {
                                                      weekday: "short",
                                                      day: "numeric",
                                                      month: "short",
                                                    },
                                                  )
                                                : `Sem. ${s.semaine} • ${s.jour}`;
                                              return (
                                                <tr
                                                  key={s.affectationId || idx}
                                                  className="hover:bg-slate-50/60"
                                                >
                                                  <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-400">
                                                    {idx + 1}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className="block font-semibold text-slate-900 capitalize">
                                                      {dateTexte}
                                                    </span>
                                                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                                      <Clock className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                                      {s.horaire ||
                                                        `Séance ${s.creneauSeance}`}{" "}
                                                      ({s.duree || "2h30"})
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className="block font-semibold text-slate-900">
                                                      {s.matiereNom}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                      {s.formationNom}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className="inline-block rounded border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                                                      {s.theme ||
                                                        "Séance de cours"}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2 text-slate-600">
                                                    <div>{s.centreNom}</div>
                                                    <div className="text-[11px] text-slate-400">
                                                      {s.salleNom}
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                                    {Number(
                                                      s.coutApplique ||
                                                        fiche.coutParSeance,
                                                    ).toLocaleString(
                                                      "fr-FR",
                                                    )}{" "}
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
                          </tbody>
                        );
                      })}
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
              <div className="lg:col-span-2 space-y-4">
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
                            <th className="py-3 pr-3 pl-5">Collaborateur</th>
                            <th className="px-3 py-3">Rôle</th>
                            <th className="px-3 py-3 text-right">Salaire Réf.</th>
                            <th className="px-3 py-3 text-right">Montant Payé</th>
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
                                  <td className="px-3 py-3 text-right font-mono text-slate-600">
                                    {Number(fiche.salaireReference).toLocaleString(
                                      "fr-FR"
                                    )}{" "}
                                    F
                                  </td>

                                  {/* Paid amount & diff */}
                                  <td className="px-3 py-3 text-right">
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
                                  <td className="px-3 py-3 text-[11px] text-slate-600 max-w-xs truncate">
                                    {fiche.observations ? (
                                      <span>{fiche.observations}</span>
                                    ) : (
                                      <span className="text-slate-300 italic">—</span>
                                    )}
                                  </td>

                                  {/* Action */}
                                  <td className="py-3 pr-5 pl-3 text-center">
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
