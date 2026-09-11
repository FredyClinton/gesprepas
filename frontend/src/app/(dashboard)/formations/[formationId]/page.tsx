import { auth } from "@/auth";
import { FormationDetailView } from "./FormationDetailView";

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ formationId: string }>;
}) {
  const session = await auth();
  const utilisateur = session?.user;
  const { formationId } = await params;

  if (
    !utilisateur ||
    (utilisateur.role !== "DIRECTEUR" &&
      utilisateur.role !== "DIRECTEUR_ACADEMIQUE")
  ) {
    return (
      <main className="p-8 text-sm text-brand-gray">
        Cet écran est réservé au Directeur et au Directeur Académique.
      </main>
    );
  }

  return (
    <FormationDetailView
      formationId={formationId}
      peutGererAcademique={utilisateur.role === "DIRECTEUR_ACADEMIQUE"}
    />
  );
}

