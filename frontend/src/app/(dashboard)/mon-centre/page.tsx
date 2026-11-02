import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { CentreDetailView } from "../centres/[centreId]/CentreDetailView";

// Réservé au Chef de Centre - remplace les anciens écrans séparés Formations/Salles
// par la même vue que la fiche centre du Directeur Académique, sur son propre centre.
export default async function MonCentrePage() {
  const session = await auth();
  const utilisateur = session!.user;

  if (utilisateur.role !== "CHEF_CENTRE" || !utilisateur.centreId) {
    return (
      <AccessRestricted
        title="Accès Chef de Centre"
        message="Cet écran est réservé aux Chefs de Centre rattachés à une implantation locale."
      />
    );
  }

  return (
    <CentreDetailView
      centreId={utilisateur.centreId}
      peutGererAcademique={false}
      peutRelocaliser={false}
      masquerRetour
    />
  );
}
