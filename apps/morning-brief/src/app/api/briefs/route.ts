import { NextResponse } from "next/server";
import { validateBrief } from "@/lib/brief-contract";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/briefs
// Body: a Claude-generated JSON object that matches the brief contract.
// Writes to the briefs table and returns the inserted row.
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  let brief;
  try {
    brief = validateBrief(payload);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "validation failed" }, { status: 422 });
  }

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("briefs")
      .insert({
        date: brief.date,
        title: brief.title,
        summary: brief.summary,
        top_priority: brief.top_priority,
        sections: brief.sections,
        source_status: brief.source_status,
        delivery_status: brief.delivery_status,
        body_markdown: brief.body_markdown ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, brief: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "insert failed" }, { status: 500 });
  }
}

// GET /api/briefs?limit=10
// Returns the latest N briefs in reverse chronological order.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("briefs")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, briefs: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "fetch failed" }, { status: 500 });
  }
}
