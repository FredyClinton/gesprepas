"use client";

import { useMemo, useState, useEffect } from "react";
import {
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  UserPlus,
  Phone,
  Clock,
  GraduationCap,
  Users,
  Calendar,
} from "lucide-react";
import type { Departement } from "@/modules/departement";
import type { Matiere, CouleurMatiere } from "@/modules/matieres";
import type { Enseignant } from "@/modules/personnel";
import type { Formation } from "@/modules/academique";
import { Button } from "@/shared/ui";

export type DepartementDrawerProps = {
  departement: Departement | null;
  matiere?: Matiere;
  couleur?: CouleurMatiere;
  chef?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
  };
  rosterEnseignantIds: string[];
  enseignantsParId: Map<string, Enseignant>;
  tousEnseignants: Enseignant[];
  formations: Formation[];
  centres: { id: string; nom: string }[];
  affectations: {
    id: string;
    centreId: string;
    formationId: string;
    matiereId: string;
    enseignantId?: string | null;
    jour: string;
    seance: number;
    semaine: number;
    statut: string;
  }[];
  semaineCourante: number;
  isOpen: boolean;
  onClose: () => void;
  onRenommer: (dep: Departement) => void;
  onSupprimer: (dep: Departement) => void;
  onAssignerChef: (dep: Departement) => void;
  onAjouterRoster: (enseignantId: string) => void;
  onRetirerRoster: (enseignantId: string) => void;
  isAddingRoster?: boolean;
};

