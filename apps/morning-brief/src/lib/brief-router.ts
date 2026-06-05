// Partition the Obsidian morning-brief markdown into 5 tab buckets:
// today · workstreams · fieldIntel · rhythm · log.
//
// Routing rules:
//   • Pre-h2 (preamble) callouts route by type:
//       quote / abstract / warning / tip / list  → today
//       cite / example                           → rhythm
//   • Inside the "Field Intelligence" h2 section → fieldIntel
//   • Inside the "Tier-1 Workstreams" h2 section:
//       tip                                      → today (Coaching Reflection)
//       list                                     → today (Today's Cadence)
//       example / note                           → workstreams
//   • Top-of-doc loose blockquote (Inbox sweep / Regen cache) + trailing "Generated…"
//     blockquote → log
//   • H1 line ("# 🌅 ... Morning Brief") is stripped from every bucket.

export type RoutedBrief = {
  heroTitle: string;          // text extracted from the doc's H1 (without leading emoji)
  today: string;
  workstreams: string;
  fieldIntel: string;
  rhythm: string;
  log: string;                // diagnostic blockquotes (top sweep + bottom generated stamp)
  workstreamCounts: WorkstreamCount[];
};

export type WorkstreamCount = {
  emoji: string;              // leading emoji from the callout title (or "")
  name: string;               // human name ("Health", "Coaching", …)
  primary: number | null;     // first numeric in the *Total:* line, or null
  primaryLabel: string;       // label that followed the number ("active", "in flight", "seeding", …)
};

type Tab = "today" | "workstreams" | "fieldIntel" | "rhythm" | "log";

type Segment =
  | { kind: "md"; text: string }
  | {
      kind: "callout";
      type: string;
      open: boolean;
      title: string;
      body: string;
      raw: string; // verbatim source so we can re-emit losslessly
    };

const CALLOUT_RE = /^>\s*\[!(\w+)\]([+-]?)\s*(.*)$/;

function parseSegments(md: string): Segment[] {
  const lines = md.split("\n");
  const segments: Segment[] = [];
  let mdBuf: string[] = [];
  let i = 0;

  const flushMd = () => {
    if (mdBuf.length > 0) {
      segments.push({ kind: "md", text: mdBuf.join("\n") });
      mdBuf = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(CALLOUT_RE);
    if (m) {
      flushMd();
      const [, type, toggle, title] = m;
      const rawLines: string[] = [line];
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.startsWith("> ")) {
          rawLines.push(next);
          bodyLines.push(next.slice(2));
          i++;
        } else if (next.trim() === ">") {
          rawLines.push(next);
          bodyLines.push("");
          i++;
        } else {
          break;
        }
      }
      segments.push({
        kind: "callout",
        type: type.toLowerCase(),
        open: toggle !== "-",
        title: title.trim(),
        body: bodyLines.join("\n").replace(/\s+$/, ""),
        raw: rawLines.join("\n"),
      });
    } else {
      mdBuf.push(line);
      i++;
    }
  }
  flushMd();
  return segments;
}

// Within a `md` segment, find any standalone H2 (`## …`) lines and partition.
// Returns ordered chunks each tagged with the most-recent H2 header (or null for preamble).
function splitMdByH2(text: string): Array<{ heading: string | null; text: string }> {
  const lines = text.split("\n");
  const chunks: Array<{ heading: string | null; text: string }> = [];
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (buf.length > 0) {
      chunks.push({ heading: current, text: buf.join("\n") });
      buf = [];
    }
  };
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flush();
      current = line.replace(/^##\s+/, "").trim();
      // keep the heading line inside its own chunk so we can re-emit it
      buf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return chunks;
}

function routeCallout(type: string, section: string | null): Tab {
  const inField = (section ?? "").toLowerCase().includes("field intelligence");
  const inWork  = (section ?? "").toLowerCase().includes("workstream");

  if (inField) return "fieldIntel";

  if (inWork) {
    if (type === "tip")  return "today";       // Coaching Reflection
    if (type === "list") return "today";       // Today's Cadence
    return "workstreams";                       // example / note (Overnight Drafts)
  }

  // Preamble (no h2 yet)
  switch (type) {
    case "quote":
    case "abstract":
    case "warning":
    case "tip":
    case "list":
      return "today";
    case "cite":
      return "rhythm";
    case "example":
      return "rhythm";   // Natural Rhythm + Biodynamic Garden live here
    default:
      return "today";
  }
}

// Strip the H1 title line out of an md chunk and return both pieces.
function extractH1(text: string): { title: string; rest: string } {
  const lines = text.split("\n");
  let title = "";
  const rest: string[] = [];
  for (const line of lines) {
    if (!title && /^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, "").replace(/^[\p{Emoji}\p{So}\p{Sk}\s]*/u, "").trim();
      continue;
    }
    rest.push(line);
  }
  return { title, rest: rest.join("\n") };
}

