import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-orange text-brand-white hover:bg-brand-orange/90 focus-visible:outline-brand-orange",
  secondary:
    "bg-brand-white text-brand-anthracite border border-brand-gray/30 hover:bg-brand-gray/5 focus-visible:outline-brand-anthracite",
  ghost:
    "bg-transparent text-brand-anthracite hover:bg-brand-gray/10 focus-visible:outline-brand-anthracite",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

// Bouton d'action générique de l'appli. `primary` = orange, réservé aux actions
// principales (charte : "orange #F7931E — actions").
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
