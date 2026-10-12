"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, children, width = "max-w-sm" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-xl",
          width
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="sticky top-0 z-10 float-right -mt-2 -mr-2 text-ink-400 hover:text-ink-700"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
