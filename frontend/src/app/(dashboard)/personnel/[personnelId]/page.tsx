import { auth } from "@/auth";
import { PersonnelDetailView } from "./PersonnelDetailView";

export default async function PersonnelDetailPage({
  params,
}: {
  params: Promise<{ personnelId: string }>;
}) {
  const session = await auth();
  const utilisateur = session?.user;
  const { personnelId } = await params;

  if (!utilisateur) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Veuillez vous connecter pour accéder à cette page.
      </main>
    );
  }

  const estLuiMeme = utilisateur.id === personnelId;
  const rolesAutorises = [
    "DIRECTEUR",
    "DIRECTEUR_ACADEMIQUE",
    "CHEF_CENTRE",
    "COMPTABLE",
  ];

  if (!estLuiMeme && !rolesAutorises.includes(utilisateur.role)) {
    return (
      <main className="text-brand-gray p-8 text-sm">
        Cet écran est réservé à la Direction, aux Responsables de Centre et aux Comptables.
      </main>
    );
  }

  return <PersonnelDetailView personnelId={personnelId} />;
}

