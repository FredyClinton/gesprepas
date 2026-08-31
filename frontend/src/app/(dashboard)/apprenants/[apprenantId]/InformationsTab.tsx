import { Card } from "@/shared/ui";
import type { Apprenant } from "@/modules/apprenants";

import { BadgeDemo } from "./BadgeDemo";
import { MOCK_COORDONNEES, MOCK_TUTEUR } from "./mocks";

function calculerAge(dateNaissance: string): number {
  const naissance = new Date(dateNaissance);
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const pasEncoreAnniversaire =
    aujourdhui.getMonth() < naissance.getMonth() ||
    (aujourdhui.getMonth() === naissance.getMonth() &&
      aujourdhui.getDate() < naissance.getDate());
  if (pasEncoreAnniversaire) age -= 1;
  return age;
}

function Champ({
  label,
  valeur,
  mock = false,
}: {
  label: string;
  valeur: string;
  // Valeur venant de mocks.ts, pas de l'API — voir BadgeDemo.
  mock?: boolean;
}) {
  return (
    <div>
      <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
        {label}
        {mock && <BadgeDemo />}
      </p>
      <p className="text-brand-anthracite text-base font-bold">{valeur}</p>
    </div>
  );
}

export function InformationsTab({
  apprenant,
  nomFormation,
  nomCentre,
}: {
  apprenant: Apprenant;
  nomFormation: string | undefined;
  nomCentre: string | undefined;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-brand-anthracite text-lg font-bold">
          Données personnelles
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Champ label="Nom" valeur={apprenant.nom} />
          <Champ label="Prénom" valeur={apprenant.prenom} />
          <Champ
            label="Date de naissance"
            valeur={`${new Date(apprenant.dateNaissance).toLocaleDateString("fr-FR")} (${calculerAge(apprenant.dateNaissance)} ans)`}
          />
          <Champ
            label="Date d'inscription"
            valeur={new Date(apprenant.dateInscription).toLocaleDateString(
              "fr-FR",
            )}
          />
          <Champ label="Centre" valeur={nomCentre ?? "—"} />
          <Champ label="Filière / Formation" valeur={nomFormation ?? "—"} />
          {/* MOCK — pas de colonne correspondante sur Apprenant côté backend.
              Remplacer par les vrais champs dès qu'ils existeront dans
              ApprenantResponse (voir mocks.ts). */}
          <Champ label="Email" valeur={MOCK_COORDONNEES.email} mock />
          <Champ label="Téléphone" valeur={MOCK_COORDONNEES.telephone} mock />
          <Champ
            label="Adresse de résidence"
            valeur={MOCK_COORDONNEES.adresseResidence}
            mock
          />
          <Champ
            label="Lieu de naissance"
            valeur={MOCK_COORDONNEES.lieuNaissance}
            mock
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-brand-anthracite text-lg font-bold">
          Tuteur / Urgence
        </h2>
        <div className="mt-4 space-y-5">
          {/* MOCK — aucun concept de tuteur/contact d'urgence côté backend
              aujourd'hui. Voir mocks.ts. */}
          <Champ label="Nom du tuteur" valeur={MOCK_TUTEUR.nom} mock />
          <Champ label="Contact du tuteur" valeur={MOCK_TUTEUR.contact} mock />
          <Champ label="Profession" valeur={MOCK_TUTEUR.profession} mock />
        </div>
      </Card>
    </div>
  );
}
