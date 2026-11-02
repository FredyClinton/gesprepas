import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
};

// Champ de formulaire générique avec label et message d'erreur, pensé pour
// react-hook-form (`register(...)` s'étale directement sur les props natives).
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", endAdornment, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="text-slate-700 block text-xs font-semibold tracking-tight"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-brand-anthracite placeholder:text-slate-400 transition-all duration-150 hover:border-slate-300 focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/15 focus:outline-none ${
              error ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200/50" : ""
            } ${endAdornment ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {endAdornment}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-rose-600 animate-in fade-in duration-150">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
