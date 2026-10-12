"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useSavedJobsStore } from "@/store/useSavedJobsStore";
import { cn } from "@/lib/utils";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.max(1, Math.round(diffMs / 3_600_000));
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const jobTypeLabel = {
  "full-time": "Fulltime",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const levelLabel = {
  entry: "Entry Level",
  mid: "Medium Level",
  senior: "Senior Level",
  lead: "Lead",
  executive: "Executive",
};

export function JobCard({ job }) {
  const saved = useSavedJobsStore((s) => s.isSaved(job._id));
  const toggle = useSavedJobsStore((s) => s.toggle);

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="block rounded-xl border border-ink-100 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        {job.companyLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.companyLogoUrl}
            alt=""
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-500">
            {job.company?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(job._id);
          }}
          aria-label={saved ? "Unsave job" : "Save job"}
        >
          <Bookmark className={cn("size-4", saved ? "fill-brand-500 text-brand-500" : "text-ink-300")} />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-ink-900">{job.title}</p>
        {job.source === "jsearch" && (
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">External</span>
        )}
      </div>
      <p className="text-xs text-ink-500">{job.company}</p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600">
          {jobTypeLabel[job.jobType] ?? job.jobType}
        </span>
        {job.experienceLevel && (
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600">
            {levelLabel[job.experienceLevel] ?? job.experienceLevel}
          </span>
        )}
        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600 capitalize">
          {job.workMode}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
        <span>{job.location}</span>
        <span>{timeAgo(job.createdAt)}</span>
      </div>
    </Link>
  );
}
