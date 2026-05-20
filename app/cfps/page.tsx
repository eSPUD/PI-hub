"use client";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { CFPStatusBadge, Countdown, daysUntil, deadlineUrgency, useNow } from "@/components/Bits";
import type { CallForPaper, Project } from "@/lib/types";

const TIMELINE_DAYS_AHEAD = 180;
const TIMELINE_DAYS_BEHIND = 30;

function fmtDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function deadlineLabel(days: number): string {
  if (!Number.isFinite(days)) return "no date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "today";
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

function CFPsInner() {
  const { store, loaded } = useStore();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const items = store.cfps
      .filter((c) => !c.archivedAt)
      .filter((c) =>
        !needle ||
        c.name.toLowerCase().includes(needle) ||
        c.venue.toLowerCase().includes(needle) ||
        c.topics.some((t) => t.toLowerCase().includes(needle)),
      );
    return items.sort((a, b) => {
      const da = a.submissionDeadline || "9999-12-31";
      const db = b.submissionDeadline || "9999-12-31";
      return da.localeCompare(db);
    });
  }, [store.cfps, q]);

  if (!loaded) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <section className="section-title">
        <div>
          <h1>Deadlines & Calls for Papers</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {store.cfps.filter((c) => !c.archivedAt).length} venue{store.cfps.filter((c) => !c.archivedAt).length === 1 ? "" : "s"} tracked · projects assigned to a CFP show on the timeline with assessment status
          </p>
        </div>
        <Link href="/cfps/new" className="btn btn-primary">+ New CFP</Link>
      </section>

      {store.cfps.length > 0 && <NextDeadline cfps={filtered} />}
      {store.cfps.length > 0 && <Timeline cfps={filtered} projects={store.projects} />}

      {filtered.length === 0 ? (
        <div className="empty">
          {q ? "No CFPs match your search." : <>No calls for papers tracked yet. <Link href="/cfps/new">Add one</Link>.</>}
        </div>
      ) : (
        <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
          {filtered.map((c) => (
            <CFPCard key={c.id} cfp={c} projects={store.projects} />
          ))}
        </section>
      )}
    </div>
  );
}

function NextDeadline({ cfps }: { cfps: CallForPaper[] }) {
  const upcoming = cfps
    .filter((c) => c.submissionDeadline && deadlineUrgency(c.submissionDeadline) !== "passed")
    .sort((a, b) => a.submissionDeadline.localeCompare(b.submissionDeadline));
  const next = upcoming[0];
  if (!next) return null;
  return (
    <section className="next-deadline">
      <div style={{ minWidth: 0 }}>
        <h2>Next deadline</h2>
        <div className="name">{next.name}</div>
        <div className="meta">
          {next.venue ? `${next.venue} · ` : ""}submission {fmtDate(next.submissionDeadline)}
        </div>
        <div className="meta" style={{ marginTop: 6 }}>
          <Link href={`/cfps/${next.id}`}>Open CFP →</Link>
        </div>
      </div>
      <Countdown target={next.submissionDeadline} />
    </section>
  );
}

