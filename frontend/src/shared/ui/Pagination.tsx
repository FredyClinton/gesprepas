import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  // Nom (singulier) de ce qui est compté, pour un message explicite -
  // ex. "enseignant" -> "1–10 sur 47 enseignants". Pluriel naïf (+ "s"),
  // suffisant pour le vocabulaire de l'app.
  label?: string;
};

// Pagination purement client (le backend ne propose pas encore d'endpoints
// paginés) : découpe une liste déjà chargée/filtrée en pages. Simple exprès -
// pas de saut direct à une page arbitraire, juste précédent/suivant + le
// numéro de la page courante.
export function Pagination({
  page,
  totalPages,
  onChange,
  totalItems,
  pageSize,
  label = "résultat",
}: Props) {
  if (totalPages <= 1) return null;

  const debut = (page - 1) * pageSize + 1;
  const fin = Math.min(page * pageSize, totalItems);
  const libelle = totalItems > 1 ? `${label}s` : label;

  return (
    <div className="border-slate-100 flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 rounded-b-xl">
      <p className="text-slate-500 text-xs">
        Affichage de{" "}
        <span className="text-brand-anthracite font-semibold">
          {debut} à {fin}
        </span>{" "}
        sur <span className="font-semibold text-brand-anthracite">{totalItems}</span> {libelle}
      </p>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-brand-anthracite disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-brand-anthracite shadow-2xs whitespace-nowrap">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Page suivante"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-brand-anthracite disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
