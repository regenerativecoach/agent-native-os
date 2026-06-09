import type { Metadata } from "next";
import "./globals.css";
import { formatWrittenDateWithWeekday } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Living Systems Intelligence — Morning Brief",
  description: "Dan Chisholm's Daily Update.",
};

function formatHeaderDate(): string {
  const today = new Date().toISOString().slice(0, 10);
  return formatWrittenDateWithWeekday(today);
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
                <em>Living</em> Systems Intelligence
              </div>
              <div className="site-tagline">Morning Brief — Dan Chisholm&apos;s Daily Update</div>
            </div>
            <div className="header-date">{formatHeaderDate()}</div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
