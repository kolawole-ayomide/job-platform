import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Two independent sidebar preferences: collapsed (icon-only vs full labels)
// and theme (light/dark). Persisted so a person's choice survives page
// navigation and reloads, not just the current session.
export const useSidebarStore = create(
  persist(
    (set) => ({
      collapsed: false,
      theme: "light", // "light" | "dark"
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    {
      name: "wizjobai-sidebar-prefs",
      storage: createJSONStorage(() => localStorage),
    }
  )
);