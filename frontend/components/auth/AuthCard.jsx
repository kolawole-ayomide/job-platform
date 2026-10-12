import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function AuthCard({ title, subtitle, children, width = "max-w-md" }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className={`w-full ${width}`}>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
