export function PublicFooter() {
  return (
    <footer className="mt-auto flex items-center justify-between border-t border-ink-100 px-6 py-4 text-xs text-ink-400 sm:px-10">
      <span>&copy; {new Date().getFullYear()} WizJobAI. All rights reserved.</span>
      <div className="flex items-center gap-4">
        <a href="/privacy" className="hover:text-ink-700">Privacy Policy</a>
        <a href="/terms" className="hover:text-ink-700">Terms &amp; Conditions</a>
      </div>
    </footer>
  );
}
