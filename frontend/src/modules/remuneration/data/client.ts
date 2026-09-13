import { apiFetch } from "@/shared/lib/api-client";
import type {
  FichePaieEnseignant,
  BordereauPaiePersonnel,
  BordereauPaieEnseignantDetail,
  FichePaieDetail,
  ValiderBordereauEnseignantPayload,
} from "../domain/types";

export function listFichesPaieEnseignant(
  enseignantId: string,
  sessionId?: string,
): Promise<FichePaieEnseignant[]> {
  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<FichePaieEnseignant[]>(
    `/api/remuneration/enseignants/${enseignantId}/fiches${query}`,
  );
}

export function listBordereauxPaiePersonnel(
  sessionId: string,
): Promise<BordereauPaiePersonnel[]> {
  return apiFetch<BordereauPaiePersonnel[]>(
    `/api/remuneration/personnel/sessions/${sessionId}/bordereaux`,
  );
}

export function preparerBordereauEnseignant(
  sessionId: string,
  datePaiement?: string,
  saisiPar?: string,
): Promise<BordereauPaieEnseignantDetail> {
  const params = new URLSearchParams();
  if (datePaiement) params.set("datePaiement", datePaiement);
  if (saisiPar) params.set("saisiPar", saisiPar);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<BordereauPaieEnseignantDetail>(
    `/api/remuneration/enseignants/sessions/${sessionId}/preparer${query}`,
    { method: "POST" },
  );
}

export function validerBordereauEnseignant(
  sessionId: string,
  payload: ValiderBordereauEnseignantPayload,
): Promise<BordereauPaieEnseignantDetail> {
  return apiFetch<BordereauPaieEnseignantDetail>(
    `/api/remuneration/enseignants/sessions/${sessionId}/valider`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function listBordereauxEnseignant(
  sessionId: string,
): Promise<BordereauPaieEnseignantDetail[]> {
  return apiFetch<BordereauPaieEnseignantDetail[]>(
    `/api/remuneration/enseignants/sessions/${sessionId}/bordereaux`,
  );
}

export function getBordereauEnseignant(
  bordereauId: string,
): Promise<BordereauPaieEnseignantDetail> {
  return apiFetch<BordereauPaieEnseignantDetail>(
    `/api/remuneration/enseignants/bordereaux/${bordereauId}`,
  );
}

export function getFichePaieDetail(
  ficheId: string,
): Promise<FichePaieDetail> {
  return apiFetch<FichePaieDetail>(
    `/api/remuneration/fiches/${ficheId}`,
  );
}

export function executerPaiementFiche(
  bordereauId: string,
  ficheId: string,
  executePar?: string,
): Promise<void> {
  const params = new URLSearchParams();
  if (executePar) params.set("executePar", executePar);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<void>(
    `/api/remuneration/enseignants/bordereaux/${bordereauId}/fiches/${ficheId}/executer${query}`,
    { method: "POST" },
  );
}

export function mettreAJourThemeSeance(
  affectationId: string,
  theme: string,
): Promise<void> {
  return apiFetch<void>(
    `/api/remuneration/seances/${affectationId}/theme`,
    {
      method: "PATCH",
      body: JSON.stringify({ theme }),
    },
  );
}

