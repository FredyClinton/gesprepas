import { auth } from "@/auth";
import { ConcoursBlancsView } from "./ConcoursBlancsView";

export default async function ConcoursBlancsPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <ConcoursBlancsView
      userRole={user.role}
      userCentreId={user.centreId}
      userDepartementId={user.departementId}
      userId={user.id}
    />
  );
}

