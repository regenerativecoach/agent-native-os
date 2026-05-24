// Renders Dan's full Obsidian daily note on the Vercel hero.
// Splits the markdown into (regular markdown) and (Obsidian callout) segments.
// Regular segments render via react-markdown + remark-gfm.
// Callouts render as native <details>/<summary> blocks with semantic classes.
//
// Obsidian callout syntax: `> [!type]+` (expanded) / `> [!type]-` (collapsed) / `> [!type]` (no toggle, treated as expanded).
// Body continuation: subsequent lines starting with `> ` until the first non-`>` line.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Segment =
  | { kind: "md"; text: string }
  | { kind: "callout"; type: string; open: boolean; title: string; body: string };

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
    const calloutMatch = line.match(/^>\s*\[!(\w+)\]([+-]?)\s*(.*)$/);

    if (calloutMatch) {
      flushMd();
      const [, type, toggle, title] = calloutMatch;
      i++;
      const bodyLines: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        if (next.startsWith("> ")) {
          bodyLines.push(next.slice(2));
          i++;
        } else if (next.trim() === ">") {
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
      });
    } else {
      mdBuf.push(line);
      i++;
    }
  }
  flushMd();
  return segments;
}

function defaultTitleFor(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function Callout({ seg }: { seg: Extract<Segment, { kind: "callout" }> }) {
  const title = seg.title || defaultTitleFor(seg.type);
  return (
    <details className={`callout callout-${seg.type}`} open={seg.open}>
      <summary className="callout-title">{title}</summary>
      <div className="callout-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{seg.body}</ReactMarkdown>
      </div>
    </details>
  );
}

export function ObsidianBrief({ markdown }: { markdown: string }) {
  const segments = parseSegments(markdown);
  return (
    <div className="obsidian-brief">
      {segments.map((seg, i) =>
        seg.kind === "callout" ? (
          <Callout key={i} seg={seg} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {seg.text}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
