import { auth } from "@/auth";
import { DossierDetailView } from "./DossierDetailView";

const ROLES_AUTORISES = [
  "CHEF_CENTRE",
  "DIRECTEUR",
  "DIRECTEUR_ACADEMIQUE",
  "SUPERVISEUR_DOSSIERS",
  "CHARGE_DOSSIER",
];

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ dossierId: string }>;
}) {
  const session = await auth();
  const utilisateur = session?.user;
  const { dossierId } = await params;

  if (!utilisateur || !ROLES_AUTORISES.includes(utilisateur.role)) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Accès non autorisé à la gestion de ce dossier administratif.
      </main>
    );
  }

  return <DossierDetailView dossierId={dossierId} />;
}
