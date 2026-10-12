"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import * as onboardingApi from "@/lib/api/onboarding";
import { normalizeError } from "@/lib/api/client";
import { estimateYearsOfExperience } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024; // matches upload.middleware.js
const ACCEPTED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// The parser returns a loose `dates` string per experience entry rather than
// separate start/end fields (see resumeParser.service.js) - fold it into
// startDate so nothing is silently dropped; the user can split it later.
function normalizeParsedExperience(entries) {
  return entries.map((e) => ({
    company: e.company ?? "",
    title: e.title ?? "",
    location: "",
    startDate: e.dates ?? e.startDate ?? "",
    endDate: e.endDate ?? "",
    isCurrent: false,
    description: e.description ?? "",
  }));
}

export default function UploadResumePage() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [resumeUrlInput, setResumeUrlInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const [noResume, setNoResume] = useState(draft.skippedResume);

  async function handleFile(file) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Only PDF and DOC/DOCX files are allowed for resumes.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large. Max size is 5MB.");
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    try {
      const res = await onboardingApi.parseResume(file);
      const parsed = res.data;
      // Current Role and Years of Experience aren't returned directly by
      // the parser - they're derived here from the same parsed experience
      // list, so they only overwrite existing draft values when we
      // actually found something usable.
      const derivedCurrentRole = parsed.experience?.[0]?.title || draft.currentRole;
      const derivedYears = estimateYearsOfExperience(parsed.experience) || draft.yearsOfExperience;

      update({
        resumeUrl: parsed.resumeUrl,
        resumePublicId: parsed.resumePublicId,
        phone: parsed.phone ?? draft.phone,
        location: parsed.location ?? draft.location,
        summary: parsed.summary ?? draft.summary,
        currentRole: derivedCurrentRole,
        yearsOfExperience: derivedYears,
        topSkills: parsed.skills?.length ? parsed.skills : draft.topSkills,
        experience: normalizeParsedExperience(parsed.experience),
        education: parsed.education.map((e) => ({
          institution: e.institution ?? "",
          degree: e.degree ?? "",
          fieldOfStudy: e.fieldOfStudy ?? "",
          startDate: e.startDate ?? "",
          endDate: e.endDate ?? "",
        })),
        skippedResume: false,
      });
      setNoResume(false);
    } catch (err) {
      setError(normalizeError(err).message);
      setFileName("");
    } finally {
      setIsParsing(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleContinue(e) {
    e.preventDefault();
    const patch = { skippedResume: noResume };
    // If the user typed a resume link instead of uploading a file, treat it
    // the same as an uploaded resume's URL. Only applies when no file was
    // already uploaded+parsed - the upload takes priority if both are present.
    if (!draft.resumeUrl && resumeUrlInput.trim()) {
      patch.resumeUrl = resumeUrlInput.trim();
      patch.resumePublicId = ""; // not a Cloudinary asset - nothing to clean up later
    }
    update(patch);
    router.push("/onboarding/contact");
  }

  return (
    <OnboardingLayout
      step={1}
      title="Upload your resume"
      subtitle="This helps us auto-fill your applications and find better matches."
    >
      <form onSubmit={handleContinue}>
        {error && <Alert>{error}</Alert>}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragActive ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {isParsing ? (
            <>
              <Loader2 className="size-6 animate-spin text-brand-500" />
              <p className="text-sm text-ink-700">Parsing your resume…</p>
            </>
          ) : (
            <>
              <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm">
                <UploadCloud className="size-4 text-brand-500" />
              </span>
              <p className="text-sm font-medium text-brand-500">
                {fileName || "Click to upload resume"}
              </p>
              <p className="text-xs text-ink-400">or drag and drop here</p>
              <p className="text-xs text-ink-400">PDF, DOC, DOCX (max 5MB)</p>
            </>
          )}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-200" />
          Or provide a URL
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        <Input
          label="Enter Resume URL (Get access to 'Anyone with the link')"
          placeholder="https://drive.google.com/your-resume"
          value={resumeUrlInput}
          onChange={(e) => setResumeUrlInput(e.target.value)}
          hint="Link to your resume on Google Drive, Dropbox, or personal website"
        />

        <label className="mt-4 flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={noResume}
            onChange={(e) => setNoResume(e.target.checked)}
            className="size-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
          />
          I don&apos;t have a resume
        </label>

        <StepFooter showBack={false} isLoading={isParsing} />
      </form>
    </OnboardingLayout>
  );
}
