// Canonical morning-brief JSON contract. Match this in:
//   blueprints/morning-brief/brief-contract.json
//   supabase/migrations/0001_morning_brief.sql (briefs table columns)
// If you add a field, add it in all three places.

export type SourceStatus = {
  name: string; // "gmail", "calendar", "youtube-transcripts", "manual-notes"
  enabled: boolean;
  last_pulled_at: string | null; // ISO 8601
  item_count: number;
  note?: string;
};

export type DeliveryStatus = {
  channel: "telegram" | "slack" | "imessage" | "email" | "none";
  delivered_at: string | null;
  recipient: string | null;
  ok: boolean;
  error?: string | null;
};

export type BriefSection = {
  heading: string;
  body: string; // plain text or light markdown
  citations?: { label: string; url?: string }[];
};

export type Brief = {
  id?: string; // uuid, server-assigned
  date: string; // YYYY-MM-DD
  title: string;
  summary: string; // 1-3 sentence top-of-page summary
  top_priority: string; // single thing the human should do first
  sections: BriefSection[]; // ordered list, render in order
  source_status: SourceStatus[];
  delivery_status: DeliveryStatus;
  body_markdown?: string; // full Obsidian daily-note markdown — Vercel hero render
  created_at?: string; // ISO 8601, server-assigned
};

// Lightweight runtime guard. Throws if any required field is missing.
// body_markdown is optional — older briefs and Telegram-only payloads omit it.
export function validateBrief(input: unknown): Brief {
  if (!input || typeof input !== "object") throw new Error("brief: not an object");
  const b = input as Record<string, unknown>;
  const required = ["date", "title", "summary", "top_priority", "sections", "source_status", "delivery_status"];
  for (const k of required) {
    if (!(k in b)) throw new Error(`brief: missing field "${k}"`);
  }
  if (!Array.isArray(b.sections)) throw new Error("brief: sections must be an array");
  if (!Array.isArray(b.source_status)) throw new Error("brief: source_status must be an array");
  if ("body_markdown" in b && b.body_markdown != null && typeof b.body_markdown !== "string") {
    throw new Error("brief: body_markdown must be a string when present");
  }
  return b as unknown as Brief;
}
