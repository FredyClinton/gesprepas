import { auth } from "@/auth";
import { EnseignantsListView } from "./EnseignantsListView";

export default async function EnseignantsPage() {
  const session = await auth();
  const utilisateur = session!.user;

  if (
    utilisateur.role !== "DIRECTEUR_ACADEMIQUE" &&
    utilisateur.role !== "CHEF_DEPARTEMENT"
  ) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé au Directeur Académique et au Chef de Département.
      </main>
    );
  }

  return (
    <EnseignantsListView
      role={utilisateur.role}
      departementIdCDD={
        utilisateur.role === "CHEF_DEPARTEMENT"
          ? utilisateur.departementId
          : null
      }
    />
  );
}
