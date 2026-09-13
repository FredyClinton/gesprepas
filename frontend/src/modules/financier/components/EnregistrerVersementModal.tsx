"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal, Button, ApprenantCombobox } from "@/shared/ui";
import { useMotifs, useSaisirEntree, useMouvementsFinanciers } from "../data/queries";
import { useApprenants } from "@/modules/apprenants";
import { useLivres, useEnregistrerVenteLivre } from "@/modules/livres";
import {
  Coins,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  User,
  BookOpen,
  Check,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";

const FCFA = new Intl.NumberFormat("fr-FR");

interface EnregistrerVersementModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprenantId?: string;
  nomApprenant?: string;
  centreId: string;
  sessionId: string;
  formationId?: string;
  soldeRestant?: number;
}

export function EnregistrerVersementModal({
  isOpen,
  onClose,
  apprenantId,
  nomApprenant,
  centreId,
  sessionId,
  formationId,
  soldeRestant,
}: EnregistrerVersementModalProps) {
  const { data: session } = useSession();
  const rawUserId = session?.user?.id;
  const isUUID =
    rawUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      rawUserId,
    );
  const userId = isUUID ? rawUserId : "00000000-0000-0000-0000-000000000000";

  const { data: allApprenants = [] } = useApprenants();
  const { data: mouvements = [] } = useMouvementsFinanciers(sessionId, centreId);
  const { data: livres = [] } = useLivres(true);

  const apprenantsDuCentre = useMemo(
    () => allApprenants.filter((a) => a.centreId === centreId),
    [allApprenants, centreId],
  );

  const [selectedApprenantId, setSelectedApprenantId] = useState<string>("");

  const effectiveApprenantId = apprenantId || selectedApprenantId;
  const currentApprenant = useMemo(
    () => apprenantsDuCentre.find((a) => a.id === effectiveApprenantId),
    [apprenantsDuCentre, effectiveApprenantId],
  );

  const effectiveNomApprenant =
    nomApprenant ||
    (currentApprenant ? `${currentApprenant.nom} ${currentApprenant.prenom}` : "");
  const effectiveFormationId = formationId || currentApprenant?.formationId;

  const effectiveSoldeRestant = useMemo(() => {
    if (soldeRestant !== undefined) return soldeRestant;
    if (!currentApprenant) return 0;
    const totalVerse = mouvements
      .filter(
        (m) =>
          m.type === "ENTREE" &&
          m.statut !== "REJETE" &&
          m.apprenantId === currentApprenant.id,
      )
      .reduce((sum, m) => sum + m.montant, 0);
    return Math.max(0, (currentApprenant.montantContrat || 0) - totalVerse);
  }, [soldeRestant, currentApprenant, mouvements]);

  const { data: motifs = [] } = useMotifs("ENTREE");
  const motifsActifs = useMemo(
    () => motifs.filter((m) => m.actif !== false),
    [motifs],
  );

  const [montant, setMontant] = useState<number | "">("");
  const [motifId, setMotifId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantitesParLivre, setQuantitesParLivre] = useState<Record<string, number>>({});
  const selectedLivresIds = useMemo(() => Object.keys(quantitesParLivre), [quantitesParLivre]);
  const [estAcheteurExterne, setEstAcheteurExterne] = useState<boolean>(false);
  const [nomAcheteurExterne, setNomAcheteurExterne] = useState<string>("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  // Auto-sélectionner le premier motif ou "Scolarité"
  useEffect(() => {
    if (motifsActifs.length > 0 && !motifId) {
      const motifScolarite = motifsActifs.find(
        (m) =>
          m.nom.toLowerCase().includes("scolarité") ||
          m.nom.toLowerCase().includes("tranche"),
      );
      setMotifId(motifScolarite ? motifScolarite.id : motifsActifs[0].id);
    }
  }, [motifsActifs, motifId]);

  const selectedMotif = useMemo(
    () => motifsActifs.find((m) => m.id === motifId),
    [motifsActifs, motifId],
  );

  const isAchatLivres = useMemo(() => {
    return selectedMotif?.nom.toLowerCase().includes("livre") ?? false;
  }, [selectedMotif]);

  // Si on passe en mode "Achat Livres", recalculer le montant d'après les livres et quantités
  useEffect(() => {
    if (isAchatLivres) {
      const totalLivres = Object.entries(quantitesParLivre).reduce((sum, [id, qte]) => {
        const l = livres.find((item) => item.id === id);
        return sum + (l ? l.prix * qte : 0);
      }, 0);
      setMontant(totalLivres > 0 ? totalLivres : "");
    }
  }, [isAchatLivres, quantitesParLivre, livres]);

  function toggleLivre(id: string) {
    setQuantitesParLivre((prev) => {
      const copy = { ...prev };
      if (copy[id] && copy[id] > 0) {
        delete copy[id];
      } else {
        copy[id] = 1;
      }
      return copy;
    });
  }

  function updateQuantiteLivre(id: string, qte: number) {
    const nouvelleQte = Math.max(1, qte);
    setQuantitesParLivre((prev) => ({
      ...prev,
      [id]: nouvelleQte,
    }));
  }

  function selectionnerTousLivres() {
    const nouv: Record<string, number> = {};
    livres.forEach((l) => {
      nouv[l.id] = quantitesParLivre[l.id] || 1;
    });
    setQuantitesParLivre(nouv);
  }

  function deselectionnerTousLivres() {
    setQuantitesParLivre({});
  }

  const saisirEntreeMutation = useSaisirEntree();
  const enregistrerVenteMutation = useEnregistrerVenteLivre();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!motifId) {
      setErreur("Veuillez choisir un motif de versement.");
      return;
    }

    if (isAchatLivres) {
      const lignes = Object.entries(quantitesParLivre)
        .filter(([, q]) => q > 0)
        .map(([livreId, quantite]) => ({ livreId, quantite }));

      if (lignes.length === 0) {
        setErreur("Veuillez cocher au moins un livre à acheter dans la liste.");
        return;
      }

      let nomFinal = "";
      let apprenantIdFinal: string | undefined = undefined;

      if (estAcheteurExterne) {
        nomFinal = nomAcheteurExterne.trim();
        if (!nomFinal) {
          setErreur("Veuillez saisir le nom de l'acheteur externe.");
          return;
        }
      } else {
        if (!effectiveApprenantId || !currentApprenant) {
          setErreur("Veuillez sélectionner un apprenant.");
          return;
        }
        nomFinal = effectiveNomApprenant;
        apprenantIdFinal = effectiveApprenantId;
      }

      try {
        await enregistrerVenteMutation.mutateAsync({
          sessionId,
          centreId,
          dateVente: date,
          nomAcheteur: nomFinal,
          apprenantId: apprenantIdFinal,
          estExterne: estAcheteurExterne,
          saisiParUtilisateurId: userId,
          lignes,
        });

        setSucces(true);
        setTimeout(() => {
          setSucces(false);
          setMontant("");
          setQuantitesParLivre({});
          setNomAcheteurExterne("");
          onClose();
        }, 800);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'enregistrement de la vente de livres.";
        setErreur(msg);
      }
      return;
    }

    // Cas standard (hors livres, ex: Scolarité, Inscription, etc.)
    if (!effectiveApprenantId) {
      setErreur("Veuillez sélectionner un apprenant.");
      return;
    }

    const m = Number(montant);
    if (!m || m <= 0) {
      setErreur("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    // Règle de non-dépassement pour la scolarité
    if (effectiveSoldeRestant > 0 && m > effectiveSoldeRestant) {
      setErreur(
        `Le montant saisi (${FCFA.format(m)} FCFA) dépasse le solde restant dû (${FCFA.format(
          effectiveSoldeRestant,
        )} FCFA) du contrat. Veuillez ajuster le montant.`,
      );
      return;
    }

    try {
      await saisirEntreeMutation.mutateAsync({
        sessionId,
        motifId,
        montant: m,
        date,
        saisiParUtilisateurId: userId,
        centreId,
        apprenantId: effectiveApprenantId,
        formationId: effectiveFormationId,
      });

      setSucces(true);
      setTimeout(() => {
        setSucces(false);
        setMontant("");
        setQuantitesParLivre({});
        onClose();
      }, 800);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du versement.";
      setErreur(msg);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un versement"
      maxWidth={isAchatLivres ? "max-w-2xl" : "max-w-lg"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{erreur}</span>
          </div>
        )}

        {succes && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>Versement enregistré et validé avec succès !</span>
          </div>
        )}

        {/* ── Sélecteur d'apprenant ou Acheteur Externe ── */}
        {!apprenantId && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                <span>{isAchatLivres && estAcheteurExterne ? "Acheteur externe" : "Sélectionner l'apprenant"}</span>{" "}
                <span className="text-rose-500">*</span>
              </label>

              {isAchatLivres && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setEstAcheteurExterne(false)}
                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      !estAcheteurExterne
                        ? "bg-brand-orange text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Élève inscrit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstAcheteurExterne(true)}
                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      estAcheteurExterne
                        ? "bg-brand-orange text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Acheteur externe
                  </button>
                </div>
              )}
            </div>

            {isAchatLivres && estAcheteurExterne ? (
              <div>
                <input
                  type="text"
                  value={nomAcheteurExterne}
                  onChange={(e) => setNomAcheteurExterne(e.target.value)}
                  placeholder="Nom complet de l'acheteur (ex: Parent d'élève, M. Paul)..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
            ) : (
              <div>
                <ApprenantCombobox
                  apprenants={apprenantsDuCentre}
                  selectedId={selectedApprenantId}
                  onSelect={(apprenant) => {
                    setSelectedApprenantId(apprenant?.id || "");
                    setMontant("");
                  }}
                  placeholder="Rechercher par nom, prénom ou matricule..."
                />
              </div>
            )}
          </div>
        )}

        {/* ── Récapitulatif Apprenant & Solde ── */}
        {effectiveApprenantId && !estAcheteurExterne && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Apprenant
              </span>
              <span className="text-sm font-black text-slate-900">
                {effectiveNomApprenant}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isAchatLivres ? "Contrat Scolarité" : "Reste à solder"}
              </span>
              <span
                className={`text-sm font-black ${
                  effectiveSoldeRestant > 0 ? "text-brand-orange" : "text-emerald-700"
                }`}
              >
                {FCFA.format(Math.max(effectiveSoldeRestant, 0))} FCFA
              </span>
              {isAchatLivres && (
                <span className="block text-[10px] text-slate-400 font-medium">
                  (Non impacté par l'achat de livres)
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Motif ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              <span>Motif d'encaissement</span> <span className="text-rose-500">*</span>
            </span>
            {isAchatLivres && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-brand-orange px-2 py-0.5 text-[10px] font-bold">
                <Sparkles size={10} /> Mode Vente d'Ouvrages
              </span>
            )}
          </label>
          <select
            value={motifId}
            onChange={(e) => {
              setMotifId(e.target.value);
              setErreur(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
          >
            {motifsActifs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>

        {/* ── Sélection des Livres si motif Achat Livres ── */}
        {isAchatLivres && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <BookOpen size={15} className="text-brand-orange" />
                <span>Sélectionner les livres à acheter</span>
                <span className="text-rose-500">*</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectionnerTousLivres}
                  className="font-bold text-brand-orange hover:underline cursor-pointer"
                >
                  Tout cocher
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectionnerTousLivres}
                  className="font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {livres.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Aucun livre actif disponible dans le catalogue. Veuillez en ajouter dans la section Livres.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {livres.map((livre) => {
                  const isChecked = Boolean(quantitesParLivre[livre.id]);
                  const qte = quantitesParLivre[livre.id] || 1;

                  return (
                    <div
                      key={livre.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isChecked
                          ? "bg-white border-brand-orange shadow-2xs"
                          : "bg-white/70 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            toggleLivre(livre.id);
                          }}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-white transition-colors cursor-pointer ${
                            isChecked
                              ? "bg-brand-orange border-brand-orange"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 truncate">
                              {livre.titre}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-brand-orange block">
                            {FCFA.format(livre.prix)} FCFA / unité
                          </span>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-1.5 pl-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantiteLivre(livre.id, qte - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Diminuer"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={qte}
                            onChange={(e) =>
                              updateQuantiteLivre(livre.id, parseInt(e.target.value) || 1)
                            }
                            className="h-7 w-12 text-center rounded-lg border border-slate-200 text-xs font-black text-slate-800 outline-none focus:border-brand-orange"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantiteLivre(livre.id, qte + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Augmenter"
                          >
                            <Plus size={12} />
                          </button>
                          <div className="text-right min-w-[70px] ml-1">
                            <span className="text-xs font-black text-slate-800 block">
                              {FCFA.format(livre.prix * qte)} F
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 text-xs">
              <span className="text-slate-600 font-medium">
                {selectedLivresIds.length} livre(s) sélectionné(s)
              </span>
              <span className="font-bold text-slate-800">
                Sous-total :{" "}
                <span className="font-black text-brand-orange text-sm">
                  {FCFA.format(Number(montant) || 0)} FCFA
                </span>
              </span>
            </div>
          </div>
        )}

        {/* ── Montant ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Coins size={13} className="text-brand-orange" />
              <span>Montant à encaisser (FCFA)</span> <span className="text-rose-500">*</span>
            </span>
            {!isAchatLivres && effectiveSoldeRestant > 0 && (
              <button
                type="button"
                onClick={() => setMontant(effectiveSoldeRestant)}
                className="text-[11px] font-bold text-brand-orange hover:underline cursor-pointer"
              >
                Tout solder ({FCFA.format(effectiveSoldeRestant)} F)
              </button>
            )}
          </label>
          <input
            type="number"
            required
            min={1}
            max={!isAchatLivres && effectiveSoldeRestant > 0 ? effectiveSoldeRestant : undefined}
            value={montant}
            onChange={(e) => {
              if (!isAchatLivres) {
                setMontant(e.target.value === "" ? "" : Number(e.target.value));
              }
            }}
            readOnly={isAchatLivres}
            placeholder={isAchatLivres ? "Cochez des livres ci-dessus" : "Ex: 50000"}
            className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base font-black text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 ${
              isAchatLivres ? "bg-slate-100 cursor-not-allowed text-brand-orange" : "bg-white"
            }`}
          />

          {!isAchatLivres && Number(montant) > effectiveSoldeRestant && effectiveSoldeRestant > 0 && (
            <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle size={12} />
              Dépassement du contrat : solde restant maximal {FCFA.format(effectiveSoldeRestant)} FCFA.
            </p>
          )}

          {/* Raccourcis montants pour scolarité */}
          {!isAchatLivres && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[25000, 50000, 100000].map((val) => {
                const disabled = effectiveSoldeRestant > 0 && val > effectiveSoldeRestant;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMontant(val)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      disabled
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-orange hover:text-brand-orange"
                    }`}
                  >
                    +{FCFA.format(val)} F
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Date ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span>Date de versement</span> <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />
        </div>

        {/* ── Boutons ── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saisirEntreeMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              saisirEntreeMutation.isPending ||
              (isAchatLivres && selectedLivresIds.length === 0) ||
              (!isAchatLivres &&
                effectiveSoldeRestant > 0 &&
                Number(montant) > effectiveSoldeRestant)
            }
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold"
          >
            {saisirEntreeMutation.isPending ? "Encaissement..." : "Valider le versement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
