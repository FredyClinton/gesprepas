import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DirecteurDashboard } from "./_dashboards/directeur";
import { ChefCentreDashboard } from "./_dashboards/chef-centre";
import { DirecteurAcademiqueDashboard } from "./_dashboards/directeur-academique";
import { ChefDepartementDashboard } from "./_dashboards/chef-departement";
import { CaissierDashboard } from "./_dashboards/caissier";
import { ComptableDashboard } from "./_dashboards/comptable";

// Dispatcher : ne construit rien lui-même, choisit le tableau de bord selon le rôle.
// `session!` est sûr ici - (dashboard)/layout.tsx a déjà redirigé vers /login si
// `session` était `null`, cette page ne s'exécute jamais sans session valide.
export default async function DashboardPage() {
  const session = await auth();
  const utilisateur = session!.user;

  switch (session!.user.role) {
    case "DIRECTEUR":
      return <DirecteurDashboard />;
    case "CHEF_CENTRE":
      return <ChefCentreDashboard centreId={utilisateur.centreId!} />;
    case "CAISSIER":
      return <CaissierDashboard centreId={utilisateur.centreId!} />;
    case "COMPTABLE":
      return <ComptableDashboard />;
    case "DIRECTEUR_ACADEMIQUE":
      return <DirecteurAcademiqueDashboard />;
    case "CHEF_DEPARTEMENT":
      return (
        <ChefDepartementDashboard
          departementId={utilisateur.departementId}
          chefId={utilisateur.id}
        />
      );
    case "CHARGE_DOSSIER":
    case "SUPERVISEUR_DOSSIERS":
      redirect("/dossiers");
    default:
      // Rôles sans maquette confirmée - même logique que la nav par défaut
      // (shared/layout/nav-items.ts) : pas de contenu inventé.
      return (
        <main className="text-brand-gray p-8 text-sm">
          Tableau de bord à venir pour ce rôle.
        </main>
      );
  }
}
