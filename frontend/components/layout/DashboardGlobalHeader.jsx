"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

// Sits above the Sidebar+content row on every dashboard page - matches the
// same Home/About/Contact nav + centered logo used on public/auth pages
// (PublicHeader), swapping Sign in/Sign up for "My Dashboard" + the avatar
// menu now that the person is logged in. Previously this avatar/logout menu
// lived in DashboardTopbar's full-width bar on every page; it's consolidated
// here so it only renders once, matching the design's single top-level bar.
export function DashboardGlobalHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/signin");
  }

  return (
    <header className="flex items-center justify-between border-b border-ink-100 bg-white px-6 py-3 sm:px-10">
      <nav className="flex items-center gap-6 text-sm text-ink-700">
        <Link href="/" className="hover:text-ink-900">Home</Link>
        <Link href="/about" className="hidden hover:text-ink-900 sm:inline">About</Link>
        <Link href="/contact" className="hidden hover:text-ink-900 sm:inline">Contact</Link>
        <Link href="/dashboard" className="font-medium text-brand-600 hover:text-brand-700">My Dashboard</Link>
      </nav>

      <Logo />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-ink-100 text-sm font-semibold text-ink-700"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase() ?? "?"
          )}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-ink-100 bg-white p-2 shadow-lg">
              <div className="flex items-center gap-2 px-2 py-2">
                <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() ?? "?"
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-ink-400">{user?.email}</p>
                </div>
              </div>
              <div className="my-1 h-px bg-ink-100" />
              <Link
                href="/settings/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-700 hover:bg-ink-50"
              >
                <Settings className="size-4" />
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-danger-600 hover:bg-danger-100/50"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="mb-2 text-lg font-semibold text-ink-900">Logout Account</h2>
        <p className="mb-5 text-sm text-ink-500">
          Are you sure you want to logout? This action will make you re-sign in again.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth isLoading={loggingOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Modal>
    </header>
  );
}