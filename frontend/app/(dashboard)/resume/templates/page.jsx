"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, Eye } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import * as resumeApi from "@/lib/api/resume";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function ResumeTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    resumeApi
      .getTemplates()
      .then((res) => {
        setTemplates(res.data.templates);
        setSelected(res.data.templates[0]?.id ?? "");
      })
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    if (!selected) return;
    setExporting(true);
    setError(null);
    setExportUrl(null);
    try {
      const res = await resumeApi.exportResume(selected);
      setExportUrl(res.data.url);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <DashboardTopbar
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Resume", href: "/resume" },
          { label: "Templates" },
        ]}
      />

      <main className="flex-1 px-6 py-6">
        <Link href="/resume" className="mb-4 flex w-fit items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
          <ArrowLeft className="size-4" /> Back to resume
        </Link>

        <h1 className="mb-1 text-xl font-semibold text-ink-900">Template Style</h1>
        <p className="mb-6 text-sm text-ink-500">Choose a template, preview it, and export a shareable PDF.</p>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelected(t.id);
                    setExportUrl(null);
                  }}
                  className={cn(
                    "rounded-xl border-2 bg-white p-4 text-left transition-colors",
                    selected === t.id ? "border-brand-500" : "border-ink-100 hover:border-ink-200"
                  )}
                >
                  <div
                    className="mb-3 flex h-32 flex-col gap-1.5 rounded-lg border border-ink-100 p-3"
                    style={{ borderTopColor: t.accentColor, borderTopWidth: 4 }}
                  >
                    <div className="h-2 w-2/3 rounded" style={{ backgroundColor: t.accentColor }} />
                    <div className="h-1.5 w-full rounded bg-ink-100" />
                    <div className="h-1.5 w-4/5 rounded bg-ink-100" />
                    <div className="mt-2 h-1.5 w-1/2 rounded" style={{ backgroundColor: t.accentColor, opacity: 0.6 }} />
                    <div className="h-1.5 w-full rounded bg-ink-100" />
                  </div>
                  <p className="text-sm font-medium text-ink-900">{t.name}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={resumeApi.getPreviewUrl(selected)} target="_blank" rel="noreferrer">
                <Button variant="outline" disabled={!selected}>
                  <Eye className="size-4" /> Preview PDF
                </Button>
              </a>
              <Button isLoading={exporting} disabled={!selected} onClick={handleExport}>
                <Download className="size-4" /> Export &amp; get shareable link
              </Button>
            </div>

            {exportUrl && (
              <Alert variant="success">
                Exported! <a href={exportUrl} target="_blank" rel="noreferrer" className="font-medium underline">Download your resume</a>
              </Alert>
            )}
          </>
        )}
      </main>
    </>
  );
}
