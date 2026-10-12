"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Sparkles, Settings } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AvatarPicker, avatarColor } from "@/components/wizbot/AvatarPicker";
import { useAuthStore } from "@/store/useAuthStore";
import * as wizbotApi from "@/lib/api/wizbot";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// Bonus feature (not in the Figma design) - Claude-powered chat, separate
// from the Wizbot automation agents. `id` can be the literal string "new"
// to start a fresh conversation in one call (see wizbotApi.sendMessage).
export default function AssistantChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id;
  const isNew = conversationId === "new";
  const user = useAuthStore((s) => s.user);

    const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [loadedKey, setLoadedKey] = useState(isNew ? null : conversationId);
  const bottomRef = useRef(null);

  // Reset synchronously during render when we're viewing a real (non-"new")
  // conversation and its id changes - covers both navigating between two
  // existing conversations, and the "new" -> real-id swap after the first
  // message is sent (see handleSend below).
  if (!isNew && conversationId !== loadedKey) {
    setLoadedKey(conversationId);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    wizbotApi
      .getConversation(conversationId)
      .then((res) => {
        if (cancelled) return;
        setConversation(res.data.conversation);
        setMessages(res.data.conversation.messages);
      })
      .catch((err) => !cancelled && setError(normalizeError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [conversationId, isNew]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await wizbotApi.sendMessage(conversationId, text);
      setMessages(res.data.messages);
      if (isNew && res.data.conversation) {
        // Swap the URL to the real conversation id without a full reload,
        // now that the backend has created it.
        router.replace(`/assistant/${res.data.conversation._id}`);
        setConversation(res.data.conversation);
      }
    } catch (err) {
      setError(normalizeError(err).message);
      setMessages((prev) => prev.slice(0, -1));
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <DashboardTopbar
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "AI Assistant", href: "/assistant" },
          { label: isNew ? "New chat" : conversation?.title ?? "Chat" },
        ]}
      />

      <main className="flex flex-1 flex-col px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/assistant")}
            className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          {conversation && (
            <button
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
            >
              <Settings className="size-3.5" /> Bot Configuration
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : !isNew && !conversation ? (
          <Alert>{error ?? "Conversation not found."}</Alert>
        ) : (
          <>
            <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-ink-100 bg-white p-5">
              {messages.length === 0 && (
                <p className="py-12 text-center text-sm text-ink-400">
                  Say hello to get started — ask about resume feedback, interview prep, or job search strategy.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={m._id ?? i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-white",
                      m.role === "user" ? "bg-ink-700" : avatarColor(conversation?.botConfig?.avatar)
                    )}
                  >
                    {m.role === "user" ? (
                      <span className="text-xs font-semibold">{user?.name?.[0]?.toUpperCase() ?? "?"}</span>
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </span>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
                      m.role === "user" ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-800"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex size-8 items-center justify-center rounded-full text-white", avatarColor(conversation?.botConfig?.avatar))}>
                    <Sparkles className="size-4" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl bg-ink-50 px-4 py-3">
                    <Loader2 className="size-3.5 animate-spin text-ink-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <Alert>{error}</Alert>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask the assistant anything about your job search…"
                className="h-11 flex-1 rounded-lg border border-ink-200 px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
              <Button type="submit" isLoading={sending} disabled={!draft.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </main>

      {conversation && (
        <BotConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          conversation={conversation}
          onSaved={(updated) => setConversation(updated)}
        />
      )}
    </>
  );
}

function BotConfigModal({ open, onClose, conversation, onSaved }) {
  const [avatar, setAvatar] = useState(conversation.botConfig?.avatar ?? "blue");
  const [persona, setPersona] = useState(conversation.botConfig?.persona ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await wizbotApi.updateBotConfig(conversation._id, avatar, persona);
      onSaved(res.data.conversation);
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-md">
      <h2 className="mb-1 text-lg font-semibold text-ink-900">Bot Configuration</h2>
      <p className="mb-5 text-sm text-ink-500">You can customize your assistant&apos;s avatar and persona.</p>

      {error && <Alert>{error}</Alert>}

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium text-brand-500">Choose Avatar</p>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>

      <label className="mb-1.5 block text-xs font-medium text-brand-500">Persona</label>
      <textarea
        rows={3}
        value={persona}
        onChange={(e) => setPersona(e.target.value)}
        placeholder="e.g. Friendly and encouraging career coach"
        className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
      />

      <div className="mt-6 flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose}>Close</Button>
        <Button fullWidth isLoading={saving} onClick={handleSave}>Save</Button>
      </div>
    </Modal>
  );
}
