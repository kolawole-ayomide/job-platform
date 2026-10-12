"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { TagInput } from "@/components/ui/TagInput";
import { Select } from "@/components/ui/Select";
import { CheckboxPill } from "@/components/ui/CheckboxPill";
import { useOnboardingStore } from "@/store/useOnboardingStore";

// Matches Profile.model.js jobPreferences.jobTypes enum
const JOB_TYPES = [
  { value: "full-time", label: "Fulltime" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

// Matches Profile.model.js jobPreferences.workMode enum
const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
  { value: "any", label: "Anyone" },
];

// Matches Job.model.js / Profile.model.js experienceLevel enum
const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead/Principal" },
  { value: "executive", label: "Executive" },
];

export default function JobPreferencesPage() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();
  const [targetJobTitles, setTargetJobTitles] = useState(draft.targetJobTitles);

  const form = useForm({
    defaultValues: {
      jobTypes: draft.jobTypes,
      workMode: draft.workMode,
      experienceLevel: draft.experienceLevel,
    },
  });

  function proceed(values) {
    update({ ...values, targetJobTitles });
    router.push("/onboarding/skills");
  }

  return (
    <OnboardingLayout step={4} title="Job Preferences" subtitle="What type of roles are you looking for?">
      <form onSubmit={form.handleSubmit(proceed)} className="space-y-5">
        <TagInput
          label="Target job title"
          placeholder="Teacher"
          values={targetJobTitles}
          onChange={setTargetJobTitles}
        />

        <div>
          <label className="mb-2 block text-xs font-medium text-brand-500">Job Type</label>
          <Controller
            control={form.control}
            name="jobTypes"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((opt) => (
                  <CheckboxPill
                    key={opt.value}
                    label={opt.label}
                    checked={field.value.includes(opt.value)}
                    onChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, opt.value]
                          : field.value.filter((v) => v !== opt.value)
                      )
                    }
                  />
                ))}
              </div>
            )}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-brand-500">
            Work Location Preference (Multiple selection)
          </label>
          <Controller
            control={form.control}
            name="workMode"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {WORK_MODES.map((opt) => (
                  <CheckboxPill
                    key={opt.value}
                    label={opt.label}
                    checked={field.value.includes(opt.value)}
                    onChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, opt.value]
                          : field.value.filter((v) => v !== opt.value)
                      )
                    }
                  />
                ))}
              </div>
            )}
          />
        </div>

        <Select label="Experience Level" {...form.register("experienceLevel")}>
          <option value="">Select experience level</option>
                    {EXPERIENCE_LEVELS.map((lvl) => (
            <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
          ))}
        </Select>

        <StepFooter
          onBack={() => router.push("/onboarding/summary")}
          onSkip={() => proceed({})}
        />
      </form>
    </OnboardingLayout>
  );
}
