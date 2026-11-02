"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useCentres } from "@/modules/centres-sessions";
import { Card, Button, Skeleton } from "@/shared/ui";
import { ApprenantsListView } from "./ApprenantsListView";

interface ApprenantsSuperviseurContainerProps {
  userRole: string;
  initialRecherche?: string;
}

export function ApprenantsSuperviseurContainer({
  userRole,
  initialRecherche,
}: ApprenantsSuperviseurContainerProps) {
  const { data: centres = [], isLoading } = useCentres();
  const [centreSelectionneId, setCentreSelectionneId] = useState<string>("");

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (centres.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto my-12">
        <Card className="p-8 text-center bg-white border border-slate-200 shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 text-brand-orange flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <h2 className="text-lg font-bold text-brand-anthracite mb-2">
            Aucun centre disponible
          </h2>
          <p className="text-sm text-brand-gray mb-6">
            Aucun centre de préparation n&apos;est actuellement configuré pour afficher la liste des apprenants.
          </p>
          <Link href="/centres">
            <Button variant="primary">Configurer les centres</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const centreActifId = centreSelectionneId || centres[0]?.id;

  return (
    <div className="space-y-4">
      {/* Sélecteur de centre institutionnel pour les profils Direction / Superviseur */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Supervision Réseau
            </span>
            <p className="text-xs font-semibold text-brand-anthracite">
              Consultation des effectifs apprenants par centre
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="select-centre-superviseur" className="text-xs font-semibold text-slate-600">
            Centre actif :
          </label>
          <select
            id="select-centre-superviseur"
            value={centreActifId}
            onChange={(e) => setCentreSelectionneId(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-brand-anthracite outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.villeActuelle ? `(${c.villeActuelle})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vue de la liste des apprenants pour le centre sélectionné */}
      {centreActifId && (
        <ApprenantsListView
          key={centreActifId}
          centreId={centreActifId}
          userRole={userRole}
          initialRecherche={initialRecherche}
        />
      )}
    </div>
  );
}
