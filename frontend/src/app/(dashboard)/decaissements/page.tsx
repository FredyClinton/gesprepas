import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DecaissementsView } from "./DecaissementsView";

export const metadata = {
  title: "Transactions & Décaissements | EXCELIS PRÉPAS",
  description: "Suivi et contrôle des dépenses, rémunérations et achats par catégorie",
};

export default async function DecaissementsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <DecaissementsView />;
}

