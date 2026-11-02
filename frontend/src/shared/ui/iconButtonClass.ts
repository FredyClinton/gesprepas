type IconButtonTone = "neutral" | "danger" | "primary" | "institutional";

const TONE_CLASSES: Record<IconButtonTone, string> = {
  neutral:
    "border-slate-200 text-slate-500 bg-white shadow-2xs hover:border-slate-300 hover:text-brand-anthracite hover:bg-slate-50",
  danger: "border-rose-200 text-rose-600 bg-white shadow-2xs hover:bg-rose-50 hover:border-rose-300",
  primary: "border-brand-orange/30 text-brand-orange bg-white shadow-2xs hover:bg-brand-orange/10 hover:border-brand-orange",
  institutional: "border-[#2D2E80]/30 text-[#2D2E80] bg-white shadow-2xs hover:bg-[#2D2E80]/10 hover:border-[#2D2E80]",
};

// Classes pour une action compacte à icône seule (éditer, supprimer, voir, suspendre...)
export function iconButtonClass(tone: IconButtonTone = "neutral"): string {
  return `inline-flex items-center justify-center rounded-lg border p-1.5 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 ${TONE_CLASSES[tone]}`;
}
