"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, Flag, Loader2, CheckCircle2, Globe, ExternalLink } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { ReportJobModal } from "@/components/jobs/ReportJobModal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useSavedJobsStore } from "@/store/useSavedJobsStore";
import * as jobsApi from "@/lib/api/jobs";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function formatSalary(job) {
  const { currency, min, max } = job.salaryRange || {};
  if (!min && !max) return "Not specified";
  const fmt = (n) => (n ? n.toLocaleString() : "");
  if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}`;
  return `${currency} ${fmt(min || max)}`;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [sidebarJobs, setSidebarJobs] = useState([]);
  // Real, server-computed match score now (GET /jobs/:id returns matchScore
  // + isSaved directly - no more client-side profile/job skill diffing).
  const [matchPercent, setMatchPercent] = useState(null);
  const [tab, setTab] = useState("description");
  const [reportOpen, setReportOpen] = useState(false);

    const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyState, setApplyState] = useState("idle");
  const [applyError, setApplyError] = useState(null);
  const [loadedJobId, setLoadedJobId] = useState(jobId);

  const saved = useSavedJobsStore((s) => s.isSaved(jobId));
  const toggleSaved = useSavedJobsStore((s) => s.toggle);
  const savedIds = useSavedJobsStore((s) => s.savedIds);

  // Reset synchronously during render when the route's jobId changes (e.g.
  // navigating from one job's detail page to another via the sidebar), so
  // the UI shows a fresh loading state immediately instead of stale content
  // lingering until the fetch effect below finishes. This runs during
  // render, not inside the effect, so it's not a "setState in effect" call.
  if (jobId !== loadedJobId) {
    setLoadedJobId(jobId);
    setLoading(true);
    setError(null);
    setJob(null);
    setMatchPercent(null);
  }

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      jobsApi.getJobById(jobId),
      jobsApi.listJobs({ limit: 10 }),
      jobsApi.getMyApplications(),
    ]).then(([jobRes, listRes, appsRes]) => {
      if (cancelled) return;

      if (jobRes.status === "fulfilled") {
        setJob(jobRes.value.data.job);
        setMatchPercent(jobRes.value.data.matchScore);
        // Sync the saved-jobs store if this job was saved elsewhere and
        // hasn't been fetched into the store yet.
        if (jobRes.value.data.isSaved && !savedIds.includes(jobId)) {
          useSavedJobsStore.setState((s) => ({ savedIds: [...s.savedIds, jobId] }));
        }
      } else {
        setError(normalizeError(jobRes.reason).message);
      }

      if (listRes.status === "fulfilled") setSidebarJobs(listRes.value.data.jobs);

      if (appsRes.status === "fulfilled") {
        const already = appsRes.value.data.applications.some(
          (a) => (typeof a.jobId === "string" ? a.jobId : a.jobId._id) === jobId
        );
        if (already) setApplyState("applied");
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function handleApply() {
    setApplyState("loading");
    setApplyError(null);
    try {
      await jobsApi.applyToJob(jobId);
      setApplyState("applied");
    } catch (err) {
      setApplyState("error");
      setApplyError(normalizeError(err).message);
    }
  }

  return (
    <>
      <DashboardTopbar
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Search Jobs", href: "/jobs" },
          { label: "Job Details" },
        ]}
      />

      <main className="flex-1 px-6 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="size-4" /> Job Details
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : !job ? (
          <Alert>{error ?? "Job not found."}</Alert>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            {/* Left rail */}
            <div className="hidden max-h-[70vh] space-y-2 overflow-y-auto lg:block">
              {sidebarJobs.map((j) => (
                <Link
                  key={j._id}
                  href={`/jobs/${j._id}`}
                  className={cn(
                    "block rounded-xl border p-3",
                    j._id === job._id ? "border-brand-400 bg-brand-50" : "border-ink-100 bg-white hover:bg-ink-50"
                  )}
                >
                  <p className="text-sm font-medium text-ink-900">{j.title}</p>
                  <p className="text-xs text-ink-500">{j.company}</p>
                  <p className="mt-1 text-xs text-ink-400">{j.location}</p>
                </Link>
              ))}
            </div>

            {/* Detail pane */}
            <div className="rounded-xl border border-ink-100 bg-white p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-ink-900">{job.title}</h1>
                    {job.source === "jsearch" && (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                        External listing
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-500">
                    {job.company} · {job.location} · posted{" "}
                    {new Date(job.externalPostedAt ?? job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {matchPercent !== null && (
                    <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-600">
                      {matchPercent}% Match
                    </span>
                  )}
                  <button
                    onClick={() => setReportOpen(true)}
                    aria-label="Report this job"
                    className="text-ink-400 hover:text-danger-600"
                  >
                    <Flag className="size-4" />
                  </button>
                  <button onClick={() => toggleSaved(job._id)} aria-label="Save job">
                    <Bookmark className={cn("size-4", saved ? "fill-brand-500 text-brand-500" : "text-ink-400")} />
                  </button>
                  {job.source === "jsearch" ? (
                    // External listing - we have no ATS to submit to, so
                    // "Apply" honestly sends the person to the real posting
                    // instead of creating a fake local application record.
                    <a href={job.applyUrl} target="_blank" rel="noreferrer">
                      <Button>
                        <ExternalLink className="size-4" /> Apply on original site
                      </Button>
                    </a>
                  ) : applyState === "applied" ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-success-100 px-4 py-2 text-sm font-medium text-success-600">
                      <CheckCircle2 className="size-4" /> Applied
                    </span>
                  ) : (
                    <Button isLoading={applyState === "loading"} onClick={handleApply}>
                      Apply
                    </Button>
                  )}
                </div>
              </div>

              {applyError && <Alert>{applyError}</Alert>}

              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs text-ink-700">
                  {formatSalary(job)}
                </span>
                <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs text-ink-700 capitalize">
                  {job.jobType.replace("-", " ")}
                </span>
                <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs text-ink-700 capitalize">
                  {job.workMode}
                </span>
                {job.experienceLevel && (
                  <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs text-ink-700 capitalize">
                    {job.experienceLevel}
                  </span>
                )}
                {job.companySize && (
                  <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs text-ink-700">
                    {job.companySize} employees
                  </span>
                )}
              </div>

              <div className="mb-5 flex gap-1 rounded-lg bg-ink-50 p-1 w-fit">
                <button
                  onClick={() => setTab("description")}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium",
                    tab === "description" ? "bg-white shadow-sm text-ink-900" : "text-ink-500"
                  )}
                >
                  Job Description
                </button>
                <button
                  onClick={() => setTab("company")}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium",
                    tab === "company" ? "bg-white shadow-sm text-ink-900" : "text-ink-500"
                  )}
                >
                  Company
                </button>
              </div>

              {tab === "description" ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-ink-900">Overview</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">{job.description}</p>
                  </div>
                  {job.requirements?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-ink-900">Requirements</h3>
                      <ul className="list-inside list-disc space-y-1 text-sm text-ink-600">
                        {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {job.responsibilities?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-ink-900">Responsibilities</h3>
                      <ul className="list-inside list-disc space-y-1 text-sm text-ink-600">
                        {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl bg-brand-50 px-4 py-3.5 text-xs text-ink-600">
                    Use AI to find out how well your skills and resume fit this job description.
                  </div>

                  <div className="flex gap-3">
                    <Link href="/resume">
                      <Button variant="outline">Optimize Resume for this Role</Button>
                    </Link>
                    <Link href="/interview-prep">
                      <Button>Take Interview Prep</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    {job.companyLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.companyLogoUrl}
                        alt={`${job.company} logo`}
                        className="size-11 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-11 items-center justify-center rounded-full bg-ink-50 text-base font-semibold text-ink-600">
                        {job.company?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-ink-900">{job.company}</p>
                      <p className="text-xs text-ink-500">{job.location}</p>
                    </div>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-ink-900">About {job.company}</h3>
                  {job.companyDescription ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
                      {job.companyDescription}
                    </p>
                  ) : (
                    <p className="text-sm text-ink-500">
                      {job.source === "jsearch"
                        ? "No company description was available from the original listing."
                        : "This company hasn't added a description yet."}
                    </p>
                  )}
                  {job.companySize && (
                    <p className="mt-3 text-sm text-ink-600">
                      <span className="font-medium text-ink-900">Company size:</span> {job.companySize} employees
                    </p>
                  )}
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-1.5 text-sm text-brand-500 hover:underline"
                    >
                      <Globe className="size-3.5" /> {job.companyWebsite}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ReportJobModal open={reportOpen} onClose={() => setReportOpen(false)} jobId={jobId} />
    </>
  );
}
