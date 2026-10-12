"use client";

import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/Select";

export function JobSearchHero({ value, onChange, onSubmit, compact, totalCount }) {
  return (
    <div className={`hero-gradient rounded-2xl text-white ${compact ? "p-4" : "p-6"}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>
          Let&apos;s find your dream job
        </h2>
        {typeof totalCount === "number" && (
          <span className="text-xs text-white/70">{totalCount.toLocaleString()}+ available job vacancies</span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-ink-400" />
          <input
            value={value.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            placeholder="Job Title, Company or Keyword"
            className="w-full border-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3.5 py-2.5">
          <MapPin className="size-4 shrink-0 text-ink-400" />
          <input
            value={value.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Location"
            className="w-full border-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
        </div>
        <button
          type="button"
          aria-label="More filters"
          className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-white/10 sm:flex"
        >
          <SlidersHorizontal className="size-4" />
        </button>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-white px-6 text-sm font-medium text-brand-600 hover:bg-white/90"
        >
          Search
        </button>
      </form>

      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Select
            className="!h-10 !border-white/20 !bg-white/10 !text-white [&>option]:text-ink-900"
            value={value.jobType}
            onChange={(e) => onChange({ jobType: e.target.value })}
          >
            <option value="">All types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </Select>
          <Select
            className="!h-10 !border-white/20 !bg-white/10 !text-white [&>option]:text-ink-900"
            value={value.experienceLevel}
            onChange={(e) => onChange({ experienceLevel: e.target.value })}
          >
            <option value="">All levels</option>
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </Select>
          <Select
            className="!h-10 !border-white/20 !bg-white/10 !text-white [&>option]:text-ink-900"
            value={value.workMode}
            onChange={(e) => onChange({ workMode: e.target.value })}
          >
            <option value="">All Locations</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </Select>
          <input
            value={value.salaryMin}
            onChange={(e) => onChange({ salaryMin: e.target.value })}
            placeholder="e.g. $100,000"
            className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/50"
          />
          {/* Real filter now - backend Job.companySize + jobQuerySchema.companySize (was a hardcoded, non-functional div before) */}
          <Select
            className="!h-10 !border-white/20 !bg-white/10 !text-white [&>option]:text-ink-900"
            value={value.companySize}
            onChange={(e) => onChange({ companySize: e.target.value })}
          >
            <option value="">Any company size</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="501-1000">501-1000</option>
            <option value="1000+">1000+</option>
          </Select>
        </div>
      )}
    </div>
  );
}
