import { auth } from "@/auth";
import { ApprenantDetailView } from "./ApprenantDetailView";

export default async function ApprenantDetailPage({
  params,
}: {
  params: Promise<{ apprenantId: string }>;
}) {
  const session = await auth();
  const utilisateur = session!.user;
  const { apprenantId } = await params;

  if (utilisateur.role !== "CHEF_CENTRE") {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé aux Chefs de Centre.
      </main>
    );
  }

  return <ApprenantDetailView apprenantId={apprenantId} />;
}
