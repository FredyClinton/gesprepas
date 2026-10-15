"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Check, AlertCircle, Plus, Loader2 } from "lucide-react";
import { Modal, Button, ApprenantCombobox, type ApprenantItem } from "@/shared/ui";
import {
  useConcoursSession,
  usePiecesDuConcours,
  useOuvrirDossier,
  useAjouterConcoursAuDossier,
  useDossierParApprenant,
  useConcoursDuDossier,
  useRouvrirDossier,
} from "@/modules/dossiers";
import { messageErreurApi } from "@/shared/lib/api-client";
import type { Apprenant } from "@/modules/apprenants";

const FCFA = new Intl.NumberFormat("fr-FR");

interface SouscrireDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprenants: Apprenant[];
  sessionId: string;
  centreId?: string;
  apprenantPreselectionneId?: string;
  onSuccess?: () => void;
}

export function SouscrireDossierModal(props: SouscrireDossierModalProps) {
  if (!props.isOpen) return null;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={
        props.apprenantPreselectionneId
          ? "Rattacher un concours supplémentaire"
          : "Souscrire un élève à un concours"
      }
      description={
        props.apprenantPreselectionneId
          ? "Ajoutez un 2ème concours (ou plus) au dossier administratif de cet élève pour la session en cours."
          : undefined
      }
      maxWidth="max-w-2xl"
    >
      <SouscrireDossierForm key={props.apprenantPreselectionneId || "nouveau"} {...props} />
    </Modal>
  );
}

