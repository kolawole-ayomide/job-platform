"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { Select } from "@/components/ui/Select";
import { useOnboardingStore } from "@/store/useOnboardingStore";

// Native <input type="number"> can't display or accept comma-formatted
// text at all (typing a comma is invalid input and gets rejected), so the
// design's "$ 8,000" style display needs a real text input that formats as
// you type - not a number input with a placeholder it could never match.
function CurrencyInput({ label, value, onChange, placeholder }) {
  function handleChange(e) {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    onChange(digitsOnly);
  }
  const display = value ? Number(value).toLocaleString("en-US") : "";

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-medium text-brand-500">{label}</label>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">$</span>
        <input
          value={display}
          onChange={handleChange}
          inputMode="numeric"
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-ink-200 bg-white pl-7 pr-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        />
      </div>
    </div>
  );
}

const CURRENCIES = ["USD ($)", "GBP (£)", "EUR (€)", "NGN (₦)", "CAD ($)"];

// Matches Profile.model.js availability.status enum. The design shows more
// granular options ("Within 3 Months" etc.) - we map those UI labels down
// to the 3 backend-accepted values via `noticePeriod` for the exact phrase.
const START_OPTIONS = [
  { value: "actively-looking", noticePeriod: "Immediately", label: "Immediately" },
  { value: "actively-looking", noticePeriod: "Within 1 Month", label: "Within 1 Month" },
  { value: "open-to-offers", noticePeriod: "Within 2 Months", label: "Within 2 Months" },
  { value: "open-to-offers", noticePeriod: "2-3 Months", label: "2-3 Months" },
  { value: "not-looking", noticePeriod: "Just exploring", label: "Just exploring" },
];

export default function SalaryAvailabilityPage() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();

  const [minSalary, setMinSalary] = useState(draft.minSalary);
  const [maxSalary, setMaxSalary] = useState(draft.maxSalary);

  const form = useForm({
    defaultValues: {
      currency: draft.currency || CURRENCIES[0],
      startOption: START_OPTIONS[0].label,
      willingToRelocate: draft.willingToRelocate,
    },
  });

  function proceed(values) {
    const matched = START_OPTIONS.find((o) => o.label === values.startOption);
    update({
      currency: values.currency ?? draft.currency,
      minSalary,
      maxSalary,
      availabilityStatus: matched?.value ?? draft.availabilityStatus,
      willingToRelocate: values.willingToRelocate ?? draft.willingToRelocate,
    });
    router.push("/onboarding/review");
  }

  return (
    <OnboardingLayout step={6} title="Salary & Availability" subtitle="Set your expectations for compensation">
      <form onSubmit={form.handleSubmit(proceed)} className="space-y-5">
        <Select label="Currency" {...form.register("currency")}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput label="Minimum Salary" value={minSalary} onChange={setMinSalary} placeholder="8,000" />
          <CurrencyInput label="Maximum Salary" value={maxSalary} onChange={setMaxSalary} placeholder="12,000" />
        </div>

        <Select label="When can you start?" {...form.register("startOption")}>
          {START_OPTIONS.map((o) => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
        </Select>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            className="size-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
            {...form.register("willingToRelocate")}
          />
          I&apos;m willing to relocate for the right opportunity
        </label>

        <StepFooter
          onBack={() => router.push("/onboarding/skills")}
          onSkip={() => proceed({})}
        />
      </form>
    </OnboardingLayout>
  );
}
