"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { Card } from "@/shared/ui";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";

export function CentresListView() {
  const { data: centres, isLoading } = useCentres();
  const { data: sessionActive } = useSessionActive();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-brand-anthracite text-4xl font-bold">Centres</h1>
        <p className="text-brand-gray mt-1.5 text-base">
          Choisissez un centre pour voir sa fiche.
        </p>
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-brand-gray/10 divide-y">
          {isLoading && (
            <li className="text-brand-gray p-5 text-center text-sm">
              Chargement...
            </li>
          )}
          {!isLoading && centres?.length === 0 && (
            <li className="text-brand-gray p-5 text-center text-sm">
              Aucun centre pour l&rsquo;instant.
            </li>
          )}
          {centres?.map((centre) => {
            const rejointSessionActive = sessionActive
              ? centre.sessionIds.includes(sessionActive.id)
              : false;
            return (
              <li key={centre.id}>
                <Link
                  href={`/centres/${centre.id}`}
                  className="hover:bg-brand-gray/5 flex items-center justify-between p-5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-orange/10 text-brand-orange rounded-lg p-2">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-brand-anthracite text-base font-bold">
                        {centre.nom}
                      </p>
                      <p className="text-brand-gray text-sm">
                        {centre.villeActuelle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      rejointSessionActive
                        ? "bg-brand-blue/10 text-brand-blue"
                        : "bg-brand-gray/10 text-brand-gray"
                    }`}
                  >
                    {rejointSessionActive
                      ? "Session active"
                      : "Hors session active"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
