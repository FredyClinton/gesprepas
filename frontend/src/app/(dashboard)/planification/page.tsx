import { auth } from "@/auth";
import { PlanificationView } from "./PlanificationView";

// Écran partagé : Directeur Académique construit le planning et peut assigner sur
// tous les centres/matières ; Chef de Département assigne uniquement sur son propre
// département (une seule matière, voir modules/departement) ; Chef de Centre ne fait
// que marquer les séances de son propre centre comme effectuées, une fois un
// enseignant assigné (les autres centres restent visibles mais désactivés). Les
// autres rôles ont aussi ce lien de nav (shared/layout/nav-items.ts) mais n'ont pas
// de workflow confirmé ici — vue en lecture seule pour eux, pas de contenu inventé.
export default async function PlanificationPage() {
  const session = await auth();
  const utilisateur = session!.user;

  switch (utilisateur.role) {
    case "DIRECTEUR_ACADEMIQUE":
      return (
        <PlanificationView role="DIRECTEUR_ACADEMIQUE" departementId={null} />
      );
    case "CHEF_DEPARTEMENT":
      return (
        <PlanificationView
          role="CHEF_DEPARTEMENT"
          departementId={utilisateur.departementId}
        />
      );
    case "CHEF_CENTRE":
      return (
        <PlanificationView
          role="CHEF_CENTRE"
          departementId={null}
          centreId={utilisateur.centreId}
        />
      );
    default:
      return (
        <PlanificationView
          role={utilisateur.role}
          departementId={null}
          readOnly
        />
      );
  }
}
