import { auth } from "@/auth";
import { LivresView } from "@/modules/livres";

export default async function LivresPage() {
  const session = await auth();
  return (
    <LivresView
      userRole={session?.user?.role}
      userCentreId={session?.user?.centreId ?? undefined}
    />
  );
}

