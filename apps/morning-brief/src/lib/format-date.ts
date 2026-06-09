// Shared date formatters — one written style across the whole surface.
// Use formatWrittenDate / formatWrittenDateWithWeekday everywhere a date is shown.
// rewriteIsoDates(s) swaps any embedded YYYY-MM-DD inside a string with the written form.

function ordinalSuffix(n: number): string {
  // 1 → st · 2 → nd · 3 → rd · 4..20 → th · then repeats
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function parseIso(iso: string): Date | null {
  // Accept "YYYY-MM-DD" or full ISO timestamps. Anchor bare dates to local midnight
  // so the JS engine doesn't shift them across the dateline.
  const isoFull = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + "T00:00:00" : iso;
  const d = new Date(isoFull);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "9th June 2026"
export function formatWrittenDate(iso: string): string {
  const d = parseIso(iso);
  if (!d) return iso;
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${day}${ordinalSuffix(day)} ${month} ${year}`;
}

// "Tuesday · 9th June 2026"
export function formatWrittenDateWithWeekday(iso: string): string {
  const d = parseIso(iso);
  if (!d) return iso;
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  return `${weekday} · ${formatWrittenDate(iso)}`;
}

// Swap every embedded YYYY-MM-DD inside `s` with the written form.
// Used to clean up titles like "2026-06-09 — Morning Brief" → "9th June 2026 — Morning Brief".
export function rewriteIsoDates(s: string): string {
  return s.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_m, y, mo, d) =>
    formatWrittenDate(`${y}-${mo}-${d}`)
  );
}
