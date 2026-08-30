"use client";

import {
  LayoutGrid,
  Users,
  TrendingUp,
  AlertTriangle,
  Wallet,
  FileText,
  ChevronDown,
  Download,
} from "lucide-react";

import { Button, Card } from "@/shared/ui";
import { useApprenants } from "@/modules/apprenants";
import { useCentres } from "@/modules/centres-sessions";
import Link from "next/link";
// manque côté API (taux de recouvrement, dossiers, soldes financiers consolidés).
const PLACEHOLDER = "—";

export function DirecteurDashboard() {
  const { data: apprenants, isLoading: chargementApprenants } = useApprenants();
  const { data: centres, isLoading: chargementCentres } = useCentres();

  const centresActifs = centres?.filter((c) => c.statut === "OUVERT").length;

  // Effectif par centre : seule colonne du tableau comparatif calculable aujourd'hui
  const effectifParCentre = (centreId: string) =>
    apprenants?.filter((a) => a.centreId === centreId).length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête de page : spécifique à cet écran, pas dans le TopBar partagé */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-brand-anthracite text-4xl font-bold">
            Vision Globale
          </h1>
          <p className="text-brand-gray mt-1.5 text-base">
            Aperçu consolidé des performances du réseau EXCELIS PRÉPAS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sélecteur de session — visuel uniquement, pas de module sessions
              construit encore, rien à sélectionner pour de vrai pour l'instant */}
          <button
            type="button"
            className="border-brand-gray/20 text-brand-anthracite flex items-center gap-2 rounded-md border bg-white px-4 py-2.5 text-sm font-bold"
          >
            Session 2023-2024
            <ChevronDown size={16} />
          </button>
          {/* Export — visuel uniquement, aucune logique d'export n'existe encore */}
          <Button>
            <Download size={18} />
            Exporter le rapport
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Centres actifs"
          value={chargementCentres ? "…" : (centresActifs ?? PLACEHOLDER)}
          icon={LayoutGrid}
        />
        <KpiCard
          label="Effectif total"
          value={
            chargementApprenants ? "…" : (apprenants?.length ?? PLACEHOLDER)
          }
          icon={Users}
        />
        <KpiCard
          label="Taux de recouvrement"
          value={PLACEHOLDER}
          icon={TrendingUp}
          note="Endpoint agrégé à construire"
        />
        <KpiCard
          label="Dossiers"
          value={PLACEHOLDER}
          icon={AlertTriangle}
          tone="danger"
          note="Endpoint agrégé à construire"
        />
        <KpiCard
          label="Solde consolidé"
          value={PLACEHOLDER}
          icon={Wallet}
          note="Endpoint agrégé à construire"
        />
        <KpiCard
          label="Reste des contrats"
          value={PLACEHOLDER}
          icon={FileText}
          note="Endpoint agrégé à construire"
        />
      </div>

      {/* Tableau comparatif */}
      <Card className="overflow-hidden">
        <div className="border-brand-gray/20 flex items-center justify-between border-b p-5">
          <h2 className="text-brand-anthracite text-lg font-bold">
            Tableau comparatif des centres
          </h2>
          <Link href="/centres" className="text-brand-orange text-sm font-bold">
            Voir tout
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-anthracite text-brand-white">
              <tr>
                {[
                  "Centre",
                  "Chef de centre",
                  "Effectif du centre",
                  "Chiffre d'affaire",
                  "Taux de recouvrement",
                  "Dossiers reçus",
                  "Livrets vendus",
                  "Livrets reçus",
                ].map((titre) => (
                  <th
                    key={titre}
                    className="p-4 text-xs font-bold tracking-wide uppercase"
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-brand-gray/10 divide-y">
              {chargementCentres && (
                <tr>
                  <td colSpan={8} className="text-brand-gray p-5 text-center">
                    Chargement...
                  </td>
                </tr>
              )}
              {centres?.map((centre) => (
                <tr key={centre.id}>
                  <td className="text-brand-anthracite p-4 font-bold">
                    {centre.nom}
                  </td>
                  <td className="text-brand-gray p-4 text-sm">{PLACEHOLDER}</td>
                  <td className="text-brand-gray p-4 text-sm">{PLACEHOLDER}</td>
                  <td className="text-brand-gray p-4 text-sm">{PLACEHOLDER}</td>
                  <td className="text-brand-gray p-4 text-sm">{PLACEHOLDER}</td>
                  <td className="text-brand-gray p-4 text-sm">{PLACEHOLDER}</td>
                  <td className="text-brand-anthracite p-4 font-bold">
                    {chargementApprenants ? "…" : effectifParCentre(centre.id)}
                  </td>
                  <td className="text-brand-gray p-4 text-sm">{PLACEHOLDER}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: typeof LayoutGrid;
  tone?: "default" | "danger";
  note?: string;
};

// Colocalisé : seul DirecteurDashboard s'en sert pour l'instant. À promouvoir vers
// shared/ui/ le jour où un deuxième tableau de bord de rôle en a besoin aussi.
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  note,
}: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-2.5 p-5">
      <div className="flex items-start justify-between">
        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
          {label}
        </span>
        <div
          className={`rounded-lg p-2 ${
            tone === "danger"
              ? "bg-red-50 text-red-600"
              : "bg-brand-orange/10 text-brand-orange"
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
      <div
        className={`text-3xl font-bold ${
          tone === "danger" ? "text-red-600" : "text-brand-anthracite"
        }`}
      >
        {value}
      </div>
      {note && <p className="text-brand-gray/70 text-xs">{note}</p>}
    </Card>
  );
}
