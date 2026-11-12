"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  AlertCircle,
  Plus,
  Loader2,
  Lock,
  MessageSquare,
  Calendar,
  CheckCheck,
  Search,
  RotateCcw,
  Building2,
  GraduationCap,
  ExternalLink,
  Award,
} from "lucide-react";
import { Button, Card } from "@/shared/ui";
import {
  useDossier,
  useConcoursDuDossier,
  usePiecesDossierConcours,
  useSoldeDossierConcours,
  usePiecesRequises,
  useConcours,
  useValiderPieceDossier,
  useSignalerDossierComplet,
  useCloturerDossier,
  useRouvrirDossier,
  useModifierObservationDossier,
  type Dossier,
  type DossierConcours,
  type PieceRequise,
  SouscrireDossierModal,
  EnregistrerPaiementDossierModal,
} from "@/modules/dossiers";
import { useApprenant, useApprenants } from "@/modules/apprenants";
import { useCentres, useSessions } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { messageErreurApi } from "@/shared/lib/api-client";

// Rôles qui détiennent DOSSIER_ENCAISSER côté backend (MatricePermissions) : le
// Directeur et le Comptable consultent les paiements sans les encaisser.
// Rôles qui détiennent DOSSIER_GERER (ouvrir, souscrire, valider les pièces, clôturer) :
// le Directeur supervise les dossiers en lecture seule.
const ROLES_GESTION_DOSSIER = new Set([
  "CAISSIER",
  "CHARGE_DOSSIER",
  "SUPERVISEUR_DOSSIERS",
  "DIRECTEUR_ACADEMIQUE",
  "CHEF_CENTRE",
]);

const ROLES_ENCAISSEMENT_DOSSIER = new Set([
  "CAISSIER",
  "CHARGE_DOSSIER",
  "SUPERVISEUR_DOSSIERS",
  "DIRECTEUR_ACADEMIQUE",
  "CHEF_CENTRE",
]);

const FCFA = new Intl.NumberFormat("fr-FR");

const STATUT_CONFIG: Record<
  Dossier["statut"],
  { label: string; badge: string; bg: string; icon: typeof Clock }
> = {
  OUVERT: {
    label: "Dossier Ouvert",
    badge: "bg-amber-50 text-amber-800 border border-amber-200",
    bg: "bg-amber-600",
    icon: Clock,
  },
  COMPLET: {
    label: "Dossier Complet",
    badge: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    bg: "bg-emerald-600",
    icon: CheckCircle2,
  },
  CLOTURE: {
    label: "Dossier Clôturé",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    bg: "bg-slate-500",
    icon: Lock,
  },
};

interface DossierDetailViewProps {
  dossierId: string;
}

