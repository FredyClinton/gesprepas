import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FinancesCaissierView } from "./FinancesCaissierView";

export const metadata = {
  title: "Finances & Caisse | EXCELIS PRÉPAS",
  description: "Journal des opérations financières et mouvements de caisse",
};

export default async function FinancesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const centreId = user.centreId || "";

  return <FinancesCaissierView centreId={centreId} />;
}
