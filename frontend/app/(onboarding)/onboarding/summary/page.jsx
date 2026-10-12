"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { Input } from "@/components/ui/Input";
import { useOnboardingStore } from "@/store/useOnboardingStore";

// Figma caps this at 500 with "aim for 150-300" guidance - the backend's
// own ceiling (Profile.model.js) is 2000, so this is a stricter, design-
// matched frontend limit, not a backend change; nothing here can violate
// the backend's own (more permissive) constraint.
const MAX_SUMMARY = 500;

const tips = [
  "Highlight your key skills and expertise",
  "Mention your years of experience",
  "Include your career goals or interests",
  "Keep it concise and impactful (2-3 sentences)",
];

export default function SummaryPage() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();

  const form = useForm({
    defaultValues: {
      summary: draft.summary,
      currentRole: draft.currentRole,
      yearsOfExperience: draft.yearsOfExperience,
    },
  });

    const summaryValue = useWatch({ control: form.control, name: "summary" }) ?? "";

  function onSubmit(values) {
    update(values);
    router.push("/onboarding/preferences");
  }

  return (
    <OnboardingLayout step={3} title="Professional Summary" subtitle="Tell us about your professional background">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-500">Professional Summary</label>
          <textarea
            rows={4}
            maxLength={MAX_SUMMARY}
            placeholder="Write a brief summary about yourself, your experience, and your career goals"
            className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            {...form.register("summary")}
          />
          <p className="mt-1 text-right text-xs text-ink-400">
            {summaryValue.length}/{MAX_SUMMARY} characters (aim for 150-300)
          </p>
        </div>

        <Input label="Current/Recent Role (Optional)" placeholder="Senior software engineer" {...form.register("currentRole")} />
        <Input label="Years of Experience (Optional)" type="number" min={0} placeholder="3" {...form.register("yearsOfExperience")} />

        <div className="rounded-xl bg-brand-50 px-4 py-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-600">
            <Sparkles className="size-3.5" />
            AI tips for a great summary:
          </p>
          <ul className="space-y-1">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-1.5 text-xs text-ink-600">
                <span className="text-success-600">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <StepFooter onBack={() => router.push("/onboarding/contact")} />
      </form>
    </OnboardingLayout>
  );
}
