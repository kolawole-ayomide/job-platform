"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { TagInput } from "@/components/ui/TagInput";
import { useOnboardingStore } from "@/store/useOnboardingStore";

const INDUSTRY_SUGGESTIONS = [
  "Technology", "Education", "Healthcare", "Finance", "E-commerce",
  "Manufacturing", "Media & Entertainment", "Non-profit", "Government", "Consulting",
];

// Same dictionary backend/services/resumeParser.service.js matches against,
// so suggestions here stay consistent with what auto-fill can detect.
const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "Python", "Java", "React", "Next.js", "Node.js",
  "Express", "MongoDB", "PostgreSQL", "SQL", "GraphQL", "AWS", "Docker",
  "Kubernetes", "Git", "Tailwind CSS", "Figma", "Project Management", "Agile",
];

export default function IndustrySkillsPage() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();
  const [industries, setIndustries] = useState(draft.targetIndustries);
  const [skills, setSkills] = useState(draft.topSkills);

  function proceed() {
    update({ targetIndustries: industries, topSkills: skills });
    router.push("/onboarding/salary");
  }

  return (
    <OnboardingLayout step={5} title="Industry & Skills" subtitle="Help us match you with the right opportunities">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          proceed();
        }}
        className="space-y-5"
      >
        <TagInput
          label="Target Industries"
          required
          placeholder="e.g. Education"
          values={industries}
          onChange={setIndustries}
          suggestions={INDUSTRY_SUGGESTIONS}
        />
        <TagInput
          label="Top Skills"
          required
          placeholder="e.g. TypeScript"
          values={skills}
          onChange={setSkills}
          suggestions={SKILL_SUGGESTIONS}
        />

        <StepFooter onBack={() => router.push("/onboarding/preferences")} />
      </form>
    </OnboardingLayout>
  );
}
