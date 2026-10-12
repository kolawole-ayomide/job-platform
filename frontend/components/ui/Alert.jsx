import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Alert({ variant = "error", children }) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm",
        variant === "error"
          ? "border-danger-100 bg-danger-100/60 text-danger-600"
          : "border-success-100 bg-success-100/60 text-success-600"
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