function SouscrireDossierForm({
  onClose,
  apprenants,
  sessionId,
  centreId,
  apprenantPreselectionneId,
  onSuccess,
}: SouscrireDossierModalProps) {
  const [selectedApprenantId, setSelectedApprenantId] = useState(
    apprenantPreselectionneId || "",
  );
  const [selectedConcoursId, setSelectedConcoursId] = useState("");
  const [piecesOverrides, setPiecesOverrides] = useState<
    Record<string, { cochee: boolean; quantite: number }>
  >({});
  const [erreur, setErreur] = useState<string | null>(null);

  // Réinitialiser les surcharges quand le concours change
  useEffect(() => {
    setPiecesOverrides({});
  }, [selectedConcoursId]);

  // Apprenants éligibles (filtrés par centre si fourni)
  const apprenantsFiltres: ApprenantItem[] = useMemo(() => {
    return apprenants
      .filter((a) => !centreId || a.centreId === centreId)
      .map((a) => ({
        id: a.id,
        nom: a.nom,
        prenom: a.prenom,
        matricule: a.referenceRecu || undefined,
        centreId: a.centreId,
      }));
  }, [apprenants, centreId]);

  const { data: concoursList = [], isLoading: chargementConcours } =
    useConcoursSession(sessionId);

  const { data: piecesConcours = [], isLoading: chargementPieces } =
    usePiecesDuConcours(selectedConcoursId || undefined);

  const { data: dossierExistant } = useDossierParApprenant(
    selectedApprenantId || undefined,
  );

  const { data: concoursDuDossier = [] } = useConcoursDuDossier(
    dossierExistant?.id || undefined,
  );

  const idsConcoursDejaSouscrits = useMemo(() => {
    return new Set(concoursDuDossier.map((dc) => dc.concoursId));
  }, [concoursDuDossier]);

  const ouvrirDossierMutation = useOuvrirDossier();
  const ajouterConcoursMutation = useAjouterConcoursAuDossier();
  const rouvrirDossierMutation = useRouvrirDossier();

  // Pièces sélectionnées calculées (cochées par défaut, modifiables via overrides)
  const piecesSelectionnees = useMemo(() => {
    const result: Record<string, { cochee: boolean; quantite: number }> = {};
    piecesConcours.forEach((p) => {
      if (piecesOverrides[p.id] !== undefined) {
        result[p.id] = piecesOverrides[p.id];
      } else {
        result[p.id] = { cochee: true, quantite: 1 };
      }
    });
    return result;
  }, [piecesConcours, piecesOverrides]);

  // Calcul du montant total estimé
  const montantTotalEstime = useMemo(() => {
    if (!piecesConcours) return 0;
    return piecesConcours.reduce((total, p) => {
      const sel = piecesSelectionnees[p.id];
      if (sel && sel.cochee) {
        return total + p.montant * sel.quantite;
      }
      return total;
    }, 0);
  }, [piecesConcours, piecesSelectionnees]);

  function handleTogglePiece(pieceId: string) {
    setPiecesOverrides((prev) => {
      const actu = piecesSelectionnees[pieceId] || { cochee: true, quantite: 1 };
      return {
        ...prev,
        [pieceId]: {
          ...actu,
          cochee: !actu.cochee,
        },
      };
    });
  }

  function handleChangerQuantite(pieceId: string, qte: number) {
    const nouvelleQte = Math.max(1, qte);
    setPiecesOverrides((prev) => {
      const actu = piecesSelectionnees[pieceId] || { cochee: true, quantite: 1 };
      return {
        ...prev,
        [pieceId]: {
          ...actu,
          quantite: nouvelleQte,
        },
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!selectedApprenantId) {
      setErreur("Veuillez sélectionner un apprenant.");
      return;
    }
    if (!selectedConcoursId) {
      setErreur("Veuillez sélectionner un concours officiel.");
      return;
    }

    const selections = Object.entries(piecesSelectionnees)
      .filter(([, sel]) => sel.cochee)
      .map(([pieceRequiseId, sel]) => ({
        pieceRequiseId,
        quantite: sel.quantite,
      }));

    if (selections.length === 0) {
      setErreur("Veuillez sélectionner au moins une pièce requise pour ce concours.");
      return;
    }

    try {
      let dossierId = dossierExistant?.id;

      // 1. Si l'élève n'a pas encore de dossier pour cette session, on l'ouvre
      if (!dossierId) {
        const nouveauDossier = await ouvrirDossierMutation.mutateAsync({
          apprenantId: selectedApprenantId,
          sessionId,
        });
        dossierId = nouveauDossier.id;
      } else if (dossierExistant && dossierExistant.statut !== "OUVERT") {
        // 1bis. Si le dossier existant est clôturé ou complet, on le rouvre avant d'y ajouter le concours
        await rouvrirDossierMutation.mutateAsync(dossierId);
      }

      // 2. Rattachement du concours avec ses pièces sélectionnées
      await ajouterConcoursMutation.mutateAsync({
        dossierId,
        input: {
          concoursId: selectedConcoursId,
          selections,
        },
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErreur(
        messageErreurApi(
          err,
          "Une erreur est survenue lors de l'enregistrement de la souscription.",
        ),
      );
    }
  }

  const enCoursDeTraitement =
    ouvrirDossierMutation.isPending ||
    ajouterConcoursMutation.isPending ||
    rouvrirDossierMutation.isPending;

  const concoursActif = concoursList.find((c) => c.id === selectedConcoursId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erreur && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Sélection de l'apprenant */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Élève candidat
        </label>
        {apprenantPreselectionneId ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 flex items-center justify-between">
            <span>
              {apprenants.find((a) => a.id === apprenantPreselectionneId)?.nom}{" "}
              {apprenants.find((a) => a.id === apprenantPreselectionneId)?.prenom}
            </span>
            {apprenants.find((a) => a.id === apprenantPreselectionneId)?.referenceRecu && (
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                {apprenants.find((a) => a.id === apprenantPreselectionneId)?.referenceRecu}
              </span>
            )}
          </div>
        ) : (
          <ApprenantCombobox
            apprenants={apprenantsFiltres}
            selectedId={selectedApprenantId}
            onSelect={(item) => setSelectedApprenantId(item ? item.id : "")}
            placeholder="Rechercher par nom, prénom ou matricule..."
          />
        )}
        {dossierExistant && (
          <div
            className={`mt-2 p-3 rounded-xl text-xs space-y-1 border ${
              dossierExistant.statut === "OUVERT"
                ? "bg-amber-50/80 border-amber-200"
                : "bg-blue-50/80 border-blue-200"
            }`}
          >
            <p
              className={`font-bold flex items-center gap-1.5 ${
                dossierExistant.statut === "OUVERT"
                  ? "text-amber-900"
                  : "text-blue-900"
              }`}
            >
              <Check
                size={14}
                className={
                  dossierExistant.statut === "OUVERT"
                    ? "text-amber-700"
                    : "text-blue-700"
                }
              />{" "}
              {dossierExistant.statut === "OUVERT"
                ? "Dossier administratif déjà ouvert (Session en cours)"
                : `Dossier administratif existant (${dossierExistant.statut})`}
            </p>
            <p className="text-slate-600">
              {dossierExistant.statut === "OUVERT" ? (
                <>
                  Cet élève a déjà souscrit à {concoursDuDossier.length} concours.
                  En sélectionnant un autre concours ci-dessous, vous lui rattachez un{" "}
                  <strong>concours supplémentaire</strong> dans son même dossier.
                </>
              ) : (
                <>
                  Le dossier de cet élève est actuellement <strong>{dossierExistant.statut.toLowerCase()}</strong>. En validant ce concours supplémentaire, le dossier sera <strong>automatiquement réouvert</strong> pour permettre le suivi des nouvelles pièces et paiements.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Choix du concours */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Concours cible
        </label>
        <select
          value={selectedConcoursId}
          onChange={(e) => {
            setSelectedConcoursId(e.target.value);
            setPiecesOverrides({});
          }}
          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all cursor-pointer font-medium"
          disabled={chargementConcours}
          required
        >
          <option value="">Sélectionner un concours officiel...</option>
          {concoursList.map((c) => {
            const dejaSouscrit = idsConcoursDejaSouscrits.has(c.id);
            return (
              <option key={c.id} value={c.id} disabled={dejaSouscrit}>
                {c.nom} {dejaSouscrit ? " — (Déjà souscrit pour cet élève)" : ""}
              </option>
            );
          })}
        </select>
        {concoursList.length === 0 && !chargementConcours && (
          <p className="text-xs text-amber-600 mt-1">
            Aucun concours n&rsquo;est programmé pour cette session.
          </p>
        )}
      </div>

      {/* Détails du concours et dates limites */}
      {concoursActif && (
        <div className="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-2 text-xs text-slate-700">
          <div className="flex items-center justify-between font-semibold">
            <span>Délai interne de recevabilité :</span>
            <span className="font-mono text-brand-orange">
              {new Date(concoursActif.dateLimiteRecevabiliteCentre).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Date limite officielle de dépôt :</span>
            <span className="font-mono text-slate-800">
              {new Date(concoursActif.dateLimiteDepot).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      )}

      {/* Sélection des pièces requises et quantités */}
      {selectedConcoursId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pièces à constituer ({piecesConcours.length})
            </span>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total estimé : </span>
              <strong className="text-sm font-bold font-mono text-brand-orange">
                {FCFA.format(montantTotalEstime)} FCFA
              </strong>
            </div>
          </div>

          {chargementPieces ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <Loader2 size={16} className="animate-spin inline mr-1" /> Chargement des pièces requises...
            </div>
          ) : piecesConcours.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>Aucune pièce requise configurée pour ce concours</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Ce concours officiel n&rsquo;a pas encore de pièces associées. Veuillez configurer les pièces exigées dans l&rsquo;onglet &laquo; Campagnes de concours &raquo; avant de pouvoir souscrire un dossier.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {[...piecesConcours]
                .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))
                .map((piece) => {
                const sel = piecesSelectionnees[piece.id] || { cochee: false, quantite: 1 };
                return (
                  <div
                    key={piece.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      sel.cochee
                        ? "bg-white border-orange-200 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 opacity-60"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={sel.cochee}
                        onChange={() => handleTogglePiece(piece.id)}
                        className="h-4 w-4 rounded-md text-brand-orange focus:ring-brand-orange border-slate-300"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{piece.nom}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {FCFA.format(piece.montant)} FCFA / unité
                        </p>
                      </div>
                    </label>

                    {sel.cochee && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Qté :</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={sel.quantite}
                          onChange={(e) =>
                            handleChangerQuantite(piece.id, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-14 p-1 text-xs text-center font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onClose} disabled={enCoursDeTraitement}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={enCoursDeTraitement || !selectedConcoursId || !selectedApprenantId}
          className="bg-brand-orange text-white hover:bg-brand-orange/90 font-semibold"
        >
          {enCoursDeTraitement ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Enregistrement...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={16} />
              {dossierExistant ? "Rattacher ce concours supplémentaire" : "Valider la souscription"}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
