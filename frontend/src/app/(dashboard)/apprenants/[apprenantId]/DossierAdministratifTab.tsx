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

// Rôles qui détiennent DOSSIER_ENCAISSER côté backend (MatricePermissions) : le
// Directeur et le Comptable consultent les paiements sans les encaisser.
const ROLES_ENCAISSEMENT_DOSSIER = new Set([
  "CAISSIER",
  "CHARGE_DOSSIER",
  "SUPERVISEUR_DOSSIERS",
  "DIRECTEUR_ACADEMIQUE",
  "CHEF_CENTRE",
]);

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
  // DOSSIER_GERER côté backend : ni le Comptable ni le Directeur (lecture seule).
  const peutGererDossier =
    authSession?.user?.role !== "COMPTABLE" &&
    authSession?.user?.role !== "DIRECTEUR";
  const peutEncaisser = ROLES_ENCAISSEMENT_DOSSIER.has(
    authSession?.user?.role ?? "",
  );

  const { data: concoursDuDossier = [], isLoading: chargementConcours } =
    useConcoursDuDossier(dossier?.id);
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
        <Card className="border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="text-brand-orange mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
            <FolderOpen size={28} />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Aucun dossier de concours ouvert
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Cet élève n&rsquo;a pas encore souscrit au service de confection et
            de dépôt de dossier de concours pour cette session.
          </p>

          {peutGererDossier && apprenant && (
            <div className="mt-5">
              <Button
                type="button"
                onClick={() => setModalSouscrireOuverte(true)}
                className="bg-brand-orange inline-flex items-center gap-2 text-xs font-bold text-white shadow-xs"
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
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${CLASSES_STATUT_DOSSIER[dossier.statut]}`}
            >
              {LABELS_STATUT_DOSSIER[dossier.statut]}
            </span>
          </div>
          <p className="text-brand-gray mt-1 text-xs">
            Ouvert le{" "}
            {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
            {dossier.dateCloture &&
              ` · Clôturé le ${new Date(dossier.dateCloture).toLocaleDateString("fr-FR")}`}
          </p>
          {dossier.observation && (
            <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600 italic">
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
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus size={14} className="text-brand-orange" />
              <span>Rattacher un concours</span>
            </Button>
          )}

          <Link
            href={`/dossiers/${dossier.id}`}
            className="bg-brand-orange hover:bg-brand-orange/90 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
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
            <p className="text-xs text-slate-400">
              Aucun concours rattaché à ce dossier. Cliquez sur &laquo;
              Rattacher un concours &raquo;.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {concoursDuDossier.map((dc) => (
              <ConcoursRattacheInteractiveCard
                key={dc.id}
                dossierConcours={dc}
                cataloguePieces={piecesRequises}
                dossierStatut={dossier.statut}
                onOuvrirPaiement={
                  peutEncaisser
                    ? (nomConcours) =>
                        setPaiementCible({ dossierConcours: dc, nomConcours })
                    : undefined
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
  /** Absent : l'utilisateur ne peut pas encaisser, le bouton est masqué. */
  onOuvrirPaiement?: (nomConcours: string) => void;
}) {
  const { data: concours } = useConcours(dossierConcours.concoursId);
  const { data: pieces = [], isLoading: chargementPieces } =
    usePiecesDossierConcours(dossierConcours.id);
  const { data: solde } = useSoldeDossierConcours(dossierConcours.id);

  const validerPieceMutation = useValiderPieceDossier();
  const [validerToutEnCours, setValiderToutEnCours] = useState(false);
  const [filtrePieces, setFiltrePieces] = useState<
    "TOUTES" | "A_VALIDER" | "VALIDEES"
  >("TOUTES");
  const [recherchePiece, setRecherchePiece] = useState("");

  const nbValidees = pieces.filter((p) => p.statut === "VALIDEE").length;
  const nbTotal = pieces.length;
  const nbRestantes = nbTotal - nbValidees;
  const progression =
    nbTotal > 0 ? Math.round((nbValidees / nbTotal) * 100) : 0;

  const soldeRestant = solde
    ? solde.soldeRestant
    : dossierConcours.montantTotal;
  const montantPaye = solde ? solde.montantPaye : 0;
  const progressionPaiement =
    dossierConcours.montantTotal > 0
      ? Math.min(
          100,
          Math.round((montantPaye / dossierConcours.montantTotal) * 100),
        )
      : 100;

  // Filtrage des pièces
  const piecesFiltrees = pieces.filter((p) => {
    if (filtrePieces === "A_VALIDER" && p.statut === "VALIDEE") return false;
    if (filtrePieces === "VALIDEES" && p.statut !== "VALIDEE") return false;
    if (recherchePiece.trim()) {
      const pieceInfo = cataloguePieces.find(
        (cp) => cp.id === p.pieceRequiseId,
      );
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
    <Card className="flex flex-col justify-between space-y-4 p-5">
      <div className="space-y-3">
        {/* En-tête concours & avancement */}
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {concours?.nom || "Concours officiel"}
            </h4>
            {concours && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                Délai centre :{" "}
                <strong className="text-slate-600">
                  {new Date(
                    concours.dateLimiteRecevabiliteCentre,
                  ).toLocaleDateString("fr-FR")}
                </strong>{" "}
                · Dépôt officiel :{" "}
                <strong className="text-slate-600">
                  {new Date(concours.dateLimiteDepot).toLocaleDateString(
                    "fr-FR",
                  )}
                </strong>
              </p>
            )}
          </div>
          <span
            className={`shrink-0 self-start rounded-full px-2.5 py-0.5 text-xs font-bold sm:self-auto ${
              progression === 100
                ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {nbValidees}/{nbTotal} pièces ({progression}%)
          </span>
        </div>

        {/* Volet financier & barres jumelées */}
        <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Frais Réglés
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {FCFA.format(montantPaye)} /{" "}
                {FCFA.format(dossierConcours.montantTotal)} F
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Reste à payer
              </span>
              <span
                className={`font-mono font-bold ${
                  soldeRestant <= 0 ? "text-emerald-700" : "text-brand-orange"
                }`}
              >
                {soldeRestant <= 0
                  ? "Soldé (100%)"
                  : `${FCFA.format(soldeRestant)} FCFA`}
              </span>
            </div>
          </div>

          {/* Barres jumelées : Pièces physiques vs Paiement par étapes */}
          <div className="grid grid-cols-1 gap-2 border-t border-slate-200/60 pt-1 sm:grid-cols-2">
            <div>
              <div className="mb-0.5 flex justify-between text-[10px] font-medium text-slate-500">
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
              <div className="mb-0.5 flex justify-between text-[10px] font-medium text-slate-500">
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
        <div className="space-y-2.5 border-t border-slate-100 pt-2">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            {/* Filtres d'état */}
            <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFiltrePieces("TOUTES")}
                className={`cursor-pointer rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all ${
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
                className={`cursor-pointer rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all ${
                  filtrePieces === "A_VALIDER"
                    ? "text-brand-orange bg-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                À valider ({nbRestantes})
              </button>
              <button
                type="button"
                onClick={() => setFiltrePieces("VALIDEES")}
                className={`cursor-pointer rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all ${
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
                  <Search
                    size={12}
                    className="absolute top-1/2 left-2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={recherchePiece}
                    onChange={(e) => setRecherchePiece(e.target.value)}
                    placeholder="Filtrer une pièce..."
                    className="focus:ring-brand-orange w-36 rounded-lg border border-slate-200 bg-slate-50 py-0.5 pr-2 pl-6 text-xs focus:bg-white focus:ring-1 focus:outline-none sm:w-44"
                  />
                </div>
              )}

              {nbRestantes > 0 && dossierStatut !== "CLOTURE" && (
                <Button
                  type="button"
                  onClick={handleValiderToutesLesPieces}
                  disabled={
                    validerToutEnCours || validerPieceMutation.isPending
                  }
                  className="flex h-6.5 items-center gap-1 bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700"
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
            <p className="py-3 text-center text-xs text-slate-400">
              Chargement des pièces...
            </p>
          ) : piecesFiltrees.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400 italic">
              {pieces.length === 0
                ? "Aucune pièce requise."
                : "Aucune pièce ne correspond au filtre sélectionné."}
            </p>
          ) : (
            <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {piecesFiltrees.map((p) => {
                const pieceInfo = cataloguePieces.find(
                  (cp) => cp.id === p.pieceRequiseId,
                );
                const estValidee = p.statut === "VALIDEE";

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl border p-2 text-xs transition-all ${
                      estValidee
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {estValidee ? (
                        <CheckCircle2
                          size={15}
                          className="shrink-0 text-emerald-600"
                        />
                      ) : (
                        <Clock size={15} className="shrink-0 text-amber-500" />
                      )}
                      <span className="truncate font-semibold">
                        {pieceInfo?.nom || "Pièce requise"}
                        {p.quantite > 1 ? ` (x${p.quantite})` : ""}
                      </span>
                    </div>

                    <div>
                      {estValidee ? (
                        <span className="rounded-md bg-emerald-100/70 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Reçue & conforme
                        </span>
                      ) : dossierStatut !== "CLOTURE" ? (
                        <button
                          type="button"
                          onClick={() => validerPieceMutation.mutate(p.id)}
                          disabled={
                            validerPieceMutation.isPending || validerToutEnCours
                          }
                          className="shrink-0 cursor-pointer rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                        >
                          Valider
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          En attente
                        </span>
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
        <div className="flex justify-end border-t border-slate-100 pt-2">
          {onOuvrirPaiement && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOuvrirPaiement(concours?.nom || "Concours")}
              className="text-brand-orange flex items-center gap-1.5 border-orange-200 text-xs font-bold hover:bg-orange-50"
            >
              <Coins size={14} />
              <span>
                {montantPaye > 0
                  ? "Encaisser tranche / acompte"
                  : "Encaisser frais dossier"}
              </span>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
