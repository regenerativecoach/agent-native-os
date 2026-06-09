"use client";

import { useState } from "react";
import type { Brief } from "@/lib/brief-contract";
import { ObsidianBrief } from "@/lib/obsidian-brief";
import type { RoutedBrief } from "@/lib/brief-router";
import { formatWrittenDateWithWeekday } from "@/lib/format-date";
import {
  WAVES_PHASES,
  WAVES_LAST_UPDATED,
  FINANCIAL_PROGRESS,
  LIFECYCLE_ORDER,
  type WavesPhase,
  type FinancialProgress,
  type Lifecycle,
} from "@/lib/waves-status";

type TabId = "today" | "workstreams" | "fieldIntel" | "rhythm" | "log";

type Props = {
  brief: Brief;
  routed: RoutedBrief;
  deliveries: Array<{ id: string; channel: string; ok: boolean; created_at: string; error: string | null }>;
  recent: Brief[];
};


export default function BriefTabs({ brief, routed, deliveries, recent }: Props) {
  const [tab, setTab] = useState<TabId>("today");

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "today", label: "Today" },
    { id: "workstreams", label: "Workstreams", count: routed.workstreamCounts.length || undefined },
    { id: "fieldIntel", label: "Field Intel" },
    { id: "rhythm", label: "Rhythm" },
    { id: "log", label: "Log" },
  ];

  const goTo = (id: TabId) => {
    setTab(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <nav className="nav-bar">
        <div className="nav-inner">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`nav-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => goTo(t.id)}
            >
              {t.label}
              {t.count != null && <span className="badge">{t.count}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main className="brief-main">
        {tab === "today" && (
          <TodayPanel brief={brief} routed={routed} onJumpWorkstreams={() => goTo("workstreams")} />
        )}
        {tab === "workstreams" && <WorkstreamsPanel routed={routed} />}
        {tab === "fieldIntel" && <FieldIntelPanel routed={routed} />}
        {tab === "rhythm" && <RhythmPanel routed={routed} />}
        {tab === "log" && <LogPanel brief={brief} routed={routed} deliveries={deliveries} recent={recent} />}
      </main>

      <footer className="brief-footer">
        <span>Generated {brief.created_at ?? new Date().toISOString()}</span>
      </footer>
    </>
  );
}

/* ─── Today ────────────────────────────────────────────── */

function TodayPanel({
  brief,
  routed,
  onJumpWorkstreams,
}: {
  brief: Brief;
  routed: RoutedBrief;
  onJumpWorkstreams: () => void;
}) {
  const heroLine = routed.heroTitle || brief.title;
  return (
    <section className="tab-panel active">
      <div className="hero-band">
        <div className="hero-eyebrow">{formatWrittenDateWithWeekday(brief.date)}</div>
        <h1>
          <span className="serif-accent">Today</span> — {heroLine}
        </h1>
        {brief.summary && <p className="hero-subtitle">{brief.summary}</p>}
        {routed.dailyMantra && (
          <div className="hero-mantra">
            <div className="hero-mantra-label">Daily Mantra</div>
            <div className="hero-mantra-body">
              <ObsidianBrief markdown={routed.dailyMantra} />
            </div>
          </div>
        )}
      </div>

      {brief.top_priority && (
        <div className="priority-block">
          <div className="priority-label">Top priority</div>
          <div className="priority-text">{brief.top_priority}</div>
        </div>
      )}

      <WavesProgressBar phases={WAVES_PHASES} onJumpWorkstreams={onJumpWorkstreams} />
      <FinancialBar progress={FINANCIAL_PROGRESS} />

      <div className="brief-content">
        <ObsidianBrief markdown={routed.today} />
      </div>
    </section>
  );
}

/* ─── WAVES progress bar (replaces workstream chips) ───── */

function lifecycleIndex(l: Lifecycle): number {
  return LIFECYCLE_ORDER.indexOf(l) + 1; // 1..5
}

function WavesProgressBar({
  phases,
  onJumpWorkstreams,
}: {
  phases: WavesPhase[];
  onJumpWorkstreams: () => void;
}) {
  return (
    <div className="status-section">
      <div className="status-section-head">
        <span className="status-section-label">WAVES · Programme Status</span>
        <button className="status-section-link" onClick={onJumpWorkstreams}>
          See tasks in Workstreams →
        </button>
        <span className="status-section-meta">Status as of {WAVES_LAST_UPDATED}</span>
      </div>
      <div className="waves-bar" role="group" aria-label="WAVES programme status">
        {phases.map((p) => (
          <div key={p.letter} className={`waves-pillar stage-${p.lifecycle}`}>
            <div className="waves-letter" aria-hidden="true">{p.letter}</div>
            <div className="waves-phase-name">{p.phaseName}</div>
            <div className="waves-product">{p.product}</div>
            <span className={`waves-role ${p.role}`}>{p.role}</span>
            <div className="lifecycle-bar" aria-label={`Lifecycle: ${p.lifecycle}`}>
              {LIFECYCLE_ORDER.map((stage, idx) => (
                <span
                  key={stage}
                  className={`lifecycle-seg ${idx < lifecycleIndex(p.lifecycle) ? `fill-${p.lifecycle}` : ""}`}
                />
              ))}
            </div>
            <div className={`lifecycle-label stage-${p.lifecycle}`}>{p.lifecycle}</div>
            {p.note && <div className="waves-note">{p.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Financial replacement-income bar ─────────────────── */

function formatGBP(n: number | null): string {
  if (n == null) return "—";
  return `£${n.toLocaleString("en-GB")}`;
}

function FinancialBar({ progress }: { progress: FinancialProgress }) {
  const { currentMonthlyGBP, targetMonthlyGBP, sessionsComplete, sessionsTotal, kpiLockSession, note } = progress;
  const targetKnown = targetMonthlyGBP != null && targetMonthlyGBP > 0;
  const pct = targetKnown && currentMonthlyGBP != null
    ? Math.min(100, Math.round((currentMonthlyGBP / (targetMonthlyGBP as number)) * 100))
    : 0;
  return (
    <div className="status-section">
      <div className="status-section-head">
        <span className="status-section-label">Income Replacement · Path A</span>
        <span className="status-section-meta">{sessionsComplete}/{sessionsTotal} Financial Steward sessions</span>
      </div>
      <div className="financial-card">
        <div className="financial-row">
          <span className="financial-current">
            {currentMonthlyGBP != null ? (
              <>{formatGBP(currentMonthlyGBP)}<span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "0.35rem" }}>/ month</span></>
            ) : (
              <span className="tbd">Baseline pending</span>
            )}
          </span>
          <span className="financial-target">
            Target: {targetKnown ? `${formatGBP(targetMonthlyGBP)} / month` : "TBD"}
          </span>
        </div>
        <div className="financial-track" aria-label={targetKnown ? `${pct}% of target` : "target not yet set"}>
          {targetKnown ? (
            <div className="financial-fill" style={{ width: `${pct}%` }} />
          ) : (
            <div className="financial-fill unknown" style={{ width: "100%" }} />
          )}
        </div>
        <div className="financial-meta">
          <span>
            {note ?? "Financial Steward sessions lock the replacement-income KPI."}
          </span>
          <span className="sessions">
            KPI locks at session{" "}
            <span className="complete">{kpiLockSession}</span>
            {sessionsComplete < kpiLockSession ? ` · ${kpiLockSession - sessionsComplete} to go` : " · locked"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Workstreams ──────────────────────────────────────── */

function WorkstreamsPanel({ routed }: { routed: RoutedBrief }) {
  return (
    <section className="tab-panel active">
      <div className="hero-band">
        <div className="hero-eyebrow">Tier-1 Workstreams · live from Airtable</div>
        <h1>
          What&apos;s <span className="serif-accent">in flight</span>.
        </h1>
        <p className="hero-subtitle">
          Top 3 per domain by priority + due date. Click <em>open</em> on any card to jump to the full Airtable view.
          Overnight drafts from last night&apos;s evening review sit at the bottom.
        </p>
      </div>
      <div className="brief-content">
        {routed.workstreams ? (
          <ObsidianBrief markdown={routed.workstreams} />
        ) : (
          <p className="tab-preamble">No workstream content in today&apos;s brief.</p>
        )}
      </div>
    </section>
  );
}

/* ─── Field Intel ──────────────────────────────────────── */

function FieldIntelPanel({ routed }: { routed: RoutedBrief }) {
  return (
    <section className="tab-panel active">
      <div className="hero-band">
        <div className="hero-eyebrow">Field Intelligence</div>
        <h1>
          What&apos;s <span className="serif-accent">moving</span> in the field.
        </h1>
        <p className="hero-subtitle">
          Outside signal — three feeds the coaching concept sits inside: regenerative leadership, AI, and the
          AI × regenerative intersection in UK construction. Skim or skip.
        </p>
      </div>
      <div className="brief-content">
        {routed.fieldIntel ? (
          <ObsidianBrief markdown={routed.fieldIntel} />
        ) : (
          <p className="tab-preamble">No field-intel content in today&apos;s brief.</p>
        )}
      </div>
    </section>
  );
}

/* ─── Rhythm ───────────────────────────────────────────── */

function RhythmPanel({ routed }: { routed: RoutedBrief }) {
  return (
    <section className="tab-panel active">
      <div className="hero-band">
        <div className="hero-eyebrow">Rhythm · interior layer</div>
        <h1>
          The <span className="serif-accent">season</span> around the day.
        </h1>
        <p className="hero-subtitle">
          WAVES glimpse, natural rhythm (season + moon phase), and the biodynamic garden context the day is
          happening inside. Sets the register before the doing.
        </p>
      </div>
      <div className="brief-content">
        {routed.rhythm ? (
          <ObsidianBrief markdown={routed.rhythm} />
        ) : (
          <p className="tab-preamble">No rhythm content in today&apos;s brief.</p>
        )}
      </div>
    </section>
  );
}

/* ─── Log ──────────────────────────────────────────────── */

function LogPanel({
  brief,
  routed,
  deliveries,
  recent,
}: {
  brief: Brief;
  routed: RoutedBrief;
  deliveries: Props["deliveries"];
  recent: Brief[];
}) {
  return (
    <section className="tab-panel active">
      <div className="hero-band">
        <div className="hero-eyebrow">Log · diagnostics</div>
        <h1>
          Is the <span className="serif-accent">pipe</span> healthy?
        </h1>
        <p className="hero-subtitle">
          Source registry, delivery pings, and the last 8 briefs. If anything broke, it shows up here first.
        </p>
      </div>

      <div className="log-grid">
        <SourceRegistry brief={brief} />
        <DeliveryLog deliveries={deliveries} />
      </div>

      <RunTimeline recent={recent} latest={brief} />

      {routed.log && (
        <>
          <div className="timeline-label">Generation footer</div>
          <div className="brief-content">
            <ObsidianBrief markdown={routed.log} />
          </div>
        </>
      )}
    </section>
  );
}

function SourceRegistry({ brief }: { brief: Brief }) {
  const sources = brief.source_status ?? [];
  return (
    <div className="log-card">
      <div className="log-card-label">Sources</div>
      <ul className="log-list">
        {sources.length === 0 ? (
          <li className="mono" style={{ borderBottom: "none" }}>
            No source status recorded.
          </li>
        ) : (
          sources.map((s) => (
            <li key={s.name}>
              <span className="mono">{s.name}</span>
              <span className={`status-pill ${s.enabled ? "ok" : "muted"}`}>
                {s.enabled ? `${s.item_count}` : "off"}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function DeliveryLog({ deliveries }: { deliveries: Props["deliveries"] }) {
  return (
    <div className="log-card">
      <div className="log-card-label">Delivery</div>
      {deliveries.length === 0 ? (
        <p className="mono" style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
          No pings sent yet.
        </p>
      ) : (
        <ul className="log-list">
          {deliveries.slice(0, 6).map((d) => (
            <li key={d.id}>
              <span className="mono">
                {new Date(d.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {d.channel}
              </span>
              <span className={`status-pill ${d.ok ? "ok" : "warn"}`}>{d.ok ? "sent" : "failed"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RunTimeline({ recent, latest }: { recent: Brief[]; latest: Brief }) {
  const all = [latest, ...recent];
  if (all.length === 0) return null;
  return (
    <>
      <div className="timeline-label">Recent briefs</div>
      <ul className="timeline-list">
        {all.map((b, i) => (
          <li key={(b.id ?? "") + i}>
            <span className="timeline-date">{b.date}</span>
            <span className="timeline-title">{b.title}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
