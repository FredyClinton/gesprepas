"use client";

import React, { useState, useMemo } from "react";
import type { AuditLogItem } from "@/types/audit";
import { Pagination } from "@/shared/ui/Pagination";
import { SortableHeader } from "@/shared/ui";
import { compareStrings, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import {
  Eye,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  SearchX,
  Clock,
} from "lucide-react";

interface AuditLogsTableProps {
  logs: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
  onSelectLog: (log: AuditLogItem) => void;
}

export function AuditLogsTable({
  logs,
  totalElements,
  totalPages,
  page,
  pageSize,
  onPageChange,
  isLoading,
  onSelectLog,
}: AuditLogsTableProps) {
  type TriAuditColonne = "date" | "utilisateur" | "module" | "action" | "centre" | "statut";
  const [triColonne, setTriColonne] = useState<TriAuditColonne>("date");
  const [triDirection, setTriDirection] = useState<SortDirection>("desc");

  function handleTri(colonne: TriAuditColonne) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection(colonne === "date" ? "desc" : "asc");
    }
  }

  const logsTries = useMemo(() => {
    return [...logs].sort((a, b) => {
      let res = 0;
      switch (triColonne) {
        case "date":
          res = compareDates(a.createdAt, b.createdAt);
          break;
        case "utilisateur":
          res = compareStrings(a.utilisateurNom || "", b.utilisateurNom || "");
          break;
        case "module":
          res = compareStrings(a.module || "", b.module || "");
          break;
        case "action":
          res = compareStrings(a.typeAction || "", b.typeAction || "");
          break;
        case "centre":
          res = compareStrings(a.centreNom || "", b.centreNom || "");
          break;
        case "statut":
          res = compareStrings(a.statut || "", b.statut || "");
          break;
      }
      return triDirection === "asc" ? res : -res;
    });
  }, [logs, triColonne, triDirection]);
  const getModuleBadgeClass = (module: string) => {
    switch (module) {
      case "FINANCE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BILAN_JOURNALIER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "INSCRIPTION":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PAIE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ADMINISTRATION":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getModuleLabel = (module: string) => {
    switch (module) {
      case "FINANCE":
        return "Finance";
      case "BILAN_JOURNALIER":
        return "Bilan Journalier";
      case "INSCRIPTION":
        return "Inscription";
      case "PAIE":
        return "Paie";
      case "ADMINISTRATION":
        return "Admin";
      default:
        return module;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-gray/15 shadow-xs overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-brand-gray/15 bg-brand-gray/5 text-brand-gray uppercase tracking-wider font-semibold">
              <SortableHeader
                label="Date & Heure"
                columnKey="date"
                currentSortColumn={triColonne}
                currentSortDirection={triDirection}
                onSort={handleTri}
                align="left"
              />
              <SortableHeader
                label="Utilisateur"
                columnKey="utilisateur"
                currentSortColumn={triColonne}
                currentSortDirection={triDirection}
                onSort={handleTri}
                align="left"
              />
              <SortableHeader
                label="Module"
                columnKey="module"
                currentSortColumn={triColonne}
                currentSortDirection={triDirection}
                onSort={handleTri}
                align="left"
              />
              <SortableHeader
                label="Action"
                columnKey="action"
                currentSortColumn={triColonne}
                currentSortDirection={triDirection}
                onSort={handleTri}
                align="left"
              />
              <th className="py-3.5 px-4 min-w-[220px]">Description</th>
              <SortableHeader
                label="Centre"
                columnKey="centre"
                currentSortColumn={triColonne}
                currentSortDirection={triDirection}
                onSort={handleTri}
                align="left"
              />
              <SortableHeader
                label="Statut"
                columnKey="statut"
                currentSortColumn={triColonne}
                currentSortDirection={triDirection}
                onSort={handleTri}
                align="left"
              />
              <th className="py-3.5 px-4 text-right">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray/10 text-brand-anthracite">
            {isLoading ? (
              // Squelettes de chargement
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-3 w-24 bg-brand-gray/15 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 w-32 bg-brand-gray/15 rounded mb-1" />
                    <div className="h-2 w-16 bg-brand-gray/10 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-4 w-16 bg-brand-gray/15 rounded-full" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3 w-20 bg-brand-gray/15 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 w-48 bg-brand-gray/15 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3 w-16 bg-brand-gray/15 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-4 w-12 bg-brand-gray/15 rounded-full" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-6 w-6 bg-brand-gray/15 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              // État vide
              <tr>
                <td colSpan={8} className="py-12 text-center text-brand-gray">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SearchX size={32} className="text-brand-gray/50" />
                    <p className="text-sm font-semibold text-brand-anthracite">
                      Aucun événement d'audit trouvé
                    </p>
                    <p className="text-xs text-brand-gray max-w-sm">
                      Essayez d'ajuster vos critères de recherche ou vos filtres de période.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Liste des lignes
              logsTries.map((item) => {
                const { date, time } = formatDate(item.createdAt);
                const isSuccess = item.statut === "SUCCES";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-brand-gray/5 transition-colors group cursor-pointer"
                    onClick={() => onSelectLog(item)}
                  >
                    {/* Date & Heure */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-brand-anthracite">
                        {date}
                      </div>
                      <div className="text-[11px] text-brand-gray flex items-center gap-1">
                        <Clock size={10} />
                        {time}
                      </div>
                    </td>

                    {/* Utilisateur */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-anthracite truncate max-w-[150px]">
                        {item.utilisateurNom || "Système"}
                      </div>
                      <div className="text-[11px] text-brand-gray">
                        {item.utilisateurRole || "Automatique"}
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getModuleBadgeClass(
                          item.module,
                        )}`}
                      >
                        {getModuleLabel(item.module)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-medium text-brand-anthracite">
                        {item.typeAction}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <p
                        className="truncate text-brand-anthracite font-normal"
                        title={item.description}
                      >
                        {item.description}
                      </p>
                    </td>

                    {/* Centre */}
                    <td className="py-3 px-3 whitespace-nowrap text-brand-gray font-medium">
                      {item.centreNom || (item.centreId ? item.centreId.slice(0, 8) : "National")}
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Succès
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                          <XCircle size={13} className="text-rose-600" />
                          Échec
                        </span>
                      )}
                    </td>

                    {/* Bouton Détails */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLog(item);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-brand-gray hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination serveur */}
      <Pagination
        page={page + 1}
        totalPages={totalPages}
        onChange={(newPage) => onPageChange(newPage - 1)}
        totalItems={totalElements}
        pageSize={pageSize}
        label="enregistrement"
      />
    </div>
  );
}
