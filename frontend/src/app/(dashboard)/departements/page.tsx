import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
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
      <AccessRestricted
        title="Accès Direction"
        message="Cet écran est réservé au Directeur et au Directeur Académique."
      />
    );
  }

  return <DepartementsListView />;
}

