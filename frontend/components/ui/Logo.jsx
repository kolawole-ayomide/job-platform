import { cn } from "@/lib/utils";

export function Logo({ className, light }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      <img src="/images/wizlogo.png" alt="WizJobAI logo" className="h-6 w-6 object-contain" />
      <span className={cn("text-base", light ? "text-white" : "text-ink-900")}>WizJobAI</span>
    </div>
  );
}
