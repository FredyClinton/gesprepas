import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { ProgressionView } from "./ProgressionView";

// Écran dédié au suivi pédagogique (thèmes/contenus dispensés) - Chef de
// Département (son ou ses départements) et Directeur Académique (vue globale
// comparative). Les tableaux de bord respectifs n'affichent plus qu'un résumé
// qui renvoie ici pour le détail, la saisie et l'édition.
export default async function ProgressionPage() {
  const session = await auth();
  const utilisateur = session!.user;

  switch (utilisateur.role) {
    case "CHEF_CENTRE":
      return <ProgressionView role="CHEF_CENTRE" />;
    case "CHEF_DEPARTEMENT":
      return (
        <ProgressionView
          role="CHEF_DEPARTEMENT"
          departementId={utilisateur.departementId}
          chefId={utilisateur.id}
        />
      );
    case "DIRECTEUR_ACADEMIQUE":
      return <ProgressionView role="DIRECTEUR_ACADEMIQUE" />;
    default:
      return (
        <AccessRestricted
          title="Accès Suivi Pédagogique"
          message="Cet écran est réservé au Directeur Académique, aux Chefs de Département et aux Chefs de Centre."
        />
      );
  }
}

