import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { ApprenantsListView } from "./ApprenantsListView";
import { ApprenantsSuperviseurContainer } from "./ApprenantsSuperviseurContainer";

export default async function ApprenantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ recherche?: string; q?: string }>;
}) {
  const session = await auth();
  const utilisateur = session!.user;
  const sp = searchParams ? await searchParams : undefined;
  const initialRecherche = sp?.recherche || sp?.q || "";

  const rolesAutorises = [
    "CHEF_CENTRE",
    "CAISSIER",
    "DIRECTEUR",
    "DIRECTEUR_ACADEMIQUE",
    "ADMIN",
  ];

  if (!rolesAutorises.includes(utilisateur.role)) {
    return (
      <AccessRestricted
        title="Accès réservé"
        message="Cet écran est réservé au personnel rattaché à un centre (Caissiers, Chefs de Centre) et à la Direction Générale."
      />
    );
  }

  // Si l'utilisateur est directement rattaché à un centre
  if (utilisateur.centreId) {
    return (
      <ApprenantsListView
        centreId={utilisateur.centreId}
        userRole={utilisateur.role}
        initialRecherche={initialRecherche}
      />
    );
  }

  // Utilisateur de niveau Direction / Siège sans centreId fixe : sélecteur de centre
  return (
    <ApprenantsSuperviseurContainer
      userRole={utilisateur.role}
      initialRecherche={initialRecherche}
    />
  );
}