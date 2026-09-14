"use client";

import { Calendar } from "lucide-react";

type Props = {
  semaines: number[];
  value: number | "TOUTES";
  semaineCourante?: number;
  onChange: (value: number | "TOUTES") => void;
  toutes?: boolean;
};

export function SelecteurSemaine({
  semaines,
  value,
  semaineCourante,
  onChange,
  toutes = false,
}: Props) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
      <Calendar size={15} className="shrink-0 text-brand-orange" />
      <span className="hidden text-xs font-bold tracking-wider text-slate-500 uppercase sm:inline">
        Semaine :
      </span>
      <select
        value={value === "TOUTES" ? "TOUTES" : String(value)}
        onChange={(event) =>
          onChange(
            event.target.value === "TOUTES"
              ? "TOUTES"
              : Number(event.target.value),
          )
        }
        className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-800 outline-none sm:text-sm"
      >
        {toutes && <option value="TOUTES">Toutes les semaines</option>}
        {semaines.map((semaine) => (
          <option key={semaine} value={String(semaine)}>
            Semaine {semaine}
            {semaine === semaineCourante ? " (en cours)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}