"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Bot, FileText, MessagesSquare, ChevronRight, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobCard } from "@/components/jobs/JobCard";
import { Alert } from "@/components/ui/Alert";
import { useAuthStore } from "@/store/useAuthStore";
import * as usersApi from "@/lib/api/users";
import * as jobsApi from "@/lib/api/jobs";
import { normalizeError } from "@/lib/api/client";

const QUICK_LINKS = [
  { href: "/wizbot", label: "Auto-Apply", desc: "Manage your AI job application bots", icon: Bot, accent: "bg-sky-50 text-sky-500" },
  { href: "/resume", label: "Create Resume", desc: "Get AI-powered suggestions, or optimize an existing one", icon: FileText, accent: "bg-ink-100 text-ink-500" },
  { href: "/interview-prep", label: "Interview Prep", desc: "Practice with AI-powered interview simulations", icon: MessagesSquare, accent: "bg-orange-50 text-orange-500" },
];

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([usersApi.getDashboardSummary(), jobsApi.getRecommendedJobs()])
      .then(([summaryRes, jobsRes]) => {
        if (cancelled) return;
        if (summaryRes.status === "fulfilled") {
          setSummary(summaryRes.value.data);
        } else {
          setError(normalizeError(summaryRes.reason).message);
        }
        if (jobsRes.status === "fulfilled") {
          setRecommended(jobsRes.value.data.jobs);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const byStatus = summary?.applicationsByStatus ?? {};
  const total = summary?.totalApplications ?? 0;
  const interviews = byStatus.interview ?? 0;
  const rejections = byStatus.rejected ?? 0;
  const offers = byStatus.offer ?? 0;
  const successRate = total > 0 ? Math.round((offers / total) * 1000) / 10 : 0;

  // Real daily counts from the last 7 days (see users.controller.js
  // getDashboardSummary) - each card's sparkline traces its own field
  // across those 7 real data points, not a decorative placeholder.
  const dailyTrend = summary?.dailyTrend ?? [];
  const trends = summary?.trends ?? {};
  const totalTrendData = dailyTrend.map((d) => d.total);
  const interviewTrendData = dailyTrend.map((d) => d.interview);
  const rejectedTrendData = dailyTrend.map((d) => d.rejected);
  const offerTrendData = dailyTrend.map((d) => d.offer);

  return (
    <>
      <main className="flex-1 px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900">
              Welcome back, <span className="font-bold">{user?.name?.split(" ")[0] ?? "there"}</span>!
            </h1>
            <p className="text-sm text-ink-500">Here&apos;s what&apos;s happening with your job search today.</p>
          </div>
          <Link
            href="/wizbot"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-900"
          >
            Create Bot
          </Link>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            {total > 0 && (
              <div className="mb-6 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-brand-600">AI Summary:</p>
                  <div className="my-1.5 border-t border-dashed border-brand-200" />
                  <p className="text-sm text-ink-600">
                    You&apos;ve sent {total} application{total === 1 ? "" : "s"} so far
                    {offers > 0 && `, received ${offers} offer${offers === 1 ? "" : "s"}`}
                    {interviews > 0 && `, and have ${interviews} interview${interviews === 1 ? "" : "s"} in the pipeline`}.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink-900">Application Overview</p>
              {summary?.weeklyApplicationsCount > 0 && (
                <span className="text-xs text-ink-400">{summary.weeklyApplicationsCount} this week</span>
              )}
            </div>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="All Applications Sent" value={total} trendPercent={trends.total} trendData={totalTrendData} />
              <StatCard label="Interviews" value={interviews} trendPercent={trends.interview} trendData={interviewTrendData} />
              <StatCard label="Rejections" value={rejections} trendPercent={trends.rejected} trendData={rejectedTrendData} />
              <StatCard label="Offers received" value={offers} accent="brand" trendPercent={trends.offer} trendData={offerTrendData} />
              <StatCard label="Success Rate" value={`${successRate}%`} />
            </div>

            <p className="mb-3 text-sm font-medium text-ink-900">Quick Links</p>
            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-4 hover:shadow-sm"
                >
                  <span className={`flex size-9 items-center justify-center rounded-lg ${link.accent}`}>
                    <link.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{link.label}</p>
                    <p className="truncate text-xs text-ink-400">{link.desc}</p>
                  </div>
                  <ChevronRight className="size-4 text-ink-300" />
                </Link>
              ))}
            </div>

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink-900">Recommended for you</p>
              <Link href="/jobs" className="text-xs font-medium text-brand-500 hover:underline">
                See all
              </Link>
            </div>
            {recommended.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-400">
                No recommendations yet — add skills to your profile to get matched with jobs.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.slice(0, 8).map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
