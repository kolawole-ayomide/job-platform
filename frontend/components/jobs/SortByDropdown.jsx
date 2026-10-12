"use client";

import { useState } from "react";
import { ArrowUpDown, Check } from "lucide-react";

// Values match the backend's real jobQuerySchema.sortBy enum
// (recent/salary-high/salary-low/relevance) - previously these were
// "recent"/"relevant"/"salary" and didn't correspond to anything the
// server understood, so only "recent" ever actually worked.
const OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "relevance", label: "Most Relevant" },
  { value: "salary-high", label: "Highest Salary" },
  { value: "salary-low", label: "Lowest Salary" },
];

export function SortByDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
      >
        <ArrowUpDown className="size-3.5" />
        Sort By: {current.label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-52 rounded-xl border border-ink-100 bg-white p-1.5 shadow-lg">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
              >
                {opt.label}
                {value === opt.value && <Check className="size-3.5 text-brand-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
