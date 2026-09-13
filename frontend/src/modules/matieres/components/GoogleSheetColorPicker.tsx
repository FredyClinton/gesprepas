"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Check, Pipette } from "lucide-react";
import { isCouleurClaire } from "../couleurs";

// Palette matricielle fidèle à Google Sheets
// Ligne 1 : 10 niveaux de gris / neutres (du noir au blanc)
export const GOOGLE_SHEETS_MONOCHROME = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
] as const;

// 10 colonnes de teintes chromatiques, chacune avec 6 nuances (de la plus claire à la plus sombre)
export const GOOGLE_SHEETS_HUES_MATRIX: string[][] = [
  // Nuance 1 : Très claire / pastel
  [
    "#f4cccc", // Rouge clair
    "#fce5cd", // Orange clair
    "#fff2cc", // Jaune clair
    "#d9ead3", // Vert clair
    "#d0e0e3", // Cyan clair
    "#cfe2f3", // Bleu ciel clair
    "#d9d2e9", // Violet clair
    "#ead1dc", // Magenta clair
    "#c9daf8", // Indigo clair
    "#e6b8af", // Brun clair
  ],
  // Nuance 2 : Claire
  [
    "#ea9999",
    "#f9cb9c",
    "#ffe599",
    "#b6d7a8",
    "#a2c4c9",
    "#9fc5e8",
    "#b4a7d6",
    "#d5a6bd",
    "#a4c2f4",
    "#dd7e6b",
  ],
  // Nuance 3 : Moyenne
  [
    "#e06666",
    "#f6b26b",
    "#ffd966",
    "#93c47d",
    "#76a5af",
    "#6fa8dc",
    "#8e7cc3",
    "#c27ba0",
    "#6d9eeb",
    "#cc4125",
  ],
  // Nuance 4 : Standard / Vive
  [
    "#cc0000",
    "#e69138",
    "#f1c232",
    "#6aa84f",
    "#45818e",
    "#3d85c6",
    "#674ea7",
    "#a64d79",
    "#3c78d8",
    "#a61c00",
  ],
  // Nuance 5 : Sombre
  [
    "#990000",
    "#b45f06",
    "#bf9000",
    "#38761d",
    "#134f5c",
    "#0b5394",
    "#351c75",
    "#741b47",
    "#1155cc",
    "#85200c",
  ],
  // Nuance 6 : Très sombre / Profonde
  [
    "#660000",
    "#783f04",
    "#7f6000",
    "#274e13",
    "#0c343d",
    "#073763",
    "#20124d",
    "#4c1130",
    "#1c4587",
    "#5b0f00",
  ],
];

interface GoogleSheetColorPickerProps {
  couleurActive?: string;
  onSelectCouleur: (hex: string) => void;
  align?: "left" | "right";
  className?: string;
  boutonLibelle?: string;
}

