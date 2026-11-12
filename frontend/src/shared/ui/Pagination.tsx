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

// Barre de pagination (1-based) : sert aussi bien aux listes paginées côté
// serveur (apprenants, mouvements, ventes, dossiers : totalItems = totalElements
// renvoyé par l'API) qu'aux petites listes découpées côté client. Simple exprès -
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
    <div className="flex flex-col gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Affichage de{" "}
        <span className="text-brand-anthracite font-semibold">
          {debut} à {fin}
        </span>{" "}
        sur{" "}
        <span className="text-brand-anthracite font-semibold">
          {totalItems}
        </span>{" "}
        {libelle}
      </p>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
          className="hover:text-brand-anthracite flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-brand-anthracite rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Page suivante"
          className="hover:text-brand-anthracite flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
