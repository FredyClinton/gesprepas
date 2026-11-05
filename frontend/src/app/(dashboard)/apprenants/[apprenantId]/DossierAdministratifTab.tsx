"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Plus,
  Coins,
  FileCheck,
  FolderOpen,
  CheckCheck,
  Search,
  Loader2,
  Clock,
} from "lucide-react";
import { Button, Card } from "@/shared/ui";
import {
  useConcours,
  useConcoursDuDossier,
  usePiecesDossierConcours,
  usePiecesRequises,
  useSoldeDossierConcours,
  useValiderPieceDossier,
  SouscrireDossierModal,
  EnregistrerPaiementDossierModal,
  type Dossier,
  type DossierConcours,
  type PieceRequise,
} from "@/modules/dossiers";
import type { Centre, SessionAcademique } from "@/modules/centres-sessions";
import type { Apprenant } from "@/modules/apprenants";

const FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_DOSSIER: Record<Dossier["statut"], string> = {
  OUVERT: "En cours",
  COMPLET: "Complet",
  CLOTURE: "Clôturé",
};

const CLASSES_STATUT_DOSSIER: Record<Dossier["statut"], string> = {
  OUVERT: "bg-amber-50 text-amber-800 border border-amber-200",
  COMPLET: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  CLOTURE: "bg-slate-100 text-slate-700 border border-slate-200",
};

interface DossierAdministratifTabProps {
  dossier: Dossier | undefined;
  centres?: Centre[] | undefined;
  sessions?: SessionAcademique[] | undefined;
  apprenant?: Apprenant;
}

