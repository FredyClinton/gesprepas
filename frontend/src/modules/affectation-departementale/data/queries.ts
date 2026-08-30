"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  ajouterEnseignant,
  listRosterDepartement,
  retirerEnseignant,
} from "./client";

export function useRosterDepartement(
  departementId: string | undefined,
  sessionId: string | undefined,
) {
  return useQuery({
    queryKey: ["roster-departement", departementId, sessionId],
    queryFn: () => listRosterDepartement(departementId!, sessionId!),
    enabled: Boolean(departementId && sessionId),
  });
}

// interroge le roster de chaque département en parallèle et on combine côté client.
export function useRostersDepartements(
  departementIds: string[] | undefined,
  sessionId: string | undefined,
) {
  const resultats = useQueries({
    queries: (departementIds ?? []).map((departementId) => ({
      queryKey: ["roster-departement", departementId, sessionId],
      queryFn: () => listRosterDepartement(departementId, sessionId!),
      enabled: Boolean(sessionId),
    })),
  });

  const chargement = resultats.some((r) => r.isLoading);
  const rosters = resultats
    .map((r) => r.data)
    .filter((d): d is NonNullable<typeof d> => d !== undefined)
    .flat();

  return { data: chargement ? undefined : rosters, isLoading: chargement };
}

// Invalide toutes les variantes de queryKey ["roster-departement", *, sessionId]
// d'un coup (préfixe partiel — TanStack Query matche sur les segments fournis).
function useInvalidationRosters() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["roster-departement"] });
}

export function useAjouterEnseignantRoster() {
  const invalider = useInvalidationRosters();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({
      departementId,
      sessionId,
      enseignantId,
    }: {
      departementId: string;
      sessionId: string;
      enseignantId: string;
    }) =>
      ajouterEnseignant(
        departementId,
        sessionId,
        enseignantId,
        session?.user.role,
      ),
    onSuccess: invalider,
  });
}

export function useRetirerEnseignantRoster() {
  const invalider = useInvalidationRosters();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({
      departementId,
      sessionId,
      enseignantId,
    }: {
      departementId: string;
      sessionId: string;
      enseignantId: string;
    }) =>
      retirerEnseignant(
        departementId,
        sessionId,
        enseignantId,
        session?.user.role,
      ),
    onSuccess: invalider,
  });
}
