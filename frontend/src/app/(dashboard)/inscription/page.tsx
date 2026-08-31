import { auth } from "@/auth";
import { InscriptionApprenantView } from "./InscriptionApprenantView";

export default async function InscriptionPage() {
    const session = await auth();
    const utilisateur = session!.user;

    if (utilisateur.role !== "CHEF_CENTRE" || !utilisateur.centreId) {
        return (
            <main className="text-brand-gray p-8 text-sm">
                Cet écran est réservé aux Chefs de Centre.
            </main>
        );
    }

    return <InscriptionApprenantView centreId={utilisateur.centreId} />;
}