"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TagInput } from "@/components/ui/TagInput";
import { Alert } from "@/components/ui/Alert";
import { AvatarPicker, AVATAR_OPTIONS } from "@/components/wizbot/AvatarPicker";
import * as wizbotApi from "@/lib/api/wizbot";
import { normalizeError } from "@/lib/api/client";

// Creates a real WizbotAgent - once created it's picked up by the backend's
// background scheduler (every 2 min by default, see server.js) and starts
// scanning the live Job collection against these criteria for real matches
// and, if autoApply is on, real applications.
export function CreateBotModal({ open, onClose }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [keywords, setKeywords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [workMode, setWorkMode] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [minMatchScore, setMinMatchScore] = useState("50");
  const [autoApply, setAutoApply] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Give your bot a name to get started.");
      return;
    }
    if (!keywords.length) {
      setError("Add at least one keyword so the bot knows what to scan for.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const res = await wizbotApi.createAgent({
        name: name.trim(),
        avatar,
        autoApply,
        criteria: {
          keywords,
          locations,
          workMode: workMode || null,
          jobType: jobType || null,
          experienceLevel: experienceLevel || null,
          salaryMin: salaryMin ? Number(salaryMin) : null,
          minMatchScore: Number(minMatchScore) || 50,
        },
      });
      onClose();
      router.push(`/wizbot/${res.data.agent._id}`);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-md">
      <h2 className="mb-1 text-lg font-semibold text-ink-900">Create New Bot</h2>
      <p className="mb-5 text-sm text-ink-500">
        Configure your AI job application agent — it scans live jobs against these criteria automatically.
      </p>

      {error && <Alert>{error}</Alert>}

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium text-brand-500">Choose Avatar</p>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>

      <div className="space-y-4">
        <Input
          label="Bot Name"
          placeholder="e.g. Software Engineer"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TagInput
          label="Keywords to scan for"
          values={keywords}
          onChange={setKeywords}
          placeholder="e.g. React, Node.js, Backend"
        />

        <TagInput
          label="Locations (optional)"
          values={locations}
          onChange={setLocations}
          placeholder="e.g. Remote, Lagos, London"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Work mode" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            <option value="">Any</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </Select>
          <Select label="Job type" value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">Any</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Experience level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
          >
            <option value="">Any</option>
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </Select>
          <Input
            label="Min salary (optional)"
            type="number"
            placeholder="e.g. 80000"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
          />
        </div>

        <Input
          label="Minimum match score to act on (%)"
          type="number"
          min={0}
          max={100}
          value={minMatchScore}
          onChange={(e) => setMinMatchScore(e.target.value)}
          hint="Jobs scoring below this are scanned but not logged as matches."
        />

        <label className="flex items-start gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
            className="mt-0.5 size-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
          />
          <span>
            Auto-apply to matches above the threshold (uses your saved resume)
            <span className="mt-0.5 block text-xs font-normal text-ink-400">
              Only applies to jobs posted directly on WizJobAI - external listings (from job
              boards) are flagged as matches for you to apply to yourself, since we can't submit
              applications on other sites.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose}>
          Close
        </Button>
        <Button fullWidth isLoading={isCreating} onClick={handleCreate}>
          Create AI Agent
        </Button>
      </div>
    </Modal>
  );
}
