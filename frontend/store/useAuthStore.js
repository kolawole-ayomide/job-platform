import { create } from "zustand";
import * as authApi from "@/lib/api/auth";
import { normalizeError } from "@/lib/api/client";

export const useAuthStore = create((set) => ({
  user: null,
  status: "idle", // "idle" | "loading" | "authenticated" | "unauthenticated"
  // Carries the email between the two sign-in steps (email -> password screens).
  pendingSigninEmail: null,

  setPendingSigninEmail: (email) => set({ pendingSigninEmail: email }),

  // Called once on app shell mount to check the HttpOnly cookie session.
  hydrate: async () => {
    set({ status: "loading" });
    try {
      const res = await authApi.getMe();
      set({ user: res.data.user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  signin: async (email, password) => {
    try {
      const res = await authApi.signin({ email, password });
      set({ user: res.data.user, status: "authenticated" });
      return res.data.user;
    } catch (err) {
      throw normalizeError(err);
    }
  },

 signup: async (name, email, password) => {
    try {
      const res = await authApi.signup({ name, email, password });
      // Signup does not sign the user in (no cookie set) - the backend
      // requires email verification first (see auth.controller.js `signup`).
      // `emailDelivered` lets the UI tell the user honestly if the
      // verification email couldn't be sent (e.g. SMTP down), instead of
      // always claiming "check your email" when nothing was sent.
      return res.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  // Google/LinkedIn OAuth both return the same { user } shape and set the
  // same HttpOnly cookie as email/password signin, so they share this.
  signinWithSocial: async (idToken) => {
    try {
      const res = await authApi.googleAuth(idToken);
      set({ user: res.data.user, status: "authenticated" });
      return res.data.user;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: "unauthenticated" });
    }
  },

  setUser: (user) => set({ user }),
}));