function CFPCard({ cfp, projects }: { cfp: CallForPaper; projects: Project[] }) {
  const assigned = projects
    .map((p) => {
      const a = p.cfpAssignments.find((x) => x.cfpId === cfp.id);
      return a ? { project: p, status: a.status } : null;
    })
    .filter((x): x is { project: Project; status: import("@/lib/types").ProjectCFPStatus } => !!x);

  const days = daysUntil(cfp.submissionDeadline);
  const urgency = deadlineUrgency(cfp.submissionDeadline);

  return (
    <div className="card cfp-card">
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <Link href={`/cfps/${cfp.id}`} style={{ color: "var(--text)", fontWeight: 600, fontSize: 17 }}>{cfp.name}</Link>
            <span className={`deadline-pill ${urgency}`}>
              {urgency === "passed" ? "passed" : `submission ${deadlineLabel(days)}`}
            </span>
            {cfp.submissionDeadline && (
              <Countdown target={cfp.submissionDeadline} compact />
            )}
            {cfp.url && <a href={cfp.url} target="_blank" rel="noreferrer" className="muted small">CFP page ↗</a>}
          </div>
          {cfp.venue && <p className="muted" style={{ marginTop: 4, marginBottom: 0 }}>{cfp.venue}{cfp.location ? ` · ${cfp.location}` : ""}</p>}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 12 }}>
        {cfp.abstractDeadline && <DatePill label="Abstract" date={cfp.abstractDeadline} />}
        {cfp.submissionDeadline && <DatePill label="Submission" date={cfp.submissionDeadline} primary />}
        {cfp.notificationDate && <DatePill label="Notification" date={cfp.notificationDate} />}
        {cfp.conferenceDate && <DatePill label="Conference" date={cfp.conferenceDate} />}
      </div>

      {cfp.topics.length > 0 && (
        <div className="pi-tags" style={{ marginTop: 12 }}>
          {cfp.topics.map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>
      )}

      <div className="divider" />

      <div className="row-between" style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Projects assigned ({assigned.length})</h3>
      </div>
      {assigned.length === 0 ? (
        <p className="muted small">No projects assigned. Open a project and add this CFP as a target.</p>
      ) : (
        <ul className="list">
          {assigned.map(({ project, status }) => (
            <li key={project.id} className="list-item">
              <div className="row-between">
                <div>
                  <Link href={`/projects/${project.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{project.name}</Link>
                  {project.description && <div className="muted small" style={{ marginTop: 2 }}>{project.description}</div>}
                </div>
                <CFPStatusBadge status={status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DatePill({ label, date, primary = false }: { label: string; date: string; primary?: boolean }) {
  const urgency = deadlineUrgency(date);
  return (
    <div className="card" style={{ padding: "10px 14px", boxShadow: "none", background: primary ? "var(--card-2)" : "var(--card)" }}>
      <div className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{fmtDate(date)}</div>
      <div className={`deadline-pill ${urgency}`} style={{ marginTop: 6, fontSize: 11 }}>
        {deadlineLabel(daysUntil(date))}
      </div>
    </div>
  );
}

function Timeline({ cfps, projects }: { cfps: CallForPaper[]; projects: Project[] }) {
  const now = useNow(60_000);
  const start = now - TIMELINE_DAYS_BEHIND * 86400000;
  const end = now + TIMELINE_DAYS_AHEAD * 86400000;
  const range = end - start;

  const todayPct = ((now - start) / range) * 100;

  type Marker = { cfp: CallForPaper; pct: number; urgency: ReturnType<typeof deadlineUrgency> };
  const markers: Marker[] = [];
  for (const c of cfps) {
    if (!c.submissionDeadline) continue;
    const t = new Date(c.submissionDeadline + "T23:59:59").getTime();
    if (t < start || t > end) continue;
    markers.push({ cfp: c, pct: ((t - start) / range) * 100, urgency: deadlineUrgency(c.submissionDeadline) });
  }
  markers.sort((a, b) => a.pct - b.pct);

  // month ticks
  const monthTicks: { pct: number; label: string }[] = [];
  const d = new Date(start);
  d.setDate(1);
  while (d.getTime() < end) {
    const pct = ((d.getTime() - start) / range) * 100;
    if (pct >= 0 && pct <= 100) {
      monthTicks.push({ pct, label: d.toLocaleDateString(undefined, { month: "short" }) });
    }
    d.setMonth(d.getMonth() + 1);
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>Timeline</h2>
        <span className="muted small">past {TIMELINE_DAYS_BEHIND} d · next {TIMELINE_DAYS_AHEAD} d</span>
      </div>
      <div className="timeline">
        <div className="timeline-axis">
          <div className="timeline-today" style={{ left: `${todayPct}%` }} />
          {monthTicks.map((m, i) => (
            <span key={i} className="tl-month" style={{ left: `${m.pct}%` }}>{m.label}</span>
          ))}
          {markers.map((m, i) => {
            const assignedCount = projects.filter((p) => p.cfpAssignments.some((a) => a.cfpId === m.cfp.id)).length;
            return (
              <div key={i} className={`tl-marker ${m.urgency}`} style={{ left: `${m.pct}%` }}>
                <span className="tl-label">
                  {m.cfp.name} · {fmtDate(m.cfp.submissionDeadline)}
                  {assignedCount > 0 ? ` · ${assignedCount} project${assignedCount === 1 ? "" : "s"}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {markers.length === 0 && (
        <p className="muted small" style={{ marginTop: 10 }}>
          No deadlines fall within the visible window.
        </p>
      )}
      <div className="row" style={{ gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        <LegendDot color="#10b981" label="more than 30 days" />
        <LegendDot color="#f59e0b" label="within 30 days" />
        <LegendDot color="#e02d3c" label="within 7 days" />
        <LegendDot color="#9ca3af" label="passed" />
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="row small muted" style={{ gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

export default function CFPsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <CFPsInner />
    </Suspense>
  );
}
