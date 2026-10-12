"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { IntroBanner } from "@/components/ui/IntroBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";

export default function SignUpPage() {
  const router = useRouter();
  const { signup, signinWithSocial, setPendingSigninEmail } = useAuthStore();
  const [serverError, setServerError] = useState(null);
  // Matches the Figma modal: "This email is already connected to an
  // account. Do you want to log in instead?" - the backend already
  // distinguishes this case with a real 409 status (see auth.controller.js
  // `signup`), so this checks that instead of guessing from message text.
  const [existingAccountEmail, setExistingAccountEmail] = useState(null);

  const form = useForm({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values) {
    setServerError(null);
    try {
      const { emailDelivered } = await signup(values.name, values.email, values.password);
      // Backend doesn't sign the user in on signup - it requires email
      // verification first (see auth.controller.js `signup`). If the
      // verification email itself failed to send (e.g. SMTP down), tell
      // the person honestly instead of sending them to a "check your
      // email" screen for an email that never arrived.
      const emailParam = encodeURIComponent(values.email);
      router.push(
        emailDelivered
          ? `/verify-email?pending=1&email=${emailParam}`
          : `/verify-email?pending=1&email=${emailParam}&delivery=failed`
      );
    } catch (err) {
      if (err.statusCode === 409) {
        setExistingAccountEmail(values.email);
      } else {
        setServerError(err.message);
      }
    }
  }

  function handleGoToLogin() {
    setPendingSigninEmail(existingAccountEmail);
    router.push("/signin");
  }

  async function handleGoogleCredential(idToken) {
    setServerError(null);
    try {
      // Google sign-up is already-verified by Google, so it goes straight to the dashboard.
      await signinWithSocial(idToken);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err.message);
    }
  }

  return (
    <AuthCard title="" width="max-w-lg">
      <IntroBanner />

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">Enter your details</h1>
        <p className="mt-2 text-sm text-ink-500">You will need to confirm this email later</p>
      </div>

      {serverError && <Alert>{serverError}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Joe Kent"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="joekent@gmail.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Input
          label="Enter Password"
          type="password"
          placeholder="••••••••"
          hint="At least 8 characters, one uppercase letter, one number"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={form.formState.errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />

        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
          Create Account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
        <div className="h-px flex-1 bg-ink-200" />
        Or sign up with
        <div className="h-px flex-1 bg-ink-200" />
      </div>

      <SocialAuthButtons onGoogleCredential={handleGoogleCredential} onError={setServerError} />

      <p className="mt-6 text-center text-sm text-ink-500">
        Oh, I have an account?{" "}
        <Link href="/signin" className="font-medium text-brand-500 hover:underline">
          Sign in
        </Link>
      </p>

      <Modal open={!!existingAccountEmail} onClose={() => setExistingAccountEmail(null)} width="max-w-sm">
        <h2 className="mb-2 text-lg font-semibold text-ink-900">
          This email is already connected to an account.
        </h2>
        <p className="mb-5 text-sm text-ink-500">Do you want to log in instead?</p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setExistingAccountEmail(null)}>
            Close
          </Button>
          <Button fullWidth onClick={handleGoToLogin}>
            Go To Login
          </Button>
        </div>
      </Modal>
    </AuthCard>
  );
}
