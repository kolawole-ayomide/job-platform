"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ExperienceEditor({ value, onChange }) {
  function update(index, patch) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }
  function remove(index) {
    onChange(value.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...value, { company: "", title: "", startDate: "", endDate: "", description: "" }]);
  }

  return (
    <div className="space-y-4">
      {value.map((exp, i) => (
        <div key={i} className="rounded-xl border border-ink-100 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="grid flex-1 grid-cols-2 gap-3">
              <Input placeholder="Job title" value={exp.title} onChange={(e) => update(i, { title: e.target.value })} />
              <Input placeholder="Company" value={exp.company} onChange={(e) => update(i, { company: e.target.value })} />
            </div>
            <button onClick={() => remove(i)} aria-label="Remove experience" className="mt-2 text-ink-300 hover:text-danger-600">
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Input placeholder="Start date" value={exp.startDate ?? ""} onChange={(e) => update(i, { startDate: e.target.value })} />
            <Input placeholder="End date (or 'Present')" value={exp.endDate ?? ""} onChange={(e) => update(i, { endDate: e.target.value })} />
          </div>
          <textarea
            rows={2}
            placeholder="What did you work on?"
            value={exp.description ?? ""}
            onChange={(e) => update(i, { description: e.target.value })}
            className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" /> Add experience
      </Button>
    </div>
  );
}
