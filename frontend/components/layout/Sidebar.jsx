"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Rocket, LayoutGrid, Search, Bot, FileText, LineChart,
  Bookmark, MessagesSquare, Calendar, ChevronRight, ChevronLeft, HelpCircle,
  ChevronDown, Sparkles, Sun, Moon,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSidebarStore } from "@/store/useSidebarStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/get-started", label: "Get Started", icon: Rocket },
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  {
    href: "/jobs",
    label: "Discover Jobs",
    icon: Search,
    children: [
      { href: "/jobs", label: "Search for Jobs" },
      { href: "/jobs/saved", label: "Saved Jobs" },
    ],
  },
  { href: "/wizbot", label: "Manage Wizbot", icon: Bot },
  // Bonus feature, not part of the original Figma design - a Claude-powered
  // chat assistant, separate from the Wizbot automation bots above.
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/resume", label: "My Resume", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/applications", label: "Application Tracker", icon: Bookmark },
  { href: "/interview-prep", label: "Interview Prep", icon: MessagesSquare },
  { href: "/scheduler", label: "Scheduler", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { collapsed, theme, toggleCollapsed, toggleTheme } = useSidebarStore();
  const [jobsExpanded, setJobsExpanded] = useState(pathname?.startsWith("/jobs"));
  const isDark = theme === "dark";

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r px-3 py-4 transition-[width]",
        collapsed ? "w-20" : "w-64",
        isDark ? "border-navy-900 bg-brand-600" : "border-ink-100 bg-white"
      )}
    >
      <div
        className={cn(
          "mb-2 flex items-center gap-1 rounded-xl px-3 py-2.5",
          collapsed && "justify-center px-0",
          isDark ? "bg-white/10" : "bg-ink-50"
        )}
      >
        <button
          onClick={() => router.push("/settings/profile")}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left",
            isDark ? "hover:bg-white/10" : "hover:bg-ink-100"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() ?? "?"
            )}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-sm font-medium", isDark ? "text-white" : "text-ink-900")}>
                {user?.name ?? "…"}
              </span>
              <span className={cn("block truncate text-xs", isDark ? "text-white/60" : "text-ink-400")}>
                {user?.email ?? ""}
              </span>
            </span>
          )}
        </button>
        {/* Matches the Figma interaction: clicking this arrow (not the
            name/avatar, which opens Profile Settings) collapses the
            sidebar. Only shown expanded - the dedicated toggle button
            below remains the way to expand again from collapsed. */}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg p-1.5",
              isDark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {/* Collapse + theme toggles - not part of the Figma mockup's static
          frames, but a real control has to live somewhere for these to be
          genuine toggleable features rather than just two disconnected
          screenshots. */}
      <div className={cn("mb-2 flex gap-1", collapsed && "flex-col")}>
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs",
            isDark ? "text-white/70 hover:bg-white/10" : "text-ink-500 hover:bg-ink-50"
          )}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          {!collapsed && "Collapse"}
        </button>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs",
            isDark ? "text-white/70 hover:bg-white/10" : "text-ink-500 hover:bg-ink-50"
          )}
        >
          {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {!collapsed && (isDark ? "Light" : "Dark")}
        </button>
      </div>

      <div className={cn("mb-2 h-px", isDark ? "bg-white/10" : "bg-ink-100")} />

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          const activeClasses = isDark ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600";
          const inactiveClasses = isDark ? "text-white/80 hover:bg-white/10" : "text-ink-700 hover:bg-ink-50";

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => setJobsExpanded((v) => !v)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive ? activeClasses : inactiveClasses
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn("size-3.5 transition-transform", jobsExpanded && "rotate-180")} />
                    </>
                  )}
                </button>
                {!collapsed && jobsExpanded && (
                  <div className={cn("ml-6 mt-0.5 space-y-0.5 border-l pl-3", isDark ? "border-white/20" : "border-ink-100")}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-2.5 py-1.5 text-sm",
                          pathname === child.href
                            ? cn("font-medium", isDark ? "text-white" : "text-brand-600")
                            : isDark ? "text-white/60 hover:text-white" : "text-ink-500 hover:text-ink-800"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive ? activeClasses : inactiveClasses
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-2 border-t pt-3", isDark ? "border-white/10" : "border-ink-100")}>
        <Link
          href="/help"
          title={collapsed ? "Help Center" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-full bg-brand-600 px-3.5 py-2.5 text-sm text-white hover:bg-navy-900",
            collapsed && "justify-center px-0 py-2.5"
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
            <HelpCircle className="size-3.5" />
          </span>
          {!collapsed && (
            <span className="flex-1">
              <span className="block font-medium leading-tight">Help Center</span>
              <span className="block text-xs text-white/70 leading-tight">Answers here</span>
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}