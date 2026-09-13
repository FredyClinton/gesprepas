import { apiFetch } from "@/shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ContratApprenant {
  id: string;
  apprenantId: string;
  reference: string;
  dateSignature: string;
  montantTotal: number;
  statut: string;
  observations?: string | null;
  phaseId?: string | null;
  formationId?: string | null;
}

export interface InscriptionPhase {
  id: string;
  apprenantId: string;
  contratId?: string | null;
  phaseId: string;
  formationId: string;
  statut: string;
  dateDebut: string;
  dateFin?: string | null;
  formationPrecedenteId?: string | null;
}

export interface CursusApprenant {
  apprenantId: string;
  formationActiveId?: string | null;
  phaseActiveId?: string | null;
  montantTotalCumule: number;
  contrats: ContratApprenant[];
  inscriptionsPhases: InscriptionPhase[];
}

export interface CreerContratPhasePayload {
  phaseId: string;
  formationId: string;
  montantContrat: number;
  dateSignature?: string;
  observations?: string;
}

export function recupererCursus(apprenantId: string): Promise<CursusApprenant> {
  return apiFetch<CursusApprenant>(`/api/apprenants/${apprenantId}/cursus`);
}

export function creerContratPhase(
  apprenantId: string,
  payload: CreerContratPhasePayload,
): Promise<CursusApprenant> {
  return apiFetch<CursusApprenant>(`/api/apprenants/${apprenantId}/contrats-phase`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changerFormationPhase(
  apprenantId: string,
  phaseId: string,
  nouvelleFormationId: string,
): Promise<InscriptionPhase> {
  return apiFetch<InscriptionPhase>(
    `/api/apprenants/${apprenantId}/phases/${phaseId}/changer-formation`,
    {
      method: "PATCH",
      body: JSON.stringify({ nouvelleFormationId }),
    },
  );
}

export function useCursusApprenant(apprenantId?: string) {
  return useQuery({
    queryKey: ["apprenant-cursus", apprenantId],
    queryFn: () => (apprenantId ? recupererCursus(apprenantId) : Promise.resolve(null)),
    enabled: Boolean(apprenantId),
  });
}

export function useCreerContratPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      apprenantId,
      payload,
    }: {
      apprenantId: string;
      payload: CreerContratPhasePayload;
    }) => creerContratPhase(apprenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["apprenant-cursus", variables.apprenantId] });
      queryClient.invalidateQueries({ queryKey: ["apprenant", variables.apprenantId] });
      queryClient.invalidateQueries({ queryKey: ["apprenants"] });
    },
  });
}

export function useChangerFormationPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      apprenantId,
      phaseId,
      nouvelleFormationId,
    }: {
      apprenantId: string;
      phaseId: string;
      nouvelleFormationId: string;
    }) => changerFormationPhase(apprenantId, phaseId, nouvelleFormationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["apprenant-cursus", variables.apprenantId] });
      queryClient.invalidateQueries({ queryKey: ["apprenant", variables.apprenantId] });
      queryClient.invalidateQueries({ queryKey: ["apprenants"] });
    },
  });
}

