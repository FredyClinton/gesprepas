import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "institutional" | "outline" | "ghost" | "danger" | "compact";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-orange text-white hover:bg-[#e07f12] focus-visible:outline-brand-orange shadow-xs active:scale-[0.98]",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:border-[#2D2E80]/40 hover:bg-[#2D2E80]/5 hover:text-[#2D2E80] focus-visible:outline-[#2D2E80] shadow-2xs active:scale-[0.98]",
  institutional:
    "bg-[#2D2E80] text-white hover:bg-[#222365] focus-visible:outline-[#2D2E80] shadow-xs active:scale-[0.98]",
  outline:
    "bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-slate-400",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-xs active:scale-[0.98]",
  compact:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 text-xs rounded-md font-medium",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

// Bouton d'action standard EXCELIS PRÉPAS
// `primary` : Orange officiel #F7931E pour actions majeures
// `secondary` : Fond blanc bordé réactif avec accent bleu pourpre #2D2E80
// `institutional` : Bleu pourpre plein #2D2E80 pour actions institutionnelles
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
