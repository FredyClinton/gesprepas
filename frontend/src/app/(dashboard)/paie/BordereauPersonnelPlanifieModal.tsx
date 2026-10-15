"use client";

import { useMemo, useRef, useState } from "react";
import {
  X,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  Banknote,
  Users,
  Info,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  useSimulationBordereauPersonnel,
  useValiderBordereauPersonnel,
} from "@/modules/remuneration/data/queries";
import { usePersonnelList } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { ROLE_LABELS, type Role } from "@/types/roles";
import { messageErreurApi } from "@/shared/lib/api-client";
import { Button } from "@/shared/ui";

interface BordereauPersonnelPlanifieModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName?: string;
  onSuccess: (newBordereauId: string) => void;
}

export function BordereauPersonnelPlanifieModal({
  isOpen,
  onClose,
  sessionId,
  sessionName,
  onSuccess,
}: BordereauPersonnelPlanifieModalProps) {
  const [datePaiement, setDatePaiement] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [intitule, setIntitule] = useState<string>("Paie Personnel Administratif");
  const [referencePersonnalisee, setReferencePersonnalisee] = useState<string>("");
  
  // Custom adjusted amounts and observations per personnelId
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [customObservations, setCustomObservations] = useState<Record<string, string>>({});
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client reference ref to ensure idempotency
  const clientReferenceRef = useRef<string>("");

  // Data
  const {
    data: simulation,
    isLoading: loadingSimulation,
    error: simulationError,
  } = useSimulationBordereauPersonnel(sessionId, datePaiement, intitule, isOpen);

  const { data: personnelList = [] } = usePersonnelList();
  const { data: utilisateurs = [] } = useUtilisateurs();

  const validerMutation = useValiderBordereauPersonnel();

  // Maps for personnel details
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

  // Combined lines
  const lines = useMemo(() => {
    if (!simulation?.fiches) return [];
    return simulation.fiches.map((f) => {
      const p = personnelMap.get(f.personnelId);
      const role = roleMap.get(f.personnelId);
      const defaultSalaire = Number(f.salaireReference || 0);
      const montantPaye = customAmounts[f.personnelId] ?? defaultSalaire;
      const observation = customObservations[f.personnelId] ?? (f.observations || "");
      const inclus = !excludedIds.has(f.personnelId);

      return {
        personnelId: f.personnelId,
        nom: p?.nom || "Personnel",
        prenom: p?.prenom || "",
        telephone: p?.telephone || "-",
        email: p?.email || "-",
        roleLabel: role ? (ROLE_LABELS[role] || role) : "Personnel administratif",
        salaireReference: defaultSalaire,
        montantPaye,
        observation,
        inclus,
      };
    });
  }, [simulation, personnelMap, roleMap, customAmounts, customObservations, excludedIds]);

  // Totals calculation
  const stats = useMemo(() => {
    const inclusLines = lines.filter((l) => l.inclus && l.montantPaye > 0);
    const totalPaye = inclusLines.reduce((acc, l) => acc + l.montantPaye, 0);
    const totalRef = inclusLines.reduce((acc, l) => acc + l.salaireReference, 0);
    const ecartTotal = totalPaye - totalRef;
    const nbInclus = inclusLines.length;
    const nbTotal = lines.length;
    return { totalPaye, totalRef, ecartTotal, nbInclus, nbTotal };
  }, [lines]);

  const handleAmountChange = (personnelId: string, value: number) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [personnelId]: Math.max(0, value),
    }));
  };

  const handleObservationChange = (personnelId: string, value: string) => {
    setCustomObservations((prev) => ({
      ...prev,
      [personnelId]: value,
    }));
  };

  const handleToggleInclude = (personnelId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personnelId)) {
        next.delete(personnelId);
      } else {
        next.add(personnelId);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setExcludedIds(new Set());
    } else {
      setExcludedIds(new Set(lines.map((l) => l.personnelId)));
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);

    const lignesAValider = lines
      .filter((l) => l.inclus && l.montantPaye > 0)
      .map((l) => ({
        personnelId: l.personnelId,
        salaireReference: l.salaireReference,
        montantPaye: l.montantPaye,
        observations: l.observation.trim() || undefined,
      }));

    if (lignesAValider.length === 0) {
      setValidationError("Veuillez sélectionner au moins un collaborateur avec un montant supérieur à 0.");
      return;
    }

    if (!clientReferenceRef.current) {
      clientReferenceRef.current =
        referencePersonnalisee.trim() ||
        simulation?.reference ||
        `BORD-PERS-${datePaiement}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }

    setIsSubmitting(true);
    try {
      const resultat = await validerMutation.mutateAsync({
        sessionId,
        payload: {
          datePaiement,
          reference: clientReferenceRef.current,
          intitule: intitule.trim() || "Paie Personnel Administratif",
          saisiPar: "DIRECTION",
          lignes: lignesAValider,
        },
      });

      onSuccess(resultat.id);
      onClose();
    } catch (err) {
      setValidationError(messageErreurApi(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-anthracite/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-brand-gray/15 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Programmer la paie du personnel administratif
              </h2>
              <p className="text-xs text-slate-500">
                Session {sessionName} • Ajustement des montants, primes, retenues et validation comptable
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Paramètres du bordereau */}
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Date de paiement
              </label>
              <input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Intitulé du bordereau
              </label>
              <input
                type="text"
                value={intitule}
                placeholder="Ex : Paie administrative - Septembre"
                onChange={(e) => setIntitule(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Référence comptable (optionnelle)
              </label>
              <input
                type="text"
                value={referencePersonnalisee}
                placeholder={simulation?.reference || "Auto-générée si vide"}
                onChange={(e) => setReferencePersonnalisee(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Bannière d'erreur */}
        {(validationError || simulationError) && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>
              {validationError ||
                (simulationError ? messageErreurApi(simulationError) : null)}
            </span>
          </div>
        )}

        {/* Corps : Tableau des collaborateurs */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingSimulation ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-orange border-t-transparent" />
              <p className="mt-3 text-xs font-medium">
                Génération de la simulation de paie en cours…
              </p>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Users size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">
                Aucun collaborateur administratif trouvé
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Assurez-vous d&rsquo;avoir enregistré du personnel et défini leurs salaires de base pour cette session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="font-bold text-brand-orange hover:underline"
                  >
                    Tout inclure
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="hover:underline text-slate-600"
                  >
                    Tout désélectionner
                  </button>
                </div>
                <span>
                  {stats.nbInclus} / {stats.nbTotal} collaborateurs sélectionnés
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="w-10 px-4 py-3 text-center">Inclus</th>
                      <th className="px-4 py-3">Collaborateur</th>
                      <th className="px-4 py-3 text-right">Salaire de réf.</th>
                      <th className="px-4 py-3 text-right w-44">Montant à payer (FCFA)</th>
                      <th className="px-4 py-3">Observations / Motif d&rsquo;ajustement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {lines.map((ligne) => {
                      const ecart = ligne.montantPaye - ligne.salaireReference;
                      const aEcart = ligne.inclus && ecart !== 0;

                      return (
                        <tr
                          key={ligne.personnelId}
                          className={`transition-colors ${
                            !ligne.inclus ? "bg-slate-50/50 opacity-60" : "hover:bg-slate-50/70"
                          }`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={ligne.inclus}
                              onChange={() => handleToggleInclude(ligne.personnelId)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/30 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">
                              {ligne.nom} {ligne.prenom}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                                {ligne.roleLabel}
                              </span>
                              <span>•</span>
                              <span>{ligne.telephone}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-600">
                            {ligne.salaireReference.toLocaleString("fr-FR")} FCFA
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                disabled={!ligne.inclus}
                                value={ligne.montantPaye}
                                onChange={(e) =>
                                  handleAmountChange(
                                    ligne.personnelId,
                                    Number(e.target.value) || 0,
                                  )
                                }
                                className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-right font-mono text-xs font-bold text-slate-900 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange disabled:bg-slate-100"
                              />
                              {aEcart && (
                                <span
                                  className={`text-[10px] font-bold ${
                                    ecart > 0 ? "text-emerald-600" : "text-amber-600"
                                  }`}
                                >
                                  {ecart > 0 ? `+${ecart.toLocaleString("fr-FR")}` : ecart.toLocaleString("fr-FR")} FCFA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              disabled={!ligne.inclus}
                              placeholder="Prime de rentrée, acompte déduit..."
                              value={ligne.observation}
                              onChange={(e) =>
                                handleObservationChange(ligne.personnelId, e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange disabled:bg-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec Récapitulatif et Validation */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Totaux */}
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Décaissé
                </span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {stats.totalPaye.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              {stats.ecartTotal !== 0 && (
                <div className="border-l border-slate-200 pl-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Ajustements (Écart)
                  </span>
                  <p
                    className={`text-sm font-bold font-mono ${
                      stats.ecartTotal > 0 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {stats.ecartTotal > 0 ? `+${stats.ecartTotal.toLocaleString("fr-FR")}` : stats.ecartTotal.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || stats.nbInclus === 0}
                onClick={handleSubmit}
                className="shadow-sm"
              >
                {isSubmitting ? (
                  "Émission en cours…"
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Valider & Émettre le bordereau
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

