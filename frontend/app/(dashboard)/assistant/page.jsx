"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Sparkles, Loader2, Plus } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { avatarColor } from "@/components/wizbot/AvatarPicker";
import * as wizbotApi from "@/lib/api/wizbot";
import { normalizeError } from "@/lib/api/client";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"} ago`;
}

// This is a bonus feature (not in the Figma design) - a Claude-powered chat
// assistant for resume feedback, interview prep, and job-search strategy.
// Kept separate from the Wizbot automation bots at /wizbot.
export default function AssistantPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

   function load() {
    wizbotApi
      .listConversations()
      .then((res) => setConversations(res.data.conversations))
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await wizbotApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "AI Assistant" }]} />

      <main className="flex-1 px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900">AI Assistant</h1>
            <p className="text-sm text-ink-500">Chat about your resume, interview prep, or job search strategy</p>
          </div>
          <Link href="/assistant/new">
            <Button>
              <Plus className="size-4" /> New chat
            </Button>
          </Link>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 px-4 py-16 text-center">
            <Sparkles className="mx-auto mb-3 size-8 text-ink-300" />
            <p className="text-sm text-ink-500">No conversations yet.</p>
            <Link href="/assistant/new">
              <Button className="mt-4">Start a chat</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {conversations.map((c) => (
              <div key={c._id} className="rounded-xl border border-ink-100 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <span className={`flex size-10 items-center justify-center rounded-full text-white ${avatarColor(c.botConfig?.avatar)}`}>
                    <Sparkles className="size-5" />
                  </span>
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={deletingId === c._id}
                    aria-label="Delete conversation"
                    className="text-ink-300 hover:text-danger-600"
                  >
                    {deletingId === c._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
                <p className="text-sm font-semibold text-ink-900">{c.title}</p>
                <p className="mb-4 text-xs text-ink-400">Last active {timeAgo(c.updatedAt)}</p>
                <Link href={`/assistant/${c._id}`}>
                  <Button variant="outline" size="sm" fullWidth>Open Chat</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
