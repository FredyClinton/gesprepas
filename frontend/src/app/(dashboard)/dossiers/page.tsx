import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { DossiersView } from "./DossiersView";

const ROLES_AUTORISES = new Set([
  "DIRECTEUR",
  "DIRECTEUR_ACADEMIQUE",
  "SUPERVISEUR_DOSSIERS",
  "CHARGE_DOSSIER",
  "CHEF_CENTRE",
]);

export default async function DossiersPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (!role || !ROLES_AUTORISES.has(role)) {
    return (
      <AccessRestricted
        title="Accès Dossiers Concours"
        message="Cet écran est réservé aux Superviseurs de dossiers, Chargés de dossiers et Chefs de Centre."
      />
    );
  }

  return <DossiersView />;
}
