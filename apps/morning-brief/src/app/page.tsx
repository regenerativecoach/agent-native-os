import type { Brief } from "@/lib/brief-contract";
import { supabaseAdmin } from "@/lib/supabase";
import { routeBrief } from "@/lib/brief-router";
import BriefTabs from "./brief-tabs";

export const dynamic = "force-dynamic";

type LatestData = {
  latest: Brief | null;
  recent: Brief[];
  deliveries: Array<{ id: string; channel: string; ok: boolean; created_at: string; error: string | null }>;
};

async function loadLatest(): Promise<LatestData> {
  try {
    const sb = supabaseAdmin();
    const briefsRes = await sb.from("briefs").select("*").order("date", { ascending: false }).limit(8);
    const deliveryRes = await sb
      .from("delivery_logs")
      .select("id, channel, ok, created_at, error")
      .order("created_at", { ascending: false })
      .limit(10);
    const briefs = (briefsRes.data ?? []) as Brief[];
    return {
      latest: briefs[0] ?? null,
      recent: briefs.slice(1),
      deliveries: deliveryRes.data ?? [],
    };
  } catch {
    return { latest: null, recent: [], deliveries: [] };
  }
}

export default async function Page() {
  const { latest, recent, deliveries } = await loadLatest();

  if (!latest) return <EmptyHero />;

  // When the brief carries the full Obsidian daily-note markdown, route it into tabs.
  // Older briefs (structured-only, no body_markdown) get an empty routed shell — the
  // Today tab still surfaces title/summary/top_priority from the structured contract.
  const routed = latest.body_markdown
    ? routeBrief(latest.body_markdown)
    : {
        heroTitle: latest.title,
        today: "",
        workstreams: "",
        fieldIntel: "",
        rhythm: "",
        log: "",
        workstreamCounts: [],
      };

  return <BriefTabs brief={latest} routed={routed} deliveries={deliveries} recent={recent} />;
}

function EmptyHero() {
  return (
    <main className="brief-main">
      <div className="brief-empty">
        <h2>No brief yet.</h2>
        <p>
          Run <code>/morning</code> in Claude Code, or POST a brief to <code>/api/briefs</code>.
        </p>
      </div>
    </main>
  );
}
