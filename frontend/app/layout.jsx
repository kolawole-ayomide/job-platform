import "./globals.css";

export const metadata = {
  title: "WizJobAI",
  description: "Your AI-powered job search assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink-50 text-ink-900">{children}</body>
    </html>
  );
}
