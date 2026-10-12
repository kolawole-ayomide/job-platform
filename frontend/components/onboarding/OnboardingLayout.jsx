import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { cn } from "@/lib/utils";

// Matches the Figma design: 6 numbered steps (upload-resume through
// salary/availability). The final "You're All Set!" review screen is a
// separate confirmation screen with no step counter at all - not step 7 -
// see the `step={null}` usage in review/page.jsx.
const TOTAL_STEPS = 6;

// The design shows the bar shifting red -> orange -> blue as steps advance.
function progressColor(step) {
  if (step <= 2) return "bg-danger-600";
  if (step <= 4) return "bg-warning-600";
  return "bg-brand-500";
}

export function OnboardingLayout({ step, title, subtitle, children, width = "max-w-xl" }) {
  const showStepper = step !== null && step !== undefined;
  const percent = showStepper ? Math.round((step / TOTAL_STEPS) * 10000) / 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex flex-1 justify-center px-4 py-10">
        <div className={cn("w-full", width)}>
          {showStepper && (
            <>
              <div className="mb-6 flex items-center justify-between text-xs text-ink-500">
                <span>Step {step} of {TOTAL_STEPS}</span>
                <span>{percent}% Complete</span>
              </div>
              <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor(step))}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          )}

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          </div>

          {children}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
