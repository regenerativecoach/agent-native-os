-- Adds full Obsidian brief markdown alongside the compact JSON contract.
-- The compact fields (title, summary, top_priority, sections, source_status,
-- delivery_status) still travel for the Telegram ping; body_markdown carries
-- the full daily-note content for the Vercel hero render.

alter table public.briefs
  add column if not exists body_markdown text;
