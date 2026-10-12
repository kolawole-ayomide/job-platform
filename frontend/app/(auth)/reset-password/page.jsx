"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validators/auth.schema";
import * as authApi from "@/lib/api/auth";
import { normalizeError } from "@/lib/api/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values) {
    if (!token) {
      setServerError("This reset link is missing its token. Please request a new one.");
      return;
    }
    setServerError(null);
    try {
      await authApi.resetPassword(token, values.password);
      // Backend clears the auth cookie on reset (forces re-login everywhere).
      router.push("/signin");
    } catch (err) {
      setServerError(normalizeError(err).message);
    }
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a strong password for your account.">
      {!token && <Alert>This reset link is invalid or missing its token.</Alert>}
      {serverError && <Alert>{serverError}</Alert>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          hint="At least 8 characters, one uppercase letter, one number"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={form.formState.errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />
        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
          Reset Password
        </Button>
      </form>
    </AuthCard>
  );
}
