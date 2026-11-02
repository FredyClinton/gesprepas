"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  const { data: dossier, isLoading: chargementDossier, error: erreurDossier } =
    useDossier(dossierId);

  const { data: apprenant } = useApprenant(dossier?.apprenantId);
  const { data: apprenants = [] } = useApprenants();
  const { data: concoursDuDossier = [], isLoading: chargementConcours } =
    useConcoursDuDossier(dossierId);
  const { data: piecesRequises = [] } = usePiecesRequises();
  const { data: centres = [] } = useCentres();
  const { data: sessions = [] } = useSessions();
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
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 size={32} className="animate-spin text-brand-orange" />
        <p className="text-sm font-semibold">Chargement du dossier administratif...</p>
      </div>
    );
  }

  if (erreurDossier || !dossier) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <div>
            <h3 className="font-bold text-sm">Dossier introuvable</h3>
            <p className="text-xs mt-0.5">
              Le dossier demandé n&rsquo;existe pas ou a été déplacé.
            </p>
          </div>
        </div>
        <Link
          href="/dossiers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
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
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-orange transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Retour au tableau des dossiers</span>
        </Link>

        {session && (
          <span className="text-xs font-mono font-bold px-3 py-1 bg-orange-50 text-brand-orange border border-orange-200 rounded-full">
            Session {session.annee}
          </span>
        )}
      </div>

      {erreur && (
        <div className="flex items-center gap-3 p-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span className="flex-1 font-medium">{erreur}</span>
          <button
            type="button"
            onClick={() => setErreur(null)}
            className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {succes && (
        <div className="flex items-center gap-3 p-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span className="flex-1 font-semibold">{succes}</span>
          <button
            type="button"
            onClick={() => setSucces(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Bandeau Héro Apprenant & Actions ── */}
      <Card className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Infos Élève */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-400 text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
              {apprenant
                ? `${apprenant.nom?.[0] || ""}${apprenant.prenom?.[0] || ""}`.toUpperCase()
                : "E"}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {apprenant ? `${apprenant.nom} ${apprenant.prenom}` : "Élève..."}
                </h1>
                {statutConfig && StatutIcon && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${statutConfig.badge}`}
                  >
                    <StatutIcon size={13} />
                    {statutConfig.label}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                {apprenant?.referenceRecu && (
                  <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
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
                  Ouvert le {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
                  {dossier.dateCloture &&
                    ` · Clôturé le ${new Date(dossier.dateCloture).toLocaleDateString("fr-FR")}`}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'actions principaux */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {dossier.statut === "OUVERT" && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSignalerComplet}
                disabled={signalerCompletMutation.isPending}
                className="text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-300"
              >
                {signalerCompletMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1.5 text-emerald-600" />
                ) : (
                  <CheckCircle2 size={15} className="mr-1.5 text-emerald-600" />
                )}
                <span>
                  {signalerCompletMutation.isPending ? "Signalement en cours..." : "Signaler complet"}
                </span>
              </Button>
            )}

            {dossier.statut === "COMPLET" && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloturer}
                disabled={cloturerMutation.isPending}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300"
              >
                {cloturerMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1.5 text-slate-600" />
                ) : (
                  <Lock size={14} className="mr-1.5" />
                )}
                <span>
                  {cloturerMutation.isPending ? "Clôture en cours..." : "Clôturer le dossier"}
                </span>
              </Button>
            )}

            {(dossier.statut === "CLOTURE" || dossier.statut === "COMPLET") && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleRouvrir}
                disabled={rouvrirMutation.isPending}
                className="text-xs font-bold text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 border-amber-300"
                title="Rouvrir ce dossier administratif"
              >
                {rouvrirMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1.5 text-amber-600" />
                ) : (
                  <RotateCcw size={14} className="mr-1.5 text-amber-600" />
                )}
                <span>
                  {rouvrirMutation.isPending ? "Réouverture..." : "Rouvrir le dossier"}
                </span>
              </Button>
            )}

            <Button
              type="button"
              onClick={() => setModalSouscrireOuverte(true)}
              className="text-xs bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-xs"
            >
              <Plus size={15} className="mr-1.5" />
              Rattacher un concours
            </Button>

            <Link
              href={`/apprenants/${dossier.apprenantId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              title="Consulter la fiche complète de l'élève (inscriptions, cursus, notes...)"
            >
              <ExternalLink size={13} />
              <span>Fiche élève</span>
            </Link>
          </div>
        </div>
      </Card>

      {/* ── Grille des Concours Rattachés ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
              Concours souscrits ({concoursDuDossier.length})
            </h2>
            <p className="text-xs text-slate-500">
              Liste des concours auxquels le candidat est inscrit avec le suivi financier et des pièces requises.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalSouscrireOuverte(true)}
            className="text-xs font-bold text-brand-orange border-orange-200 hover:bg-orange-50 flex items-center gap-1"
          >
            <Plus size={14} />
            <span>+ Ajouter un autre concours</span>
          </Button>
        </div>

        {chargementConcours ? (
          <Card className="p-12 text-center text-xs text-slate-400">
            <Loader2 size={20} className="animate-spin text-brand-orange inline mr-2" />
            Chargement des concours rattachés...
          </Card>
        ) : concoursDuDossier.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center mx-auto">
              <Award size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Aucun concours rattaché à ce dossier
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ce dossier administratif a été ouvert mais aucun concours officiel n&rsquo;a encore été sélectionné.
            </p>
            <Button
              type="button"
              onClick={() => setModalSouscrireOuverte(true)}
              className="text-xs bg-brand-orange text-white font-bold inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Rattacher un premier concours
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {concoursDuDossier.map((dc) => (
              <ConcoursSectionCard
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

      {/* ── Section Observations & Notes administratives ── */}
      <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <MessageSquare size={15} className="text-brand-orange" />
          <span>Notes & Observations administratives</span>
        </label>
        <p className="text-xs text-slate-500">
          Indiquez ici toute précision utile sur le candidat (ex : dispense médicale, diplôme étranger en cours d&rsquo;équivalence, bordereau spécial...).
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={3}
            placeholder="Écrire une observation sur ce dossier..."
            className="flex-1 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all font-medium text-slate-800"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleSauvegarderObservation}
            disabled={modifierObservationMutation.isPending}
            className="self-end text-xs font-bold px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            {modifierObservationMutation.isPending ? "Enregistrement..." : "Enregistrer la note"}
          </Button>
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
}: {
  dossierConcours: DossierConcours;
  cataloguePieces: PieceRequise[];
  dossierStatut: Dossier["statut"];
  onOuvrirPaiement: (nomConcours: string) => void;
}) {
  const { data: concours } = useConcours(dossierConcours.concoursId);
  const { data: pieces = [], isLoading: chargementPieces } =
    usePiecesDossierConcours(dossierConcours.id);
  const { data: solde } = useSoldeDossierConcours(dossierConcours.id);

  const validerPieceMutation = useValiderPieceDossier();
  const [validerToutEnCours, setValiderToutEnCours] = useState(false);
  const [filtrePieces, setFiltrePieces] = useState<"TOUTES" | "A_VALIDER" | "VALIDEES">("TOUTES");
  const [recherchePiece, setRecherchePiece] = useState("");

  const nbValidees = pieces.filter((p) => p.statut === "VALIDEE").length;
  const nbTotal = pieces.length;
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
    <Card className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-5 shadow-xs">
      {/* ── En-tête Concours & Volet Financier ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center font-bold text-xs">
              <Award size={16} />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {concours?.nom || "Concours officiel"}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                progression === 100
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {nbValidees}/{nbTotal} pièces ({progression}%)
            </span>
          </div>

          {concours && (
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
              <span>
                Délai centre :{" "}
                <strong className="text-slate-700 font-mono">
                  {new Date(concours.dateLimiteRecevabiliteCentre).toLocaleDateString("fr-FR")}
                </strong>
              </span>
              <span>·</span>
              <span>
                Dépôt officiel :{" "}
                <strong className="text-slate-700 font-mono">
                  {new Date(concours.dateLimiteDepot).toLocaleDateString("fr-FR")}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Bloc Financier & Bouton Paiement */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-right">
            <p className="text-[11px] text-slate-500 font-medium">
              Réglé: <strong className="font-mono text-slate-800">{FCFA.format(montantPaye)}</strong> / {FCFA.format(dossierConcours.montantTotal)} FCFA
            </p>
            <p
              className={`text-xs font-bold font-mono ${
                soldeRestant <= 0 ? "text-emerald-700" : "text-brand-orange"
              }`}
            >
              {soldeRestant <= 0
                ? "✓ Soldé en totalité"
                : `Reste : ${FCFA.format(soldeRestant)} FCFA (${progressionPaiement}%)`}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => onOuvrirPaiement(concours?.nom || "Concours")}
            className="text-xs px-3 py-2 font-bold text-brand-orange bg-white hover:bg-orange-50 border-orange-200 shadow-2xs flex items-center gap-1.5"
          >
            <Coins size={14} />
            <span>Payer</span>
          </Button>
        </div>
      </div>

      {/* ── Barre d'outils des Pièces (Filtres, Recherche, Tout Valider) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFiltrePieces("TOUTES")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={recherchePiece}
              onChange={(e) => setRecherchePiece(e.target.value)}
              placeholder="Filtrer une pièce..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange w-44"
            />
          </div>

          {dossierStatut === "OUVERT" && nbValidees < nbTotal && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleValiderToutesLesPieces}
              disabled={validerToutEnCours}
              className="text-xs px-2.5 py-1 font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-300"
              title="Valider en un clic toutes les pièces restantes de ce concours"
            >
              <CheckCheck size={14} className="mr-1 text-emerald-600" />
              <span>{validerToutEnCours ? "Validation..." : "Tout valider"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Liste des pièces en grille responsive ── */}
      {chargementPieces ? (
        <div className="p-8 text-center text-xs text-slate-400">
          <Loader2 size={16} className="animate-spin text-brand-orange inline mr-1" />
          Chargement des pièces...
        </div>
      ) : piecesFiltrees.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
          Aucune pièce ne correspond au filtre sélectionné.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {piecesFiltrees.map((piece) => {
            const pieceInfo = cataloguePieces.find(
              (cp) => cp.id === piece.pieceRequiseId,
            );
            const estValidee = piece.statut === "VALIDEE";
            const montantLigne = pieceInfo ? pieceInfo.montant * piece.quantite : 0;

            return (
              <div
                key={piece.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  estValidee
                    ? "bg-emerald-50/20 border-emerald-200/80"
                    : "bg-white border-slate-200/90 shadow-2xs"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {pieceInfo?.nom || "Pièce non répertoriée"}
                    </p>
                    {piece.quantite > 1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        x{piece.quantite}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {pieceInfo ? `${FCFA.format(montantLigne)} FCFA` : "—"}
                    {piece.dateValidation &&
                      ` · Validée le ${new Date(piece.dateValidation).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {estValidee ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Validée
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => validerPieceMutation.mutate(piece.id)}
                      disabled={validerPieceMutation.isPending || dossierStatut !== "OUVERT"}
                      className="text-xs px-2.5 py-1 font-bold text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 border-amber-300"
                    >
                      <Clock size={12} className="mr-1 text-amber-600" />
                      Valider
                    </Button>
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
