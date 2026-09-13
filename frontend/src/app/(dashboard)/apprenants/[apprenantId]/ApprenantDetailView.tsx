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
import { useCentres, useSessions } from "@/modules/centres-sessions";
import { useDossierParApprenant } from "@/modules/dossiers";
import {
  useVersementsApprenant,
  EnregistrerVersementModal,
} from "@/modules/financier";

import { InformationsTab } from "./InformationsTab";
import { ContratEtPaiementsTab } from "./ContratEtPaiementsTab";
import { DossierAdministratifTab } from "./DossierAdministratifTab";
import { PresenceTab } from "./PresenceTab";
import { NegocierContratPhaseModal } from "./NegocierContratPhaseModal";

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
  const [onglet, setOnglet] = useState<Onglet>("informations");
  const [modalModifierOuverte, setModalModifierOuverte] = useState(false);
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [modalContratOuverte, setModalContratOuverte] = useState(false);

  const { data: apprenant, isLoading, isError } = useApprenant(apprenantId);
  const { data: cursus } = useCursusApprenant(apprenantId);
  const { data: formations } = useFormations();
  const { data: centres } = useCentres();
  const { data: sessions } = useSessions();
  const { data: dossier } = useDossierParApprenant(apprenantId);
  const { data: versements } = useVersementsApprenant(apprenantId);

  const formation = formations?.find(
    (f) => f.id === (cursus?.formationActiveId || apprenant?.formationId),
  );
  const centre = centres?.find((c) => c.id === apprenant?.centreId);
  const session = sessions?.find((s) => s.id === apprenant?.sessionId);

  const montantPaye = (versements ?? [])
    .filter((v) => v.statut !== "REJETE")
    .reduce((total, v) => total + v.montant, 0);
  const totalContrat = cursus?.montantTotalCumule ?? apprenant?.montantContrat ?? 0;
  const soldeRestant = Math.max(totalContrat - montantPaye, 0);

  const tauxRecouvrement =
    totalContrat > 0 ? Math.min(100, Math.round((montantPaye / totalContrat) * 100)) : 100;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-r-transparent" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Chargement du profil de l&rsquo;élève...</p>
      </div>
    );
  }

  if (isError || !apprenant) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <Card className="p-10 text-center">
          <p className="text-lg font-bold text-slate-900">Apprenant introuvable</p>
          <Link
            href="/apprenants"
            className="text-brand-orange mt-3 inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
          >
            <ArrowLeft size={16} />
            <span>Retour à la liste</span>
          </Link>
        </Card>
      </div>
    );
  }

  const nomComplet = `${apprenant.prenom} ${apprenant.nom}`;
  const initiales = `${apprenant.prenom?.[0] || ""}${apprenant.nom?.[0] || ""}`.toUpperCase() || "E";
  const phasesDejaSuivies = (cursus?.inscriptionsPhases || []).map((i) => i.phaseId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Fil d'Ariane & Navigation ── */}
      <div>
        <Link
          href="/apprenants"
          className="text-slate-500 hover:text-slate-900 mb-3 inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à la liste des apprenants
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalModifierOuverte(true)}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Pencil size={13} />
              <span>Modifier</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalContratOuverte(true)}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus size={13} />
              <span>Négocier phase</span>
            </Button>

            <Button
              type="button"
              onClick={() => setModalVersementOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <Coins size={14} />
              <span>Encaisser versement</span>
            </Button>
          </div>
        </div>

        {/* ── Cartouche Financier Intégré & Jauge ── */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Total Réglé ({tauxRecouvrement}%)
            </span>
            <p className="text-base font-black text-emerald-800 mt-0.5">
              {FCFA.format(montantPaye)} FCFA
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Reste à Solder
            </span>
            <p
              className={`text-base font-black mt-0.5 ${
                soldeRestant > 0 ? "text-brand-orange" : "text-emerald-800"
              }`}
            >
              {FCFA.format(Math.max(soldeRestant, 0))} FCFA
            </p>
          </div>
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
      </div>

      {/* ── Onglets Modernes ── */}
      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
        <OngletBouton
          actif={onglet === "informations"}
          onClick={() => setOnglet("informations")}
          icone={<Info size={16} />}
          libelle="Informations & Cursus"
        />
        <OngletBouton
          actif={onglet === "contrat"}
          onClick={() => setOnglet("contrat")}
          icone={<Wallet size={16} />}
          libelle={cursus?.contrats?.length ? `Contrats (${cursus.contrats.length}) & Paiements` : "Contrats & Paiements"}
        />
        <OngletBouton
          actif={onglet === "dossier"}
          onClick={() => setOnglet("dossier")}
          icone={<FolderKanban size={16} />}
          libelle="Dossier Administratif"
        />
        <OngletBouton
          actif={onglet === "presence"}
          onClick={() => setOnglet("presence")}
          icone={<CalendarCheck size={16} />}
          libelle="Assiduité & Présences"
        />
      </div>

      {/* ── Contenu des Onglets ── */}
      {onglet === "informations" && (
        <InformationsTab
          apprenant={apprenant}
          nomFormation={formation?.nom}
          nomCentre={centre?.nom}
          cursus={cursus}
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
          sessionId={apprenant.sessionId}
          formationId={formation?.id}
          soldeRestant={soldeRestant}
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
