"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Info,
  Wallet,
  FolderKanban,
  CalendarCheck,
  Phone,
  Building2,
  GraduationCap,
  Pencil,
  Plus,
  Coins,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Button, Card } from "@/shared/ui";
import {
  useApprenant,
  useCursusApprenant,
  ModifierApprenantModal,
} from "@/modules/apprenants";
import { useFormations } from "@/modules/academique";
import { useCentres, useSessions, useSessionActive } from "@/modules/centres-sessions";
import { useDossierParApprenant, useConcoursDuDossier } from "@/modules/dossiers";
import { useSession } from "next-auth/react";
import {
  useVersementsApprenant,
  useMotifs,
  EnregistrerVersementModal,
  RecuPaiementModal,
  type DonneesRecuPaiement,
} from "@/modules/financier";

import { InformationsTab } from "./InformationsTab";
import { ContratEtPaiementsTab } from "./ContratEtPaiementsTab";
import { DossierAdministratifTab } from "./DossierAdministratifTab";
import { PresenceTab } from "./PresenceTab";
import { NegocierContratPhaseModal } from "./NegocierContratPhaseModal";

const MOTIF_ACHAT_LIVRES_ID = "00000000-0000-0000-0000-000000000012";
const FCFA = new Intl.NumberFormat("fr-FR");

const AVATAR_COLORS = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-purple-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-indigo-500 text-white",
  "bg-orange-500 text-white",
];

