"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import * as jobsApi from "@/lib/api/jobs";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// Matches Application.model.js status enum exactly.
const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "in-review", label: "In Review" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const STATUS_STYLES = {
  applied: "bg-ink-100 text-ink-600",
  "in-review": "bg-brand-100 text-brand-600",
  interview: "bg-warning-100 text-warning-600",
  offer: "bg-success-100 text-success-600",
  rejected: "bg-danger-100 text-danger-600",
  withdrawn: "bg-ink-100 text-ink-400",
};

export default function ApplicationTrackerPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    jobsApi
      .getMyApplications()
      .then((res) => setApplications(res.data.applications))
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(applicationId, status) {
    setUpdatingId(applicationId);
    setError(null);
    try {
      const res = await jobsApi.updateApplicationStatus(applicationId, status);
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? res.data.application : a))
      );
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Application Tracker" }]} />

      <main className="flex-1 px-6 py-6">
        <h1 className="mb-1 text-xl font-semibold text-ink-900">Application Tracker</h1>
        <p className="mb-5 text-sm text-ink-500">
          Track every application and update its status as it moves forward.
        </p>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : applications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-12 text-center text-sm text-ink-400">
            You haven&apos;t applied to any jobs yet.{" "}
            <Link href="/jobs" className="text-brand-500 hover:underline">Browse jobs</Link>
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="px-4 py-3 font-medium">Company / Role</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Applied On</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} className="border-b border-ink-50 last:border-none">
                    <td className="px-4 py-3">
                      {app.jobId ? (
                        <Link href={`/jobs/${app.jobId._id}`} className="hover:underline">
                          <span className="block font-medium text-ink-900">{app.jobId.title}</span>
                          <span className="block text-xs text-ink-400">{app.jobId.company}</span>
                        </Link>
                      ) : (
                        <span className="text-ink-400">Job no longer available</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{app.jobId?.location ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-xs font-medium",
                            STATUS_STYLES[app.status] ?? STATUS_STYLES.applied
                          )}
                        >
                          {STATUS_OPTIONS.find((o) => o.value === app.status)?.label ?? app.status}
                        </span>
                        <Select
                          className="!h-8 !w-36 !text-xs"
                          value={app.status}
                          disabled={updatingId === app._id}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}