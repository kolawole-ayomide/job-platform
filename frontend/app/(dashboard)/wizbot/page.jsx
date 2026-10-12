"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Bot as BotIcon, Loader2, Play, Pause, RefreshCw } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CreateBotModal } from "@/components/wizbot/CreateBotModal";
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

const STATUS_STYLES = {
  running: "bg-success-100 text-success-600",
  paused: "bg-warning-100 text-warning-600",
  terminated: "bg-ink-100 text-ink-500",
};

// Real automation agents (backend: WizbotAgent + background scheduler in
// server.js) - status, scan/match/apply counts, and last-scan time are all
// live numbers from actual scan cycles, not placeholders.
export default function ManageWizbotPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

    function fetchAgents() {
    return wizbotApi
      .listAgents()
      .then((res) => setAgents(res.data.agents))
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false));
  }

  // Used by the create-bot modal's onClose to manually refresh the list -
  // safe to call setState here since it runs from an event handler.
  function load() {
    setLoading(true);
    fetchAgents();
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  async function handleDelete(id) {
    setBusyId(id);
    try {
      await wizbotApi.deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(agent) {
    setBusyId(agent._id);
    try {
      const nextStatus = agent.status === "running" ? "paused" : "running";
      const res = await wizbotApi.updateAgentStatus(agent._id, nextStatus);
      setAgents((prev) => prev.map((a) => (a._id === agent._id ? res.data.agent : a)));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleScanNow(agent) {
    setBusyId(agent._id);
    try {
      const res = await wizbotApi.triggerScan(agent._id);
      setAgents((prev) => prev.map((a) => (a._id === agent._id ? res.data.agent : a)));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Manage Wizbot" }]} />

      <main className="flex-1 px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900">Manage Wizbot</h1>
            <p className="text-sm text-ink-500">Your AI job-scanning &amp; auto-apply agents</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Bot</Button>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 px-4 py-16 text-center">
            <BotIcon className="mx-auto mb-3 size-8 text-ink-300" />
            <p className="text-sm text-ink-500">You haven&apos;t created a bot yet.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>Create your first bot</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div key={agent._id} className="rounded-xl border border-ink-100 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <span className={`flex size-10 items-center justify-center rounded-full text-white ${avatarColor(agent.avatar)}`}>
                    <BotIcon className="size-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                      STATUS_STYLES[agent.status]
                    )}
                  >
                    {agent.status}
                  </span>
                </div>

                <p className="text-sm font-semibold text-ink-900">{agent.name}</p>
                <p className="mb-3 text-xs text-ink-400">Last scan {timeAgo(agent.lastScanAt)}</p>

                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-ink-50 py-2">
                    <p className="text-sm font-semibold text-ink-900">{agent.stats.jobsScanned}</p>
                    <p className="text-[10px] text-ink-400">Scanned</p>
                  </div>
                  <div className="rounded-lg bg-ink-50 py-2">
                    <p className="text-sm font-semibold text-ink-900">{agent.stats.jobsMatched}</p>
                    <p className="text-[10px] text-ink-400">Matched</p>
                  </div>
                  <div className="rounded-lg bg-ink-50 py-2">
                    <p className="text-sm font-semibold text-ink-900">{agent.stats.jobsApplied}</p>
                    <p className="text-[10px] text-ink-400">Applied</p>
                  </div>
                </div>

                <div className="mb-2 flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    disabled={busyId === agent._id || agent.status === "terminated"}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
                  >
                    {agent.status === "running" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                    {agent.status === "running" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleScanNow(agent)}
                    disabled={busyId === agent._id || agent.status !== "running"}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
                  >
                    {busyId === agent._id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Scan now
                  </button>
                  <button
                    onClick={() => handleDelete(agent._id)}
                    disabled={busyId === agent._id}
                    aria-label="Delete bot"
                    className="flex items-center justify-center rounded-lg border border-ink-200 px-2.5 text-ink-400 hover:border-danger-200 hover:text-danger-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <Link href={`/wizbot/${agent._id}`}>
                  <Button variant="outline" size="sm" fullWidth>View details</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateBotModal open={createOpen} onClose={() => { setCreateOpen(false); load(); }} />
    </>
  );
}
