"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { Input } from "@/components/ui/Input";
import { useOnboardingStore } from "@/store/useOnboardingStore";

// A short, real curated list rather than every country - the field just
// needs to produce a genuine E.164-style number (code + digits), and this
// covers the markets this app's onboarding text already references.
const COUNTRY_CODES = [
  { code: "+1", label: "+1 (US/CA)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+234", label: "+234 (NG)" },
  { code: "+91", label: "+91 (IN)" },
  { code: "+27", label: "+27 (ZA)" },
  { code: "+61", label: "+61 (AU)" },
];

// draft.phone is stored as one combined string (e.g. "+1 5551234567") - this
// splits it back into { code, number } for the two controlled inputs below,
// falling back to the first country code when nothing's been entered yet.
function splitPhone(phone) {
  const match = COUNTRY_CODES.find((c) => phone?.startsWith(c.code));
  if (match) return { code: match.code, number: phone.slice(match.code.length).trim() };
  return { code: COUNTRY_CODES[0].code, number: phone || "" };
}

export default function ContactInfoPage() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();
  const initialPhone = splitPhone(draft.phone);

  const form = useForm({
    defaultValues: {
      phoneCode: initialPhone.code,
      phoneNumber: initialPhone.number,
      location: draft.location,
      linkedinProfile: draft.linkedinProfile,
      portfolioUrl: draft.portfolioUrl,
    },
  });

  function onSubmit(values) {
    update({
      phone: values.phoneNumber ? `${values.phoneCode} ${values.phoneNumber}` : "",
      location: values.location,
      linkedinProfile: values.linkedinProfile,
      portfolioUrl: values.portfolioUrl,
    });
    router.push("/onboarding/summary");
  }

  return (
    <OnboardingLayout step={2} title="Contact Information" subtitle="Tell us about your professional background">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-500">Phone Number (Optional)</label>
          <div className="flex gap-2">
            <Controller
              control={form.control}
              name="phoneCode"
              render={({ field }) => (
                <select
                  {...field}
                  className="h-11 w-28 rounded-lg border border-ink-200 bg-white px-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              )}
            />
            <input
              placeholder="(555) 123-4567"
              className="h-11 flex-1 rounded-lg border border-ink-200 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              {...form.register("phoneNumber")}
            />
          </div>
        </div>
        <Input
          label="Current Location"
          placeholder="San Francisco, CA"
          {...form.register("location")}
        />
        <Input
          label="LinkedIn Profile (Optional)"
          placeholder="linkedin.com/in/yourname"
          {...form.register("linkedinProfile")}
        />
        <Input
          label="Portfolio Website URL (Optional)"
          placeholder="myportfolio.com"
          {...form.register("portfolioUrl")}
        />

        <StepFooter onBack={() => router.push("/onboarding/upload-resume")} />
      </form>
    </OnboardingLayout>
  );
}
