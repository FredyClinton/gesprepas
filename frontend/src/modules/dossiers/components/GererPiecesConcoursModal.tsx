"use client";

import React, { useState, useMemo } from "react";
import { Modal, Button } from "@/shared/ui";
import {
  usePiecesDuConcours,
  usePiecesRequises,
  useAjouterPieceAuConcours,
  useRetirerPieceDuConcours,
  type Concours,
} from "@/modules/dossiers";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  CheckSquare2,
  Square,
  Sparkles,
  Calendar,
  Layers,
  FileCheck,
} from "lucide-react";

const FCFA = new Intl.NumberFormat("fr-FR");

interface GererPiecesConcoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  concours: Concours | null;
  peutModifier?: boolean;
}

export function GererPiecesConcoursModal(props: GererPiecesConcoursModalProps) {
  if (!props.isOpen || !props.concours) return null;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={`Pièces exigées : ${props.concours.nom}`}
      maxWidth="max-w-2xl"
    >
      <GererPiecesConcoursContent
        key={props.concours.id}
        concours={props.concours}
        onClose={props.onClose}
        peutModifier={props.peutModifier}
      />
    </Modal>
  );
}

function GererPiecesConcoursContent({
  concours,
  onClose,
  peutModifier = false,
}: {
  concours: Concours;
  onClose: () => void;
  peutModifier?: boolean;
}) {
  const { data: piecesConcours = [], isLoading: chargementPieces } = usePiecesDuConcours(
    concours.id,
  );
  const { data: catalogue = [], isLoading: chargementCatalogue } = usePiecesRequises();

  const ajouterPieceMutation = useAjouterPieceAuConcours();
  const retirerPieceMutation = useRetirerPieceDuConcours();

  const [onglet, setOnglet] = useState<"exigees" | "catalogue">("exigees");
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enTraitementId, setEnTraitementId] = useState<string | null>(null);
  const [actionEnMasse, setActionEnMasse] = useState(false);

  const idsPiecesActuelles = new Set(piecesConcours.map((p) => p.id));
  const catalogueActif = catalogue.filter((p) => p.actif);

  // Montant total estimé des pièces actuellement exigées
  const totalMontant = piecesConcours.reduce((acc, p) => acc + (p.montant || 0), 0);

  // Filtrage selon la recherche et tri par ordre alphabétique
  const rechercheNormalisee = recherche.toLowerCase().trim();

  const piecesExigeesFiltrees = useMemo(() => {
    return piecesConcours
      .filter((p) =>
        rechercheNormalisee ? p.nom.toLowerCase().includes(rechercheNormalisee) : true,
      )
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
  }, [piecesConcours, rechercheNormalisee]);

  const catalogueFiltre = useMemo(() => {
    return catalogueActif
      .filter((p) =>
        rechercheNormalisee ? p.nom.toLowerCase().includes(rechercheNormalisee) : true,
      )
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
  }, [catalogueActif, rechercheNormalisee]);

  // Toggle une pièce (ajouter ou retirer)
  async function handleTogglePiece(pieceId: string, estDejaExigee: boolean) {
    if (!concours || !peutModifier) return;
    setErreur(null);
    setEnTraitementId(pieceId);

    try {
      if (estDejaExigee) {
        await retirerPieceMutation.mutateAsync({
          concoursId: concours.id,
          pieceRequiseId: pieceId,
        });
      } else {
        await ajouterPieceMutation.mutateAsync({
          concoursId: concours.id,
          pieceRequiseId: pieceId,
        });
      }
    } catch (err: unknown) {
      setErreur(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la pièce pour ce concours.",
      );
    } finally {
      setEnTraitementId(null);
    }
  }

  // Tout exiger (ajouter toutes les pièces du catalogue actif non encore ajoutées)
  async function handleToutExiger() {
    if (!concours || !peutModifier) return;
    setErreur(null);
    setActionEnMasse(true);

    const aAjouter = catalogueActif.filter((p) => !idsPiecesActuelles.has(p.id));
    try {
      for (const piece of aAjouter) {
        await ajouterPieceMutation.mutateAsync({
          concoursId: concours.id,
          pieceRequiseId: piece.id,
        });
      }
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'ajout en masse des pièces.");
    } finally {
      setActionEnMasse(false);
    }
  }

  // Tout retirer (supprimer toutes les pièces du concours)
  async function handleToutRetirer() {
    if (!concours || !peutModifier || piecesConcours.length === 0) return;
    setErreur(null);
    setActionEnMasse(true);

    try {
      for (const piece of piecesConcours) {
        await retirerPieceMutation.mutateAsync({
          concoursId: concours.id,
          pieceRequiseId: piece.id,
        });
      }
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : "Erreur lors de la suppression en masse des pièces.",
      );
    } finally {
      setActionEnMasse(false);
    }
  }

  return (
    <div className="space-y-4">
        {erreur && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {/* ── Cartouche Résumé : Délais & Métriques ── */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-brand-orange" />
                Délais de la session
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-700">
                <span>
                  Recevabilité centre :{" "}
                  <strong className="font-mono text-slate-900">
                    {new Date(concours.dateLimiteRecevabiliteCentre).toLocaleDateString("fr-FR")}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Dépôt officiel :{" "}
                  <strong className="font-mono text-slate-900">
                    {new Date(concours.dateLimiteDepot).toLocaleDateString("fr-FR")}
                  </strong>
                </span>
              </div>
            </div>

            {/* Badges Chiffrés */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pièces exigées
                </span>
                <span className="text-xs font-black text-slate-800">
                  {piecesConcours.length}{" "}
                  <span className="text-[11px] font-normal text-slate-500">
                    / {catalogueActif.length}
                  </span>
                </span>
              </div>

              <div className="px-3 py-1.5 bg-orange-50 border border-orange-200/80 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-brand-orange block">
                  Coût standard
                </span>
                <span className="text-xs font-black font-mono text-brand-orange">
                  {FCFA.format(totalMontant)} FCFA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Onglets & Barre d'actions (si superviseur) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {peutModifier ? (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setOnglet("exigees")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  onglet === "exigees"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileCheck size={14} className={onglet === "exigees" ? "text-emerald-600" : ""} />
                <span>Pièces exigées ({piecesConcours.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOnglet("catalogue")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  onglet === "catalogue"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers size={14} className={onglet === "catalogue" ? "text-brand-orange" : ""} />
                <span>Catalogue & Cases à cocher ({catalogueActif.length})</span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileCheck size={15} className="text-brand-orange" />
              <span>Liste officielle des pièces à fournir par le candidat</span>
            </div>
          )}

          {/* Recherche rapide */}
          <div className="relative w-full sm:w-56">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher une pièce..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
            />
          </div>
        </div>

        {/* ── Actions globales pour le catalogue (si superviseur) ── */}
        {peutModifier && onglet === "catalogue" && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[11px] text-slate-500">
              Cochez les pièces requises pour ce concours :
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToutExiger}
                disabled={actionEnMasse || piecesConcours.length === catalogueActif.length}
                className="text-[11px] font-bold text-brand-orange hover:underline disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                {actionEnMasse ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>Tout exiger</span>
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleToutRetirer}
                disabled={actionEnMasse || piecesConcours.length === 0}
                className="text-[11px] font-bold text-slate-400 hover:text-red-600 hover:underline disabled:opacity-40 cursor-pointer"
              >
                Tout retirer
              </button>
            </div>
          </div>
        )}

        {/* ── VUE 1 : Pièces actuellement exigées ── */}
        {(onglet === "exigees" || !peutModifier) && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {chargementPieces ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 size={18} className="animate-spin inline mr-2 text-brand-orange" />
                Chargement des pièces exigées...
              </div>
            ) : piecesExigeesFiltrees.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileCheck size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  {recherche
                    ? "Aucune pièce exigée ne correspond à votre recherche."
                    : "Aucune pièce requise n'est actuellement configurée pour ce concours."}
                </p>
                {peutModifier && !recherche && (
                  <Button
                    type="button"
                    onClick={() => setOnglet("catalogue")}
                    className="bg-brand-orange text-white text-xs px-3 py-1.5 mt-2"
                  >
                    <Plus size={13} className="mr-1" /> Sélectionner dans le catalogue
                  </Button>
                )}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Pièce exigée</th>
                      <th className="p-3 text-right">Tarif unitaire</th>
                      <th className="p-3 text-center">Exigence</th>
                      {peutModifier && <th className="p-3 text-right w-14">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {piecesExigeesFiltrees.map((piece, index) => {
                      const enCours = enTraitementId === piece.id;
                      const isEven = index % 2 === 0;
                      return (
                        <tr
                          key={piece.id}
                          className={`transition-colors ${
                            isEven ? "bg-white" : "bg-slate-50/75"
                          } hover:bg-orange-50/40`}
                        >
                          <td className="p-3 text-center font-mono text-[11px] font-semibold text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 block">{piece.nom}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  Obligatoire pour le dépôt
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            <span className="inline-block bg-slate-100/90 border border-slate-200/70 px-2 py-0.5 rounded-md">
                              {FCFA.format(piece.montant)} FCFA
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              Exigée
                            </span>
                          </td>
                          {peutModifier && (
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleTogglePiece(piece.id, true)}
                                disabled={enCours || actionEnMasse}
                                title="Ne plus exiger cette pièce pour ce concours"
                                className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-40"
                              >
                                {enCours ? (
                                  <Loader2 size={14} className="animate-spin text-red-500" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── VUE 2 : Catalogue complet avec cases à cocher directes (si superviseur) ── */}
        {peutModifier && onglet === "catalogue" && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {chargementCatalogue ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 size={18} className="animate-spin inline mr-2 text-brand-orange" />
                Chargement du catalogue...
              </div>
            ) : catalogueFiltre.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {recherche
                  ? "Aucune pièce du catalogue ne correspond à votre recherche."
                  : "Aucune pièce active dans le catalogue standard."}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 w-10 text-center">Cocher</th>
                      <th className="p-3">Pièce du catalogue</th>
                      <th className="p-3 text-right">Tarif</th>
                      <th className="p-3 text-center">Statut concours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalogueFiltre.map((piece, index) => {
                      const estExigee = idsPiecesActuelles.has(piece.id);
                      const enCours = enTraitementId === piece.id;
                      const isEven = index % 2 === 0;

                      return (
                        <tr
                          key={piece.id}
                          onClick={() =>
                            !enCours && !actionEnMasse && handleTogglePiece(piece.id, estExigee)
                          }
                          className={`cursor-pointer select-none transition-colors ${
                            estExigee
                              ? "bg-orange-50/50 hover:bg-orange-50/80"
                              : isEven
                              ? "bg-white hover:bg-slate-100/60"
                              : "bg-slate-50/75 hover:bg-slate-100/60"
                          }`}
                        >
                          <td className="p-3 text-center font-mono text-[11px] font-semibold text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3 text-center">
                            {enCours ? (
                              <Loader2 size={16} className="animate-spin text-brand-orange mx-auto" />
                            ) : estExigee ? (
                              <CheckSquare2 size={16} className="text-brand-orange mx-auto" />
                            ) : (
                              <Square size={16} className="text-slate-300 mx-auto" />
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-semibold ${
                                estExigee ? "text-slate-900 font-bold" : "text-slate-600"
                              }`}
                            >
                              {piece.nom}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {FCFA.format(piece.montant)} FCFA
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                estExigee
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {estExigee ? "Sélectionnée" : "Non retenue"}
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

        {/* ── Pied de modal ── */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Total pour le candidat :{" "}
            <strong className="text-brand-orange font-mono font-bold">
              {FCFA.format(totalMontant)} FCFA
            </strong>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
      </div>
    </div>
  );
}