export function DepartementDrawer({
  departement,
  matiere,
  couleur,
  chef,
  rosterEnseignantIds,
  enseignantsParId,
  tousEnseignants,
  formations,
  centres,
  affectations,
  semaineCourante,
  isOpen,
  onClose,
  onRenommer,
  onSupprimer,
  onAssignerChef,
  onAjouterRoster,
  onRetirerRoster,
  isAddingRoster = false,
}: DepartementDrawerProps) {
  const [onglet, setOnglet] = useState<"roster" | "creneaux" | "formations">("roster");
  const [rechercheRoster, setRechercheRoster] = useState("");
  const [enseignantAajouterId, setEnseignantAajouterId] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const enseignantIdsSet = useMemo(
    () => new Set(rosterEnseignantIds),
    [rosterEnseignantIds],
  );

  const enseignantsDisponibles = useMemo(() => {
    return tousEnseignants.filter((e) => !enseignantIdsSet.has(e.id));
  }, [tousEnseignants, enseignantIdsSet]);

  const enseignantsRoster = useMemo(() => {
    return rosterEnseignantIds
      .map((id) => enseignantsParId.get(id))
      .filter((e): e is Enseignant => Boolean(e))
      .filter((e) => {
        if (!rechercheRoster.trim()) return true;
        const q = rechercheRoster.toLowerCase();
        return (
          e.nom.toLowerCase().includes(q) ||
          e.prenom.toLowerCase().includes(q) ||
          e.matricule.toLowerCase().includes(q)
        );
      });
  }, [rosterEnseignantIds, enseignantsParId, rechercheRoster]);

  const creneauxMatiere = useMemo(() => {
    if (!departement) return [];
    return affectations.filter((a) => a.matiereId === departement.matiereId);
  }, [affectations, departement]);

  const creneauxPourvus = useMemo(() => {
    return creneauxMatiere.filter((c) => c.enseignantId).length;
  }, [creneauxMatiere]);

  const formationsMatiere = useMemo(() => {
    if (!departement) return [];
    return formations.filter((f) => f.matiereIds?.includes(departement.matiereId));
  }, [formations, departement]);

  const centresParId = useMemo(() => {
    const map = new Map<string, string>();
    centres.forEach((c) => map.set(c.id, c.nom));
    return map;
  }, [centres]);

  const formationsParId = useMemo(() => {
    const map = new Map<string, string>();
    formations.forEach((f) => map.set(f.id, f.nom));
    return map;
  }, [formations]);

  const handleAjoutEnseignant = () => {
    if (!enseignantAajouterId) return;
    onAjouterRoster(enseignantAajouterId);
    setEnseignantAajouterId("");
  };

  if (!isOpen || !departement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          className="w-screen max-w-xl bg-white shadow-xl flex flex-col border-l border-slate-200"
        >
          {/* En-tête ERP du tiroir */}
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {couleur?.hex && (
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: couleur.hex }}
                    />
                  )}
                  <span className="text-xs font-medium text-slate-500">
                    {matiere?.nom ?? "Discipline générale"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 truncate">
                  {departement.nom}
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRenommer(departement)}
                  className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Renommer le département"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onSupprimer(departement)}
                  className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Supprimer le département"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
                  title="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Fiche Direction Pédagogique */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Direction pédagogique
                </span>
                <button
                  type="button"
                  onClick={() => onAssignerChef(departement)}
                  className="text-xs font-semibold text-brand-orange hover:underline cursor-pointer"
                >
                  {chef ? "Modifier" : "Assigner"}
                </button>
              </div>

              {chef ? (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {chef.prenom} {chef.nom}
                    </p>
                    <p className="text-slate-500">{chef.email}</p>
                  </div>
                  {chef.telephone && (
                    <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                      <Phone size={11} className="text-slate-400" />
                      {chef.telephone}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Poste vacant — aucun chef désigné</span>
                </div>
              )}
            </div>

            {/* Métriques clés en ligne */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Équipe</span>
                <span className="font-semibold text-slate-900">
                  {rosterEnseignantIds.length} enseignant{rosterEnseignantIds.length > 1 ? "s" : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Séances S{semaineCourante}
                </span>
                <span
                  className={`font-semibold ${
                    creneauxMatiere.length > 0 && creneauxPourvus < creneauxMatiere.length
                      ? "text-amber-700"
                      : "text-slate-900"
                  }`}
                >
                  {creneauxPourvus} / {creneauxMatiere.length} pourvues
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Formations</span>
                <span className="font-semibold text-slate-900">
                  {formationsMatiere.length} cursus
                </span>
              </div>
            </div>
          </div>

          {/* Onglets ERP sobres */}
          <div className="flex border-b border-slate-200 bg-white px-6">
            <button
              type="button"
              onClick={() => setOnglet("roster")}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                onglet === "roster"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={14} />
              <span>Équipe ({rosterEnseignantIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setOnglet("creneaux")}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                onglet === "creneaux"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar size={14} />
              <span>Séances de la semaine ({creneauxMatiere.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setOnglet("formations")}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                onglet === "formations"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap size={14} />
              <span>Formations ({formationsMatiere.length})</span>
            </button>
          </div>

          {/* Corps du panneau défilant */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* ONGLET 1 : ROSTER */}
            {onglet === "roster" && (
              <div className="space-y-4">
                {/* Formulaire d'ajout rapide */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Ajouter un enseignant au pôle (Session active)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={enseignantAajouterId}
                      onChange={(e) => setEnseignantAajouterId(e.target.value)}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-orange"
                    >
                      <option value="">
                        -- Sélectionner un enseignant ({enseignantsDisponibles.length} disponibles) --
                      </option>
                      {enseignantsDisponibles.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.prenom} {e.nom} ({e.matricule})
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={!enseignantAajouterId || isAddingRoster}
                      onClick={handleAjoutEnseignant}
                      className="bg-brand-orange text-white text-xs font-semibold px-3 py-1.5 rounded-md shrink-0"
                    >
                      {isAddingRoster ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </div>

                {/* Filtre roster si liste supérieure à 4 */}
                {rosterEnseignantIds.length > 4 && (
                  <input
                    type="search"
                    value={rechercheRoster}
                    onChange={(e) => setRechercheRoster(e.target.value)}
                    placeholder="Filtrer par nom ou matricule..."
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-orange"
                  />
                )}

                {/* Tableau sobre des enseignants */}
                {enseignantsRoster.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    Aucun enseignant rattaché à ce pôle pour cette session.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Enseignant</th>
                          <th className="py-2.5 px-3">Matricule</th>
                          <th className="py-2.5 px-3">Statut</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {enseignantsRoster.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {e.prenom} {e.nom}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {e.matricule}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  e.statut === "ACTIF"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {e.statut === "ACTIF" ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onRetirerRoster(e.id)}
                                className="text-slate-400 hover:text-rose-600 text-xs font-medium cursor-pointer"
                                title="Retirer de l'équipe"
                              >
                                Retirer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ONGLET 2 : SÉANCES */}
            {onglet === "creneaux" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Planning des séances programmées cette semaine pour la matière{" "}
                  <strong className="text-slate-800">{matiere?.nom}</strong> :
                </p>

                {creneauxMatiere.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    Aucun créneau planifié pour cette matière cette semaine.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Créneau</th>
                          <th className="py-2.5 px-3">Centre & Formation</th>
                          <th className="py-2.5 px-3">Enseignant</th>
                          <th className="py-2.5 px-3 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {creneauxMatiere.map((c) => {
                          const prof = c.enseignantId
                            ? enseignantsParId.get(c.enseignantId)
                            : undefined;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                {c.jour} · S{c.seance}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <span className="block font-medium">
                                  {formationsParId.get(c.formationId) ?? c.formationId}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {centresParId.get(c.centreId) ?? c.centreId}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {prof ? (
                                  <span className="font-medium text-slate-900">
                                    {prof.prenom} {prof.nom}
                                  </span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    Non assigné
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    c.statut === "EFFECTUEE"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {c.statut === "EFFECTUEE" ? "Effectuée" : "Planifiée"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ONGLET 3 : FORMATIONS */}
            {onglet === "formations" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Formations intégrant cette discipline dans leur cursus :
                </p>

                {formationsMatiere.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    Aucune formation ne comprend cette matière pour le moment.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {formationsMatiere.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <span className="font-medium text-slate-900">{f.nom}</span>
                        <span className="text-slate-400">
                          {f.matiereIds?.length ?? 0} matière(s) au programme
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pied de tiroir */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
