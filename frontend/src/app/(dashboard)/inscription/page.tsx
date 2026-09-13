import { auth } from "@/auth";
import { InscriptionApprenantView } from "./InscriptionApprenantView";

export default async function InscriptionPage() {
    const session = await auth();
    const utilisateur = session!.user;

    const rolesAutorises = ["CHEF_CENTRE", "DIRECTEUR", "DIRECTEUR_ACADEMIQUE", "ADMIN"];
    if (!rolesAutorises.includes(utilisateur.role)) {
        return (
            <main className="text-slate-500 p-8 text-sm">
                Cet écran est réservé aux Chefs de Centre et à la Direction.
            </main>
        );
    }

    return (
        <InscriptionApprenantView
            centreId={utilisateur.centreId || undefined}
            userRole={utilisateur.role}
        />
    );
}