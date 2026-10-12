"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useSavedJobsStore } from "@/store/useSavedJobsStore";
import { cn } from "@/lib/utils";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.max(1, Math.round(diffMs / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function JobListTable({ jobs }) {
  const savedIds = useSavedJobsStore((s) => s.savedIds);
  const toggle = useSavedJobsStore((s) => s.toggle);

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
            <th className="px-4 py-3 font-medium">Company/Position</th>
            <th className="px-4 py-3 font-medium">Job Type</th>
            <th className="px-4 py-3 font-medium">Date Posted</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job._id} className="border-b border-ink-50 last:border-none hover:bg-ink-50/50">
              <td className="px-4 py-3">
                <Link href={`/jobs/${job._id}`} className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-ink-50 text-xs font-semibold text-ink-500">
                    {job.company?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span>
                    <span className="flex items-center gap-1.5">
                      <span className="block font-medium text-ink-900">{job.title}</span>
                      {job.source === "jsearch" && (
                        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                          External
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-ink-400">{job.company}</span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-ink-600 capitalize">{job.jobType.replace("-", " ")}</td>
              <td className="px-4 py-3 text-ink-500">{timeAgo(job.createdAt)}</td>
              <td className="px-4 py-3 text-ink-600">{job.location}</td>
              <td className="px-4 py-3">
                <button onClick={() => toggle(job._id)} aria-label="Save job">
                  <Bookmark
                    className={cn(
                      "size-4",
                      savedIds.includes(job._id) ? "fill-brand-500 text-brand-500" : "text-ink-300"
                    )}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
