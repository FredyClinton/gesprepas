"use client";

import { useMemo, useRef, useState } from "react";
import {
  X,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Banknote,
  Users,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
} from "lucide-react";
import {
  useSimulationBordereauEnseignant,
  useValiderBordereauEnseignant,
} from "@/modules/remuneration/data/queries";
import { formatVolumeHoraire } from "@/modules/remuneration/domain/volumeHoraire";

interface BordereauPlanifieModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName?: string;
  onSuccess: (newBordereauId: string) => void;
}

export function BordereauPlanifieModal({
  isOpen,
  onClose,
  sessionId,
  sessionName,
  onSuccess,
}: BordereauPlanifieModalProps) {
  const [datePaiement, setDatePaiement] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [intitule, setIntitule] = useState<string>("");
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(
    null,
  );

  // Fixed client reference generated on submit to ensure strict idempotency across double-clicks
  const clientReferenceRef = useRef<string>("");

  const {
    data: simulation,
    isLoading: loadingSimulation,
    error: simulationError,
  } = useSimulationBordereauEnseignant(sessionId, datePaiement, isOpen);

  const validerMutation = useValiderBordereauEnseignant();

  const lines = useMemo(() => {
    if (!simulation?.fiches) return [];
    return simulation.fiches.map((f) => {
      const defaultRate = Number(f.coutParSeance || 0);
      const coutParSeance = customRates[f.enseignantId] ?? defaultRate;
      const inclus = !excludedIds.has(f.enseignantId);
      return {
        enseignantId: f.enseignantId,
        nom: f.enseignantNom,
        prenom: f.enseignantPrenom,
        matricule: f.enseignantMatricule,
        departementNom: f.departementNom,
        nombreSeances: f.nombreSeances,
        coutParSeance,
        inclus,
        affectationIds: f.affectationIds || [],
        seances: f.seances || [],
      };
    });
  }, [simulation, customRates, excludedIds]);

  const handleRateChange = (enseignantId: string, newRate: number) => {
    setCustomRates((prev) => ({
      ...prev,
      [enseignantId]: Math.max(0, newRate),
    }));
  };

  const handleToggleInclude = (enseignantId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(enseignantId)) {
        next.delete(enseignantId);
      } else {
        next.add(enseignantId);
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setExcludedIds(new Set());
    } else {
      setExcludedIds(
        new Set(simulation?.fiches?.map((f) => f.enseignantId) || []),
      );
    }
  };

  const activeLines = useMemo(() => lines.filter((l) => l.inclus), [lines]);

  const totalEnseignants = activeLines.length;
  const totalSeances = useMemo(
    () => activeLines.reduce((acc, l) => acc + l.nombreSeances, 0),
    [activeLines],
  );
  const totalMontant = useMemo(
    () =>
      activeLines.reduce(
        (acc, l) => acc + l.nombreSeances * l.coutParSeance,
        0,
      ),
    [activeLines],
  );

  const handleValider = async () => {
    if (activeLines.length === 0 || isSubmitting || validerMutation.isPending)
      return;
    setIsSubmitting(true);
    setValidationError(null);

    if (!clientReferenceRef.current) {
      clientReferenceRef.current = "BORD-ENS-" + Date.now();
    }
    const reference = clientReferenceRef.current;

    try {
      const res = await validerMutation.mutateAsync({
        sessionId,
        payload: {
          reference,
          datePaiement,
          intitule: intitule.trim() || undefined,
          lignes: activeLines.map((l) => ({
            enseignantId: l.enseignantId,
            coutParSeance: l.coutParSeance,
            affectationIds: l.affectationIds,
          })),
          saisiPar: "DIRECTION",
        },
      });

      clientReferenceRef.current = "";
      onSuccess(res.id);
      onClose();
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la validation du bordereau",
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayError =
    validationError ||
    (simulationError ? (simulationError as Error).message : null);

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange shadow-brand-orange/20 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bordereau Planifié - Rémunération Enseignants
              </h2>
              <p className="text-xs text-slate-500">
                Session : {sessionName || "Active"} • Décompte des séances
                effectuées non payées
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-3">
          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Date prévisionnelle de paiement
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={datePaiement}
                  onChange={(e) => setDatePaiement(e.target.value)}
                  className="focus:ring-brand-orange/20 focus:border-brand-orange rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Intitulé / Période (facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex: Paie Quinzaine 1 - Septembre"
                value={intitule}
                onChange={(e) => setIntitule(e.target.value)}
                className="focus:ring-brand-orange/20 focus:border-brand-orange w-64 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5">
              <Users className="text-brand-orange h-4 w-4" />
              <span className="text-brand-orange text-xs font-semibold">
                {totalEnseignants} enseignant(s)
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5">
              <Layers className="h-4 w-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-800">
                {totalSeances} séances ({formatVolumeHoraire(totalSeances)})
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5">
              <Banknote className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">
                {totalMontant.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayError && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-800">{displayError}</p>
            </div>
          )}

          {loadingSimulation ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="border-brand-orange h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" />
              <p className="text-sm">
                Collecte des séances effectuées et simulation du décompte...
              </p>
            </div>
          ) : lines.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500 opacity-80" />
              <p className="text-base font-medium text-slate-700">
                Toutes les séances sont déjà payées !
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Aucune séance effectuée en attente de rémunération sur cette
                session.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="w-10 p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={
                          activeLines.length === lines.length &&
                          lines.length > 0
                        }
                        onChange={(e) => handleToggleAll(e.target.checked)}
                        className="text-brand-orange focus:ring-brand-orange rounded border-slate-300"
                      />
                    </th>
                    <th className="p-3.5">Enseignant</th>
                    <th className="p-3.5">Département</th>
                    <th className="p-3.5 text-center">Séances Eff.</th>
                    <th className="w-44 p-3.5 text-right">
                      Coût / Séance (FCFA)
                      <span className="text-brand-orange block text-[10px] font-normal">
                        Éditable pour ce bordereau
                      </span>
                    </th>
                    <th className="p-3.5 text-right">Montant Total</th>
                    <th className="w-12 p-3.5 text-center">Détail</th>
                  </tr>
                </thead>
                {lines.map((ligne) => {
                  const sousTotal = ligne.nombreSeances * ligne.coutParSeance;
                  const isExpanded = expandedTeacherId === ligne.enseignantId;
                  return (
                    <tbody
                      key={ligne.enseignantId}
                      className="divide-y divide-slate-100 text-slate-700"
                    >
                      <tr
                        className={`transition-colors ${
                          ligne.inclus
                            ? "hover:bg-orange-50/40"
                            : "bg-slate-50/50 opacity-40"
                        } ${isExpanded ? "bg-orange-50/20" : ""}`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={ligne.inclus}
                            onChange={() =>
                              handleToggleInclude(ligne.enseignantId)
                            }
                            className="text-brand-orange focus:ring-brand-orange rounded border-slate-300"
                          />
                        </td>
                        <td className="p-3.5 font-medium text-slate-900">
                          <div>
                            {ligne.nom} {ligne.prenom}
                          </div>
                          <div className="font-mono text-xs text-slate-400">
                            {ligne.matricule || "Sans matricule"}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {ligne.departementNom}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-800">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-mono">
                            {ligne.nombreSeances}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min={0}
                              step={500}
                              disabled={!ligne.inclus}
                              value={ligne.coutParSeance}
                              onChange={(e) =>
                                handleRateChange(
                                  ligne.enseignantId,
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="focus:ring-brand-orange/20 focus:border-brand-orange w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right font-mono text-sm font-semibold text-slate-900 focus:ring-2 focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {sousTotal.toLocaleString("fr-FR")} FCFA
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTeacherId(
                                isExpanded ? null : ligne.enseignantId,
                              )
                            }
                            className={`rounded-lg p-1.5 transition-colors ${
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
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={7} className="p-4 pl-8">
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-4 py-2.5 text-xs font-semibold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  <BookOpen className="text-brand-orange h-3.5 w-3.5" />
                                  Détail des séances effectuées (
                                  {ligne.nombreSeances}) - {ligne.nom}{" "}
                                  {ligne.prenom}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  Volume horaire :{" "}
                                  {formatVolumeHoraire(ligne.nombreSeances)}
                                </span>
                              </div>

                              {ligne.seances.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                  Aucun détail individuel de séance n&apos;est
                                  disponible pour cet enseignant.
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
                                          Tarif Séance
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {ligne.seances.map((s, idx) => {
                                        const dateTexte = s.dateSeance
                                          ? new Date(
                                              s.dateSeance,
                                            ).toLocaleDateString("fr-FR", {
                                              weekday: "short",
                                              day: "numeric",
                                              month: "short",
                                            })
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
                                                {s.theme || "Séance de cours"}
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
                                                ligne.coutParSeance,
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
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            La validation engagera une{" "}
            <strong>Sortie Financière Générale</strong> et verrouillera les
            séances.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-800"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleValider}
              disabled={
                isSubmitting ||
                validerMutation.isPending ||
                loadingSimulation ||
                activeLines.length === 0
              }
              className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting || validerMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Validation & Émission en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Valider et engager la sortie (
                    {totalMontant.toLocaleString("fr-FR")} FCFA)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