export function DossierDetailView({ dossierId }: DossierDetailViewProps) {
  const {
    data: dossier,
    isLoading: chargementDossier,
    error: erreurDossier,
  } = useDossier(dossierId);

  const { data: apprenant } = useApprenant(dossier?.apprenantId);
  const { data: apprenants = [] } = useApprenants();
  const { data: concoursDuDossier = [], isLoading: chargementConcours } =
    useConcoursDuDossier(dossierId);
  const { data: piecesRequises = [] } = usePiecesRequises();
  const { data: centres = [] } = useCentres();
  const { data: sessions = [] } = useSessions();
  const { data: authSession } = useSession();
  const peutEncaisser = ROLES_ENCAISSEMENT_DOSSIER.has(
    authSession?.user?.role ?? "",
  );
  const peutGererDossier = ROLES_GESTION_DOSSIER.has(
    authSession?.user?.role ?? "",
  );
  const { data: formations = [] } = useFormations();

  // Mutations
  const signalerCompletMutation = useSignalerDossierComplet();
  const cloturerMutation = useCloturerDossier();
  const rouvrirMutation = useRouvrirDossier();
  const modifierObservationMutation = useModifierObservationDossier();

  // États locaux
  const [observation, setObservation] = useState<string>("");
  const [observationInitialisee, setObservationInitialisee] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [modalSouscrireOuverte, setModalSouscrireOuverte] = useState(false);
  const [paiementCible, setPaiementCible] = useState<{
    dossierConcours: DossierConcours;
    nomConcours: string;
  } | null>(null);

  // Initialisation du champ observation dès que le dossier est chargé
  if (dossier && !observationInitialisee) {
    setObservation(dossier.observation || "");
    setObservationInitialisee(true);
  }

  const centre = centres.find((c) => c.id === dossier?.centreId);
  const session = sessions.find((s) => s.id === dossier?.sessionId);
  const formation = formations.find((f) => f.id === apprenant?.formationId);

  const statutConfig = dossier ? STATUT_CONFIG[dossier.statut] : null;
  const StatutIcon = statutConfig?.icon;

  async function handleSignalerComplet() {
    if (!dossier) return;
    setErreur(null);
    setSucces(null);
    try {
      await signalerCompletMutation.mutateAsync(dossier.id);
      setSucces("Le dossier a été marqué comme complet avec succès !");
    } catch (err: unknown) {
      setErreur(
        messageErreurApi(
          err,
          "Toutes les pièces de tous les concours doivent être validées pour marquer le dossier complet.",
        ),
      );
    }
  }

  async function handleCloturer() {
    if (!dossier) return;
    setErreur(null);
    setSucces(null);
    try {
      await cloturerMutation.mutateAsync(dossier.id);
      setSucces("Le dossier a été clôturé avec succès.");
    } catch (err: unknown) {
      setErreur(
        messageErreurApi(
          err,
          "Le dossier doit être marqué 'Complet' avant de pouvoir être clôturé.",
        ),
      );
    }
  }

  async function handleRouvrir() {
    if (!dossier) return;
    setErreur(null);
    setSucces(null);
    try {
      await rouvrirMutation.mutateAsync(dossier.id);
      setSucces("Le dossier a été rouvert avec succès.");
    } catch (err: unknown) {
      setErreur(
        messageErreurApi(
          err,
          "Une erreur est survenue lors de la réouverture du dossier.",
        ),
      );
    }
  }

  async function handleSauvegarderObservation() {
    if (!dossier) return;
    try {
      await modifierObservationMutation.mutateAsync({
        dossierId: dossier.id,
        observation,
      });
    } catch (err: unknown) {
      setErreur(
        messageErreurApi(err, "Impossible d'enregistrer l'observation."),
      );
    }
  }

  if (chargementDossier) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-slate-500">
        <Loader2 size={32} className="text-brand-orange animate-spin" />
        <p className="text-sm font-semibold">
          Chargement du dossier administratif...
        </p>
      </div>
    );
  }

  if (erreurDossier || !dossier) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-8">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <div>
            <h3 className="text-sm font-bold">Dossier introuvable</h3>
            <p className="mt-0.5 text-xs">
              Le dossier demandé n&rsquo;existe pas ou a été déplacé.
            </p>
          </div>
        </div>
        <Link
          href="/dossiers"
          className="text-brand-orange inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
        >
          <ArrowLeft size={14} /> Retour à la liste des dossiers
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Navigation Breadcrumb ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dossiers"
          className="hover:text-brand-orange inline-flex items-center gap-2 text-xs font-bold text-slate-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Retour au tableau des dossiers</span>
        </Link>

        {session && (
          <span className="text-brand-orange rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-mono text-xs font-bold">
            Session {session.annee}
          </span>
        )}
      </div>

      {erreur && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span className="flex-1 font-medium">{erreur}</span>
          <button
            type="button"
            onClick={() => setErreur(null)}
            className="cursor-pointer font-bold text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {succes && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span className="flex-1 font-semibold">{succes}</span>
          <button
            type="button"
            onClick={() => setSucces(null)}
            className="cursor-pointer font-bold text-emerald-500 hover:text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Bandeau Héro Apprenant & Actions ── */}
      <Card className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Infos Élève */}
          <div className="flex items-start gap-4">
            <div className="from-brand-orange flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr to-amber-400 text-xl font-black text-white shadow-sm">
              {apprenant
                ? `${apprenant.nom?.[0] || ""}${apprenant.prenom?.[0] || ""}`.toUpperCase()
                : "E"}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  {apprenant
                    ? `${apprenant.nom} ${apprenant.prenom}`
                    : "Élève..."}
                </h1>
                {statutConfig && StatutIcon && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${statutConfig.badge}`}
                  >
                    <StatutIcon size={13} />
                    {statutConfig.label}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                {apprenant?.referenceRecu && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-700">
                    Reçu: {apprenant.referenceRecu}
                  </span>
                )}
                {centre && (
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    {centre.nom}
                  </span>
                )}
                {formation && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={13} className="text-slate-400" />
                    {formation.nom}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar size={13} />
                  Ouvert le{" "}
                  {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
                  {dossier.dateCloture &&
                    ` · Clôturé le ${new Date(dossier.dateCloture).toLocaleDateString("fr-FR")}`}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'actions principaux */}
          {peutGererDossier && (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
              {dossier.statut === "OUVERT" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSignalerComplet}
                  disabled={signalerCompletMutation.isPending}
                  className="border-emerald-300 bg-emerald-50/60 text-xs font-bold text-emerald-700 hover:bg-emerald-100/80"
                >
                  {signalerCompletMutation.isPending ? (
                    <Loader2
                      size={14}
                      className="mr-1.5 animate-spin text-emerald-600"
                    />
                  ) : (
                    <CheckCircle2
                      size={15}
                      className="mr-1.5 text-emerald-600"
                    />
                  )}
                  <span>
                    {signalerCompletMutation.isPending
                      ? "Signalement en cours..."
                      : "Signaler complet"}
                  </span>
                </Button>
              )}

              {dossier.statut === "COMPLET" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloturer}
                  disabled={cloturerMutation.isPending}
                  className="border-slate-300 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  {cloturerMutation.isPending ? (
                    <Loader2
                      size={14}
                      className="mr-1.5 animate-spin text-slate-600"
                    />
                  ) : (
                    <Lock size={14} className="mr-1.5" />
                  )}
                  <span>
                    {cloturerMutation.isPending
                      ? "Clôture en cours..."
                      : "Clôturer le dossier"}
                  </span>
                </Button>
              )}

              {(dossier.statut === "CLOTURE" ||
                dossier.statut === "COMPLET") && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRouvrir}
                  disabled={rouvrirMutation.isPending}
                  className="border-amber-300 bg-amber-50/60 text-xs font-bold text-amber-700 hover:bg-amber-100/80"
                  title="Rouvrir ce dossier administratif"
                >
                  {rouvrirMutation.isPending ? (
                    <Loader2
                      size={14}
                      className="mr-1.5 animate-spin text-amber-600"
                    />
                  ) : (
                    <RotateCcw size={14} className="mr-1.5 text-amber-600" />
                  )}
                  <span>
                    {rouvrirMutation.isPending
                      ? "Réouverture..."
                      : "Rouvrir le dossier"}
                  </span>
                </Button>
              )}

              <Button
                type="button"
                onClick={() => setModalSouscrireOuverte(true)}
                className="bg-brand-orange hover:bg-brand-orange/90 text-xs font-bold text-white shadow-xs"
              >
                <Plus size={15} className="mr-1.5" />
                Rattacher un concours
              </Button>

              <Link
                href={`/apprenants/${dossier.apprenantId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="Consulter la fiche complète de l'élève (inscriptions, cursus, notes...)"
              >
                <ExternalLink size={13} />
                <span>Fiche élève</span>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* ── Grille des Concours Rattachés ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
              Concours souscrits ({concoursDuDossier.length})
            </h2>
            <p className="text-xs text-slate-500">
              Liste des concours auxquels le candidat est inscrit avec le suivi
              financier et des pièces requises.
            </p>
          </div>

          {peutGererDossier && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalSouscrireOuverte(true)}
              className="text-brand-orange flex items-center gap-1 border-orange-200 text-xs font-bold hover:bg-orange-50"
            >
              <Plus size={14} />
              <span>+ Ajouter un autre concours</span>
            </Button>
          )}
        </div>

        {chargementConcours ? (
          <Card className="p-12 text-center text-xs text-slate-400">
            <Loader2
              size={20}
              className="text-brand-orange mr-2 inline animate-spin"
            />
            Chargement des concours rattachés...
          </Card>
        ) : concoursDuDossier.length === 0 ? (
          <Card className="space-y-3 p-10 text-center">
            <div className="text-brand-orange mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Award size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Aucun concours rattaché à ce dossier
            </h3>
            <p className="mx-auto max-w-sm text-xs text-slate-500">
              Ce dossier administratif a été ouvert mais aucun concours officiel
              n&rsquo;a encore été sélectionné.
            </p>
            {peutGererDossier && (
              <Button
                type="button"
                onClick={() => setModalSouscrireOuverte(true)}
                className="bg-brand-orange inline-flex items-center gap-1.5 text-xs font-bold text-white"
              >
                <Plus size={14} /> Rattacher un premier concours
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {concoursDuDossier.map((dc) => (
              <ConcoursSectionCard
                key={dc.id}
                dossierConcours={dc}
                cataloguePieces={piecesRequises}
                dossierStatut={dossier.statut}
                peutGerer={peutGererDossier}
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

      {/* ── Section Observations & Notes administratives ── */}
      <Card className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5">
        <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
          <MessageSquare size={15} className="text-brand-orange" />
          <span>Notes & Observations administratives</span>
        </label>
        <p className="text-xs text-slate-500">
          Indiquez ici toute précision utile sur le candidat (ex : dispense
          médicale, diplôme étranger en cours d&rsquo;équivalence, bordereau
          spécial...).
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            readOnly={!peutGererDossier}
            rows={3}
            placeholder="Écrire une observation sur ce dossier..."
            className="focus:ring-brand-orange/30 focus:border-brand-orange flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 transition-all focus:bg-white focus:ring-2 focus:outline-none"
          />
          {peutGererDossier && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSauvegarderObservation}
              disabled={modifierObservationMutation.isPending}
              className="self-end px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              {modifierObservationMutation.isPending
                ? "Enregistrement..."
                : "Enregistrer la note"}
            </Button>
          )}
        </div>
      </Card>

      {/* ── Modales d'actions secondaires ── */}
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

      {modalSouscrireOuverte && (
        <SouscrireDossierModal
          isOpen={modalSouscrireOuverte}
          onClose={() => setModalSouscrireOuverte(false)}
          apprenants={apprenants}
          sessionId={dossier.sessionId}
          centreId={dossier.centreId}
          apprenantPreselectionneId={dossier.apprenantId}
          onSuccess={() => setModalSouscrireOuverte(false)}
        />
      )}
    </div>
  );
}

// ── Composant détaillé pour un concours dans la page ──
function ConcoursSectionCard({
  dossierConcours,
  cataloguePieces,
  dossierStatut,
  onOuvrirPaiement,
  peutGerer,
}: {
  dossierConcours: DossierConcours;
  cataloguePieces: PieceRequise[];
  dossierStatut: Dossier["statut"];
  /** Absent : l'utilisateur ne peut pas encaisser, le bouton est masqué. */
  onOuvrirPaiement?: (nomConcours: string) => void;
  /** Faux : pièces en lecture seule (pas de validation). */
  peutGerer: boolean;
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
    <Card className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      {/* ── En-tête Concours & Volet Financier ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-brand-orange flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold">
              <Award size={16} />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {concours?.nom || "Concours officiel"}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                progression === 100
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              {nbValidees}/{nbTotal} pièces ({progression}%)
            </span>
          </div>

          {concours && (
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
              <span>
                Délai centre :{" "}
                <strong className="font-mono text-slate-700">
                  {new Date(
                    concours.dateLimiteRecevabiliteCentre,
                  ).toLocaleDateString("fr-FR")}
                </strong>
              </span>
              <span>·</span>
              <span>
                Dépôt officiel :{" "}
                <strong className="font-mono text-slate-700">
                  {new Date(concours.dateLimiteDepot).toLocaleDateString(
                    "fr-FR",
                  )}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Bloc Financier & Bouton Paiement */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-500">
              Réglé:{" "}
              <strong className="font-mono text-slate-800">
                {FCFA.format(montantPaye)}
              </strong>{" "}
              / {FCFA.format(dossierConcours.montantTotal)} FCFA
            </p>
            <p
              className={`font-mono text-xs font-bold ${
                soldeRestant <= 0 ? "text-emerald-700" : "text-brand-orange"
              }`}
            >
              {soldeRestant <= 0
                ? "✓ Soldé en totalité"
                : `Reste : ${FCFA.format(soldeRestant)} FCFA (${progressionPaiement}%)`}
            </p>
          </div>

          {onOuvrirPaiement && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOuvrirPaiement(concours?.nom || "Concours")}
              className="text-brand-orange flex items-center gap-1.5 border-orange-200 bg-white px-3 py-2 text-xs font-bold shadow-2xs hover:bg-orange-50"
            >
              <Coins size={14} />
              <span>Payer</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Barre d'outils des Pièces (Filtres, Recherche, Tout Valider) ── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFiltrePieces("TOUTES")}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              filtrePieces === "TOUTES"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Toutes ({nbTotal})
          </button>
          <button
            type="button"
            onClick={() => setFiltrePieces("A_VALIDER")}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              filtrePieces === "A_VALIDER"
                ? "bg-white text-amber-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            À valider ({nbTotal - nbValidees})
          </button>
          <button
            type="button"
            onClick={() => setFiltrePieces("VALIDEES")}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              filtrePieces === "VALIDEES"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Validées ({nbValidees})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute top-2.5 left-2.5 text-slate-400"
            />
            <input
              type="text"
              value={recherchePiece}
              onChange={(e) => setRecherchePiece(e.target.value)}
              placeholder="Filtrer une pièce..."
              className="focus:ring-brand-orange w-44 rounded-lg border border-slate-200 bg-slate-50 py-1 pr-3 pl-8 text-xs focus:bg-white focus:ring-1 focus:outline-none"
            />
          </div>

          {peutGerer && dossierStatut === "OUVERT" && nbValidees < nbTotal && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleValiderToutesLesPieces}
              disabled={validerToutEnCours}
              className="border-emerald-300 bg-emerald-50/70 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100/80"
              title="Valider en un clic toutes les pièces restantes de ce concours"
            >
              <CheckCheck size={14} className="mr-1 text-emerald-600" />
              <span>
                {validerToutEnCours ? "Validation..." : "Tout valider"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Liste des pièces en grille responsive ── */}
      {chargementPieces ? (
        <div className="p-8 text-center text-xs text-slate-400">
          <Loader2
            size={16}
            className="text-brand-orange mr-1 inline animate-spin"
          />
          Chargement des pièces...
        </div>
      ) : piecesFiltrees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          Aucune pièce ne correspond au filtre sélectionné.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {piecesFiltrees.map((piece) => {
            const pieceInfo = cataloguePieces.find(
              (cp) => cp.id === piece.pieceRequiseId,
            );
            const estValidee = piece.statut === "VALIDEE";
            const montantLigne = pieceInfo
              ? pieceInfo.montant * piece.quantite
              : 0;

            return (
              <div
                key={piece.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                  estValidee
                    ? "border-emerald-200/80 bg-emerald-50/20"
                    : "border-slate-200/90 bg-white shadow-2xs"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {pieceInfo?.nom || "Pièce non répertoriée"}
                    </p>
                    {piece.quantite > 1 && (
                      <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
                        x{piece.quantite}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    {pieceInfo ? `${FCFA.format(montantLigne)} FCFA` : "—"}
                    {piece.dateValidation &&
                      ` · Validée le ${new Date(piece.dateValidation).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {estValidee ? (
                    <span className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-100/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Validée
                    </span>
                  ) : peutGerer ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => validerPieceMutation.mutate(piece.id)}
                      disabled={
                        validerPieceMutation.isPending ||
                        dossierStatut !== "OUVERT"
                      }
                      className="border-amber-300 bg-amber-50/60 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100/80"
                    >
                      <Clock size={12} className="mr-1 text-amber-600" />
                      Valider
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                      <Clock size={12} className="text-amber-600" />
                      En attente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
