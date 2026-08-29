"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assignerEnseignant, listAffectations } from "./client";

type UseAffectationsParams = {
    sessionId: string | undefined;
    semaine: number;
    matiereId: string | undefined;
    centreId?: string;
};

export function useAffectations({
    sessionId,
    semaine,
    matiereId,
    centreId,
}: UseAffectationsParams) {
    return useQuery({
        queryKey: ["affectations", sessionId, semaine, matiereId, centreId],
        queryFn: () =>
            listAffectations({ sessionId: sessionId!, semaine, matiereId, centreId }),
        enabled: Boolean(sessionId && matiereId),
    });
}

// Pas de mise à jour optimiste : le backend valide la disponibilité de l'enseignant
// au moment de l'assignation (409 possible) — on préfère réinterroger plutôt que
// de supposer le succès dans l'UI avant confirmation du serveur.
export function useAssignerEnseignant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, enseignantId }: { id: string; enseignantId: string }) =>
            assignerEnseignant(id, enseignantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affectations"] });
        },
    });
}