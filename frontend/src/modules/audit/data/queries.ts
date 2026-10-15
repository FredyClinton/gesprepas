"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "./api";
import type { AuditLogFilters } from "@/types/audit";

export function useAuditLogsQuery(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => fetchAuditLogs(filters),
    placeholderData: (previousData) => previousData,
  });
}
