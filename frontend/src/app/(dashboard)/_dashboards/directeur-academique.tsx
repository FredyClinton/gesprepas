"use client";

import {
  UserRound,
  AlertTriangle,
  ClipboardList,
  Download,
  Building2,
} from "lucide-react";

import { Button, Card } from "@/shared/ui";
import { useEnseignants } from "@/modules/personnel";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";

const PLACEHOLDER = "—";

export function DirecteurAcademiqueDashboard() {
  const { data: enseignants, isLoading: chargementEnseignants } =
    useEnseignants();
  const { data: centres, isLoading: chargementCentres } = useCentres();
  const { data: sessionActive } = useSessionActive();

  const enseignantsActifs = enseignants?.filter(
    (e) => e.statut === "ACTIF",
  ).length;

  const centresActifs = centres?.filter(
    (c) =>
      c.statut === "OUVERT" &&
      sessionActive &&
      c.sessionIds.includes(sessionActive.id),
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-brand-anthracite text-4xl font-bold">
            Vue d&rsquo;ensemble Pédagogique
          </h1>
          <p className="text-brand-gray mt-1.5 text-base">
            Aperçu de l&rsquo;activité pédagogique du réseau
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export — visuel uniquement, comme sur l'écran Directeur */}
          <Button variant="secondary">
            <Download size={18} />
            Exporter Rapport
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-2.5 p-5">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Enseignants actifs
            </span>
            <div className="bg-brand-orange/10 text-brand-orange rounded-lg p-2">
              <UserRound size={18} />
            </div>
          </div>
          <div className="text-brand-anthracite text-4xl font-bold">
            {chargementEnseignants ? "…" : (enseignantsActifs ?? PLACEHOLDER)}
          </div>
        </Card>

        <Card className="flex flex-col gap-2.5 p-5">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Centres actifs
            </span>
            <div className="bg-brand-blue/10 text-brand-blue rounded-lg p-2">
              <Building2 size={18} />
            </div>
          </div>
          <div className="text-brand-anthracite text-4xl font-bold">
            {chargementCentres ? "…" : (centresActifs ?? PLACEHOLDER)}
          </div>
        </Card>

        <Card className="flex flex-col gap-2.5 p-5">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Créneaux non assignés
            </span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">{PLACEHOLDER}</div>
          <p className="text-brand-gray/70 text-xs">
            Endpoint agrégé à construire
          </p>
        </Card>

        <Card className="flex flex-col gap-2.5 p-5">
          <div className="flex items-start justify-between">
            <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
              Nombre de cours
            </span>
            <div className="bg-brand-orange/10 text-brand-orange rounded-lg p-2">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="text-brand-anthracite text-4xl font-bold">
            {PLACEHOLDER}
          </div>
          <p className="text-brand-gray/70 text-xs">
            Aucune date sur les séances enregistrées — pas de filtre
            &laquo;&nbsp;ce mois&nbsp;&raquo; possible aujourd&rsquo;hui
          </p>
        </Card>
      </div>

      {/* Progression pédagogique */}
      <Card className="p-6">
        <h2 className="text-brand-anthracite mb-4 text-lg font-bold">
          Progression Pédagogique par Formation
        </h2>
        <div className="border-brand-gray/20 bg-brand-gray/5 rounded-md border border-dashed p-6 text-center">
          <p className="text-brand-gray text-sm">
            Pas encore calculable : le suivi de progression enregistre les
            séances données (thème, contenu, exercices) mais pas de total de
            séances prévues par matière — impossible d&rsquo;en tirer un
            pourcentage honnête pour l&rsquo;instant.
          </p>
        </div>
      </Card>
    </div>
  );
}
