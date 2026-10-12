"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { JobSearchHero } from "@/components/jobs/JobSearchHero";
import { JobCard } from "@/components/jobs/JobCard";
import { JobListTable } from "@/components/jobs/JobListTable";
import { SortByDropdown } from "@/components/jobs/SortByDropdown";
import { Alert } from "@/components/ui/Alert";
import * as jobsApi from "@/lib/api/jobs";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const EMPTY_FILTERS = {
  keyword: "",
  location: "",
  jobType: "",
  experienceLevel: "",
  workMode: "",
  salaryMin: "",
  companySize: "",
};

export default function SearchJobsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState("grid");
  // Real backend sort values now (recent/relevance/salary-high/salary-low) -
  // see jobQuerySchema.sortBy and jobs.controller.js `listJobs`. Sorting
  // happens server-side across the full result set, not just this page.
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    let cancelled = false;
    jobsApi
      .listJobs({
        keyword: appliedFilters.keyword || undefined,
        location: appliedFilters.location || undefined,
        jobType: appliedFilters.jobType || undefined,
        experienceLevel: appliedFilters.experienceLevel || undefined,
        workMode: appliedFilters.workMode || undefined,
        // salaryMin's placeholder shows "$100,000" so people naturally type
        // currency-formatted input - strip everything but digits before
        // converting, or Number("$2000") is NaN and fails the backend's
        // z.coerce.number().nonnegative() check with a generic "Validation
        // failed" error.
        salaryMin: appliedFilters.salaryMin
          ? Number(appliedFilters.salaryMin.replace(/[^0-9]/g, "")) || undefined
          : undefined,
        companySize: appliedFilters.companySize || undefined,
        sortBy,
        page,
        limit: 10,
      })
      .then((res) => {
        if (cancelled) return;
        setJobs(res.data.jobs);
        setPagination(res.data.pagination);
      })
      .catch((err) => !cancelled && setError(normalizeError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, sortBy, page]);

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Search Jobs" }]} />

      <main className="flex-1 px-6 py-6">
        <h1 className="mb-4 text-xl font-semibold text-ink-900">Discover Jobs</h1>

        <JobSearchHero
          value={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
                   onSubmit={() => {
            setLoading(true);
            setError(null);
            setPage(1);
            setAppliedFilters(filters);
          }}
          totalCount={pagination.total || undefined}
        />

        <div className="my-5 flex items-center justify-between">
          <p className="text-sm font-medium text-ink-900">Recommended for you</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-ink-200 p-0.5">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={cn("rounded-md p-1.5", view === "grid" ? "bg-brand-50 text-brand-600" : "text-ink-400")}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={cn("rounded-md p-1.5", view === "list" ? "bg-brand-50 text-brand-600" : "text-ink-400")}
              >
                <List className="size-4" />
              </button>
            </div>
            <SortByDropdown
              value={sortBy}
                            onChange={(v) => {
                setLoading(true);
                setError(null);
                setPage(1);
                setSortBy(v);
              }}
            />
          </div>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-12 text-center text-sm text-ink-400">
            No jobs match your filters. Try widening your search.
          </p>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        ) : (
          <JobListTable jobs={jobs} />
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <button
              disabled={page <= 1}
                            onClick={() => {
                setLoading(true);
                setError(null);
                setPage((p) => p - 1);
              }}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-600 disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setPage(p);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm",
                  p === page ? "bg-brand-600 text-white" : "border border-ink-200 text-ink-600"
                )}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= pagination.totalPages}
                            onClick={() => {
                setLoading(true);
                setError(null);
                setPage((p) => p + 1);
              }}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-600 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        )}
      </main>
    </>
  );
}
