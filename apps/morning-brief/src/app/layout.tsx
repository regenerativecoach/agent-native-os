import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Brief — The Regenerative Coach",
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
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500;1,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="header-inner">
            <div>
              <div className="site-title">
                Morning <em>Brief</em>
              </div>
              <div className="site-tagline">The Regenerative Coach · Dan&apos;s daily field manual</div>
            </div>
            <div className="header-date">{formatHeaderDate()}</div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