// Pull the headline count from a workstream callout body. Handles three shapes:
//   A) "*Total: 3 active · 0 waiting · 5 in triage*"        → 3, "active"
//   B) "*Triage backlog: 19 awaiting triage · 3 active*"    → 19, "awaiting triage"
//   C) "*Seeding: 2 · Tending: 0 · Flowering: 0 · …*"       → 2, "Seeding"
function parseCount(body: string): { primary: number | null; primaryLabel: string } {
  // Pattern A/B — keyword: NUMBER label
  const a = body.match(/\*\s*(?:Total(?:\s+in\s+flight)?|Triage\s+backlog)\s*:\s*(\d+)\s+([A-Za-z][A-Za-z\s-]*?)(?:\s*[·\*]|$)/);
  if (a) return { primary: parseInt(a[1], 10), primaryLabel: a[2].trim() };

  // Pattern C — Community-style: LABEL: NUMBER (label IS the meaning)
  const b = body.match(/\*\s*(Seeding|Tending|Flowering|Dormant)\s*:\s*(\d+)/);
  if (b) return { primary: parseInt(b[2], 10), primaryLabel: b[1] };

  // Fallback: first "* … N word …" line
  const c = body.match(/^\s*\*\s*[^*]*?(\d+)\s+([A-Za-z][A-Za-z\s-]*?)(?:\s*[·\*]|$)/m);
  if (c) return { primary: parseInt(c[1], 10), primaryLabel: c[2].trim() };

  return { primary: null, primaryLabel: "" };
}

const EMOJI_PREFIX = /^([\p{Emoji_Presentation}\p{Extended_Pictographic}☀-➿️]+)\s+(.*)$/u;
function splitEmojiName(title: string): { emoji: string; name: string } {
  // "🥋 Tai Chi ([open](https://…))" → emoji "🥋", name "Tai Chi"
  const cleaned = title.replace(/\s*\(\[open\][^)]+\)\s*$/, "").replace(/\s*\(.*\)\s*$/, "").trim();
  const m = cleaned.match(EMOJI_PREFIX);
  if (m) return { emoji: m[1].trim(), name: m[2].trim() };
  return { emoji: "", name: cleaned };
}

function isWorkstreamCallout(seg: Extract<Segment, { kind: "callout" }>): boolean {
  if (seg.type !== "example") return false;
  // Workstreams in the Tier-1 section have titles ending with "([open](…))" markers.
  // Field-intel + rhythm "example" callouts don't link to Airtable.
  return /\[open\]\(https:\/\/airtable\.com\//.test(seg.title);
}

export function routeBrief(markdown: string): RoutedBrief {
  const segments = parseSegments(markdown);

  const buckets: Record<Tab, string[]> = {
    today: [],
    workstreams: [],
    fieldIntel: [],
    rhythm: [],
    log: [],
  };
  let heroTitle = "";
  const counts: WorkstreamCount[] = [];

  let currentSection: string | null = null;

  // Pre-pass: stash the leading loose-blockquote diagnostic (Inbox sweep / Regen cache)
  // into the log bucket, then strip it from the first md segment.
  if (segments.length > 0 && segments[0].kind === "md") {
    const first = segments[0];
    const lines = first.text.split("\n");
    const leadingQuote: string[] = [];
    let i = 0;
    while (i < lines.length && (lines[i].startsWith(">") || lines[i].trim() === "")) {
      // Stop at the first H1 (we want the leading blockquote, not in-content quotes)
      if (/^#\s+/.test(lines[i])) break;
      leadingQuote.push(lines[i]);
      i++;
      if (lines[i] && !lines[i].startsWith(">") && lines[i].trim() !== "") break;
    }
    if (leadingQuote.length > 0) {
      buckets.log.push(leadingQuote.join("\n").trim());
      first.text = lines.slice(i).join("\n");
    }
  }

  for (const seg of segments) {
    if (seg.kind === "md") {
      // Possibly contains an H1 and/or H2 headings — partition.
      const chunks = splitMdByH2(seg.text);
      for (const chunk of chunks) {
        let text = chunk.text;

        // Extract H1 once
        if (!heroTitle) {
          const ext = extractH1(text);
          if (ext.title) {
            heroTitle = ext.title;
            text = ext.rest;
          }
        }

        if (chunk.heading) {
          currentSection = chunk.heading;
          // Skip the bare heading line — each tab provides its own hero title.
          // Keep any description paragraph that follows the heading in the same chunk.
          text = text.replace(/^##\s+.+$/m, "").trimStart();
        }

        // Route loose markdown (description paragraphs, dividers, footer quote) to the
        // current section's tab. The closing `---` + "Generated…" blockquote → log.
        if (/^---\s*$/m.test(text) && /Generated/.test(text)) {
          buckets.log.push(text.trim());
          continue;
        }

        const trimmed = text.trim();
        if (!trimmed) continue;

        const lower = (currentSection ?? "").toLowerCase();
        if (lower.includes("field intelligence")) {
          buckets.fieldIntel.push(trimmed);
        } else if (lower.includes("workstream")) {
          buckets.workstreams.push(trimmed);
        } else {
          // Preamble loose text — rare; route to today.
          buckets.today.push(trimmed);
        }
      }
    } else {
      // Callout
      const tab = routeCallout(seg.type, currentSection);
      buckets[tab].push(seg.raw);

      if (isWorkstreamCallout(seg)) {
        const { emoji, name } = splitEmojiName(seg.title);
        const { primary, primaryLabel } = parseCount(seg.body);
        counts.push({ emoji, name, primary, primaryLabel });
      }
    }
  }

  return {
    heroTitle,
    today: buckets.today.join("\n\n").trim(),
    workstreams: buckets.workstreams.join("\n\n").trim(),
    fieldIntel: buckets.fieldIntel.join("\n\n").trim(),
    rhythm: buckets.rhythm.join("\n\n").trim(),
    log: buckets.log.join("\n\n").trim(),
    workstreamCounts: counts,
  };
}
