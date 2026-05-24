import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Brief",
  description: "Dan's daily field manual.",
};

function formatHeaderDate(): string {
  const d = new Date();
  const day = d.toLocaleDateString("en-GB", { weekday: "long" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${day} · ${date}`;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="brief-header">
          <span className="brief-header-date">{formatHeaderDate()}</span>
          <span className="brief-wordmark">Morning Brief</span>
        </header>
        <main className="brief-main">{children}</main>
      </body>
    </html>
  );
}
