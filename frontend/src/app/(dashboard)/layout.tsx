import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCentre } from "@/modules/centres-sessions";
import { Sidebar, TopBar } from "@/shared/layout";
import { CENTRE_SCOPE_ROLES } from "@/types/roles";

// Coquille de l'espace connecté. Deuxième couche de protection, EN PLUS du proxy
// (étape 5) : Server Component, donc `auth()` s'exécute côté serveur, avant tout
// rendu. Le proxy protège déjà cette route ; ce layout revérifie indépendamment —
// recommandation actuelle de Next.js 16/Auth.js ("ne pas reposer uniquement sur le
// proxy pour la sécurité", voir étape 5).
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Le centre ne s'affiche que pour les rôles réellement centre-scope
  // (CENTRE_SCOPE_ROLES) — pas juste "si centreId existe en base". Un Directeur
  // Académique de test qui aurait un centreId renseigné par erreur ne doit pas
  // afficher de centre : c'est le rôle qui décide, pas la donnée.
  const centre =
    session.user.centreId && CENTRE_SCOPE_ROLES.has(session.user.role)
      ? await getCentre(session.user.centreId)
      : null;

  return (
    // h-screen + overflow-hidden sur toute la coquille : Sidebar et TopBar sont
    // fixed (hors flux), donc c'est `main` — pas le document — qui scrolle
    // désormais. Ça permet à un écran donné (ex. liste des enseignants) de
    // remplir exactement la hauteur dispo et de gérer lui-même son propre
    // scroll interne (ex. juste le tableau) plutôt que de scroller la page.
    <div className="h-screen overflow-hidden">
      <Sidebar role={session.user.role} />
      <div className="flex h-screen flex-col md:ml-64">
        <TopBar role={session.user.role} centreName={centre?.nom} />
        {/* pt-24/md:pt-28 compensent le TopBar fixed (h-20 = 80px) — même espace
            visuel qu'avant (header en flux + p-4/p-8) sans que le contenu ne
            parte sous la barre fixe. */}
        <main className="bg-brand-gray/[0.03] flex-1 overflow-y-auto px-4 pt-24 pb-4 md:px-8 md:pt-28 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
