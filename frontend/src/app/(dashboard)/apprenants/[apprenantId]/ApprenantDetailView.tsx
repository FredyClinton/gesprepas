"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Info,
  Wallet,
  FolderKanban,
  CalendarCheck,
} from "lucide-react";

import { Card } from "@/shared/ui";
import { useApprenant } from "@/modules/apprenants";
import { useFormations } from "@/modules/academique";
import { useCentres, useSessions } from "@/modules/centres-sessions";
import { useDossierParApprenant } from "@/modules/dossiers";
import { useVersementsApprenant } from "@/modules/financier";

import { InformationsTab } from "./InformationsTab";
import { ContratEtPaiementsTab } from "./ContratEtPaiementsTab";
import { DossierAdministratifTab } from "./DossierAdministratifTab";
import { PresenceTab } from "./PresenceTab";

const FCFA = new Intl.NumberFormat("fr-FR");

type Onglet = "informations" | "contrat" | "dossier" | "presence";

export function ApprenantDetailView({ apprenantId }: { apprenantId: string }) {
  const [onglet, setOnglet] = useState<Onglet>("informations");

  const { data: apprenant, isLoading, isError } = useApprenant(apprenantId);
  const { data: formations } = useFormations();
  const { data: centres } = useCentres();
  const { data: sessions } = useSessions();
  const { data: dossier } = useDossierParApprenant(apprenantId);
  const { data: versements } = useVersementsApprenant(apprenantId);

  const formation = formations?.find((f) => f.id === apprenant?.formationId);
  const centre = centres?.find((c) => c.id === apprenant?.centreId);
  const session = sessions?.find((s) => s.id === apprenant?.sessionId);

  const montantPaye = (versements ?? [])
    .filter((v) => v.statut === "VALIDE")
    .reduce((total, v) => total + v.montant, 0);
  const soldeRestant = apprenant ? apprenant.montantContrat - montantPaye : 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-brand-gray p-8 text-center text-base">
          Chargement...
        </p>
      </div>
    );
  }

  if (isError || !apprenant) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="p-10 text-center">
          <p className="text-brand-anthracite text-lg font-bold">
            Apprenant introuvable
          </p>
          <Link
            href="/apprenants"
            className="text-brand-orange mt-3 inline-block text-sm font-bold"
          >
            Retour à la liste
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link
          href="/apprenants"
          className="text-brand-gray hover:text-brand-anthracite mb-4 inline-flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-brand-anthracite text-3xl font-bold">
              {apprenant.prenom} {apprenant.nom}
            </h1>
            <p className="text-brand-gray mt-1 text-sm">
              {formation?.nom ?? "—"} · {centre?.nom ?? "—"}
              {session ? ` · Session ${session.annee}` : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <Card className="px-4 py-2.5 text-right">
              <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Contrat
              </p>
              <p className="text-brand-anthracite text-base font-bold">
                {FCFA.format(apprenant.montantContrat)} FCFA
              </p>
            </Card>
            <Card className="px-4 py-2.5 text-right">
              <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Reste à payer
              </p>
              <p
                className={`text-base font-bold ${
                  soldeRestant > 0 ? "text-brand-orange" : "text-green-800"
                }`}
              >
                {FCFA.format(Math.max(soldeRestant, 0))} FCFA
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-brand-gray/20 flex gap-8 overflow-x-auto border-b">
        <OngletBouton
          actif={onglet === "informations"}
          onClick={() => setOnglet("informations")}
          icone={<Info size={18} />}
          libelle="Informations"
        />
        <OngletBouton
          actif={onglet === "contrat"}
          onClick={() => setOnglet("contrat")}
          icone={<Wallet size={18} />}
          libelle="Contrat & Paiements"
        />
        <OngletBouton
          actif={onglet === "dossier"}
          onClick={() => setOnglet("dossier")}
          icone={<FolderKanban size={18} />}
          libelle="Dossier Administratif"
        />
        <OngletBouton
          actif={onglet === "presence"}
          onClick={() => setOnglet("presence")}
          icone={<CalendarCheck size={18} />}
          libelle="Présence"
        />
      </div>

      {onglet === "informations" && (
        <InformationsTab
          apprenant={apprenant}
          nomFormation={formation?.nom}
          nomCentre={centre?.nom}
        />
      )}

      {onglet === "contrat" && (
        <ContratEtPaiementsTab
          apprenant={apprenant}
          versements={versements}
          montantPaye={montantPaye}
          soldeRestant={soldeRestant}
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
      className={`flex items-center gap-2 border-b-2 pb-3 text-base font-bold whitespace-nowrap ${
        actif
          ? "border-brand-orange text-brand-orange"
          : "text-brand-gray border-transparent"
      }`}
    >
      {icone}
      {libelle}
    </button>
  );
}
