import { create } from "zustand";
import * as jobsApi from "@/lib/api/jobs";

// Real, server-persisted saved jobs (backend: SavedJob model + /jobs/:id/save,
// /jobs/saved/me). Replaces the earlier localStorage-only version - saved
// jobs now sync across devices and survive clearing browser data.
export const useSavedJobsStore = create((set, get) => ({
  savedIds: [],
  jobs: [],
  status: "idle", // "idle" | "loading" | "loaded"

  fetchSaved: async () => {
    set({ status: "loading" });
    try {
      const res = await jobsApi.getSavedJobs();
      const jobs = res.data.jobs;
      set({ jobs, savedIds: jobs.map((j) => j._id), status: "loaded" });
    } catch {
      set({ status: "loaded" });
    }
  },

  toggle: async (jobId) => {
    const isCurrentlySaved = get().savedIds.includes(jobId);
    // Optimistic update
    set((state) => ({
      savedIds: isCurrentlySaved
        ? state.savedIds.filter((id) => id !== jobId)
        : [...state.savedIds, jobId],
    }));
    try {
      if (isCurrentlySaved) {
        await jobsApi.unsaveJob(jobId);
        set((state) => ({ jobs: state.jobs.filter((j) => j._id !== jobId) }));
      } else {
        await jobsApi.saveJob(jobId);
      }
    } catch {
      // Roll back on failure
      set((state) => ({
        savedIds: isCurrentlySaved
          ? [...state.savedIds, jobId]
          : state.savedIds.filter((id) => id !== jobId),
      }));
    }
  },

  isSaved: (jobId) => get().savedIds.includes(jobId),
}));
