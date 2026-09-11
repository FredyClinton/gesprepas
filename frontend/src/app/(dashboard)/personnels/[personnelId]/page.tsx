import { redirect } from "next/navigation";

export default async function PersonnelsAliasPage({
  params,
}: {
  params: Promise<{ personnelId: string }>;
}) {
  const { personnelId } = await params;
  redirect(`/personnel/${personnelId}`);
}

