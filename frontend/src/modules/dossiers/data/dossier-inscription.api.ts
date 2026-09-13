import { apiFetch } from "@/shared/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CreerDossierInscriptionInput = {
  apprenantId: string;
  sessionId: string;
  centreId: string;
  montantGlobal: number;
  dateInscription: string;
  preInscrit: boolean;
  referenceRecu?: string | null;
  phasesSouscrites: string[];
  formationsCibles: string[];
  concoursCibles?: string[];
};

export type DossierInscription = {
  id: string;
  apprenantId: string;
  sessionId: string;
  centreId: string;
  montantGlobal: number;
  dateInscription: string;
  preInscrit: boolean;
  referenceRecu?: string;
  phasesSouscrites: string[];
  formationsCibles: string[];
  concoursCibles: string[];
};

export function creerDossierInscription(
  input: CreerDossierInscriptionInput,
): Promise<DossierInscription> {
  return apiFetch<DossierInscription>("/api/dossiers-inscription", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function useCreerDossierInscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerDossierInscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossiers-inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["apprenants"] });
    },
  });
}

