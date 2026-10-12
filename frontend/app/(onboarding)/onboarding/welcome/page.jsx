"use client";

import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-brand-50">
          <Handshake className="size-9 text-brand-500" />
        </div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Welcome to WizJobAI, {firstName}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          Your Job Automation Assistant! Kindly take a brief moment to provide us with your
          information to enable us to give you a personalized experience.
        </p>
        <Button size="lg" className="mt-8" onClick={() => router.push("/onboarding/upload-resume")}>
          Let&apos;s Go
        </Button>
      </main>
      <PublicFooter />
    </div>
  );
}
