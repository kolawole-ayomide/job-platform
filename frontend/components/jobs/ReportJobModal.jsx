"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import * as jobsApi from "@/lib/api/jobs";
import { normalizeError } from "@/lib/api/client";

// Reasons map 1:1 to the backend's JobReport `reason` enum
// (spam/scam/expired/discriminatory/misleading/other) so submissions
// validate cleanly against jobReportSchema.
const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "scam", label: "Job listing may be a scam" },
  { value: "expired", label: "Job is expired" },
  { value: "discriminatory", label: "Discriminatory content" },
  { value: "misleading", label: "Incorrect or misleading info" },
  { value: "other", label: "Other" },
];

export function ReportJobModal({ open, onClose, jobId }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    setError("");
    try {
      await jobsApi.reportJob(jobId, reason, details || undefined);
      setSubmitted(true);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setReason("");
      setDetails("");
      setError("");
    }, 200);
  }

  return (
    <Modal open={open} onClose={handleClose}>
      {submitted ? (
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-ink-900">Report received</h2>
          <p className="mb-5 text-sm text-ink-500">
            Thanks for flagging this — our team will review it.
          </p>
          <Button fullWidth onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Report this job</h2>
          {error && <Alert variant="error">{error}</Alert>}
          <p className="mb-2 text-xs font-medium text-ink-500">Why are you reporting this job?</p>
          <div className="mb-4 space-y-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 border-ink-300 text-brand-500 focus:ring-brand-400"
                />
                {r.label}
              </label>
            ))}
          </div>
          <label className="mb-1.5 block text-xs font-medium text-brand-500">Additional details</label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what the problem is"
            className="mb-4 w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={handleClose}>
              Cancel
            </Button>
            <Button fullWidth disabled={!reason} isLoading={submitting} onClick={handleSubmit}>
              Submit report
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
