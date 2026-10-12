import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Page-level breadcrumb trail only now - the avatar/logout menu that used
// to live here moved to DashboardGlobalHeader, which renders once for the
// whole dashboard shell instead of duplicating on every page (matching the
// design's single top-level avatar, not one per page).
export function DashboardTopbar({ crumbs }) {
  return (
    <nav className="flex items-center gap-1.5 border-b border-ink-100 bg-white px-6 py-3.5 text-sm text-ink-400">
      {crumbs.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5" />}
          {c.href ? (
            <Link href={c.href} className="hover:text-ink-700">{c.label}</Link>
          ) : (
            <span className="font-medium text-ink-900">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}