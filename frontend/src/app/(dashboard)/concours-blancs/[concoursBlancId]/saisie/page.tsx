import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SaisieNotesPageView } from "./SaisieNotesPageView";

interface Props {
  params: Promise<{ concoursBlancId: string }>;
  searchParams: Promise<{ formationId?: string; centreId?: string }>;
}

export default async function SaisieNotesPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const { concoursBlancId } = await params;
  const { formationId, centreId } = await searchParams;

  // Sécurité : Les chefs de département ne saisissent pas les notes de centre
  if (user.role === "CHEF_DEPARTEMENT") {
    redirect("/concours-blancs");
  }

  return (
    <SaisieNotesPageView
      concoursBlancId={concoursBlancId}
      initialFormationId={formationId}
      initialCentreId={centreId}
      userRole={user.role}
      userCentreId={user.centreId ?? undefined}
    />
  );
}

