import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { cn } from "@/lib/utils";

// trendPercent and trendData both come from real backend aggregation
// (users.controller.js getDashboardSummary - last 7 days vs the 7 before,
// see the `trends`/`dailyTrend` fields). Both stay optional: a card with
// nothing to compare against yet (e.g. a brand new account) shows no
// trend arrow and no sparkline, rather than a fabricated placeholder.
export function StatCard({ label, value, accent, trendPercent, trendData }) {
  const accentClasses = {
    brand: "border-brand-100 bg-brand-50",
    purple: "border-violet-100 bg-violet-50",
    blue: "border-sky-100 bg-sky-50",
    default: "border-ink-100 bg-white",
  };

  const trendColor =
    typeof trendPercent === "number" ? (trendPercent >= 0 ? "#16A34A" : "#DC2626") : "#9294AB";

  return (
    <div className={cn("rounded-xl border p-4", accentClasses[accent ?? "default"])}>
      <p className="text-xs text-ink-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
        {trendData && trendData.length > 1 && <Sparkline data={trendData} color={trendColor} />}
      </div>
      {typeof trendPercent === "number" && (
        <span
          className={cn(
            "mt-1 flex items-center gap-0.5 text-xs font-medium",
            trendPercent >= 0 ? "text-success-600" : "text-danger-600"
          )}
        >
          {trendPercent >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(trendPercent)}%
        </span>
      )}
    </div>
  );
}