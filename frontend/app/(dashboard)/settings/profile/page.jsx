"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Save, Camera } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TagInput } from "@/components/ui/TagInput";
import { CheckboxPill } from "@/components/ui/CheckboxPill";
import { useAuthStore } from "@/store/useAuthStore";
import * as usersApi from "@/lib/api/users";
import { normalizeError } from "@/lib/api/client";

// Matches Profile.model.js jobPreferences.jobTypes enum
const JOB_TYPES = [
  { value: "full-time", label: "Fulltime" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

// Matches Profile.model.js jobPreferences.workMode enum
const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

// Matches Profile.model.js jobPreferences.experienceLevel enum
const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

// Matches Profile.model.js availability.status enum
const AVAILABILITY_OPTIONS = [
  { value: "actively-looking", label: "Actively looking" },
  { value: "open-to-offers", label: "Open to offers" },
  { value: "not-looking", label: "Not looking" },
];

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState(null);
  const [accountNotice, setAccountNotice] = useState(null);

  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // matches upload.middleware.js uploadAvatar limit
  const AVATAR_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAvatarError(null);
    if (!AVATAR_ACCEPTED.includes(file.type)) {
      setAvatarError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > AVATAR_MAX_SIZE) {
      setAvatarError("Image is too large. Max size is 2MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const res = await usersApi.uploadAvatar(file);
      setUser(res.data.user);
    } catch (err) {
      setAvatarError(normalizeError(err).message);
    } finally {
      setAvatarUploading(false);
    }
  }

  useEffect(() => {
    if (user) {
      setAccountName(user.name ?? "");
      setAccountEmail(user.email ?? "");
    }
  }, [user]);

  async function handleAccountSave() {
    setAccountSaving(true);
    setAccountError(null);
    setAccountNotice(null);
    try {
      const payload = {};
      if (accountName !== user?.name) payload.name = accountName;
      if (accountEmail !== user?.email) payload.email = accountEmail;

      if (Object.keys(payload).length === 0) {
        setAccountSaving(false);
        return;
      }

      const res = await usersApi.updateAccount(payload);
      setUser(res.data.user);

      if (payload.email) {
        setAccountNotice(
          res.data.emailDelivered
            ? "Account updated. Check your new email to verify it."
            : "Account updated, but the verification email couldn't be sent right now. You can resend it later."
        );
      } else {
        setAccountNotice("Account updated.");
      }
    } catch (err) {
      setAccountError(normalizeError(err).message);
    } finally {
      setAccountSaving(false);
    }
  }

  const accountDirty = accountName !== (user?.name ?? "") || accountEmail !== (user?.email ?? "");

  useEffect(() => {
    let cancelled = false;
    usersApi
      .getProfile()
      .then((res) => !cancelled && setProfile(res.data.profile))
      .catch((err) => !cancelled && setError(normalizeError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(update) {
    setProfile((prev) => (prev ? { ...prev, ...update } : prev));
    setSaved(false);
  }

  function patchJobPreferences(update) {
    setProfile((prev) =>
      prev ? { ...prev, jobPreferences: { ...prev.jobPreferences, ...update } } : prev
    );
    setSaved(false);
  }

  function toggleJobType(value, checked) {
    const current = profile?.jobPreferences?.jobTypes ?? [];
    patchJobPreferences({
      jobTypes: checked ? [...current, value] : current.filter((v) => v !== value),
    });
  }

  function toggleWorkMode(value, checked) {
    const current = profile?.jobPreferences?.workMode ?? [];
    patchJobPreferences({
      workMode: checked ? [...current, value] : current.filter((v) => v !== value),
    });
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const res = await usersApi.updateProfile({
        phone: profile.phone,
        location: profile.location,
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skills,
        jobPreferences: profile.jobPreferences,
        availability: profile.availability,
        salaryExpectation: profile.salaryExpectation,
      });
      setProfile(res.data.profile);
      setSaved(true);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile Settings" }]} />

      <main className="flex-1 px-6 py-6">
        <h1 className="mb-5 text-xl font-semibold text-ink-900">Profile Settings</h1>

        {error && <Alert>{error}</Alert>}
        {saved && <Alert variant="success">Settings saved.</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : !profile ? (
          <p className="text-sm text-ink-500">No profile found — finish onboarding first.</p>
        ) : (
          <div className="max-w-3xl space-y-6">
            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Account</h2>

              {accountError && <Alert>{accountError}</Alert>}
              {accountNotice && <Alert variant="success">{accountNotice}</Alert>}
              {avatarError && <Alert>{avatarError}</Alert>}

              <div className="mb-5 flex items-center gap-4">
                <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-100 text-lg font-semibold text-ink-500">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="Profile picture" className="size-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() ?? "?"
                  )}
                  {avatarUploading && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="size-5 animate-spin text-white" />
                    </span>
                  )}
                </span>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    isLoading={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="size-3.5" /> Change photo
                  </Button>
                  <p className="mt-1.5 text-xs text-ink-400">JPG, PNG, or WEBP. Max 2MB.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    setAccountNotice(null);
                  }}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={accountEmail}
                  onChange={(e) => {
                    setAccountEmail(e.target.value);
                    setAccountNotice(null);
                  }}
                />
              </div>
              {accountEmail !== (user?.email ?? "") && (
                <p className="mt-2 text-xs text-warning-600">
                  Changing your email will require re-verifying the new address.
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!accountDirty}
                  isLoading={accountSaving}
                  onClick={handleAccountSave}
                >
                  <Save className="size-3.5" /> Save Account
                </Button>
              </div>
            </section>

            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Contact &amp; Summary</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone" value={profile.phone ?? ""} onChange={(e) => patch({ phone: e.target.value })} />
                <Input label="Location" value={profile.location ?? ""} onChange={(e) => patch({ location: e.target.value })} />
              </div>
              <div className="mt-4">
                <Input label="Headline" value={profile.headline ?? ""} onChange={(e) => patch({ headline: e.target.value })} />
              </div>
              <label className="mb-1.5 mt-4 block text-xs font-medium text-brand-500">Summary</label>
              <textarea
                rows={3}
                value={profile.summary ?? ""}
                onChange={(e) => patch({ summary: e.target.value })}
                className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
            </section>

            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Skills</h2>
              <TagInput values={profile.skills ?? []} onChange={(skills) => patch({ skills })} placeholder="Add a skill and press Enter" />
            </section>

            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Job Preferences</h2>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-brand-500">Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((opt) => (
                    <CheckboxPill
                      key={opt.value}
                      label={opt.label}
                      checked={(profile.jobPreferences?.jobTypes ?? []).includes(opt.value)}
                      onChange={(checked) => toggleJobType(opt.value, checked)}
                    />
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-brand-500">Work Location Preference</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map((opt) => (
                    <CheckboxPill
                      key={opt.value}
                      label={opt.label}
                      checked={(profile.jobPreferences?.workMode ?? []).includes(opt.value)}
                      onChange={(checked) => toggleWorkMode(opt.value, checked)}
                    />
                  ))}
                </div>
              </div>
              <Select
                label="Experience Level"
                value={profile.jobPreferences?.experienceLevel ?? ""}
                onChange={(e) => patchJobPreferences({ experienceLevel: e.target.value || null })}
              >
                <option value="">Not set</option>
                {EXPERIENCE_LEVELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </section>

            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Salary &amp; Availability</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Minimum Salary"
                  type="number"
                  value={profile.salaryExpectation?.min ?? ""}
                  onChange={(e) =>
                    patch({
                      salaryExpectation: {
                        ...profile.salaryExpectation,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                />
                <Input
                  label="Maximum Salary"
                  type="number"
                  value={profile.salaryExpectation?.max ?? ""}
                  onChange={(e) =>
                    patch({
                      salaryExpectation: {
                        ...profile.salaryExpectation,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                />
              </div>
              <div className="mt-4">
                <Select
                  label="Availability"
                  value={profile.availability?.status ?? "actively-looking"}
                  onChange={(e) =>
                    patch({ availability: { ...profile.availability, status: e.target.value } })
                  }
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
            </section>

            <div className="flex items-center justify-between">
              <Link href="/resume" className="text-sm text-brand-500 hover:underline">
                Edit work experience &amp; education in the Resume builder →
              </Link>
              <Button isLoading={saving} onClick={handleSave}>
                <Save className="size-4" /> Save Changes
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}