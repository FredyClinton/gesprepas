import React from "react";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/shared/lib/sort-utils";

interface SortableHeaderProps<T extends string = string> {
  columnKey?: T;
  sortKey?: T;
  currentSortKey?: string | null;
  currentSortColumn?: string | null;
  direction?: SortDirection;
  currentSortDirection?: SortDirection;
  onSort: (key: any) => void;
  align?: "left" | "center" | "right";
  children?: React.ReactNode;
  label?: React.ReactNode;
  className?: string;
  title?: string;
}

export function SortableHeader<T extends string = string>({
  columnKey,
  sortKey,
  currentSortKey,
  currentSortColumn,
  direction,
  currentSortDirection,
  onSort,
  align = "left",
  children,
  label,
  className = "",
  title,
}: SortableHeaderProps<T>) {
  const activeKey = (sortKey ?? columnKey) as T;
  const content = children ?? label;
  const effectiveCurrentKey = currentSortColumn ?? currentSortKey;
  const effectiveDirection = currentSortDirection ?? direction ?? "asc";
  const isActive = effectiveCurrentKey === activeKey;


  const justifyClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  return (
    <th
      className={`p-3.5 select-none ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } ${className}`}
      title={title || "Cliquer pour trier"}
    >
      <button
        type="button"
        onClick={() => onSort(activeKey)}
        className={`group inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] transition-colors cursor-pointer w-full focus:outline-hidden ${justifyClass} ${
          isActive
            ? "text-brand-orange"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <span>{content}</span>

        <span
          className={`shrink-0 transition-opacity ${
            isActive
              ? "opacity-100 text-brand-orange"
              : "opacity-40 group-hover:opacity-80 text-slate-400"
          }`}
          aria-hidden="true"
        >
          {isActive ? (
            effectiveDirection === "asc" ? (
              <ChevronUp size={13} className="stroke-[2.5]" />
            ) : (
              <ChevronDown size={13} className="stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown size={11} className="stroke-[2]" />
          )}
        </span>
      </button>
    </th>
  );
}
