import { auth } from "@/auth";
import { EnseignantDetailView } from "./EnseignantDetailView";

export default async function EnseignantDetailPage({
  params,
}: {
  params: Promise<{ enseignantId: string }>;
}) {
  const session = await auth();
  const utilisateur = session!.user;
  const { enseignantId } = await params;

  if (
    utilisateur.role !== "DIRECTEUR_ACADEMIQUE" &&
    utilisateur.role !== "CHEF_DEPARTEMENT" &&
    utilisateur.role !== "CHEF_CENTRE"
  ) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé au Directeur Académique, au Chef de Département et au
        Chef de Centre.
      </main>
    );
  }

  return (
    <EnseignantDetailView enseignantId={enseignantId} role={utilisateur.role} />
  );
}
