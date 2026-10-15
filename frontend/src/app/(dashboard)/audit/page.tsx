import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuditView } from "@/modules/audit";

export const metadata = {
  title: "Journal d'Audit & Traçabilité | EXCELIS PRÉPAS",
  description: "Consultation et supervision des journaux d'audit et de traçabilité des opérations",
};

export default async function AuditPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Seuls le directeur, le directeur académique et le chef de centre sont habilités
  const role = session.user.role;
  const isAuthorized =
    role === "DIRECTEUR" ||
    role === "DIRECTEUR_ACADEMIQUE" ||
    role === "CHEF_CENTRE";

  if (!isAuthorized) {
    redirect("/");
  }

  return (
    <AuditView
      userRole={session.user.role}
      userCentreId={session.user.centreId ?? undefined}
    />
  );
}
