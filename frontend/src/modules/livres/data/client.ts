import { apiFetch } from "@/shared/lib/api-client";
import type { Livre, CreerLivreDTO, ModifierLivreDTO } from "../domain/types";

export function listLivres(actifsSeulement = false): Promise<Livre[]> {
  const query = actifsSeulement ? "?actifsSeulement=true" : "";
  return apiFetch<Livre[]>(`/api/livres${query}`);
}

export function creerLivre(payload: CreerLivreDTO, role?: string): Promise<Livre> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  return apiFetch<Livre>("/api/livres", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function modifierLivre(
  id: string,
  payload: ModifierLivreDTO,
  role?: string,
): Promise<Livre> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  return apiFetch<Livre>(`/api/livres/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
}

export function supprimerLivre(id: string, role?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  return apiFetch<void>(`/api/livres/${id}`, {
    method: "DELETE",
    headers,
  });
}

export function enregistrerVenteLivre(
  payload: import("../domain/types").EnregistrerVenteLivreDTO,
  role?: string,
  userCentreId?: string,
): Promise<import("../domain/types").VenteLivre[]> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;
  return apiFetch<import("../domain/types").VenteLivre[]>("/api/livres/ventes", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function listerVentesLivres(
  params: {
    sessionId: string;
    centreId?: string;
    livreId?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  role?: string,
  userCentreId?: string,
): Promise<import("../domain/types").VenteLivre[]> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;

  const q = new URLSearchParams();
  q.append("sessionId", params.sessionId);
  if (params.centreId) q.append("centreId", params.centreId);
  if (params.livreId) q.append("livreId", params.livreId);
  if (params.dateDebut) q.append("dateDebut", params.dateDebut);
  if (params.dateFin) q.append("dateFin", params.dateFin);

  return apiFetch<import("../domain/types").VenteLivre[]>(`/api/livres/ventes?${q.toString()}`, {
    headers,
  });
}

export function getStatsVentesLivres(
  params: {
    sessionId: string;
    centreId?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  role?: string,
  userCentreId?: string,
): Promise<import("../domain/types").StatsVentesLivres> {
  const headers: Record<string, string> = {};
  if (role) headers["X-User-Role"] = role;
  if (userCentreId) headers["X-Centre-Id"] = userCentreId;

  const q = new URLSearchParams();
  q.append("sessionId", params.sessionId);
  if (params.centreId) q.append("centreId", params.centreId);
  if (params.dateDebut) q.append("dateDebut", params.dateDebut);
  if (params.dateFin) q.append("dateFin", params.dateFin);

  return apiFetch<import("../domain/types").StatsVentesLivres>(`/api/livres/ventes/stats?${q.toString()}`, {
    headers,
  });
}

