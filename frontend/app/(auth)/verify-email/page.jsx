"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { normalizeError } from "@/lib/api/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const pendingEmail = params.get("email");
  const deliveryFailed = params.get("delivery") === "failed";

  if (token) {
    return <VerifyingWithToken token={token} />;
  }

  if (deliveryFailed) {
    // Signup succeeded but the verification email couldn't be sent (e.g.
    // SMTP unreachable). Signup doesn't sign the user in, and
    // resend-verification requires being signed in (see auth.routes.js),
    // so "check your email" would be a dead end here - the real path
    // forward is signing in (works even while unverified) and resending
    // from inside the app.
    return (
      <AuthCard title="Account created" subtitle="We couldn't send your verification email right now.">
        <div className="flex flex-col items-center gap-6">
          <p className="text-center text-sm text-ink-500">
            Your account for{" "}
            {pendingEmail && <span className="font-medium text-ink-900">{pendingEmail}</span>} was created, but
            our mail server is unreachable at the moment. You can still sign in — you&apos;ll be able to resend
            the verification email from inside your account once you&apos;re in.
          </p>
          <Button fullWidth onClick={() => router.push("/signin")}>
            Sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  // No token, delivery not flagged as failed -> normal post-signup
  // "check your email" holding screen.
  return (
    <AuthCard title="Check your email" subtitle="Please confirm the validity of your email address.">
      <div className="flex flex-col items-center gap-6">
        <Button
          fullWidth
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "mailto:";
          }}
        >
          Check email
        </Button>
        {pendingEmail && (
          <p className="text-center text-sm text-ink-500">
            We sent a verification link to <span className="font-medium text-ink-900">{pendingEmail}</span>.
          </p>
        )}
        <button
          type="button"
          onClick={() => router.push("/signin")}
          className="text-sm text-brand-500 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    </AuthCard>
  );
}

function VerifyingWithToken({ token }) {
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    authApi
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setState("success");
        setMessage(res.message);
      })
      .catch((err) => {
        if (cancelled) return;
        setState("error");
        setMessage(normalizeError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthCard title="Email Verification">
      <div className="flex flex-col items-center gap-4 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin text-brand-500" />
            <p className="text-sm text-ink-500">Verifying your email…</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="size-12 text-success-600" />
            <p className="text-sm text-ink-700">{message}</p>
            <Link href="/signin" className="w-full">
              <Button fullWidth>Continue to sign in</Button>
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="size-12 text-danger-600" />
            <p className="text-sm text-ink-700">{message}</p>
            <Link href="/signin" className="w-full">
              <Button fullWidth variant="outline">Back to sign in</Button>
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  );
}
