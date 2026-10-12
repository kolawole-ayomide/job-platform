"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

// Matches the 8-avatar grid from the "Select Bot Avatar" screen. Rendered
// as colored bot icons rather than fetching external images, since the
// backend only stores a string id for the avatar (WizbotConversation and
// WizbotAgent both just take `avatar: String`) - no image asset pipeline.
export const AVATAR_OPTIONS = [
  { id: "blue", color: "bg-sky-500" },
  { id: "green", color: "bg-emerald-500" },
  { id: "indigo", color: "bg-indigo-500" },
  { id: "black", color: "bg-ink-900" },
  { id: "red", color: "bg-rose-500" },
  { id: "gray", color: "bg-ink-400" },
  { id: "teal", color: "bg-teal-500" },
  { id: "yellow", color: "bg-amber-500" },
];

export function avatarColor(avatarId) {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.color ?? "bg-ink-400";
}

export function AvatarPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATAR_OPTIONS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onChange(avatar.id)}
          className={cn(
            "flex aspect-square items-center justify-center rounded-xl border-2",
            value === avatar.id ? "border-brand-500 ring-2 ring-brand-100" : "border-transparent"
          )}
        >
          <span className={cn("flex size-10 items-center justify-center rounded-full text-white", avatar.color)}>
            <Bot className="size-5" />
          </span>
        </button>
      ))}
    </div>
  );
}
