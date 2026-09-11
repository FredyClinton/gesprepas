import { auth } from "@/auth";
import { DepartementsListView } from "./DepartementsListView";

export default async function DepartementsPage() {
  const session = await auth();
  const utilisateur = session?.user;

  if (
    !utilisateur ||
    (utilisateur.role !== "DIRECTEUR" &&
      utilisateur.role !== "DIRECTEUR_ACADEMIQUE")
  ) {
    return (
      <main className="p-8 text-sm text-brand-gray">
        Cet écran est réservé au Directeur et au Directeur Académique.
      </main>
    );
  }

  return <DepartementsListView />;
}
