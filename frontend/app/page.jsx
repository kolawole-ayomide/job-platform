import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="max-w-xl text-3xl font-semibold text-ink-900 sm:text-4xl">
          Your AI job search assistant
        </h1>
        <p className="max-w-md text-sm text-ink-500">
          WizJobAI auto-applies to jobs on your behalf, tracks every application,
          and preps you for interviews.
        </p>
        <div className="flex gap-3">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
