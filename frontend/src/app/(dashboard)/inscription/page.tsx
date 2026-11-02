import { auth } from "@/auth";
import { AccessRestricted } from "@/shared/ui";
import { InscriptionApprenantView } from "./InscriptionApprenantView";

export default async function InscriptionPage() {
    const session = await auth();
    const utilisateur = session!.user;

    const rolesAutorises = ["CAISSIER", "DIRECTEUR", "DIRECTEUR_ACADEMIQUE", "ADMIN"];
    if (!rolesAutorises.includes(utilisateur.role)) {
        return (
            <AccessRestricted
                title="Accès Inscription"
                message="Cet écran est réservé aux Caissiers et à la Direction. Le Chef de Centre dispose d'une vue de consultation sur les apprenants."
                redirectHref="/apprenants"
                redirectLabel="Consulter les apprenants"
            />
        );
    }

    return (
        <InscriptionApprenantView
            centreId={utilisateur.centreId || undefined}
            userRole={utilisateur.role}
        />
    );
}