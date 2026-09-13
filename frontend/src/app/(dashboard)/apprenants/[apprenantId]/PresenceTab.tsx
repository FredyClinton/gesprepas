import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

import { Button, Card } from "@/shared/ui";

import {
  MOCK_PRESENCE,
  type StatutJustification,
  type TypeSeance,
} from "./mocks";

const LABELS_TYPE: Record<TypeSeance, string> = {
  PRESENT: "Présent",
  ABSENCE: "Absence",
  RETARD: "Retard",
};

const CLASSES_TYPE: Record<TypeSeance, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENCE: "bg-red-100 text-red-800",
  RETARD: "bg-brand-orange/10 text-brand-orange",
};

const LABELS_JUSTIFICATION: Record<StatutJustification, string> = {
  NON_JUSTIFIE: "Non justifié",
  ACCEPTEE: "Acceptée",
  EN_ATTENTE: "En attente",
};

const CLASSES_JUSTIFICATION: Record<StatutJustification, string> = {
  NON_JUSTIFIE: "text-red-600",
  ACCEPTEE: "text-green-800",
  EN_ATTENTE: "text-brand-orange",
};

const ICONES_JUSTIFICATION: Record<StatutJustification, typeof AlertCircle> = {
  NON_JUSTIFIE: AlertCircle,
  ACCEPTEE: CheckCircle2,
  EN_ATTENTE: Clock3,
};

// MOCK - l'onglet Présence reprend la maquette produit à l'identique, mais aucun
// module "présence/absences/retards" n'existe côté backend aujourd'hui (pas de
// modèle, pas d'endpoint). Toutes les données ci-dessous viennent de mocks.ts ;
// remplacer ce composant par de vrais hooks dès qu'un module présence existera.
export function PresenceTab() {
  const {
    tauxPresence,
    seancesSuivies,
    seancesTotal,
    presences,
    absences,
    retards,
    historique,
  } = MOCK_PRESENCE;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-3 p-6 text-center bg-white border border-slate-200">
          <p className="text-slate-500 text-xs font-bold tracking-wide uppercase">
            Taux de présence globale
          </p>
          <JaugeCirculaire pourcentage={tauxPresence} />
          <p className="text-brand-gray text-xs">
            {seancesSuivies} séances suivies sur {seancesTotal}
          </p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-brand-anthracite text-lg font-bold">
              Récapitulatif
            </h2>
            <Button type="button" disabled title="Bientôt disponible">
              Justifier une absence
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="bg-brand-gray/5 rounded-md p-4">
              <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Présences
              </p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {String(presences).padStart(2, "0")}
              </p>
            </div>
            <div className="bg-brand-gray/5 rounded-md p-4">
              <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Absences
              </p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {String(absences).padStart(2, "0")}
              </p>
            </div>
            <div className="bg-brand-gray/5 rounded-md p-4">
              <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Retards
              </p>
              <p className="text-brand-orange mt-1 text-2xl font-bold">
                {String(retards).padStart(2, "0")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-brand-gray/20 flex items-center justify-between border-b p-5">
          <h2 className="text-brand-anthracite text-lg font-bold">
            Historique de présence
          </h2>
          <span className="text-brand-gray text-xs font-bold uppercase">
            Derniers 30 jours
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-700">
              <tr>
                {["Date", "Séance", "Type", "Justification"].map((titre) => (
                  <th
                    key={titre}
                    className="p-3.5 text-xs font-bold tracking-wider uppercase"
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historique.map((ligne, index) => {
                const IconeJustification = ligne.justification
                  ? ICONES_JUSTIFICATION[ligne.justification]
                  : null;
                return (
                  <tr
                    key={index}
                    className="hover:bg-amber-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0"
                  >
                    <td className="text-brand-gray p-4">
                      {new Date(ligne.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="text-brand-anthracite p-4 font-bold">
                      {ligne.seance}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${CLASSES_TYPE[ligne.type]}`}
                      >
                        {LABELS_TYPE[ligne.type]}
                      </span>
                    </td>
                    <td className="p-4">
                      {ligne.justification && IconeJustification ? (
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-bold ${CLASSES_JUSTIFICATION[ligne.justification]}`}
                        >
                          <IconeJustification size={14} />
                          {LABELS_JUSTIFICATION[ligne.justification]}
                        </span>
                      ) : (
                        <span className="text-brand-gray/50 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function JaugeCirculaire({ pourcentage }: { pourcentage: number }) {
  return (
    <div
      className="relative flex h-32 w-32 items-center justify-center rounded-full"
      style={{
        // color-mix() dérive la piste grise depuis le token --color-brand-gray
        // (charte graphique) au lieu d'une couleur en dur - le raccourci
        // Tailwind `var(--x)/15` n'est pas du CSS valide en style inline.
        background: `conic-gradient(var(--color-brand-orange) ${pourcentage * 3.6}deg, color-mix(in srgb, var(--color-brand-gray) 15%, white) 0deg)`,
      }}
    >
      <div className="bg-brand-white flex h-24 w-24 flex-col items-center justify-center rounded-full">
        <span className="text-brand-anthracite text-2xl font-bold">
          {pourcentage}%
        </span>
      </div>
    </div>
  );
}
