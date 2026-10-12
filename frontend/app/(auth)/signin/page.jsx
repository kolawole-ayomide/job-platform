"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinEmailSchema, signinPasswordSchema } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function SignInPage() {
  const router = useRouter();
  const { signin, signinWithSocial, setPendingSigninEmail, pendingSigninEmail } = useAuthStore();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(pendingSigninEmail ?? "");
  const [serverError, setServerError] = useState(null);

  const emailForm = useForm({
    resolver: zodResolver(signinEmailSchema),
    defaultValues: { email: pendingSigninEmail ?? "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(signinPasswordSchema),
  });

  function onEmailSubmit(values) {
    setEmail(values.email);
    setPendingSigninEmail(values.email);
    setServerError(null);
    setStep("password");
  }

  async function onPasswordSubmit(values) {
    setServerError(null);
    try {
      await signin(email, values.password);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err.message);
    }
  }

  async function handleGoogleCredential(idToken) {
    setServerError(null);
    try {
      await signinWithSocial(idToken);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err.message);
    }
  }

  if (step === "email") {
    return (
      <AuthCard title="Sign into WizJobAI" subtitle="New or returning user? Authorize right here.">
        <SocialAuthButtons onGoogleCredential={handleGoogleCredential} onError={setServerError} />

        <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-200" />
          Or better yet login with...
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        {serverError && <Alert>{serverError}</Alert>}

        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="joekent@gmail.com"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register("email")}
          />

          <p className="text-center text-xs text-ink-400">
            By continuing, you agree with the{" "}
            <Link href="/terms" className="text-ink-700 underline">Terms of Service</Link> and our{" "}
            <Link href="/privacy" className="text-ink-700 underline">Privacy Policy</Link>.
          </p>

          <Button type="submit" fullWidth isLoading={emailForm.formState.isSubmitting}>
            Continue with email
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-brand-500 hover:underline">
            Create one
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Enter Password" subtitle="New or returning user? Authorize right here.">
      {serverError && <Alert>{serverError}</Alert>}

      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
        <p className="text-center text-sm text-ink-500">{email}</p>

        <Input
          label="Enter your password"
          type="password"
          placeholder="••••••••"
          autoFocus
          error={passwordForm.formState.errors.password?.message}
          {...passwordForm.register("password")}
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={() => setStep("email")}>
            ← Back
          </Button>
          <Button type="submit" fullWidth isLoading={passwordForm.formState.isSubmitting}>
            Continue →
          </Button>
        </div>

        <p className="text-center">
          <Link href="/forgot-password" className="text-sm text-brand-500 hover:underline">
            Forgot Password?
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
