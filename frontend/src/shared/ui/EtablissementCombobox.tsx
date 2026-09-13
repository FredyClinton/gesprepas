"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { School, Check, Plus, Loader2, X } from "lucide-react";
import { useEtablissements, useEnregistrerEtablissement, Etablissement } from "@/modules/academique/data/etablissements";

interface EtablissementComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function EtablissementCombobox({
  value,
  onChange,
  placeholder = "Rechercher ou saisir un établissement...",
  disabled = false,
  className = "",
  inputClassName = "",
}: EtablissementComboboxProps) {
  const { data: etablissements = [], isLoading } = useEtablissements();
  const enregistrerMutation = useEnregistrerEtablissement();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronise query when value prop changes externally
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter establishments based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return etablissements;
    return etablissements.filter(
      (e) =>
        e.nom.toLowerCase().includes(q) ||
        (e.ville && e.ville.toLowerCase().includes(q))
    );
  }, [etablissements, query]);

  // Does query exactly match an existing establishment?
  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return etablissements.find((e) => e.nom.toLowerCase() === q);
  }, [etablissements, query]);

  const canAddNew = query.trim().length >= 2 && !exactMatch;

  const handleSelect = (etab: Etablissement) => {
    setQuery(etab.nom);
    onChange(etab.nom);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    const nomSaisi = query.trim();
    if (!nomSaisi) return;

    try {
      const nouveau = await enregistrerMutation.mutateAsync({ nom: nomSaisi });
      setQuery(nouveau.nom);
      onChange(nouveau.nom);
      setIsOpen(false);
    } catch {
      // Fallback: use the entered string even if offline or server conflict
      onChange(nomSaisi);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const max = filtered.length + (canAddNew ? 1 : 0);
      setHighlightedIndex((prev) => (prev + 1) % max);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) return;
      const max = filtered.length + (canAddNew ? 1 : 0);
      setHighlightedIndex((prev) => (prev <= 0 ? max - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (isOpen) {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex]);
        } else if (canAddNew && highlightedIndex === filtered.length) {
          handleAddNew();
        } else if (canAddNew && filtered.length === 0) {
          handleAddNew();
        } else if (filtered.length > 0) {
          handleSelect(filtered[0]);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <School size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${inputClassName}`}
        />
        {query && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setQuery("");
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-xs">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-3 text-slate-400">
              <Loader2 size={14} className="animate-spin text-brand-orange" />
              <span>Chargement du catalogue...</span>
            </div>
          )}

          {!isLoading && filtered.length === 0 && !canAddNew && (
            <div className="py-3 px-3 text-center text-slate-400 text-[11px]">
              Aucun établissement trouvé
            </div>
          )}

          {!isLoading && (
            <>
              {filtered.slice(0, 10).map((etab, idx) => {
                const isSelected = value?.toLowerCase() === etab.nom.toLowerCase();
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={etab.id}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(etab)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-left transition-colors cursor-pointer ${
                      isHighlighted
                        ? "bg-orange-50 text-brand-orange"
                        : isSelected
                        ? "bg-slate-50 text-slate-900 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <School size={13} className={isSelected ? "text-brand-orange shrink-0" : "text-slate-400 shrink-0"} />
                      <span className="truncate font-semibold">{etab.nom}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {etab.ville && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                          {etab.ville}
                        </span>
                      )}
                      {isSelected && <Check size={13} className="text-brand-orange" />}
                    </div>
                  </button>
                );
              })}

              {/* Bouton pour ajouter un nouvel établissement au catalogue s'il n'est pas trouvé */}
              {canAddNew && (
                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(filtered.length)}
                    onClick={handleAddNew}
                    disabled={enregistrerMutation.isPending}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-left text-brand-orange transition-colors cursor-pointer font-bold ${
                      highlightedIndex === filtered.length ? "bg-orange-50" : "hover:bg-orange-50/60"
                    }`}
                  >
                    {enregistrerMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin shrink-0" />
                    ) : (
                      <Plus size={13} className="shrink-0" />
                    )}
                    <div className="truncate">
                      <span>Enregistrer et utiliser : </span>
                      <span className="underline italic">&ldquo;{query.trim()}&rdquo;</span>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

