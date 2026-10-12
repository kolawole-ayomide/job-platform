import { Button } from "@/components/ui/Button";

export function StepFooter({ onBack, onSkip, continueLabel = "Continue →", isLoading, showBack = true }) {
  return (
    <div className="mt-8 flex items-center gap-3">
      {showBack && (
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
      )}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="mx-auto text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          Skip
        </button>
      )}
      <Button type="submit" isLoading={isLoading} className={onSkip ? "" : "ml-auto"}>
        {continueLabel}
      </Button>
    </div>
  );
}
