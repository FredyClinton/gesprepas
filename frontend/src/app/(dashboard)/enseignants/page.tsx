import { auth } from "@/auth";
import { EnseignantsListView } from "./EnseignantsListView";

export default async function EnseignantsPage() {
  const session = await auth();
  const utilisateur = session!.user;

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
    <EnseignantsListView
      role={utilisateur.role}
      departementIdCDD={
        utilisateur.role === "CHEF_DEPARTEMENT"
          ? utilisateur.departementId
          : null
      }
      centreIdCC={
        utilisateur.role === "CHEF_CENTRE" ? utilisateur.centreId : null
      }
    />
  );
}
