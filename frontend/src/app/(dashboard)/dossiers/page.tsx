import { auth } from "@/auth";
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
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé aux Superviseurs de dossiers, Chargés de dossiers et Chefs de Centre.
      </main>
    );
  }

  return <DossiersView />;
}
