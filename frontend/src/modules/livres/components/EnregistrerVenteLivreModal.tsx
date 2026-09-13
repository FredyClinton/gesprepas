"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal, Button, ApprenantCombobox } from "@/shared/ui";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Calendar,
  Building2,
  User,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useLivres, useEnregistrerVenteLivre } from "../data/queries";
import { useApprenants } from "@/modules/apprenants";
import type { LigneVenteLivreDTO } from "../domain/types";

const FCFA = new Intl.NumberFormat("fr-FR");

interface CentreItem {
  id: string;
  nom: string;
}

interface EnregistrerVenteLivreModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  centres: CentreItem[];
  userCentreId?: string;
  userRole?: string;
  initialApprenantId?: string;
  initialNomApprenant?: string;
}

export function EnregistrerVenteLivreModal({
  isOpen,
  onClose,
  sessionId,
  centres,
  userCentreId,
  userRole,
  initialApprenantId,
  initialNomApprenant,
}: EnregistrerVenteLivreModalProps) {
  const { data: authSession } = useSession();
  const rawUserId = authSession?.user?.id;
  const isUUID =
    rawUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      rawUserId,
    );
  const userId = isUUID ? rawUserId : "00000000-0000-0000-0000-000000000000";

  const { data: livres = [], isLoading: livresLoading } = useLivres(true);
  const { data: allApprenants = [] } = useApprenants();

  const estChefCentre = userRole === "CHEF_CENTRE";

  const [centreId, setCentreId] = useState<string>(
    userCentreId || centres[0]?.id || "",
  );
  const [dateVente, setDateVente] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [estExterne, setEstExterne] = useState<boolean>(false);
  const [selectedApprenantId, setSelectedApprenantId] = useState<string>(
    initialApprenantId || "",
  );
  const [nomAcheteurExterne, setNomAcheteurExterne] = useState<string>(
    initialNomApprenant && !initialApprenantId ? initialNomApprenant : "",
  );

  // Map of selected quantities: livreId -> quantity
  const [quantitesParLivre, setQuantitesParLivre] = useState<Record<string, number>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<boolean>(false);

  useEffect(() => {
    if (userCentreId) {
      setCentreId(userCentreId);
    } else if (centres.length > 0 && !centreId) {
      setCentreId(centres[0].id);
    }
  }, [userCentreId, centres, centreId]);

  useEffect(() => {
    if (initialApprenantId) {
      setSelectedApprenantId(initialApprenantId);
      setEstExterne(false);
    }
  }, [initialApprenantId]);

  const apprenantsDisponibles = useMemo(() => {
    if (!centreId) return allApprenants;
    return allApprenants.filter((a) => a.centreId === centreId);
  }, [allApprenants, centreId]);

  const currentApprenant = useMemo(
    () => allApprenants.find((a) => a.id === selectedApprenantId),
    [allApprenants, selectedApprenantId],
  );

  const toggleLivre = (livreId: string) => {
    setQuantitesParLivre((prev) => {
      const copy = { ...prev };
      if (copy[livreId] && copy[livreId] > 0) {
        delete copy[livreId];
      } else {
        copy[livreId] = 1;
      }
      return copy;
    });
  };

  const updateQuantite = (livreId: string, qte: number) => {
    const nouvelleQte = Math.max(1, qte);

    setQuantitesParLivre((prev) => ({
      ...prev,
      [livreId]: nouvelleQte,
    }));
  };

  const toutCocher = () => {
    const nouv: Record<string, number> = {};
    livres.forEach((l) => {
      nouv[l.id] = quantitesParLivre[l.id] || 1;
    });
    setQuantitesParLivre(nouv);
  };

  const toutDecocher = () => {
    setQuantitesParLivre({});
  };

  const lignesVente: LigneVenteLivreDTO[] = useMemo(() => {
    return Object.entries(quantitesParLivre)
      .filter(([, q]) => q > 0)
      .map(([livreId, quantite]) => ({ livreId, quantite }));
  }, [quantitesParLivre]);

  const totalMontant = useMemo(() => {
    return lignesVente.reduce((sum, ligne) => {
      const l = livres.find((item) => item.id === ligne.livreId);
      return sum + (l ? l.prix * ligne.quantite : 0);
    }, 0);
  }, [lignesVente, livres]);

  const totalExemplaires = useMemo(() => {
    return lignesVente.reduce((sum, ligne) => sum + ligne.quantite, 0);
  }, [lignesVente]);

  const enregistrerMutation = useEnregistrerVenteLivre(userRole, userCentreId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!centreId) {
      setErreur("Veuillez sélectionner un centre vendeur.");
      return;
    }

    if (!dateVente) {
      setErreur("Veuillez sélectionner une date de vente.");
      return;
    }

    let nomFinal = "";
    let apprenantIdFinal: string | undefined = undefined;

    if (estExterne) {
      nomFinal = nomAcheteurExterne.trim();
      if (!nomFinal) {
        setErreur("Veuillez saisir le nom de l'acheteur externe.");
        return;
      }
    } else {
      if (!selectedApprenantId || !currentApprenant) {
        setErreur("Veuillez rechercher et sélectionner un élève inscrit.");
        return;
      }
      nomFinal = `${currentApprenant.nom} ${currentApprenant.prenom}`;
      apprenantIdFinal = currentApprenant.id;
    }

    if (lignesVente.length === 0) {
      setErreur("Veuillez sélectionner au moins un livre à vendre.");
      return;
    }

    try {
      await enregistrerMutation.mutateAsync({
        sessionId,
        centreId,
        dateVente,
        nomAcheteur: nomFinal,
        apprenantId: apprenantIdFinal,
        estExterne,
        saisiParUtilisateurId: userId,
        lignes: lignesVente,
      });

      setSucces(true);
      setTimeout(() => {
        setSucces(false);
        setQuantitesParLivre({});
        setNomAcheteurExterne("");
        setSelectedApprenantId("");
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement de la vente.";
      setErreur(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer une vente de livres"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {succes && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>Vente enregistrée avec succès !</span>
          </div>
        )}

        {erreur && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 animate-in fade-in">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {/* ── Ligne 1 : Centre & Date ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400" />
              <span>Centre vendeur</span> <span className="text-rose-500">*</span>
            </label>
            {estChefCentre ? (
              <div className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-bold text-slate-800">
                {centres.find((c) => c.id === centreId)?.nom || "Mon Centre"}
              </div>
            ) : (
              <select
                value={centreId}
                onChange={(e) => setCentreId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>Date de vente</span> <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dateVente}
              onChange={(e) => setDateVente(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            />
          </div>
        </div>

        {/* ── Ligne 2 : Type d'acheteur (Interne vs Externe) ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>Acheteur du ou des livres</span> <span className="text-rose-500">*</span>
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEstExterne(false)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  !estExterne
                    ? "bg-brand-orange text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Élève du centre
              </button>
              <button
                type="button"
                onClick={() => setEstExterne(true)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  estExterne
                    ? "bg-brand-orange text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Acheteur externe
              </button>
            </div>
          </div>

          {!estExterne ? (
            <div>
              <ApprenantCombobox
                apprenants={apprenantsDisponibles}
                selectedId={selectedApprenantId}
                onSelect={(apprenant) => setSelectedApprenantId(apprenant?.id || "")}
                placeholder="Rechercher par nom, prénom ou matricule..."
              />
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={nomAcheteurExterne}
                onChange={(e) => setNomAcheteurExterne(e.target.value)}
                placeholder="Nom complet de l'acheteur externe (ex: Parent, Nom & Prénom)..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                La vente sera enregistrée en tant qu'acheteur externe et apparaîtra dans la traçabilité de session.
              </p>
            </div>
          )}
        </div>

        {/* ── Ligne 3 : Sélection des ouvrages & Quantités ── */}
        <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <BookOpen size={15} className="text-brand-orange" />
              <span>Ouvrages disponibles & Quantités</span>
              <span className="text-rose-500">*</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={toutCocher}
                className="font-bold text-brand-orange hover:underline cursor-pointer"
              >
                Tout cocher
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={toutDecocher}
                className="font-bold text-slate-500 hover:underline cursor-pointer"
              >
                Tout décocher
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {livres.map((livre) => {
              const estCoche = Boolean(quantitesParLivre[livre.id]);
              const qte = quantitesParLivre[livre.id] || 1;

              return (
                <div
                  key={livre.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    estCoche
                      ? "border-brand-orange/70 bg-white shadow-xs"
                      : "border-slate-200 bg-white/70 hover:border-slate-300"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={estCoche}
                      onChange={() => toggleLivre(livre.id)}
                      className="h-4 w-4 rounded text-brand-orange focus:ring-brand-orange/20 cursor-pointer accent-brand-orange shrink-0"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {livre.titre}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-brand-orange font-mono">
                        {FCFA.format(livre.prix)} FCFA / unité
                      </div>
                    </div>
                  </label>

                  {/* Contrôle de quantité si coché */}
                  {estCoche && (
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantite(livre.id, qte - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Diminuer la quantité"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qte}
                        onChange={(e) =>
                          updateQuantite(livre.id, parseInt(e.target.value) || 1)
                        }
                        className="h-7 w-12 text-center rounded-lg border border-slate-200 text-xs font-black text-slate-800 outline-none focus:border-brand-orange"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantite(livre.id, qte + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                        title="Augmenter la quantité"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-slate-700 pl-2 min-w-[75px] text-right">
                        {FCFA.format(livre.prix * qte)} F
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Récapitulatif de commande */}
          <div className="flex items-center justify-between border-t border-orange-200 pt-3 text-xs">
            <span className="text-slate-600 font-medium">
              {totalExemplaires} livre{totalExemplaires > 1 ? "s" : ""} sélectionné{totalExemplaires > 1 ? "s" : ""}
            </span>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">
                Montant total :
              </span>
              <span className="text-base font-black text-brand-orange font-mono">
                {FCFA.format(totalMontant)} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* ── Boutons d'action ── */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={enregistrerMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              enregistrerMutation.isPending ||
              lignesVente.length === 0 ||
              (!estExterne && !selectedApprenantId) ||
              (estExterne && !nomAcheteurExterne.trim())
            }
            className="flex items-center gap-2 bg-brand-orange text-white font-bold hover:bg-brand-orange/90 shadow-sm cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>
              {enregistrerMutation.isPending
                ? "Enregistrement en cours..."
                : `Valider la vente (${FCFA.format(totalMontant)} FCFA)`}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

