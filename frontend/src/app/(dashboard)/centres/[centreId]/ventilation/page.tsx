import { auth } from "@/auth";
import { CentreVentilationView } from "./CentreVentilationView";

export default async function CentreVentilationPage({
  params,
  searchParams,
}: {
  params: Promise<{ centreId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const session = await auth();
  const utilisateur = session!.user;
  const { centreId } = await params;
  const { session: sessionIdParam } = await searchParams;

  if (
    utilisateur.role !== "DIRECTEUR" &&
    utilisateur.role !== "DIRECTEUR_ACADEMIQUE" &&
    utilisateur.role !== "COMPTABLE" &&
    !(utilisateur.role === "CHEF_CENTRE" && utilisateur.centreId === centreId)
  ) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran de pilotage et de ventilation est réservé à la direction et aux chefs de centre.
      </main>
    );
  }

  return (
    <CentreVentilationView
      centreId={centreId}
      initialSessionId={sessionIdParam}
    />
  );
}
