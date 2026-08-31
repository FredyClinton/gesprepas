import { Card } from "@/shared/ui";
import type { Apprenant } from "@/modules/apprenants";
import {
  useMotifs,
  type Entree,
  type StatutMouvement,
} from "@/modules/financier";

import { BadgeDemo } from "./BadgeDemo";
import { MOCK_VERSEMENTS, modeVersementMock } from "./mocks";

const FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_VERSEMENT: Record<StatutMouvement, string> = {
  VALIDE: "Validé",
  EN_ATTENTE: "En attente",
  REJETE: "Rejeté",
};

const CLASSES_STATUT_VERSEMENT: Record<StatutMouvement, string> = {
  VALIDE: "bg-green-100 text-green-800",
  EN_ATTENTE: "bg-brand-orange/10 text-brand-orange",
  REJETE: "bg-red-100 text-red-800",
};

type LigneVersement = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  mode: string;
  statut: StatutMouvement;
};

export function ContratEtPaiementsTab({
  apprenant,
  versements,
  montantPaye,
  soldeRestant,
}: {
  apprenant: Apprenant;
  versements: Entree[] | undefined;
  montantPaye: number;
  soldeRestant: number;
}) {
  const { data: motifs } = useMotifs("ENTREE");

  // MOCK — pas encore de versement réel pour cet apprenant (base de dev vide).
  // On affiche l'état final attendu du tableau avec des données fictives, voir
  // MOCK_VERSEMENTS dans mocks.ts, plutôt qu'un tableau vide.
  const estMock = versements !== undefined && versements.length === 0;

  const lignes: LigneVersement[] = estMock
    ? MOCK_VERSEMENTS
    : (versements ?? []).map((v) => ({
        id: v.id,
        date: v.date,
        libelle: motifs?.find((m) => m.id === v.motifId)?.nom ?? "—",
        montant: v.montant,
        mode: modeVersementMock(v.id),
        statut: v.statut,
      }));

  const lignesTriees = [...lignes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const montantPayeAffiche = estMock
    ? MOCK_VERSEMENTS.filter((v) => v.statut === "VALIDE").reduce(
        (total, v) => total + v.montant,
        0,
      )
    : montantPaye;
  const soldeRestantAffiche = estMock
    ? apprenant.montantContrat - montantPayeAffiche
    : soldeRestant;

  return (
    <div className="space-y-6">
      {estMock && (
        <div className="bg-brand-orange/5 border-brand-orange/20 rounded-md border p-3 text-sm">
          <span className="text-brand-orange font-bold">
            Aperçu de démonstration
          </span>
          <span className="text-brand-gray">
            {" "}
            — cet apprenant n&rsquo;a pas encore de versement réel. Les données
            ci-dessous sont fictives, à titre d&rsquo;illustration.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
            Total contrat
          </p>
          <p className="text-brand-anthracite mt-1 text-xl font-bold">
            {FCFA.format(apprenant.montantContrat)} FCFA
          </p>
          <p className="text-brand-gray mt-1 text-xs">
            Défini le{" "}
            {new Date(apprenant.dateDefinitionContrat).toLocaleDateString(
              "fr-FR",
            )}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
            Montant payé
            {estMock && <BadgeDemo />}
          </p>
          <p className="mt-1 text-xl font-bold text-green-800">
            {FCFA.format(montantPayeAffiche)} FCFA
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
            Reste à payer
            {estMock && <BadgeDemo />}
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              soldeRestantAffiche > 0 ? "text-brand-orange" : "text-green-800"
            }`}
          >
            {FCFA.format(Math.max(soldeRestantAffiche, 0))} FCFA
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-brand-gray/20 border-b p-5">
          <h2 className="text-brand-anthracite text-lg font-bold">
            Historique des versements
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-anthracite text-brand-white">
              <tr>
                {["Date", "Libellé", "Montant", "Mode", "Statut"].map(
                  (titre) => (
                    <th
                      key={titre}
                      className="p-4 text-xs font-bold tracking-wide uppercase"
                    >
                      {titre}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-brand-gray/10 divide-y">
              {versements === undefined && (
                <tr>
                  <td colSpan={5} className="text-brand-gray p-5 text-center">
                    Chargement...
                  </td>
                </tr>
              )}
              {lignesTriees.map((v) => (
                <tr key={v.id}>
                  <td className="text-brand-gray p-4">
                    {new Date(v.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="text-brand-anthracite p-4 font-bold">
                    {v.libelle}
                  </td>
                  <td className="text-brand-anthracite p-4 font-bold">
                    {FCFA.format(v.montant)} FCFA
                  </td>
                  <td className="text-brand-gray p-4">
                    {/* MOCK — Entree n'a pas de champ "mode" côté backend. */}
                    {v.mode}
                    <BadgeDemo />
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${CLASSES_STATUT_VERSEMENT[v.statut]}`}
                    >
                      {LABELS_STATUT_VERSEMENT[v.statut]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
