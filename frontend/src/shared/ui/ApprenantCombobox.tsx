"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { User, Search, Check, X } from "lucide-react";

export interface ApprenantItem {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
  etablissementOrigine?: string;
  centreId?: string;
}

interface ApprenantComboboxProps {
  apprenants: ApprenantItem[];
  selectedId: string;
  onSelect: (apprenant: ApprenantItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ApprenantCombobox({
  apprenants,
  selectedId,
  onSelect,
  placeholder = "Rechercher un élève par nom, prénom ou matricule...",
  disabled = false,
  className = "",
}: ApprenantComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedApprenant = useMemo(
    () => apprenants.find((a) => a.id === selectedId) || null,
    [apprenants, selectedId],
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apprenants.slice(0, 30);
    return apprenants
      .filter((a) => {
        const nomComplet = `${a.nom} ${a.prenom}`.toLowerCase();
        const prenomNom = `${a.prenom} ${a.nom}`.toLowerCase();
        const mat = (a.matricule || "").toLowerCase();
        const etab = (a.etablissementOrigine || "").toLowerCase();
        return (
          nomComplet.includes(q) ||
          prenomNom.includes(q) ||
          mat.includes(q) ||
          etab.includes(q)
        );
      })
      .slice(0, 30);
  }, [apprenants, query]);

  const handleSelect = (apprenant: ApprenantItem) => {
    onSelect(apprenant);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery("");
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) return;
      setHighlightedIndex((prev) =>
        prev <= 0 ? filtered.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter") {
      if (isOpen && filtered.length > 0) {
        e.preventDefault();
        const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
        if (filtered[idx]) {
          handleSelect(filtered[idx]);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {selectedApprenant && !isOpen ? (
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={`flex items-center justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50/70 px-3.5 py-2 text-sm text-slate-800 transition-colors ${
            disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-brand-orange"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange text-white shrink-0 text-xs font-bold">
              {selectedApprenant.nom.charAt(0)}
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm">
                {selectedApprenant.nom} {selectedApprenant.prenom}
              </span>
              {selectedApprenant.etablissementOrigine && (
                <span className="text-[11px] text-slate-500 block truncate">
                  {selectedApprenant.etablissementOrigine}
                </span>
              )}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg p-1 text-slate-400 hover:bg-orange-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Changer d'élève"
            >
              <X size={15} />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={15} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Liste déroulante */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in duration-100">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              Aucun élève trouvé pour <span className="font-semibold text-slate-700">"{query}"</span>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((item, idx) => {
                const isSelected = item.id === selectedId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-orange-50 text-brand-orange"
                        : isSelected
                          ? "bg-slate-50 text-slate-900 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>
                          {item.nom} {item.prenom}
                        </span>
                        {item.matricule && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{item.matricule}
                          </span>
                        )}
                      </div>
                      {item.etablissementOrigine && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.etablissementOrigine}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-brand-orange shrink-0" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

