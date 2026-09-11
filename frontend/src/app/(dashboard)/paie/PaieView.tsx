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
import { BordereauPlanifieModal } from "./BordereauPlanifieModal";
import { FichePaieModal } from "./FichePaieModal";
import { BordereauPrintModal } from "./BordereauPrintModal";
import type { BordereauPaieEnseignantDetail } from "@/modules/remuneration/domain/types";
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

  // Modals state
  const [isPlanifierModalOpen, setIsPlanifierModalOpen] = useState(false);
  const [selectedFicheId, setSelectedFicheId] = useState<string | null>(null);
  const [printBordereauId, setPrintBordereauId] = useState<string | null>(null);

  // Data queries
  const {
    data: bordereauxEnseignants = [],
    isLoading: loadingBordereaux,
    refetch: refetchBordereaux,
  } = useBordereauxEnseignant(effectiveSessionId);

  const { data: bordereauxPersonnel = [] } =
    useBordereauxPaiePersonnel(effectiveSessionId);

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

          {/* Action Button: Programmer une paie */}
          {activeTab === "enseignants" && (
            <button
              onClick={() => setIsPlanifierModalOpen(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Programmer une paie</span>
            </button>
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
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Paie du Personnel Administratif
              </h3>
              <p className="text-xs text-slate-500">
                Bordereaux de salaires fixes enregistrés pour la session{" "}
                {currentSession?.annee}.
              </p>
            </div>
          </div>

          {bordereauxPersonnel.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p className="text-sm font-medium">
                Aucun bordereau personnel pour cette session.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bordereauxPersonnel.map((bp) => (
                <div
                  key={bp.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {bp.reference}
                    </div>
                    <div className="text-xs text-slate-500">
                      {bp.intitule} • {bp.datePaiement} •{" "}
                      {bp.nombrePersonnelsPayes} personnes
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {Number(bp.montantTotalGlobal).toLocaleString("fr-FR")}{" "}
                      FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
}
