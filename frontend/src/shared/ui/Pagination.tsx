import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  // Nom (singulier) de ce qui est compté, pour un message explicite —
  // ex. "enseignant" -> "1–10 sur 47 enseignants". Pluriel naïf (+ "s"),
  // suffisant pour le vocabulaire de l'app.
  label?: string;
};

// Pagination purement client (le backend ne propose pas encore d'endpoints
// paginés) : découpe une liste déjà chargée/filtrée en pages. Simple exprès —
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
    <div className="border-brand-gray/10 flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-brand-gray text-xs">
        <span className="text-brand-anthracite font-bold">
          {debut}–{fin}
        </span>{" "}
        sur {totalItems} {libelle}
      </p>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
          className="text-brand-anthracite hover:bg-brand-gray/10 rounded p-1.5 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-brand-anthracite px-2 text-xs font-bold whitespace-nowrap">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Page suivante"
          className="text-brand-anthracite hover:bg-brand-gray/10 rounded p-1.5 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