export function DossierAdministratifTab({
  dossier,
  apprenant,
}: DossierAdministratifTabProps) {
  const { data: authSession } = useSession();
  const peutGererDossier = authSession?.user?.role !== "COMPTABLE";

  const { data: concoursDuDossier = [], isLoading: chargementConcours } = useConcoursDuDossier(
    dossier?.id,
  );
  const { data: piecesRequises = [] } = usePiecesRequises();

  // Modals
  const [modalSouscrireOuverte, setModalSouscrireOuverte] = useState(false);
  const [paiementCible, setPaiementCible] = useState<{
    dossierConcours: DossierConcours;
    nomConcours?: string;
  } | null>(null);

  // Cas 1 : Aucun dossier ouvert pour cet apprenant
  if (!dossier) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center bg-white border border-slate-200 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Aucun dossier de concours ouvert
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Cet élève n&rsquo;a pas encore souscrit au service de confection et de dépôt de dossier de
            concours pour cette session.
          </p>

          {peutGererDossier && apprenant && (
            <div className="mt-5">
              <Button
                type="button"
                onClick={() => setModalSouscrireOuverte(true)}
                className="bg-brand-orange text-white text-xs font-bold shadow-xs inline-flex items-center gap-2"
              >
                <Plus size={15} />
                <span>Souscrire au service dossier concours</span>
              </Button>
            </div>
          )}
        </Card>

        {apprenant && (
          <SouscrireDossierModal
            isOpen={modalSouscrireOuverte}
            onClose={() => setModalSouscrireOuverte(false)}
            apprenants={[apprenant]}
            sessionId={apprenant.sessionId}
            centreId={apprenant.centreId}
            apprenantPreselectionneId={apprenant.id}
          />
        )}
      </div>
    );
  }

  // Cas 2 : Dossier existant
  return (
    <div className="space-y-6">
      {/* ── Cartouche En-tête Dossier ── */}
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-brand-anthracite text-lg font-bold">
              Dossier d&rsquo;inscription aux Concours
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase border ${CLASSES_STATUT_DOSSIER[dossier.statut]}`}
            >
              {LABELS_STATUT_DOSSIER[dossier.statut]}
            </span>
          </div>
          <p className="text-brand-gray mt-1 text-xs">
            Ouvert le {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
            {dossier.dateCloture &&
              ` · Clôturé le ${new Date(dossier.dateCloture).toLocaleDateString("fr-FR")}`}
          </p>
          {dossier.observation && (
            <p className="text-slate-600 mt-2 text-xs italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Note : &laquo; {dossier.observation} &raquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {peutGererDossier && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalSouscrireOuverte(true)}
              className="text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={14} className="text-brand-orange" />
              <span>Rattacher un concours</span>
            </Button>
          )}

          <Link
            href={`/dossiers/${dossier.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <FileCheck size={14} />
            <span>Gérer le dossier</span>
          </Link>
        </div>
      </Card>

      {/* ── Liste des Concours du Dossier ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Concours souscrits ({concoursDuDossier.length})
          </h3>
        </div>

        {chargementConcours ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Chargement des concours...
          </div>
        ) : concoursDuDossier.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-400 text-xs">
              Aucun concours rattaché à ce dossier. Cliquez sur &laquo; Rattacher un concours &raquo;.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {concoursDuDossier.map((dc) => (
              <ConcoursRattacheInteractiveCard
                key={dc.id}
                dossierConcours={dc}
                cataloguePieces={piecesRequises}
                dossierStatut={dossier.statut}
                onOuvrirPaiement={(nomConcours) =>
                  setPaiementCible({ dossierConcours: dc, nomConcours })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {apprenant && (
        <SouscrireDossierModal
          isOpen={modalSouscrireOuverte}
          onClose={() => setModalSouscrireOuverte(false)}
          apprenants={[apprenant]}
          sessionId={apprenant.sessionId}
          centreId={apprenant.centreId}
          apprenantPreselectionneId={apprenant.id}
        />
      )}

      {paiementCible && (
        <EnregistrerPaiementDossierModal
          isOpen={Boolean(paiementCible)}
          onClose={() => setPaiementCible(null)}
          dossierConcours={paiementCible.dossierConcours}
          nomConcours={paiementCible.nomConcours}
          nomApprenant={`${apprenant?.nom || ""} ${apprenant?.prenom || ""}`}
          onSuccess={() => setPaiementCible(null)}
        />
      )}
    </div>
  );
}

function ConcoursRattacheInteractiveCard({
  dossierConcours,
  cataloguePieces,
  dossierStatut,
  onOuvrirPaiement,
}: {
  dossierConcours: DossierConcours;
  cataloguePieces: PieceRequise[];
  dossierStatut: Dossier["statut"];
  onOuvrirPaiement: (nomConcours: string) => void;
}) {
  const { data: concours } = useConcours(dossierConcours.concoursId);
  const { data: pieces = [], isLoading: chargementPieces } = usePiecesDossierConcours(
    dossierConcours.id,
  );
  const { data: solde } = useSoldeDossierConcours(dossierConcours.id);

  const validerPieceMutation = useValiderPieceDossier();
  const [validerToutEnCours, setValiderToutEnCours] = useState(false);
  const [filtrePieces, setFiltrePieces] = useState<"TOUTES" | "A_VALIDER" | "VALIDEES">("TOUTES");
  const [recherchePiece, setRecherchePiece] = useState("");

  const nbValidees = pieces.filter((p) => p.statut === "VALIDEE").length;
  const nbTotal = pieces.length;
  const nbRestantes = nbTotal - nbValidees;
  const progression = nbTotal > 0 ? Math.round((nbValidees / nbTotal) * 100) : 0;

  const soldeRestant = solde ? solde.soldeRestant : dossierConcours.montantTotal;
  const montantPaye = solde ? solde.montantPaye : 0;
  const progressionPaiement =
    dossierConcours.montantTotal > 0
      ? Math.min(100, Math.round((montantPaye / dossierConcours.montantTotal) * 100))
      : 100;

  // Filtrage des pièces
  const piecesFiltrees = pieces.filter((p) => {
    if (filtrePieces === "A_VALIDER" && p.statut === "VALIDEE") return false;
    if (filtrePieces === "VALIDEES" && p.statut !== "VALIDEE") return false;
    if (recherchePiece.trim()) {
      const pieceInfo = cataloguePieces.find((cp) => cp.id === p.pieceRequiseId);
      const nom = pieceInfo?.nom.toLowerCase() || "";
      if (!nom.includes(recherchePiece.toLowerCase().trim())) return false;
    }
    return true;
  });

  // Action rapide : tout valider les pièces restantes
  async function handleValiderToutesLesPieces() {
    const aValider = pieces.filter((p) => p.statut !== "VALIDEE");
    if (aValider.length === 0) return;
    setValiderToutEnCours(true);
    try {
      for (const p of aValider) {
        await validerPieceMutation.mutateAsync(p.id);
      }
    } finally {
      setValiderToutEnCours(false);
    }
  }

  return (
    <Card className="p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* En-tête concours & avancement */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {concours?.nom || "Concours officiel"}
            </h4>
            {concours && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Délai centre :{" "}
                <strong className="text-slate-600">
                  {new Date(concours.dateLimiteRecevabiliteCentre).toLocaleDateString("fr-FR")}
                </strong>{" "}
                · Dépôt officiel :{" "}
                <strong className="text-slate-600">
                  {new Date(concours.dateLimiteDepot).toLocaleDateString("fr-FR")}
                </strong>
              </p>
            )}
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
              progression === 100
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {nbValidees}/{nbTotal} pièces ({progression}%)
          </span>
        </div>

        {/* Volet financier & barres jumelées */}
        <div className="p-3 bg-slate-50 rounded-xl space-y-2.5 border border-slate-100 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Frais Réglés
              </span>
              <span className="font-bold text-emerald-700 font-mono">
                {FCFA.format(montantPaye)} / {FCFA.format(dossierConcours.montantTotal)} F
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Reste à payer
              </span>
              <span
                className={`font-bold font-mono ${
                  soldeRestant <= 0 ? "text-emerald-700" : "text-brand-orange"
                }`}
              >
                {soldeRestant <= 0 ? "Soldé (100%)" : `${FCFA.format(soldeRestant)} FCFA`}
              </span>
            </div>
          </div>

          {/* Barres jumelées : Pièces physiques vs Paiement par étapes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5 font-medium">
                <span>Pièces conformes</span>
                <span className="font-bold">{progression}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progression === 100 ? "bg-emerald-500" : "bg-brand-orange"
                  }`}
                  style={{ width: `${progression}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5 font-medium">
                <span>Étapes de règlement</span>
                <span className="font-bold">{progressionPaiement}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    soldeRestant <= 0 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${progressionPaiement}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de contrôle des pièces : Filtres rapides, Recherche et Tout Valider */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Filtres d'état */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setFiltrePieces("TOUTES")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filtrePieces === "TOUTES"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Toutes ({nbTotal})
              </button>
              <button
                type="button"
                onClick={() => setFiltrePieces("A_VALIDER")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filtrePieces === "A_VALIDER"
                    ? "bg-white text-brand-orange shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                À valider ({nbRestantes})
              </button>
              <button
                type="button"
                onClick={() => setFiltrePieces("VALIDEES")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filtrePieces === "VALIDEES"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Validées ({nbValidees})
              </button>
            </div>

            {/* Actions groupées et recherche */}
            <div className="flex items-center gap-2">
              {nbTotal >= 5 && (
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recherchePiece}
                    onChange={(e) => setRecherchePiece(e.target.value)}
                    placeholder="Filtrer une pièce..."
                    className="pl-6 pr-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange w-36 sm:w-44"
                  />
                </div>
              )}

              {nbRestantes > 0 && dossierStatut !== "CLOTURE" && (
                <Button
                  type="button"
                  onClick={handleValiderToutesLesPieces}
                  disabled={validerToutEnCours || validerPieceMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 h-6.5 flex items-center gap-1 shadow-xs"
                >
                  {validerToutEnCours ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCheck size={12} />
                  )}
                  <span>Tout valider ({nbRestantes})</span>
                </Button>
              )}
            </div>
          </div>

          {/* Grille 2 colonnes compacte et scannable des pièces */}
          {chargementPieces ? (
            <p className="text-xs text-slate-400 py-3 text-center">Chargement des pièces...</p>
          ) : piecesFiltrees.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-3 text-center">
              {pieces.length === 0
                ? "Aucune pièce requise."
                : "Aucune pièce ne correspond au filtre sélectionné."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {piecesFiltrees.map((p) => {
                const pieceInfo = cataloguePieces.find((cp) => cp.id === p.pieceRequiseId);
                const estValidee = p.statut === "VALIDEE";

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                      estValidee
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                        : "bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {estValidee ? (
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Clock size={15} className="text-amber-500 shrink-0" />
                      )}
                      <span className="font-semibold truncate">
                        {pieceInfo?.nom || "Pièce requise"}
                        {p.quantite > 1 ? ` (x${p.quantite})` : ""}
                      </span>
                    </div>

                    <div>
                      {estValidee ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          Reçue & conforme
                        </span>
                      ) : dossierStatut !== "CLOTURE" ? (
                        <button
                          type="button"
                          onClick={() => validerPieceMutation.mutate(p.id)}
                          disabled={validerPieceMutation.isPending || validerToutEnCours}
                          className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors text-[10px] shrink-0 cursor-pointer shadow-xs"
                        >
                          Valider
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">En attente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Encaisser paiement (acompte / solde) */}
      {soldeRestant > 0 && dossierStatut !== "CLOTURE" && (
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOuvrirPaiement(concours?.nom || "Concours")}
            className="text-xs font-bold text-brand-orange hover:bg-orange-50 border-orange-200 flex items-center gap-1.5"
          >
            <Coins size={14} />
            <span>{montantPaye > 0 ? "Encaisser tranche / acompte" : "Encaisser frais dossier"}</span>
          </Button>
        </div>
      )}
    </Card>
  );
}
