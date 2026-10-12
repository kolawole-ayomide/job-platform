import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const emptyDraft = {
  resumeUrl: "",
  resumePublicId: "",
  skippedResume: false,
  phone: "",
  location: "",
  linkedinProfile: "",
  portfolioUrl: "",
  summary: "",
  currentRole: "",
  yearsOfExperience: "",
  targetJobTitles: [],
  jobTypes: [],
  workMode: [],
  experienceLevel: "",
  targetIndustries: [],
  topSkills: [],
  currency: "USD",
  minSalary: "",
  maxSalary: "",
  availabilityStatus: "actively-looking",
  willingToRelocate: false,
  experience: [],
  education: [],
};

export const useOnboardingStore = create(
  persist(
    (set) => ({
      draft: emptyDraft,
      update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      reset: () => set({ draft: emptyDraft }),
    }),
    {
      name: "wizjobai-onboarding-draft",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