function getAvatarBg(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type Onglet = "informations" | "contrat" | "dossier" | "presence";

export function ApprenantDetailView({ apprenantId }: { apprenantId: string }) {
  const { data: authSession } = useSession();
  const role = authSession?.user?.role;
  const isDossierOnlyRole = role === "SUPERVISEUR_DOSSIERS" || role === "CHARGE_DOSSIER";

  const peutEncaisser = role === "CAISSIER";
  const peutModifierApprenant =
    role === "CAISSIER" ||
    role === "DIRECTEUR" ||
    role === "DIRECTEUR_ACADEMIQUE";
  const peutNegocierContrat =
    role === "CHEF_CENTRE" ||
    role === "DIRECTEUR" ||
    role === "DIRECTEUR_ACADEMIQUE";

  const [onglet, setOnglet] = useState<Onglet>(isDossierOnlyRole ? "dossier" : "informations");
  const [modalModifierOuverte, setModalModifierOuverte] = useState(false);
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [modalContratOuverte, setModalContratOuverte] = useState(false);
  const [recuAImprimer, setRecuAImprimer] = useState<DonneesRecuPaiement | null>(null);

  const { data: apprenant, isLoading, isError } = useApprenant(apprenantId);
  const { data: cursus } = useCursusApprenant(apprenantId);
  const { data: formations } = useFormations();
  const { data: centres } = useCentres();
  const { data: sessions } = useSessions();
  const { data: sessionActive } = useSessionActive();
  const { data: dossier } = useDossierParApprenant(apprenantId);
  const { data: versements } = useVersementsApprenant(apprenantId);
  const { data: motifs } = useMotifs("ENTREE");
  const { data: concoursDuDossier = [] } = useConcoursDuDossier(dossier?.id);

  const totalFraisDossier = concoursDuDossier.reduce((sum, c) => sum + c.montantTotal, 0);

  const formation = formations?.find(
    (f) => f.id === (cursus?.formationActiveId || apprenant?.formationId),
  );
  const centre = centres?.find((c) => c.id === apprenant?.centreId);
  const session = sessions?.find((s) => s.id === apprenant?.sessionId);

  const isVersementLivre = (v: { motifId: string }) => {
    if (v.motifId === MOTIF_ACHAT_LIVRES_ID) return true;
    const m = motifs?.find((item) => item.id === v.motifId);
    return m?.nom ? m.nom.toLowerCase().includes("livre") : false;
  };

  // Scolarité uniquement : les achats de livres et dossiers concours ne sont pas déduits du contrat
  const montantPaye = (versements ?? [])
    .filter((v) => v.statut !== "REJETE" && !v.dossierConcoursId && !isVersementLivre(v))
    .reduce((total, v) => total + v.montant, 0);

  const totalAchatsLivres = (versements ?? [])
    .filter((v) => v.statut !== "REJETE" && isVersementLivre(v))
    .reduce((total, v) => total + v.montant, 0);

  const totalContrat = cursus?.montantTotalCumule ?? apprenant?.montantContrat ?? 0;
  const soldeRestant = Math.max(totalContrat - montantPaye, 0);

  const tauxRecouvrement =
    totalContrat > 0 ? Math.min(100, Math.round((montantPaye / totalContrat) * 100)) : 100;

  if (isLoading) {
    return (
      <div className="w-full p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-r-transparent" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Chargement du profil de l&rsquo;élève...</p>
      </div>
    );
  }

  if (isError || !apprenant) {
    return (
      <div className="w-full p-8">
        <Card className="p-10 text-center">
          <p className="text-lg font-bold text-slate-900">Apprenant introuvable</p>
          <Link
            href={isDossierOnlyRole ? "/dossiers" : "/apprenants"}
            className="text-brand-orange mt-3 inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
          >
            <ArrowLeft size={16} />
            <span>{isDossierOnlyRole ? "Retour aux dossiers" : "Retour à la liste"}</span>
          </Link>
        </Card>
      </div>
    );
  }

  const nomComplet = `${apprenant.prenom} ${apprenant.nom}`;
  const initiales = `${apprenant.prenom?.[0] || ""}${apprenant.nom?.[0] || ""}`.toUpperCase() || "E";
  const phasesDejaSuivies = (cursus?.inscriptionsPhases || []).map((i) => i.phaseId);

  return (
    <div className="w-full space-y-6">
      {/* ── Fil d'Ariane & Navigation ── */}
      <div>
        <Link
          href={isDossierOnlyRole ? "/dossiers" : "/apprenants"}
          className="text-slate-500 hover:text-slate-900 mb-3 inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <ArrowLeft size={16} />
          {isDossierOnlyRole ? "Retour au suivi des dossiers" : "Retour à la liste des apprenants"}
        </Link>
      </div>

      {/* ── Bannière Profil "Hero" ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Identité + Badges */}
          <div className="flex items-start gap-4">
            <div
              className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs shrink-0 ${getAvatarBg(
                nomComplet,
              )}`}
            >
              {initiales}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {nomComplet}
                </h1>
                {apprenant.preInscrit ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 uppercase">
                    <Clock size={12} />
                    Pré-inscrit (Acompte)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 uppercase">
                    <CheckCircle2 size={12} />
                    Inscription définitive
                  </span>
                )}
              </div>

              {/* Coordonnées en ligne */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <GraduationCap size={13} className="text-brand-orange" />
                  {formation?.nom ?? "Filière non définie"}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-slate-400" />
                  {centre?.nom ?? "Centre non défini"}
                  {session ? ` · Session ${session.annee}` : ""}
                </span>
                {apprenant.contactApprenant && (
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Phone size={13} className="text-slate-400" />
                    {apprenant.contactApprenant}
                  </span>
                )}
                {apprenant.etablissementOrigine && (
                  <span className="flex items-center gap-1 text-slate-500 italic">
                    Lycée : {apprenant.etablissementOrigine}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Rapides en tête */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {peutModifierApprenant && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalModifierOuverte(true)}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Pencil size={13} />
                <span>Modifier</span>
              </Button>
            )}

            {!isDossierOnlyRole && (
              <>
                {peutNegocierContrat && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setModalContratOuverte(true)}
                    className="flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Plus size={13} />
                    <span>Négocier phase</span>
                  </Button>
                )}

                {peutEncaisser && (
                  <Button
                    type="button"
                    onClick={() => setModalVersementOuverte(true)}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Coins size={14} />
                    <span>Encaisser versement</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Cartouche Financier Intégré & Jauge ── */}
        {isDossierOnlyRole ? (
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-orange-50/50 p-3.5 border border-orange-200/70">
              <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">
                Frais Dossiers Concours
              </span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {FCFA.format(totalFraisDossier)} FCFA
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Concours Souscrits
              </span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {concoursDuDossier.length} concours
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Statut Dossier
              </span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {dossier
                  ? dossier.statut === "OUVERT"
                    ? "En cours"
                    : dossier.statut === "COMPLET"
                    ? "Complet"
                    : "Clôturé"
                  : "Non ouvert"}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 gap-4 ${
                totalAchatsLivres > 0 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
              }`}
            >
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Montant Total Contrats
                  </span>
                  {cursus?.contrats && cursus.contrats.length > 0 && (
                    <span className="text-[10px] font-extrabold text-brand-orange bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded-md">
                      {cursus.contrats.length} contrat{cursus.contrats.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-base font-black text-slate-900 mt-0.5">
                  {FCFA.format(totalContrat)} FCFA
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Réglé Scolarité ({tauxRecouvrement}%)
                </span>
                <p className="text-base font-black text-emerald-800 mt-0.5">
                  {FCFA.format(montantPaye)} FCFA
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reste à Solder Contrat
                </span>
                <p
                  className={`text-base font-black mt-0.5 ${
                    soldeRestant > 0 ? "text-brand-orange" : "text-emerald-800"
                  }`}
                >
                  {FCFA.format(Math.max(soldeRestant, 0))} FCFA
                </p>
              </div>

              {totalAchatsLivres > 0 && (
                <div className="rounded-xl bg-purple-50/70 p-3.5 border border-purple-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Livres (Hors contrat)
                    </span>
                    <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                      Boutique
                    </span>
                  </div>
                  <p className="text-base font-black text-purple-950 mt-0.5">
                    {FCFA.format(totalAchatsLivres)} FCFA
                  </p>
                </div>
              )}
            </div>

            {/* Barre de progression du règlement */}
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tauxRecouvrement >= 100
                      ? "bg-emerald-500"
                      : tauxRecouvrement >= 50
                      ? "bg-brand-orange"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${tauxRecouvrement}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Onglets Modernes ── */}
      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
        <OngletBouton
          actif={onglet === "informations"}
          onClick={() => setOnglet("informations")}
          icone={<Info size={16} />}
          libelle="Informations & Cursus"
        />
        {!isDossierOnlyRole && (
          <OngletBouton
            actif={onglet === "contrat"}
            onClick={() => setOnglet("contrat")}
            icone={<Wallet size={16} />}
            libelle={cursus?.contrats?.length ? `Contrats (${cursus.contrats.length}) & Paiements` : "Contrats & Paiements"}
          />
        )}
        <OngletBouton
          actif={onglet === "dossier"}
          onClick={() => setOnglet("dossier")}
          icone={<FolderKanban size={16} />}
          libelle="Dossier Administratif"
        />
        {!isDossierOnlyRole && (
          <OngletBouton
            actif={onglet === "presence"}
            onClick={() => setOnglet("presence")}
            icone={<CalendarCheck size={16} />}
            libelle="Assiduité & Présences"
          />
        )}
      </div>

      {/* ── Contenu des Onglets ── */}
      {onglet === "informations" && (
        <InformationsTab
          apprenant={apprenant}
          nomFormation={formation?.nom}
          nomCentre={centre?.nom}
          cursus={cursus}
          peutModifier={peutModifierApprenant}
        />
      )}

      {onglet === "contrat" && (
        <ContratEtPaiementsTab
          apprenant={apprenant}
          versements={versements}
          montantPaye={montantPaye}
          soldeRestant={soldeRestant}
          cursus={cursus}
        />
      )}

      {onglet === "dossier" && (
        <DossierAdministratifTab
          dossier={dossier}
          centres={centres}
          sessions={sessions}
          apprenant={apprenant}
        />
      )}

      {onglet === "presence" && <PresenceTab />}

      {/* ── Modals Directes ── */}
      {modalModifierOuverte && (
        <ModifierApprenantModal
          isOpen={modalModifierOuverte}
          onClose={() => setModalModifierOuverte(false)}
          apprenant={apprenant}
        />
      )}

      {modalVersementOuverte && (
        <EnregistrerVersementModal
          isOpen={modalVersementOuverte}
          onClose={() => setModalVersementOuverte(false)}
          apprenantId={apprenant.id}
          nomApprenant={nomComplet}
          centreId={apprenant.centreId}
          sessionId={sessionActive?.id || apprenant.sessionId}
          formationId={formation?.id}
          soldeRestant={soldeRestant}
          onSuccessRecu={(recu) => {
            setRecuAImprimer(recu);
          }}
        />
      )}

      {/* ── Modal Reçu Officiel Deux Volets ── */}
      {recuAImprimer && (
        <RecuPaiementModal
          isOpen={Boolean(recuAImprimer)}
          onClose={() => setRecuAImprimer(null)}
          recu={recuAImprimer}
        />
      )}

      {modalContratOuverte && (
        <NegocierContratPhaseModal
          isOpen={modalContratOuverte}
          onClose={() => setModalContratOuverte(false)}
          apprenantId={apprenant.id}
          nomApprenant={nomComplet}
          phasesDejaSuivies={phasesDejaSuivies}
        />
      )}
    </div>
  );
}

function OngletBouton({
  actif,
  onClick,
  icone,
  libelle,
}: {
  actif: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  libelle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
        actif
          ? "border-brand-orange text-brand-orange"
          : "border-transparent text-slate-500 hover:text-slate-900"
      }`}
    >
      {icone}
      <span>{libelle}</span>
    </button>
  );
}
