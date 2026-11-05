import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AnalyseCentresView } from "./AnalyseCentresView";

export const metadata = {
  title: "Analyse Financière par Centre | EXCELIS PRÉPAS",
  description: "Comparatif des performances financières, ratios de recouvrement et soldes par centre physique",
};

export default async function AnalyseCentresPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <AnalyseCentresView />;
}

