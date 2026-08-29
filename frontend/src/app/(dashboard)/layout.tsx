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
        <div className="min-h-screen">
            <Sidebar role={session.user.role} />
            <div className="flex min-h-screen flex-col md:ml-64">
                <TopBar role={session.user.role} centreName={centre?.nom} />
                <main className="bg-brand-gray/[0.03] flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}