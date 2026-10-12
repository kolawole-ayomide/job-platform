"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileUser, Bot, Wand2, NotebookPen, Loader2, CheckCircle2 } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { IntroBanner } from "@/components/ui/IntroBanner";
import * as usersApi from "@/lib/api/users";
import * as wizbotApi from "@/lib/api/wizbot";
import { cn } from "@/lib/utils";

// The Figma design uses real illustration images here (not icon glyphs).
// Drop the 4 files into /public/illustrations/ with these exact names and
// they'll render automatically - until then, this falls back to a plain
// lucide icon rather than showing a broken image.
function TaskIcon({ image, icon: FallbackIcon }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) return <FallbackIcon className="size-10 text-ink-400" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt=""
      className="size-full object-contain"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function GetStartedPage() {
  const [profile, setProfile] = useState(null);
  const [hasAgent, setHasAgent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([usersApi.getProfile(), wizbotApi.listAgents()])
      .then(([profileRes, agentsRes]) => {
        if (cancelled) return;
        if (profileRes.status === "fulfilled") setProfile(profileRes.value.data.profile);
        if (agentsRes.status === "fulfilled") setHasAgent(agentsRes.value.data.agents.length > 0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const profileComplete = !!(
    profile?.headline &&
    profile?.summary &&
    profile?.skills?.length &&
    profile?.phone
  );
  const resumeReady = !!profile?.resumeUrl;

  // Interview Prep completion isn't tracked anywhere yet (that module isn't
  // wired up in this build), so it stays honestly "incomplete" rather than
  // guessing. Wizbot completion is now real - hasAgent reflects an actual
  // WizbotAgent the user created.
  const tasks = [
    {
      key: "profile",
      title: "Complete your profile",
      description: "We need a few more details to improve your experience on wizjob AI",
      icon: FileUser,
      image: "/images/get-started-profile.png",
      actionLabel: profileComplete ? "View" : "Setup",
      href: "/settings/profile",
      complete: profileComplete,
    },
    {
      key: "resume",
      title: "Optimize your resume",
      description: "Set up with relevant information such as profile picture, phone number etc",
      icon: Wand2,
      image: "/images/get-started-resume.png",
      actionLabel: resumeReady ? "View" : "Let's go",
      href: "/resume",
      complete: resumeReady,
    },
    {
      key: "wizbot",
      title: "Create your first wizbot",
      description: "Set up AI agents (WizBots) to automatically apply to jobs matching your criteria 24/7.",
      icon: Bot,
      image: "/images/get-started-wizbot.png",
      actionLabel: hasAgent ? "View" : "Create",
      href: "/wizbot",
      complete: hasAgent,
    },
    {
      key: "interview",
      title: "Prepare for Interview",
      description: "Set up with relevant information such as profile picture, phone number etc",
      icon: NotebookPen,
      image: "/images/get-started-interview.png",
      actionLabel: "Take a Section",
      href: "/interview-prep",
      complete: false,
    },
  ];

  const completedCount = tasks.filter((t) => t.complete).length;

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Get Started" }]} />

      <main className="flex-1 px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink-900">Account setup</h1>
          <span className="text-sm text-ink-500">{completedCount}/{tasks.length} completed</span>
        </div>

        <IntroBanner />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tasks.map((task) => (
              <div key={task.key} className="flex flex-col rounded-xl border border-ink-100 bg-white p-4">
                <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg bg-brand-50/60">
                  <TaskIcon image={task.image} icon={task.icon} />
                </div>
                <span className="mb-2 w-fit rounded-md bg-ink-100 px-2 py-0.5 text-[11px] text-ink-500">
                  1 min · non technical
                </span>
                <p className="text-sm font-semibold text-ink-900">{task.title}</p>
                <p className="mt-1 flex-1 text-xs text-ink-500">{task.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  {task.complete ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-success-600">
                      <CheckCircle2 className="size-3.5" /> Done
                    </span>
                  ) : (
                    <span className="size-3.5" />
                  )}
                  <Link
                    href={task.href}
                    className={cn(
                      "rounded-lg px-3.5 py-1.5 text-xs font-medium",
                      task.complete
                        ? "bg-ink-100 text-ink-600"
                        : "bg-brand-600 text-white hover:bg-navy-900"
                    )}
                  >
                    {task.actionLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
