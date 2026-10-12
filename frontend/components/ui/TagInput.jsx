"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Cycles through a few pastel colors per tag (matching the design) instead
// of a single flat color - purely cosmetic, index-based, no meaning attached
// to which color a given tag gets.
const TAG_COLORS = [
  "bg-brand-100 text-brand-600",
  "bg-violet-100 text-violet-600",
  "bg-rose-100 text-rose-600",
];

export function TagInput({ label, required, values, onChange, placeholder, suggestions = [] }) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  function addTag(tag) {
    const trimmed = tag.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(draft.toLowerCase()) && !values.includes(s)
  );

  return (
    <div className="relative w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-brand-500">
          {label}
          {required && <span className="text-danger-600"> *</span>}
        </label>
      )}
      <div className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400">
        {values.map((tag, i) => (
          <span
            key={tag}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              TAG_COLORS[i % TAG_COLORS.length]
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== tag))}
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={values.length ? "" : placeholder}
          className="min-w-24 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-ink-400"
        />
      </div>

      {focused && draft && filteredSuggestions.length > 0 && (
        <ul className={cn("absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg")}>
          {filteredSuggestions.slice(0, 6).map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="w-full px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-brand-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
