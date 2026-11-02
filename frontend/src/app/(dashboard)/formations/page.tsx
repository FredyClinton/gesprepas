import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { FormationsView } from "./FormationsView";

export default async function FormationsPage() {
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

  return <FormationsView />;
}


