import type { Brief } from "@/lib/brief-contract";
import { supabaseAdmin } from "@/lib/supabase";

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

function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${weekday} · ${date}`;
}

export default async function Page() {
  const { latest, recent, deliveries } = await loadLatest();

  return (
    <>
      {latest ? <BriefHero brief={latest} /> : <EmptyHero />}

      <details className="field-log">
        <summary>Field log</summary>
        <div className="field-log-grid">
          <SourceRegistry brief={latest} />
          <DeliveryLog deliveries={deliveries} />
        </div>
        <RunTimeline recent={recent} latest={latest} />
      </details>

      <footer className="brief-footer">
        <span>Generated {new Date().toISOString()}</span>
      </footer>
    </>
  );
}

function BriefHero({ brief }: { brief: Brief }) {
  return (
    <article className="brief-hero">
      <div className="brief-eyebrow">{formatLongDate(brief.date)}</div>
      <h1 className="brief-title">{brief.title}</h1>
      <p className="brief-summary">{brief.summary}</p>

      <div className="priority-block">
        <div className="priority-label">Top priority</div>
        <div className="priority-text">{brief.top_priority}</div>
      </div>

      {brief.sections.map((s, i) => (
        <section className="brief-section" key={i}>
          <h2 className="section-heading">{s.heading}</h2>
          <p className="section-body">{s.body}</p>
        </section>
      ))}
    </article>
  );
}

function EmptyHero() {
  return (
    <div className="brief-empty">
      <h2>No brief yet.</h2>
      <p>
        Run <code>/morning</code> in Claude Code, or POST a brief to <code>/api/briefs</code>.
      </p>
    </div>
  );
}

function SourceRegistry({ brief }: { brief: Brief | null }) {
  const sources = brief?.source_status ?? [
    { name: "manual-notes", enabled: true, last_pulled_at: null, item_count: 0 },
    { name: "calendar", enabled: false, last_pulled_at: null, item_count: 0 },
    { name: "gmail", enabled: false, last_pulled_at: null, item_count: 0 },
  ];
  return (
    <div className="field-log-card">
      <div className="field-log-card-label">Sources</div>
      <ul className="field-log-list">
        {sources.map((s) => (
          <li key={s.name}>
            <span className="mono">{s.name}</span>
            <span className={`status-pill ${s.enabled ? "ok" : "muted"}`}>
              {s.enabled ? `${s.item_count}` : "off"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeliveryLog({ deliveries }: { deliveries: LatestData["deliveries"] }) {
  return (
    <div className="field-log-card">
      <div className="field-log-card-label">Delivery</div>
      {deliveries.length === 0 ? (
        <p className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-3)" }}>No pings sent yet.</p>
      ) : (
        <ul className="field-log-list">
          {deliveries.slice(0, 6).map((d) => (
            <li key={d.id}>
              <span className="mono">
                {new Date(d.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {d.channel}
              </span>
              <span className={`status-pill ${d.ok ? "ok" : "warn"}`}>{d.ok ? "sent" : "failed"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RunTimeline({ recent, latest }: { recent: Brief[]; latest: Brief | null }) {
  const all = latest ? [latest, ...recent] : recent;
  if (all.length === 0) return null;
  return (
    <div className="timeline">
      <div className="timeline-label">Recent briefs</div>
      <ul className="timeline-list">
        {all.map((b, i) => (
          <li key={(b.id ?? "") + i}>
            <span className="timeline-date">{b.date}</span>
            <span className="timeline-title">{b.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
