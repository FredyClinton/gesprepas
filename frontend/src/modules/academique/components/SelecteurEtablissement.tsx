"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Building2, Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react";
import {
  useEtablissements,
  useEnregistrerEtablissement,
} from "../data/etablissements";

interface SelecteurEtablissementProps {
  value: string;
  onChange: (nomEtablissement: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: "normal" | "compact";
  className?: string;
}

export function SelecteurEtablissement({
  value,
  onChange,
  placeholder = "Rechercher ou saisir un établissement...",
  disabled = false,
  variant = "normal",
  className = "",
}: SelecteurEtablissementProps) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState(value || "");
  const [estEnFiltre, setEstEnFiltre] = useState(false);
  const [indexSurvol, setIndexSurvol] = useState<number>(-1);

  const conteneurRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: etablissements = [], isLoading } = useEtablissements();
  const enregistrerMutation = useEnregistrerEtablissement();

  // Synchroniser la recherche si la valeur externe change
  useEffect(() => {
    setRecherche(value || "");
    setEstEnFiltre(false);
  }, [value]);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    function handleClickDehors(event: MouseEvent) {
      if (
        conteneurRef.current &&
        !conteneurRef.current.contains(event.target as Node)
      ) {
        setOuvert(false);
        setEstEnFiltre(false);
      }
    }
    document.addEventListener("mousedown", handleClickDehors);
    return () => document.removeEventListener("mousedown", handleClickDehors);
  }, []);

  // Liste complète enrichie avec la valeur actuelle si absente du catalogue officiel
  const etablissementsComplets = useMemo(() => {
    const valNettoyee = (value || "").trim();
    if (!valNettoyee) return etablissements;
    const existe = etablissements.some(
      (e) => e.nom.trim().toLowerCase() === valNettoyee.toLowerCase(),
    );
    if (!existe) {
      return [{ id: `val-${valNettoyee}`, nom: valNettoyee, ville: null }, ...etablissements];
    }
    return etablissements;
  }, [etablissements, value]);

  // Suggestions filtrées : si l'utilisateur n'est pas en cours de frappe, on affiche la liste complète
  const suggestions = useMemo(() => {
    if (!estEnFiltre) {
      return etablissementsComplets;
    }
    const q = recherche.trim().toLowerCase();
    if (!q) return etablissementsComplets;
    return etablissementsComplets.filter(
      (e) =>
        e.nom.toLowerCase().includes(q) ||
        (e.ville && e.ville.toLowerCase().includes(q)),
    );
  }, [etablissementsComplets, recherche, estEnFiltre]);

  // Vérifier si la saisie exacte existe déjà
  const correspondanceExacte = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return etablissementsComplets.some(
      (e) => e.nom.trim().toLowerCase() === q,
    );
  }, [etablissementsComplets, recherche]);

  const peutCreer = Boolean(recherche.trim()) && !correspondanceExacte;
  const totalOptions = suggestions.length + (peutCreer ? 1 : 0);

  const selectionner = (etabNom: string) => {
    onChange(etabNom);
    setRecherche(etabNom);
    setEstEnFiltre(false);
    setOuvert(false);
  };

  const handleCreer = async () => {
    const nomAEnregistrer = recherche.trim();
    if (!nomAEnregistrer || enregistrerMutation.isPending) return;

    try {
      const nouveau = await enregistrerMutation.mutateAsync({
        nom: nomAEnregistrer,
      });
      selectionner(nouveau.nom);
    } catch {
      // En cas d'erreur de requête API, on applique quand même la saisie texte
      selectionner(nomAEnregistrer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!ouvert) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOuvert(true);
        setEstEnFiltre(false);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexSurvol((prev) => (prev + 1 < totalOptions ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexSurvol((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (indexSurvol >= 0 && indexSurvol < suggestions.length) {
        selectionner(suggestions[indexSurvol].nom);
      } else if (indexSurvol === suggestions.length && peutCreer) {
        void handleCreer();
      } else if (recherche.trim()) {
        if (peutCreer) {
          void handleCreer();
        } else {
          selectionner(recherche.trim());
        }
      }
    } else if (e.key === "Escape") {
      setOuvert(false);
      setEstEnFiltre(false);
    }
  };

  const estCompact = variant === "compact";

  return (
    <div
      ref={conteneurRef}
      className={`relative w-full text-left ${ouvert ? "z-40" : "z-0"} ${className}`}
    >
      <div
        className={`flex items-center gap-1.5 rounded-xl border transition-all duration-150 ${
          disabled
            ? "bg-slate-100 border-slate-200 cursor-not-allowed opacity-75"
            : ouvert
            ? "bg-white border-brand-orange ring-2 ring-brand-orange/15 shadow-xs"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
        } ${estCompact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
      >
        <Building2
          size={estCompact ? 13 : 15}
          className={`${
            recherche ? "text-brand-orange" : "text-slate-400"
          } shrink-0`}
        />

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value);
            setEstEnFiltre(true);
            onChange(e.target.value);
            setOuvert(true);
            setIndexSurvol(-1);
          }}
          onFocus={() => {
            if (!disabled) {
              setOuvert(true);
              setEstEnFiltre(false);
              inputRef.current?.select();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-transparent font-medium text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed ${
            estCompact ? "text-xs" : "text-xs"
          }`}
        />

        {enregistrerMutation.isPending && (
          <Loader2 size={13} className="animate-spin text-brand-orange shrink-0" />
        )}

        {recherche && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setRecherche("");
              setEstEnFiltre(false);
              onChange("");
              setOuvert(true);
              inputRef.current?.focus();
            }}
            className="p-0.5 text-slate-300 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
            title="Effacer"
          >
            <X size={12} />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setOuvert((prev) => {
                const prochain = !prev;
                if (prochain) {
                  setEstEnFiltre(false);
                }
                return prochain;
              });
              inputRef.current?.focus();
            }
          }}
          className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title="Afficher la liste des établissements"
        >
          <ChevronsUpDown size={estCompact ? 12 : 14} />
        </button>
      </div>

      {/* Menu déroulant Popover */}
      {ouvert && !disabled && (
        <div
          className={`absolute left-0 top-full mt-1 w-full min-w-[280px] max-w-[420px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
            estCompact ? "text-xs" : "text-xs"
          }`}
        >
          {/* Liste des correspondances */}
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                <Loader2 size={14} className="animate-spin text-brand-orange" />
                <span>Chargement du catalogue...</span>
              </div>
            ) : suggestions.length === 0 && !peutCreer ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Aucun établissement trouvé
              </div>
            ) : (
              suggestions.map((etab, idx) => {
                const estSelectionne =
                  (value || "").trim().toLowerCase() === etab.nom.toLowerCase();
                const estSurvole = indexSurvol === idx;

                return (
                  <button
                    key={etab.id}
                    type="button"
                    onClick={() => selectionner(etab.nom)}
                    onMouseEnter={() => setIndexSurvol(idx)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      estSurvole
                        ? "bg-brand-orange/10 text-brand-orange"
                        : estSelectionne
                        ? "bg-slate-100 font-bold text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2
                        size={13}
                        className={
                          estSurvole || estSelectionne
                            ? "text-brand-orange"
                            : "text-slate-400"
                        }
                      />
                      <span className="truncate">{etab.nom}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {etab.ville && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {etab.ville}
                        </span>
                      )}
                      {estSelectionne && (
                        <Check size={13} className="text-brand-orange" />
                      )}
                    </div>
                  </button>
                );
              })
            )}

            {/* Option de création rapide si le nom n'est pas encore au catalogue */}
            {peutCreer && (
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCreer}
                  onMouseEnter={() => setIndexSurvol(suggestions.length)}
                  disabled={enregistrerMutation.isPending}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    indexSurvol === suggestions.length
                      ? "bg-brand-orange/15 text-brand-orange"
                      : "bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/15"
                  }`}
                >
                  <div className="h-5 w-5 rounded-md bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-2xs">
                    {enregistrerMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={13} />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-[11px] font-bold block leading-tight">
                      Enregistrer et sélectionner
                    </span>
                    <span className="text-[10px] text-brand-orange/80 font-medium block truncate">
                      « {recherche.trim()} »
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
