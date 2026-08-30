import { auth } from "@/auth";
import { CentresListView } from "./CentresListView";

export default async function CentresPage() {
  const session = await auth();
  const utilisateur = session!.user;

  if (
    utilisateur.role !== "DIRECTEUR" &&
    utilisateur.role !== "DIRECTEUR_ACADEMIQUE"
  ) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé au Directeur et au Directeur Académique.
      </main>
    );
  }

  return <CentresListView />;
}
