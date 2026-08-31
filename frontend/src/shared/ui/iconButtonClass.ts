type IconButtonTone = "neutral" | "danger";

const TONE_CLASSES: Record<IconButtonTone, string> = {
  neutral:
    "border-brand-gray/30 text-brand-gray hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/5",
  danger: "border-red-200 text-red-600 hover:bg-red-50",
};

// Classes pour une action compacte à icône seule (éditer, supprimer, voir,
// suspendre...) : un vrai bouton bordé et visible au repos, pas une icône qui ne se
// distingue qu'au survol. Exposé en fonction (pas en composant) pour s'appliquer
// aussi bien à un <button> qu'à un <Link> Next.js, les deux étant utilisés selon les
// écrans pour la même famille d'actions.
export function iconButtonClass(tone: IconButtonTone = "neutral"): string {
  return `inline-flex items-center justify-center rounded-md border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${TONE_CLASSES[tone]}`;
}
