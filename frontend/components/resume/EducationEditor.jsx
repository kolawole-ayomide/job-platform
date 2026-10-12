"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function EducationEditor({ value, onChange }) {
  function update(index, patch) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }
  function remove(index) {
    onChange(value.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...value, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }]);
  }

  return (
    <div className="space-y-4">
      {value.map((edu, i) => (
        <div key={i} className="rounded-xl border border-ink-100 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <Input
              placeholder="Institution"
              value={edu.institution}
              onChange={(e) => update(i, { institution: e.target.value })}
              className="flex-1"
            />
            <button onClick={() => remove(i)} aria-label="Remove education" className="mt-2 text-ink-300 hover:text-danger-600">
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Input placeholder="Degree" value={edu.degree ?? ""} onChange={(e) => update(i, { degree: e.target.value })} />
            <Input placeholder="Field of study" value={edu.fieldOfStudy ?? ""} onChange={(e) => update(i, { fieldOfStudy: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Start date" value={edu.startDate ?? ""} onChange={(e) => update(i, { startDate: e.target.value })} />
            <Input placeholder="End date" value={edu.endDate ?? ""} onChange={(e) => update(i, { endDate: e.target.value })} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" /> Add education
      </Button>
    </div>
  );
}
