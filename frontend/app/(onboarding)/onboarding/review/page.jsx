"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Phone, MapPin, Link2, Globe, Briefcase, Layers, Tag, DollarSign } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useAuthStore } from "@/store/useAuthStore";
import * as onboardingApi from "@/lib/api/onboarding";
import { normalizeError } from "@/lib/api/client";

function Section({ icon: Icon, title, onEdit, children }) {
  return (
    <div className="border-b border-ink-100 py-4 last:border-none">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Icon className="size-4 text-ink-400" />
          {title}
        </p>
        <button type="button" onClick={onEdit} aria-label={`Edit ${title}`}>
          <Pencil className="size-4 text-brand-500" />
        </button>
      </div>
      {children}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-medium text-ink-700">
      {children}
    </span>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { draft, reset } = useOnboardingStore();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    setError(null);
    setIsSubmitting(true);
    try {
      await onboardingApi.completeOnboarding({
        resumeUrl: draft.resumeUrl || undefined,
        resumePublicId: draft.resumePublicId || undefined,
        phone: draft.phone,
        location: draft.location,
        headline: draft.currentRole,
        summary: draft.summary,
        skills: draft.topSkills,
        experience: draft.experience,
        education: draft.education,
        jobPreferences: {
          desiredRoles: draft.targetJobTitles,
          jobTypes: draft.jobTypes,
          workMode: draft.workMode,
          experienceLevel: draft.experienceLevel || undefined,
          preferredLocations: draft.location ? [draft.location] : [],
        },
        availability: {
          status: draft.availabilityStatus,
          noticePeriod: undefined,
        },
        salaryExpectation: {
          currency: draft.currency.split(" ")[0] || "USD",
          min: draft.minSalary ? Number(draft.minSalary) : undefined,
          max: draft.maxSalary ? Number(draft.maxSalary) : undefined,
        },
      });

      if (user) setUser({ ...user, onboardingComplete: true });
      reset();
      router.push("/get-started");
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <OnboardingLayout step={null} title="" width="max-w-2xl">
      <div className="mb-8 flex flex-col items-center text-center">
        <CheckCircle2 className="mb-3 size-12 text-brand-500" />
        <h1 className="text-2xl font-semibold text-ink-900">You All Set!</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          Take a few seconds to review your information before we complete this process.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="rounded-xl border border-ink-100 px-5">
        <Section icon={Phone} title="Contact Information" onEdit={() => router.push("/onboarding/contact")}>
          <div className="space-y-1.5 text-sm text-ink-600">
            <p className="flex items-center gap-2"><Phone className="size-3.5 text-ink-400" /> {draft.phone || "—"}</p>
            <p className="flex items-center gap-2"><MapPin className="size-3.5 text-ink-400" /> {draft.location || "—"}</p>
            {draft.linkedinProfile && (
              <p className="flex items-center gap-2"><Link2 className="size-3.5 text-ink-400" /> {draft.linkedinProfile}</p>
            )}
            {draft.portfolioUrl && (
              <p className="flex items-center gap-2"><Globe className="size-3.5 text-ink-400" /> {draft.portfolioUrl}</p>
            )}
          </div>
        </Section>

        <Section icon={Briefcase} title="Professional Summary" onEdit={() => router.push("/onboarding/summary")}>
          <p className="text-sm text-ink-600">{draft.summary || "—"}</p>
          {(draft.currentRole || draft.yearsOfExperience) && (
            <p className="mt-1 text-xs text-ink-400">
              {[draft.currentRole, draft.yearsOfExperience && `${draft.yearsOfExperience} years of experience`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </Section>

        <Section icon={Layers} title="Job Preferences" onEdit={() => router.push("/onboarding/preferences")}>
          <div className="grid grid-cols-2 gap-3 text-sm text-ink-600">
            <div>
              <p className="text-xs text-ink-400">Target Job</p>
              <p>{draft.targetJobTitles.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Job Type</p>
              <p>{draft.jobTypes.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Work Location</p>
              <p>{draft.workMode.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Experience Level</p>
                            <p className="capitalize">{draft.experienceLevel || "—"}</p>
            </div>
          </div>
        </Section>

        <Section icon={Tag} title="Industry & Skills" onEdit={() => router.push("/onboarding/skills")}>
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-xs text-ink-400">Industries</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.targetIndustries.length
                  ? draft.targetIndustries.map((i) => <Chip key={i}>{i}</Chip>)
                  : <span className="text-sm text-ink-400">—</span>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-ink-400">Top Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.topSkills.length
                  ? draft.topSkills.map((s) => <Chip key={s}>{s}</Chip>)
                  : <span className="text-sm text-ink-400">—</span>}
              </div>
            </div>
          </div>
        </Section>

        <Section icon={DollarSign} title="Salary & Availability" onEdit={() => router.push("/onboarding/salary")}>
          <div className="grid grid-cols-2 gap-3 text-sm text-ink-600">
            <div>
              <p className="text-xs text-ink-400">Salary Range</p>
              <p>
                {draft.minSalary || draft.maxSalary
                  ? `${draft.minSalary || "—"} - ${draft.maxSalary || "—"}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Availability</p>
              <p className="capitalize">{draft.availabilityStatus.replace(/-/g, " ")}</p>
            </div>
          </div>
        </Section>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" defaultChecked className="size-4 rounded border-ink-300 text-brand-500" />
        All the information use is correct
      </label>

      <div className="mt-6 flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/onboarding/salary")}>
          ← Back
        </Button>
        <Button
          type="button"
          className="ml-auto"
          isLoading={isSubmitting}
          onClick={handleComplete}
        >
          Complete Setup
        </Button>
      </div>

      <div className="mt-6 rounded-xl bg-brand-50 px-4 py-3.5 text-xs text-ink-600">
        <p className="mb-1 font-medium text-brand-600">Here&apos;s what happens next</p>
        <ul className="space-y-1">
          <li>✓ We&apos;ll use this info to find the best job matches</li>
          <li>✓ You can create AI agents to auto-apply to jobs</li>
          <li>✓ Track all your applications in one place</li>
          <li>✓ Get insights and analytics on your job search</li>
        </ul>
      </div>
    </OnboardingLayout>
  );
}
