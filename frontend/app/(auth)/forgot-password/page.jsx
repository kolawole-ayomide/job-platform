"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validators/auth.schema";
import * as authApi from "@/lib/api/auth";
import { normalizeError } from "@/lib/api/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState(null);
  const [sent, setSent] = useState(false);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values) {
    setServerError(null);
    try {
      await authApi.forgotPassword(values.email);
      // Backend intentionally returns the same generic message whether or
      // not the account exists (prevents email enumeration) - so we just
      // show the confirmation state regardless.
      setSent(true);
    } catch (err) {
      setServerError(normalizeError(err).message);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="If an account with that email exists, a reset link has been sent.">
        <p className="text-center text-sm text-ink-500">
          Follow the link in the email to set a new password.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="If you've forgotten your password, enter your email to reset it.">
      {serverError && <Alert>{serverError}</Alert>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="joekent@gmail.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
          Continue
        </Button>
      </form>
    </AuthCard>
  );
}
