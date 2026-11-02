"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, ArrowUpRight, ReceiptText, Wallet } from "lucide-react";
import { Modal, Button, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import type { MouvementFinancier, Motif } from "../domain/types";
import type { Apprenant } from "@/modules/apprenants";
import type { Formation } from "@/modules/academique";

const FCFA = new Intl.NumberFormat("fr-FR");

function getInitiales(prenom?: string, nom?: string) {
  const p = prenom?.trim()?.[0] || "";
  const n = nom?.trim()?.[0] || "";
  return (p + n).toUpperCase() || "EP";
}

export interface DernieresTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: MouvementFinancier[];
  apprenants: Apprenant[];
  motifs: Motif[];
  formations: Formation[];
  nomCentre?: string;
}

export function DernieresTransactionsModal({
  isOpen,
  onClose,
  transactions,
  apprenants,
  motifs,
  formations,
  nomCentre,
}: DernieresTransactionsModalProps) {
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"TOUS" | "VALIDE" | "EN_COURS">("TOUS");

  type TriColonne = "date" | "eleve" | "motif" | "montant" | "statut";
  const [triColonne, setTriColonne] = useState<TriColonne>("date");
  const [triDirection, setTriDirection] = useState<SortDirection>("desc");

  function handleTri(colonne: TriColonne) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection(colonne === "date" || colonne === "montant" ? "desc" : "asc");
    }
  }

  const transactionsFiltrees = useMemo(() => {
    const list = transactions.filter((e) => {
      if (filtreStatut !== "TOUS") {
        if (filtreStatut === "VALIDE" && e.statut !== "VALIDE") return false;
        if (filtreStatut === "EN_COURS" && e.statut === "VALIDE") return false;
      }
      if (!recherche.trim()) return true;
      const q = recherche.toLowerCase();
      const apprenant = apprenants.find((a) => a.id === e.apprenantId);
      const motif = motifs.find((m) => m.id === e.motifId);
      const formation = formations.find((f) => f.id === e.formationId);
      const nomComplet = apprenant ? `${apprenant.prenom} ${apprenant.nom}`.toLowerCase() : "";
      const motifNom = motif?.nom?.toLowerCase() || "";
      const formationNom = formation?.nom?.toLowerCase() || "";
      return nomComplet.includes(q) || motifNom.includes(q) || formationNom.includes(q);
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "date") {
        cmp = compareDates(a.date, b.date);
      } else if (triColonne === "eleve") {
        const appA = apprenants.find((x) => x.id === a.apprenantId);
        const appB = apprenants.find((x) => x.id === b.apprenantId);
        const nomA = appA ? `${appA.nom} ${appA.prenom}` : "";
        const nomB = appB ? `${appB.nom} ${appB.prenom}` : "";
        cmp = compareStrings(nomA, nomB);
      } else if (triColonne === "motif") {
        const motifA = motifs.find((m) => m.id === a.motifId)?.nom || "";
        const motifB = motifs.find((m) => m.id === b.motifId)?.nom || "";
        cmp = compareStrings(motifA, motifB);
      } else if (triColonne === "montant") {
        cmp = compareNumbers(a.montant, b.montant);
      } else if (triColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [
    transactions,
    filtreStatut,
    recherche,
    apprenants,
    motifs,
    formations,
    triColonne,
    triDirection,
  ]);

  const totalMontantFiltre = useMemo(
    () => transactionsFiltrees.reduce((sum, t) => sum + t.montant, 0),
    [transactionsFiltrees],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-brand-orange">
            <ReceiptText size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Dernières Transactions Encaissées
            </h2>
            {nomCentre && (
              <p className="text-xs text-slate-500 font-medium">{nomCentre}</p>
            )}
          </div>
        </div>
      }
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Barre d'outils de filtrage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par élève, filière, motif..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:border-brand-orange focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFiltreStatut("TOUS")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filtreStatut === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tous ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltreStatut("VALIDE")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filtreStatut === "VALIDE"
                    ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
              >
                Validés
              </button>
              <button
                type="button"
                onClick={() => setFiltreStatut("EN_COURS")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filtreStatut === "EN_COURS"
                    ? "bg-white text-amber-800 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-amber-800"
                }`}
              >
                En cours
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des transactions */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200 text-slate-700">
                <SortableHeader
                  label="Date"
                  sortKey="date"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                />
                <SortableHeader
                  label="Élève & Programme"
                  sortKey="eleve"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                />
                <SortableHeader
                  label="Motif"
                  sortKey="motif"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                />
                <SortableHeader
                  label="Montant"
                  sortKey="montant"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                  align="right"
                />
                <SortableHeader
                  label="Statut"
                  sortKey="statut"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                  align="center"
                />
                <th className="p-3 font-bold text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {transactionsFiltrees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-400 text-xs italic"
                  >
                    {recherche.trim()
                      ? "Aucun règlement ne correspond à votre recherche."
                      : "Aucune transaction enregistrée pour cette session."}
                  </td>
                </tr>
              ) : (
                transactionsFiltrees.map((e) => {
                  const apprenant = apprenants.find((a) => a.id === e.apprenantId);
                  const formation = formations.find((f) => f.id === e.formationId);
                  const motif = motifs.find((m) => m.id === e.motifId);
                  const aujourdhuiStr = new Date().toISOString().slice(0, 10);

                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {new Date(e.date).toLocaleDateString("fr-FR")}
                        </span>
                        {e.date === aujourdhuiStr && (
                          <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 bg-emerald-100 text-[10px] font-black text-emerald-800">
                            Aujourd&apos;hui
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitiales(apprenant?.prenom, apprenant?.nom)}
                          </div>
                          <div className="min-w-0">
                            {apprenant ? (
                              <Link
                                href={`/apprenants/${apprenant.id}`}
                                className="font-bold text-slate-900 hover:text-brand-orange transition-colors truncate block"
                                onClick={onClose}
                              >
                                {apprenant.prenom} {apprenant.nom}
                              </Link>
                            ) : (
                              <span className="text-slate-500 font-medium">
                                Versement divers
                              </span>
                            )}
                            {formation && (
                              <span className="text-[10px] text-slate-400 block truncate">
                                {formation.nom}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] inline-block">
                          {motif?.nom || "Frais de scolarité"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                        +{FCFA.format(e.montant)} F
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            e.statut === "VALIDE"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              e.statut === "VALIDE"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {e.statut === "VALIDE" ? "Validé" : "En cours"}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {apprenant ? (
                          <Link
                            href={`/apprenants/${apprenant.id}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:text-brand-orange hover:border-brand-orange/40 transition-colors"
                          >
                            <span>Détails</span>
                            <ArrowRight size={11} />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de modale avec total et bouton vers Journal complet */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-600">
            <span>
              Total affiché :{" "}
              <strong className="text-slate-900 font-black">
                {FCFA.format(totalMontantFiltre)} F
              </strong>{" "}
              ({transactionsFiltrees.length} opération{transactionsFiltrees.length > 1 ? "s" : ""})
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-xs px-3 py-1.5 cursor-pointer"
            >
              Fermer
            </Button>

            <Link href="/finances" onClick={onClose}>
              <Button
                type="button"
                className="bg-brand-blue hover:bg-brand-blue-hover text-white flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Wallet size={13} />
                <span>Journal financier complet</span>
                <ArrowUpRight size={13} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
