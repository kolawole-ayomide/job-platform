import { cn } from "@/lib/utils";

export function CheckboxPill({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        checked
          ? "border-brand-500 bg-brand-50 text-brand-600"
          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
      )}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded border",
          checked ? "border-brand-500 bg-brand-500" : "border-ink-300"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-2.5 fill-white">
            <path d="M4.5 8.5 2 6l.7-.7L4.5 7l4.3-4.3L9.5 3.4z" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
