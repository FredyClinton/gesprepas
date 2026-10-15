"use client";

import React, { useState, useEffect } from "react";
import type { AuditLogFilters } from "@/types/audit";
import { useCentres } from "@/modules/centres-sessions";
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Calendar,
  Layers,
  MapPin,
} from "lucide-react";

interface AuditFiltersBarProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onReset: () => void;
  onExportCsv: () => void;
  isExporting?: boolean;
}

export function AuditFiltersBar({
  filters,
  onFiltersChange,
  onReset,
  onExportCsv,
  isExporting = false,
}: AuditFiltersBarProps) {
  const { data: centres = [] } = useCentres();
  const [rechercheInput, setRechercheInput] = useState(filters.recherche || "");

  // Debounce de la recherche textuelle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rechercheInput !== (filters.recherche || "")) {
        onFiltersChange({
          ...filters,
          recherche: rechercheInput ? rechercheInput : undefined,
          page: 0,
        });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [rechercheInput, filters, onFiltersChange]);

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFiltersChange({
      ...filters,
      module: val ? val : undefined,
      page: 0,
    });
  };

  const handleCentreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFiltersChange({
      ...filters,
      centreId: val ? val : undefined,
      page: 0,
    });
  };

  const handleDateDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onFiltersChange({
      ...filters,
      dateDebut: val ? new Date(val + "T00:00:00Z").toISOString() : undefined,
      page: 0,
    });
  };

  const handleDateFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onFiltersChange({
      ...filters,
      dateFin: val ? new Date(val + "T23:59:59Z").toISOString() : undefined,
      page: 0,
    });
  };

  const hasActiveFilters = Boolean(
    filters.module ||
      filters.centreId ||
      filters.dateDebut ||
      filters.dateFin ||
      filters.recherche,
  );

  return (
    <div className="bg-white rounded-2xl border border-brand-gray/15 p-4 shadow-xs space-y-3">
      {/* Ligne 1 : Recherche texte & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray"
          />
          <input
            type="text"
            value={rechercheInput}
            onChange={(e) => setRechercheInput(e.target.value)}
            placeholder="Rechercher par utilisateur, action, description..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-brand-gray/5 border border-brand-gray/20 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-anthracite placeholder:text-brand-gray"
          />
        </div>

        {/* Boutons Export & Réinitialisation */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setRechercheInput("");
                onReset();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-gray hover:text-brand-anthracite hover:bg-brand-gray/10 rounded-xl transition-colors"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw size={14} />
              <span>Réinitialiser</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? "Export..." : "Exporter CSV"}</span>
          </button>
        </div>
      </div>

      {/* Ligne 2 : Filtres combinés (Module, Centre, Période) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-brand-gray/10">
        {/* Module */}
        <div className="relative">
          <Layers
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
          />
          <select
            value={filters.module || ""}
            onChange={handleModuleChange}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-gray/5 border border-brand-gray/15 rounded-xl text-brand-anthracite focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="">Tous les modules</option>
            <option value="FINANCE">Finances & Caisse</option>
            <option value="BILAN_JOURNALIER">Bilans Journaliers</option>
            <option value="INSCRIPTION">Apprenants & Inscriptions</option>
            <option value="PAIE">Paie du Personnel</option>
            <option value="ADMINISTRATION">Administration</option>
          </select>
        </div>

        {/* Centre */}
        <div className="relative">
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
          />
          <select
            value={filters.centreId || ""}
            onChange={handleCentreChange}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-gray/5 border border-brand-gray/15 rounded-xl text-brand-anthracite focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="">Tous les centres</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.villeActuelle ? `(${c.villeActuelle})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date Début */}
        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
          />
          <input
            type="date"
            value={
              filters.dateDebut ? filters.dateDebut.slice(0, 10) : ""
            }
            onChange={handleDateDebutChange}
            aria-label="Date début"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-gray/5 border border-brand-gray/15 rounded-xl text-brand-anthracite focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        {/* Date Fin */}
        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
          />
          <input
            type="date"
            value={filters.dateFin ? filters.dateFin.slice(0, 10) : ""}
            onChange={handleDateFinChange}
            aria-label="Date fin"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-gray/5 border border-brand-gray/15 rounded-xl text-brand-anthracite focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
      </div>
    </div>
  );
}
