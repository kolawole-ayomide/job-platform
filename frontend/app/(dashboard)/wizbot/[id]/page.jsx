"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Bot as BotIcon, Play, Pause, RefreshCw,
  Search, Target, Send, AlertTriangle,
} from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { avatarColor } from "@/components/wizbot/AvatarPicker";
import * as wizbotApi from "@/lib/api/wizbot";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function timeAgo(dateStr) {
  if (!dateStr) return "never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"} ago`;
}

const ACTIVITY_ICON = {
  scan_started: Search,
  scan_completed: Search,
  job_matched: Target,
  job_applied: Send,
  status_changed: RefreshCw,
  error: AlertTriangle,
};

// Real per-agent dashboard: everything here (funnel, match/apply rate,
// activity log, counters) comes straight from GET /wizbot/agents/:id and
// GET /wizbot/agents/:id/activity - genuine scan-cycle output, not mock
// data (see backend/src/services/wizbotAgent.service.js).
export default function WizbotAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id;

   const [agent, setAgent] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadedAgentId, setLoadedAgentId] = useState(agentId);

  const fetchAgent = useCallback(() => {
    return Promise.allSettled([wizbotApi.getAgent(agentId), wizbotApi.getAgentActivity(agentId)])
      .then(([agentRes, activityRes]) => {
        if (agentRes.status === "fulfilled") {
          setAgent(agentRes.value.data.agent);
          setMetrics(agentRes.value.data.metrics);
        } else {
          setError(normalizeError(agentRes.reason).message);
        }
        if (activityRes.status === "fulfilled") setActivity(activityRes.value.data.activity);
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  // Used by manual-refresh handlers (toggle status, scan now) - safe to call
  // setState here since these run from event handlers, not an effect body.
  function load() {
    setLoading(true);
    setError(null);
    fetchAgent();
  }

  // Reset synchronously during render when navigating between two different
  // agents' detail pages, so the UI shows a fresh loading state immediately
  // instead of stale content lingering until the fetch effect below finishes.
  if (agentId !== loadedAgentId) {
    setLoadedAgentId(agentId);
    setLoading(true);
    setError(null);
    setAgent(null);
    setMetrics(null);
    setActivity([]);
  }

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  async function handleToggleStatus() {
    if (!agent) return;
    setBusy(true);
    try {
      const nextStatus = agent.status === "running" ? "paused" : "running";
      await wizbotApi.updateAgentStatus(agent._id, nextStatus);
      load();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleScanNow() {
    setBusy(true);
    try {
      await wizbotApi.triggerScan(agentId);
      load();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  const maxFunnel = metrics ? Math.max(1, ...metrics.funnel.map((f) => f.count)) : 1;

  return (
    <>
      <DashboardTopbar
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manage Wizbot", href: "/wizbot" },
          { label: agent?.name ?? "Bot" },
        ]}
      />

      <main className="flex-1 px-6 py-6">
        <button
          onClick={() => router.push("/wizbot")}
          className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : !agent ? (
          <Alert>{error ?? "Agent not found."}</Alert>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-ink-100 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-11 items-center justify-center rounded-full text-white ${avatarColor(agent.avatar)}`}>
                      <BotIcon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{agent.name}</p>
                      <p className="text-xs text-ink-500">
                        Last scan {timeAgo(agent.lastScanAt)} · {agent.autoApply ? "Auto-apply on" : "Match only"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={busy}
                      disabled={agent.status === "terminated"}
                      onClick={handleToggleStatus}
                    >
                      {agent.status === "running" ? (
                        <>
                          <Pause className="size-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" /> Resume
                        </>
                      )}
                    </Button>
                    <Button size="sm" isLoading={busy} disabled={agent.status !== "running"} onClick={handleScanNow}>
                      <RefreshCw className="size-3.5" /> Scan now
                    </Button>
                  </div>
                </div>

                {agent.lastScanError && (
                  <Alert>{`Last scan hit an error: ${agent.lastScanError}`}</Alert>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {agent.criteria.keywords.map((k) => (
                    <span key={k} className="rounded-md bg-ink-100 px-2 py-1 text-xs text-ink-700">{k}</span>
                  ))}
                  {agent.criteria.locations.map((l) => (
                    <span key={l} className="rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-600">{l}</span>
                  ))}
                  {agent.criteria.workMode && (
                    <span className="rounded-md bg-ink-100 px-2 py-1 text-xs capitalize text-ink-700">{agent.criteria.workMode}</span>
                  )}
                </div>
              </div>

              {/* Conversion funnel - real counts: Scanned -> Matched -> Applied */}
              <div className="rounded-xl border border-ink-100 bg-white p-5">
                <p className="mb-4 text-sm font-semibold text-ink-900">Conversion Funnel</p>
                <div className="space-y-3">
                  {metrics.funnel.map((stage) => (
                    <div key={stage.stage}>
                      <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
                        <span>{stage.stage}</span>
                        <span className="font-medium text-ink-900">{stage.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${(stage.count / maxFunnel) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
                  <div>
                    <p className="text-xs text-ink-400">Match rate</p>
                    <p className="text-lg font-semibold text-ink-900">{metrics.matchRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Apply rate</p>
                    <p className="text-lg font-semibold text-ink-900">{metrics.applyRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Activity Log - real scan-cycle events */}
            <div className="rounded-xl border border-ink-100 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-ink-900">Live Activity Log</p>
              {activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  No activity yet — resume the bot or hit &quot;Scan now&quot; to run its first cycle.
                </p>
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto">
                  {activity.map((a) => {
                    const Icon = ACTIVITY_ICON[a.type] ?? BotIcon;
                    return (
                      <div key={a._id} className="flex gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                            a.type === "error" ? "bg-danger-100 text-danger-600" : "bg-ink-100 text-ink-500"
                          )}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <div>
                          <p className="text-xs text-ink-700">{a.message}</p>
                          <p className="text-[11px] text-ink-400">{timeAgo(a.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
