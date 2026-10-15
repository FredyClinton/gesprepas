import { auth } from "@/auth";
import { ApprenantDetailView } from "./ApprenantDetailView";

const ROLES_AUTORISES = [
  "CHEF_CENTRE",
  "DIRECTEUR",
  "DIRECTEUR_ACADEMIQUE",
  "SUPERVISEUR_DOSSIERS",
  "CHARGE_DOSSIER",
];

export default async function ApprenantDetailPage({
  params,
}: {
  params: Promise<{ apprenantId: string }>;
}) {
  const session = await auth();
  const utilisateur = session!.user;
  const { apprenantId } = await params;

  if (!ROLES_AUTORISES.includes(utilisateur.role)) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Accès non autorisé à la fiche de cet apprenant.
      </main>
    );
  }

  return <ApprenantDetailView apprenantId={apprenantId} />;
}
