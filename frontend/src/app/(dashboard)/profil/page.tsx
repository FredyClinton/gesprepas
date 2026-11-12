import { auth } from "@/auth";
import { getCentre } from "@/modules/centres-sessions";

import { ProfilView } from "./ProfilView";

// Profil de l'utilisateur connecté, ouvert depuis l'avatar de la barre supérieure.
// Accessible à tous les rôles : le backend (/api/mon-compte) lit l'identité dans le jeton.
export default async function ProfilPage() {
  const session = await auth();
  const utilisateur = session!.user;

  // Même résolution du nom de centre que le layout du tableau de bord.
  const centre = utilisateur.centreId
    ? await getCentre(utilisateur.centreId, session!.accessToken).catch(
        () => null,
      )
    : null;

  return <ProfilView centreNom={centre?.nom} />;
}
