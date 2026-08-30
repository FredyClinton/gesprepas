import { auth } from "@/auth";
import { CentreDetailView } from "./CentreDetailView";

export default async function CentreDetailPage({
  params,
}: {
  params: Promise<{ centreId: string }>;
}) {
  const session = await auth();
  const utilisateur = session!.user;
  const { centreId } = await params;

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

  return (
    <CentreDetailView
      centreId={centreId}
      // Seul le Directeur Académique gère les formations/salles (voir consigne du
      // 29/08/2026) ; le Directeur voit la fiche du centre sans ces sections pour
      // l'instant — création/gestion du centre lui-même pas encore construite ici.
      peutGererAcademique={utilisateur.role === "DIRECTEUR_ACADEMIQUE"}
      // Relocaliser le centre : réservé au Directeur et au Chef de Centre, pas
      // au Directeur Académique.
      peutRelocaliser={utilisateur.role === "DIRECTEUR"}
      // Fermer/rouvrir le centre : réservé au Directeur seul.
      peutFermerCentre={utilisateur.role === "DIRECTEUR"}
      // Rejoindre une session : Directeur et Directeur Académique, pas le Chef de
      // Centre — cette page n'est de toute façon accessible qu'à ces deux rôles.
      peutRejoindreSession
    />
  );
}
