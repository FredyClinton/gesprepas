import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listFichesPaieEnseignant,
  listBordereauxPaiePersonnel,
  listBordereauxEnseignant,
  preparerBordereauEnseignant,
  getBordereauEnseignant,
  getFichePaieDetail,
  validerBordereauEnseignant,
  executerPaiementFiche,
} from "./client";
import type {
  FichePaieEnseignant,
  BordereauPaiePersonnel,
  PaiementPhasePersonnel,
  BordereauPaieEnseignantDetail,
  FichePaieDetail,
  ValiderBordereauEnseignantPayload,
} from "../domain/types";

export function useSimulationBordereauEnseignant(
  sessionId?: string,
  datePaiement?: string,
  enabled = false,
) {
  return useQuery<BordereauPaieEnseignantDetail>({
    queryKey: ["simulation-bordereau-enseignant", sessionId, datePaiement],
    queryFn: () => preparerBordereauEnseignant(sessionId!, datePaiement),
    enabled: Boolean(sessionId && enabled),
  });
}

export function useFichesPaieEnseignant(
  enseignantId: string,
  sessionId?: string,
) {
  return useQuery<FichePaieEnseignant[]>({
    queryKey: ["fiches-paie-enseignant", enseignantId, sessionId],
    queryFn: () => listFichesPaieEnseignant(enseignantId, sessionId),
    enabled: Boolean(enseignantId),
  });
}

export function useBordereauxEnseignant(sessionId?: string) {
  return useQuery<BordereauPaieEnseignantDetail[]>({
    queryKey: ["bordereaux-paie-enseignant", sessionId],
    queryFn: () =>
      sessionId ? listBordereauxEnseignant(sessionId) : Promise.resolve([]),
    enabled: Boolean(sessionId),
  });
}

export function useBordereauEnseignant(bordereauId?: string) {
  return useQuery<BordereauPaieEnseignantDetail>({
    queryKey: ["bordereau-paie-enseignant", bordereauId],
    queryFn: () => getBordereauEnseignant(bordereauId!),
    enabled: Boolean(bordereauId),
  });
}

export function useFichePaieDetail(ficheId?: string) {
  return useQuery<FichePaieDetail>({
    queryKey: ["fiche-paie-detail", ficheId],
    queryFn: () => getFichePaieDetail(ficheId!),
    enabled: Boolean(ficheId),
  });
}

export function useValiderBordereauEnseignant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: ValiderBordereauEnseignantPayload;
    }) => validerBordereauEnseignant(sessionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["bordereaux-paie-enseignant"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["simulation-bordereau-enseignant"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["finances"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["affectations"],
      });
    },
  });
}

export function useExecuterPaiementFiche() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bordereauId,
      ficheId,
      executePar,
    }: {
      bordereauId: string;
      ficheId: string;
      executePar?: string;
    }) => executerPaiementFiche(bordereauId, ficheId, executePar),
    onSuccess: async (_, variables) => {
      queryClient.setQueriesData<BordereauPaieEnseignantDetail[]>(
        { queryKey: ["bordereaux-paie-enseignant"] },
        (old) => {
          if (!old) return old;
          return old.map((b) => {
            if (b.id !== variables.bordereauId) return b;
            return {
              ...b,
              fiches: b.fiches.map((f) =>
                f.id === variables.ficheId ? { ...f, statut: "PAYEE" as const } : f
              ),
            };
          });
        }
      );
      await queryClient.invalidateQueries({
        queryKey: ["bordereau-paie-enseignant", variables.bordereauId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["bordereaux-paie-enseignant"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["fiche-paie-detail", variables.ficheId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["fiches-paie-enseignant"],
      });
    },
  });
}

export function useBordereauxPaiePersonnel(sessionId?: string) {
  return useQuery<BordereauPaiePersonnel[]>({
    queryKey: ["bordereaux-paie-personnel", sessionId],
    queryFn: () =>
      sessionId ? listBordereauxPaiePersonnel(sessionId) : Promise.resolve([]),
    enabled: Boolean(sessionId),
  });
}

export function usePaiementsPersonnelSession(
  personnelId?: string,
  sessionId?: string,
) {
  const query = useBordereauxPaiePersonnel(sessionId);

  const paiements: PaiementPhasePersonnel[] = (query.data ?? [])
    .flatMap((bordereau) => {
      const f = bordereau.fiches?.find(
        (fiche) => fiche.personnelId === personnelId,
      );
      if (!f) return [];
      return [
        {
          ficheId: f.id,
          bordereauId: bordereau.id,
          referenceBordereau: bordereau.reference,
          intituleBordereau: bordereau.intitule,
          datePaiement: bordereau.datePaiement,
          salaireReference: Number(f.salaireReference ?? 0),
          montantPaye: Number(f.montantPaye ?? 0),
          observations: f.observations,
        },
      ];
    })
    .sort(
      (a, b) =>
        new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime(),
    );

  return {
    ...query,
    paiements,
  };
}
