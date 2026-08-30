import { auth } from "@/auth";
import { CentreDetailView } from "../centres/[centreId]/CentreDetailView";

// Réservé au Chef de Centre — remplace les anciens écrans séparés Formations/Salles
// par la même vue que la fiche centre du Directeur Académique, sur son propre centre.
export default async function MonCentrePage() {
  const session = await auth();
  const utilisateur = session!.user;

  if (utilisateur.role !== "CHEF_CENTRE" || !utilisateur.centreId) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé aux Chefs de Centre.
      </main>
    );
  }

  return (
    <CentreDetailView
      centreId={utilisateur.centreId}
      peutGererAcademique
      peutRelocaliser
      masquerRetour
    />
  );
}
