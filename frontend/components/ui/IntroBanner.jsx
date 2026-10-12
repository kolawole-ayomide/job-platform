"use client";

import { useState } from "react";
import { X, PlayCircle, Sparkles } from "lucide-react";

// No real demo video exists yet (see Sidebar.jsx for the same honest
// treatment) - this button was previously wired to an onWatchDemo prop
// that no caller ever actually passed, meaning it silently did nothing.
// Disabled + a clear label instead, until there's a real video.
export function IntroBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-brand-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white">
          <Sparkles className="size-4 text-brand-500" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-900">Introducing WizJobAI</p>
          <p className="text-xs text-ink-500">See how wizbot helps you auto-apply to jobs on your behalf</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          title="Demo video coming soon"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-brand-600/40 px-3.5 py-1.5 text-xs font-medium text-white/80"
        >
          <PlayCircle className="size-3.5" />
          Demo coming soon
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-ink-400 hover:text-ink-700"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}