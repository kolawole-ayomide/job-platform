"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save, LayoutTemplate } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TagInput } from "@/components/ui/TagInput";
import { ExperienceEditor } from "@/components/resume/ExperienceEditor";
import { EducationEditor } from "@/components/resume/EducationEditor";
import * as resumeApi from "@/lib/api/resume";
import { normalizeError } from "@/lib/api/client";

export default function ResumeBuilderPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resumeApi
      .getResumeData()
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

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const res = await resumeApi.updateResumeData({
        phone: profile.phone,
        location: profile.location,
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
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
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Resume" }]} />

      <main className="flex-1 px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink-900">My Resume</h1>
          <Link href="/resume/templates">
            <Button variant="outline">
              <LayoutTemplate className="size-4" /> Templates &amp; Export
            </Button>
          </Link>
        </div>

        {error && <Alert>{error}</Alert>}
        {saved && <Alert variant="success">Resume saved.</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : !profile ? (
          <p className="text-sm text-ink-500">No profile found — finish onboarding first.</p>
        ) : (
          <div className="max-w-3xl space-y-6">
            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone" value={profile.phone ?? ""} onChange={(e) => patch({ phone: e.target.value })} />
                <Input label="Location" value={profile.location ?? ""} onChange={(e) => patch({ location: e.target.value })} />
              </div>
            </section>

            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Professional Summary</h2>
              <Input label="Headline" placeholder="Senior Software Engineer" value={profile.headline ?? ""} onChange={(e) => patch({ headline: e.target.value })} />
              <label className="mb-1.5 mt-4 block text-xs font-medium text-brand-500">Summary</label>
              <textarea
                rows={4}
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
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Experience</h2>
              <ExperienceEditor
                value={profile.experience ?? []}
                onChange={(experience) => patch({ experience })}
              />
            </section>

            <section className="rounded-xl border border-ink-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">Education</h2>
              <EducationEditor
                value={profile.education ?? []}
                onChange={(education) => patch({ education })}
              />
            </section>

            <div className="flex justify-end">
              <Button isLoading={saving} onClick={handleSave}>
                <Save className="size-4" /> Save Resume
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
