import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-brand-500">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "h-11 w-full appearance-none rounded-lg border border-ink-200 bg-white px-3.5 pr-9 text-sm text-ink-900",
              "focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400",
              error && "border-danger-600",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        </div>
        {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
