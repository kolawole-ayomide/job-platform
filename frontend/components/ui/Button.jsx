import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary: "bg-brand-600 text-white hover:bg-navy-900 disabled:bg-brand-600/50",
  secondary: "bg-ink-100 text-ink-900 hover:bg-ink-200 disabled:opacity-50",
  outline: "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50 disabled:opacity-50",
  danger: "bg-danger-600 text-white hover:bg-danger-600/90 disabled:opacity-50",
  ghost: "text-ink-700 hover:bg-ink-100 disabled:opacity-50",
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef(
  (
    { className, variant = "primary", size = "md", isLoading, fullWidth, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