export function GoogleSheetColorPicker({
  couleurActive = "#3B82F6",
  onSelectCouleur,
  align = "left",
  className = "",
  boutonLibelle,
}: GoogleSheetColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>(() => {
    // Initialiser avec la couleur active si elle n'est pas dans la matrice standard
    return couleurActive ? [couleurActive] : [];
  });

  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeColorInputRef = useRef<HTMLInputElement>(null);

  // Repositionnement dynamique et intelligent du popover
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const POPOVER_WIDTH = 270;
      const POPOVER_HEIGHT = 380;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // S'il n'y a pas assez de place en bas (< 380px) et plus de place en haut, on ouvre vers le haut
      const placeAbove = spaceBelow < POPOVER_HEIGHT && spaceAbove > spaceBelow;

      let top = placeAbove
        ? Math.max(10, rect.top - POPOVER_HEIGHT - 6)
        : Math.min(window.innerHeight - POPOVER_HEIGHT - 10, rect.bottom + 6);

      let left = align === "right" ? rect.right - POPOVER_WIDTH : rect.left;
      if (left + POPOVER_WIDTH > window.innerWidth - 10) {
        left = window.innerWidth - POPOVER_WIDTH - 10;
      }
      if (left < 10) {
        left = 10;
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, align]);

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (hex: string) => {
    onSelectCouleur(hex);
    setIsOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (!customColors.includes(hex)) {
      setCustomColors((prev) => [hex, ...prev.slice(0, 9)]);
    }
    onSelectCouleur(hex);
  };

  const isSelected = (hex: string) =>
    couleurActive?.toLowerCase() === hex.toLowerCase();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bouton déclencheur / Pastille de prévisualisation */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs group"
        title="Changer la couleur (Palette style Google Sheets)"
      >
        <span
          className="w-6 h-6 rounded-md border border-black/15 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ backgroundColor: couleurActive }}
        >
          <Pipette
            size={11}
            className={`drop-shadow-xs opacity-90 ${
              isCouleurClaire(couleurActive) ? "text-slate-800" : "text-white"
            }`}
          />
        </span>
        <span className="font-mono text-[11px] font-semibold text-slate-600 px-1 uppercase">
          {boutonLibelle ? (
            <span className="font-sans font-medium">{boutonLibelle}</span>
          ) : (
            couleurActive
          )}
        </span>
      </button>

      {/* Popover Color Picker Google Sheets rendu au niveau du body via createPortal pour éviter tout clipping d'overflow */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
              width: "270px",
            }}
            className="p-3 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Ligne Monochrome / Niveaux de gris */}
            <div className="mb-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
                Neutres
              </div>
              <div className="grid grid-cols-10 gap-1">
                {GOOGLE_SHEETS_MONOCHROME.map((hex) => {
                  const active = isSelected(hex);
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleSelect(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-5 h-5 rounded-xs border transition-transform relative ${
                        hex.toLowerCase() === "#ffffff"
                          ? "border-slate-300"
                          : "border-black/10"
                      } ${active ? "ring-2 ring-brand-orange ring-offset-1 scale-110 z-10" : "hover:scale-115"}`}
                      title={hex}
                    >
                      {active && (
                        <Check
                          size={11}
                          className={`absolute inset-0 m-auto ${
                            hex.toLowerCase() === "#ffffff" ||
                            hex.toLowerCase() === "#f3f3f3" ||
                            hex.toLowerCase() === "#efefef"
                              ? "text-slate-900"
                              : "text-white"
                          }`}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grille Principale Google Sheets (10 teintes x 6 nuances) */}
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
                Palette standard
              </div>
              {GOOGLE_SHEETS_HUES_MATRIX.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-10 gap-1">
                  {row.map((hex) => {
                    const active = isSelected(hex);
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleSelect(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-5 h-5 rounded-xs border border-black/10 transition-transform relative ${
                          active
                            ? "ring-2 ring-brand-orange ring-offset-1 scale-110 z-10"
                            : "hover:scale-115"
                        }`}
                        title={hex}
                      >
                        {active && (
                          <Check
                            size={11}
                            className={`absolute inset-0 m-auto ${
                              rowIndex < 2 ? "text-slate-900" : "text-white"
                            }`}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Section « Personnalisé » */}
            <div className="pt-2.5">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Personnalisé
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {couleurActive}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Bouton "+" pour ouvrir le sélecteur natif */}
                <button
                  type="button"
                  onClick={() => nativeColorInputRef.current?.click()}
                  className="w-6 h-6 rounded-full border border-dashed border-slate-300 hover:border-brand-orange hover:text-brand-orange flex items-center justify-center text-slate-500 transition-colors cursor-pointer bg-slate-50 hover:bg-orange-50"
                  title="Ajouter une couleur personnalisée (pipette / code hex)"
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>

                {/* Pastilles personnalisées déjà utilisées */}
                {customColors.map((hex) => {
                  const active = isSelected(hex);
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleSelect(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-6 h-6 rounded-full border border-black/15 transition-transform relative ${
                        active
                          ? "ring-2 ring-brand-orange ring-offset-1 scale-110"
                          : "hover:scale-110"
                      }`}
                      title={hex}
                    >
                      {active && (
                        <Check
                          size={12}
                          className="absolute inset-0 m-auto text-white drop-shadow-xs"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}

                {/* Input color caché activé par le bouton "+" */}
                <input
                  ref={nativeColorInputRef}
                  type="color"
                  value={couleurActive}
                  onChange={handleCustomChange}
                  className="sr-only"
                  aria-label="Sélecteur de couleur natif"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

