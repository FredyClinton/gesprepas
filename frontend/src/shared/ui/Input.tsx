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
          className="text-brand-anthracite block text-xs font-bold tracking-wide uppercase"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`border-brand-gray/30 focus:border-brand-orange focus:ring-brand-orange/30 w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none ${
              error ? "border-red-400" : ""
            } ${endAdornment ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {endAdornment}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
