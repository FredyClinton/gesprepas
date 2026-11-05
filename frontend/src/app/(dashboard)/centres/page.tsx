import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { CentresListView } from "./CentresListView";

export default async function CentresPage() {
  const session = await auth();
  const utilisateur = session!.user;

  if (
    utilisateur.role !== "DIRECTEUR" &&
    utilisateur.role !== "DIRECTEUR_ACADEMIQUE" &&
    utilisateur.role !== "COMPTABLE"
  ) {
    return (
      <AccessRestricted
        title="Accès Direction"
        message="Cet écran est réservé au Directeur, au Directeur Académique et au Contrôleur Financier."
      />
    );
  }

  return <CentresListView />;
}

