import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Rough estimate only: pulls every 4-digit year out of each experience
// entry's raw `dates` string (e.g. "Jan 2021 - Present") and returns the
// span from the earliest year found to either the latest year found, or
// today if any entry says "present"/"current". Returns "" when there's not
// enough date info to make a reasonable guess, rather than a made-up number.
export function estimateYearsOfExperience(experienceEntries = []) {
  const currentYear = new Date().getFullYear();
  let minYear = null;
  let maxYear = null;
  let hasPresent = false;

  for (const entry of experienceEntries) {
    const text = entry.dates || entry.startDate || "";
    const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => parseInt(m[0], 10));
    for (const year of years) {
      if (minYear === null || year < minYear) minYear = year;
      if (maxYear === null || year > maxYear) maxYear = year;
    }
    if (/present|current/i.test(text)) hasPresent = true;
  }

  if (minYear === null) return "";

  const endYear = hasPresent ? currentYear : maxYear ?? currentYear;
  const span = Math.max(0, endYear - minYear);
  return span > 0 ? String(span) : "";
}