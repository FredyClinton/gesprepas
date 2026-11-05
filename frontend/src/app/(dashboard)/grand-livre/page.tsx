import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GrandLivreView } from "./GrandLivreView";

export const metadata = {
  title: "Grand Livre & Rapprochement de Trésorerie | EXCELIS PRÉPAS",
  description: "Journal comptable consolidé, solde progressif, pointage et rapprochement de caisse",
};

export default async function GrandLivrePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <GrandLivreView />;
}

