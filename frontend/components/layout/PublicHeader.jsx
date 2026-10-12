import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between border-b border-ink-100 px-6 py-4 sm:px-10">
      <nav className="flex items-center gap-6 text-sm text-ink-700">
        <Link href="/" className="hover:text-ink-900">Home</Link>
        <Link href="/about" className="hidden hover:text-ink-900 sm:inline">About</Link>
        <Link href="/contact" className="hidden hover:text-ink-900 sm:inline">Contact</Link>
      </nav>

      <Logo />

      <div className="flex items-center gap-3">
        <Link href="/signin">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
        <Link href="/signup">
          <Button variant="primary" size="sm">Sign up</Button>
        </Link>
      </div>
    </header>
  );
}
