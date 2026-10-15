"use client";

import { useMemo, useState } from "react";
import {
  X,
  Search,
  Building2,
  DollarSign,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Edit3,
} from "lucide-react";
import { usePersonnelList, useDefinirSalairePersonnel } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { useSimulationBordereauPersonnel } from "@/modules/remuneration/data/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ROLE_LABELS, type Role } from "@/types/roles";
import { Button } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";

interface GestionSalairesPersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName?: string;
}

export function GestionSalairesPersonnelModal({
  isOpen,
  onClose,
  sessionId,
  sessionName,
}: GestionSalairesPersonnelModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null);
  const [salaireInput, setSalaireInput] = useState<string>("");
  const [dateDebutEffet, setDateDebutEffet] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: personnelList = [], isLoading: loadingPersonnel } = usePersonnelList();
  const { data: utilisateurs = [] } = useUtilisateurs();
  const { data: simulation, isLoading: loadingSim } = useSimulationBordereauPersonnel(
    sessionId,
    undefined,
    undefined,
    isOpen
  );

  const definirSalaireMutation = useDefinirSalairePersonnel();

  // Maps
  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    utilisateurs.forEach((u) => {
      if (u.id && u.role) {
        map.set(u.id, u.role as Role);
      }
    });
    return map;
  }, [utilisateurs]);

  const currentSalaryMap = useMemo(() => {
    const map = new Map<string, number>();
    if (simulation?.fiches) {
      simulation.fiches.forEach((f) => {
        map.set(f.personnelId, Number(f.salaireReference || 0));
      });
    }
    return map;
  }, [simulation]);

  // Filtered staff
  const filteredPersonnel = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return personnelList.filter((p) => {
      const nomComplet = `${p.nom} ${p.prenom}`.toLowerCase();
      const email = (p.email || "").toLowerCase();
      const telephone = (p.telephone || "").toLowerCase();
      const role = roleMap.get(p.id) ? ROLE_LABELS[roleMap.get(p.id)!].toLowerCase() : "";
      return (
        nomComplet.includes(query) ||
        email.includes(query) ||
        telephone.includes(query) ||
        role.includes(query)
      );
    });
  }, [personnelList, searchTerm, roleMap]);

  if (!isOpen) return null;

  const handleStartEdit = (personnelId: string, currentSalary: number) => {
    setEditingPersonnelId(personnelId);
    setSalaireInput(currentSalary > 0 ? String(currentSalary) : "");
    setDateDebutEffet(new Date().toISOString().split("T")[0]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingPersonnelId(null);
    setSalaireInput("");
    setErrorMsg(null);
  };

  const handleSaveSalary = async (personnelId: string) => {
    const salaire = Number(salaireInput);
    if (isNaN(salaire) || salaire < 0) {
      setErrorMsg("Veuillez saisir un salaire valide supérieur ou égal à 0.");
      return;
    }

    setErrorMsg(null);
    try {
      await definirSalaireMutation.mutateAsync({
        personnelId,
        sessionId,
        salaireReference: salaire,
        dateDebutEffet: dateDebutEffet || undefined,
      });

      // Also invalidate the simulation query
      await queryClient.invalidateQueries({
        queryKey: ["simulation-bordereau-personnel"],
      });

      setSuccessMsg("Salaire de référence mis à jour avec succès.");
      setEditingPersonnelId(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(messageErreurApi(err));
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Salaires de Référence du Personnel
              </h2>
              <p className="text-xs text-slate-500">
                Session : <span className="font-semibold text-slate-700">{sessionName || "Session active"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback banners */}
        {errorMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="border-b border-slate-100 bg-white px-6 py-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, rôle, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-4 pl-9 text-xs text-slate-800 placeholder-slate-400 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingPersonnel || loadingSim ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
              <p className="text-xs">Chargement des membres du personnel...</p>
            </div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-400">
              <UserCheck className="h-10 w-10 stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Aucun collaborateur trouvé</p>
              <p className="text-xs text-slate-400">
                {searchTerm ? "Aucun résultat pour cette recherche." : "Aucun membre du personnel enregistré."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                  <tr>
                    <th className="py-3 pr-3 pl-4">Collaborateur</th>
                    <th className="px-3 py-3">Rôle système</th>
                    <th className="px-3 py-3">Coordonnées</th>
                    <th className="px-3 py-3 text-right">Salaire Référence</th>
                    <th className="py-3 pr-4 pl-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPersonnel.map((p) => {
                    const role = roleMap.get(p.id);
                    const currentSalaire = currentSalaryMap.get(p.id) ?? 0;
                    const isEditing = editingPersonnelId === p.id;

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isEditing ? "bg-amber-50/40" : "hover:bg-slate-50/70"
                        }`}
                      >
                        {/* Name & avatar */}
                        <td className="py-3 pr-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 uppercase">
                              {p.prenom ? p.prenom.charAt(0) : ""}
                              {p.nom ? p.nom.charAt(0) : ""}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {p.nom} {p.prenom}
                              </p>
                              {p.numeroCni && (
                                <p className="font-mono text-[10px] text-slate-400">
                                  CNI : {p.numeroCni}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-3 py-3">
                          {role ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs">
                              <ShieldCheck className="h-3 w-3 text-amber-600" />
                              {ROLE_LABELS[role]}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Personnel</span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-3 py-3 text-slate-600">
                          <p>{p.telephone || "—"}</p>
                          <p className="text-[10px] text-slate-400">{p.email || "—"}</p>
                        </td>

                        {/* Salary */}
                        <td className="px-3 py-3 text-right">
                          {isEditing ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="relative w-36">
                                <input
                                  type="number"
                                  min="0"
                                  step="5000"
                                  value={salaireInput}
                                  onChange={(e) => setSalaireInput(e.target.value)}
                                  placeholder="0"
                                  autoFocus
                                  className="w-full rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-right font-mono text-xs font-bold text-slate-900 shadow-2xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                                />
                                <span className="absolute top-1/2 right-2 -translate-y-1/2 font-sans text-[10px] font-semibold text-slate-400">
                                  F
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <span>Effet :</span>
                                <input
                                  type="date"
                                  value={dateDebutEffet}
                                  onChange={(e) => setDateDebutEffet(e.target.value)}
                                  className="rounded border border-slate-200 px-1 py-0.5 text-[10px]"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              {currentSalaire > 0 ? (
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {currentSalaire.toLocaleString("fr-FR")} FCFA
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                                  Non configuré
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 pr-4 pl-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveSalary(p.id)}
                                disabled={definirSalaireMutation.isPending}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                title="Enregistrer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={definirSalaireMutation.isPending}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                title="Annuler"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(p.id, currentSalaire)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-800"
                            >
                              <Edit3 className="h-3 w-3 text-slate-400" />
                              <span>{currentSalaire > 0 ? "Modifier" : "Définir"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>
              Les salaires enregistrés servent de base lors de la génération de chaque bordereau de paie.
            </span>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
