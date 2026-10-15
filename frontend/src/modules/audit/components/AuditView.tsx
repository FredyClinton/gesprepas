"use client";

import React, { useState } from "react";
import type { Role } from "@/types/roles";
import type { AuditLogFilters, AuditLogItem } from "@/types/audit";
import { useAuditLogsQuery } from "../data/queries";
import { fetchAuditLogs } from "../data/api";
import { AuditFiltersBar } from "./AuditFiltersBar";
import { AuditLogsTable } from "./AuditLogsTable";
import { AuditDetailsDialog } from "./AuditDetailsDialog";
import { exportAuditLogsToCsv } from "../utils/exportCsv";
import { ShieldCheck, RefreshCw } from "lucide-react";

interface AuditViewProps {
  userRole?: Role;
  userCentreId?: string;
}

export function AuditView({ userRole, userCentreId }: AuditViewProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    centreId: userRole === "CHEF_CENTRE" ? userCentreId : undefined,
    page: 0,
    size: 20,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isFetching, refetch } = useAuditLogsQuery(filters);

  const handleResetFilters = () => {
    setFilters({
      centreId: userRole === "CHEF_CENTRE" ? userCentreId : undefined,
      page: 0,
      size: 20,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      // Télécharger jusqu'à 1000 événements avec les filtres actuels
      const exportData = await fetchAuditLogs({
        ...filters,
        page: 0,
        size: 1000,
      });
      exportAuditLogsToCsv(exportData.content);
    } catch (err) {
      console.error("Erreur lors de l'export CSV :", err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = filters.page ?? 0;
  const logs = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-brand-anthracite">
                Journal d'Audit & Traçabilité
              </h1>
              <p className="text-xs text-brand-gray mt-0.5">
                Historique certifié et immuable des flux financiers, visas de caisse et dossiers apprenants
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-gray/10 text-brand-anthracite">
            {totalElements} événement{totalElements > 1 ? "s" : ""} enregistré{totalElements > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-brand-gray/15 text-brand-gray hover:text-brand-anthracite hover:bg-brand-gray/5 transition-colors disabled:opacity-50"
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <AuditFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {/* Tableau des journaux d'audit */}
      <AuditLogsTable
        logs={logs}
        totalElements={totalElements}
        totalPages={totalPages}
        page={currentPage}
        pageSize={filters.size ?? 20}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        onSelectLog={setSelectedLog}
      />

      {/* Boîte de dialogue détaillée */}
      <AuditDetailsDialog
        log={selectedLog}
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
