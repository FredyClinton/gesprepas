"use client";

import { useMemo, useState } from "react";
import {
  X,
  Copy,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useSessions } from "@/modules/centres-sessions";
import {
  useRosterDepartement,
  useCopierRosterDepuisSession,
} from "@/modules/affectation-departementale";
import { useEnseignants } from "@/modules/personnel";

interface CopierRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  departementId?: string;
  departementNom?: string;
  departementsDisponibles?: Array<{ id: string; nom: string }>;
  sessionCibleId: string;
  sessionCibleNom?: string;
  onSuccess?: () => void;
}

export function CopierRosterModal({
  isOpen,
  onClose,
  departementId,
  departementNom,
  departementsDisponibles,
  sessionCibleId,
  sessionCibleNom,
  onSuccess,
}: CopierRosterModalProps) {
  const { data: sessions = [] } = useSessions();
  const { data: enseignants = [] } = useEnseignants();

  const [selectedDepartementId, setSelectedDepartementId] = useState<string>(
    departementId || departementsDisponibles?.[0]?.id || "",
  );

  const activeDepartementId =
    departementId || selectedDepartementId || departementsDisponibles?.[0]?.id || "";
  const activeDepartementNom =
    departementNom ||
    departementsDisponibles?.find((d) => d.id === activeDepartementId)?.nom ||
    "Département";

  // Sessions pouvant servir de source (toutes sauf la cible)
  const sessionsSources = useMemo(
    () => sessions.filter((s) => s.id !== sessionCibleId),
    [sessions, sessionCibleId],
  );

  const [selectedSourceSessionId, setSelectedSourceSessionId] = useState<string>(
    sessionsSources[0]?.id || "",
  );

  // Roster de la session source
  const { data: rosterSource = [], isLoading: loadingRoster } =
    useRosterDepartement(activeDepartementId, selectedSourceSessionId || undefined);

  // Roster de la session cible (pour savoir qui est déjà présent)
  const { data: rosterCible = [] } = useRosterDepartement(
    activeDepartementId,
    sessionCibleId,
  );

  const idsDejaPresents = useMemo(
    () => new Set(rosterCible.map((r) => r.enseignantId)),
    [rosterCible],
  );

  // Map des enseignants
  const enseignantsMap = useMemo(() => {
    const map = new Map<string, (typeof enseignants)[0]>();
    enseignants.forEach((e) => map.set(e.id, e));
    return map;
  }, [enseignants]);

  // Enseignants copiables de la session source
  const enseignantsSource = useMemo(() => {
    return rosterSource.map((r) => {
      const ens = enseignantsMap.get(r.enseignantId);
      const dejaPresent = idsDejaPresents.has(r.enseignantId);
      return {
        id: r.enseignantId,
        nom: ens?.nom || "Inconnu",
        prenom: ens?.prenom || "",
        matricule: ens?.matricule || "N/A",
        dejaPresent,
      };
    });
  }, [rosterSource, enseignantsMap, idsDejaPresents]);

  // Sélection manuelle des enseignants à copier (null = tout sélectionner par défaut parmi les non-présents)
  const [selectionManuelle, setSelectionManuelle] = useState<Set<string> | null>(
    null,
  );

  const nonPresents = useMemo(() => {
    return enseignantsSource.filter((e) => !e.dejaPresent);
  }, [enseignantsSource]);

  const selectedIds = useMemo(() => {
    if (selectionManuelle !== null) return selectionManuelle;
    return new Set(nonPresents.map((e) => e.id));
  }, [selectionManuelle, nonPresents]);

  const handleToggleSelect = (id: string) => {
    setSelectionManuelle((prev) => {
      const current =
        prev !== null ? prev : new Set(nonPresents.map((e) => e.id));
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === nonPresents.length) {
      setSelectionManuelle(new Set());
    } else {
      setSelectionManuelle(new Set(nonPresents.map((e) => e.id)));
    }
  };

  const copierMutation = useCopierRosterDepuisSession();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleCopier = async () => {
    if (selectedIds.size === 0 || !selectedSourceSessionId || !activeDepartementId) return;
    setErreur(null);

    try {
      await copierMutation.mutateAsync({
        departementId: activeDepartementId,
        sessionSourceId: selectedSourceSessionId,
        sessionCibleId,
        enseignantIdsSelectionnes: Array.from(selectedIds),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setErreur(
        err instanceof Error ? err.message : "Erreur lors de la copie du roster",
      );
    }
  };

  if (!isOpen) return null;

  const sourceSession = sessions.find((s) => s.id === selectedSourceSessionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-orange text-white shadow-md shadow-brand-orange/20">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Copier le Roster Enseignant
              </h2>
              <p className="text-xs text-slate-500">
                Département : <span className="font-semibold text-slate-800">{activeDepartementNom}</span> • Cible : Session {sessionCibleNom || "Active"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source & Destination selectors */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
          {/* Department selector if not fixed and multiple options available */}
          {!departementId && departementsDisponibles && departementsDisponibles.length > 1 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Département de destination
              </label>
              <select
                value={activeDepartementId}
                onChange={(e) => {
                  setSelectedDepartementId(e.target.value);
                  setSelectionManuelle(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              >
                {departementsDisponibles.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Sélectionner la session source d&apos;origine
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedSourceSessionId}
                onChange={(e) => {
                  setSelectedSourceSessionId(e.target.value);
                  setSelectionManuelle(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              >
                {sessionsSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session {s.annee} {s.statut === "CLOTUREE" ? "(Clôturée)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Les enseignants sélectionnés seront rattachés au département pour la session en cours sans altérer leurs affectations existantes.
          </p>
        </div>

        {/* Error notification */}
        {erreur && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 font-medium">{erreur}</p>
          </div>
        )}

        {/* Teacher list */}
        <div className="p-6 max-h-80 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enseignants dans la session {sourceSession?.annee || "Source"} ({enseignantsSource.length})
            </span>
            {enseignantsSource.filter((e) => !e.dejaPresent).length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs font-semibold text-brand-orange hover:underline"
              >
                {selectedIds.size === enseignantsSource.filter((e) => !e.dejaPresent).length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
            )}
          </div>

          {loadingRoster ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chargement du roster source...
            </div>
          ) : enseignantsSource.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Aucun enseignant rattaché sur cette session source.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {enseignantsSource.map((e) => {
                const isSelected = selectedIds.has(e.id);
                return (
                  <label
                    key={e.id}
                    className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                      e.dejaPresent
                        ? "bg-slate-50/70 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-orange-50/40"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={e.dejaPresent}
                        checked={isSelected}
                        onChange={() => !e.dejaPresent && handleToggleSelect(e.id)}
                        className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {e.prenom} {e.nom}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {e.matricule}
                        </p>
                      </div>
                    </div>

                    {e.dejaPresent ? (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Déjà dans le roster
                      </span>
                    ) : isSelected ? (
                      <span className="text-[11px] font-bold text-brand-orange bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                        À copier
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIds.size} enseignant(s) sélectionné(s)
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCopier}
              disabled={selectedIds.size === 0 || copierMutation.isPending}
              className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-brand-orange/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              {copierMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Copie en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Copier vers la session ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

