import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-brand-500">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-11 w-full rounded-lg border border-ink-200 bg-white px-3.5 text-sm text-ink-900",
            "placeholder:text-ink-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400",
            error && "border-danger-600 focus:ring-danger-600 focus:border-danger-600",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger-600">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
