import { apiFetch } from "@/shared/lib/api-client";
import type { AuditLogFilters, PaginatedAuditLogs } from "@/types/audit";

export async function fetchAuditLogs(
  filters: AuditLogFilters,
): Promise<PaginatedAuditLogs> {
  const params = new URLSearchParams();
  if (filters.module) params.set("module", filters.module);
  if (filters.centreId) params.set("centreId", filters.centreId);
  if (filters.utilisateurId) params.set("utilisateurId", filters.utilisateurId);
  if (filters.dateDebut) params.set("dateDebut", filters.dateDebut);
  if (filters.dateFin) params.set("dateFin", filters.dateFin);
  if (filters.recherche) params.set("recherche", filters.recherche);
  if (filters.page !== undefined) params.set("page", filters.page.toString());
  if (filters.size !== undefined) params.set("size", filters.size.toString());

  const queryString = params.toString();
  return apiFetch<PaginatedAuditLogs>(
    `/api/audit-logs${queryString ? `?${queryString}` : ""}`,
  );
}
