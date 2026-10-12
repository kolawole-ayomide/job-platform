"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getLinkedinAuthUrl, getGithubAuthUrl } from "@/lib/api/auth";

export function SocialAuthButtons({ onGoogleCredential, onError }) {
  const [gsiReady, setGsiReady] = useState(false);
  const initialized = useRef(false);
  // Guards against overlapping navigator.credentials.get() (FedCM) calls -
  // the browser only allows one in flight at a time and throws
  // NotAllowedError if a second prompt() fires before the first resolves
  // (e.g. clicking Google again right after a transient error).
  const promptInFlight = useRef(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!gsiReady || initialized.current || !googleClientId || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        promptInFlight.current = false;
        if (response?.credential) {
          onGoogleCredential?.(response.credential);
        } else {
          onError?.("Google sign-in was cancelled or failed.");
        }
      },
    });
    initialized.current = true;
  }, [gsiReady, googleClientId, onGoogleCredential, onError]);

  function handleGoogleClick() {
    if (!googleClientId) {
      onError?.("Google sign-in isn't configured yet (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID).");
      return;
    }
    if (!window.google) {
      onError?.("Google sign-in is still loading - try again in a moment.");
      return;
    }
    if (promptInFlight.current) return; // a request is already in flight - ignore the extra click
    promptInFlight.current = true;

    // Safety net: some FedCM error paths (NetworkError/AbortError) can
    // reject without ever invoking the moment-notification callback below,
    // which would otherwise leave the button permanently stuck. Release
    // the guard after a few seconds regardless.
    const releaseTimer = setTimeout(() => {
      promptInFlight.current = false;
    }, 5000);

    // This notification callback only fires for the "moment" lifecycle
    // (displayed / not displayed / skipped / dismissed) - it never receives
    // a credential (that comes through the `callback` passed to
    // initialize() above). Without checking isNotDisplayed()/isSkippedMoment()
    // here, a FedCM-level abort or skip (very common in private/incognito
    // windows, or when there's no active Google session in the browser)
    // was completely silent - the button just did nothing with no
    // explanation. This surfaces an actual, actionable message instead.
    window.google.accounts.id.prompt((notification) => {
      clearTimeout(releaseTimer);
      promptInFlight.current = false;

      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.();
        // Showing the raw reason string (not just a guessed bucket) because
        // there are several distinct causes Google reports here -
        // unregistered_origin (Authorized JavaScript origins misconfigured
        // in Google Cloud Console), opt_out_or_no_session (no Google
        // session in this browser), secure_http_required, browser_not_supported,
        // etc. - and each needs a different fix, so guessing which one
        // applies just hides the information needed to actually diagnose it.
        onError?.(`Google sign-in didn't display (reason: ${reason || "unknown"}).`);
      }
    });
  }

  function handleLinkedinClick() {
    if (!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID) {
      onError?.("LinkedIn sign-in isn't configured yet (missing NEXT_PUBLIC_LINKEDIN_CLIENT_ID).");
      return;
    }
    window.location.href = getLinkedinAuthUrl();
  }

  function handleGithubClick() {
    if (!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) {
      onError?.("GitHub sign-in isn't configured yet (missing NEXT_PUBLIC_GITHUB_CLIENT_ID).");
      return;
    }
    window.location.href = getGithubAuthUrl();
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
      />
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleLinkedinClick}
          aria-label="Continue with LinkedIn"
          className="flex h-11 items-center gap-2 rounded-lg bg-[#0A66C2] px-4 text-sm font-medium text-white transition hover:opacity-90"
        >
          <span className="text-xs font-bold">in</span>
          LinkedIn
        </button>
        <button
          type="button"
          onClick={handleGoogleClick}
          aria-label="Continue with Google"
          className="flex h-11 items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-900 transition hover:opacity-90"
        >
          <span className="text-xs font-bold">G</span>
          Google
        </button>
        <button
          type="button"
          onClick={handleGithubClick}
          aria-label="Continue with GitHub"
          className="flex h-11 items-center gap-2 rounded-lg bg-[#181717] px-4 text-sm font-medium text-white transition hover:opacity-90"
        >
          <span className="text-xs font-bold">gh</span>
          GitHub
        </button>
      </div>
    </>
  );
}