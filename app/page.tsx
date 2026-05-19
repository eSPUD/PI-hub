"use client";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { AvatarStack, CFPStatusBadge, Countdown, Progress, StatusBadge, daysUntil, deadlineUrgency, relativeTime } from "@/components/Bits";
import { STATUSES, type CallForPaper, type Project, type ProjectStatus } from "@/lib/types";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  exploration: "#8b5cf6",
  planning: "#5468ff",
  active: "#10b981",
  paused: "#f59e0b",
  archived: "#94a3b8",
};

function matchProject(p: Project, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (p.name.toLowerCase().includes(needle)) return true;
  if (p.description.toLowerCase().includes(needle)) return true;
  if (p.status.includes(needle)) return true;
  if (p.contributors.some((c) => c.name.toLowerCase().includes(needle))) return true;
  if (p.artifacts.some((a) => a.title.toLowerCase().includes(needle))) return true;
  return false;
}

function DashboardInner() {
  const { store, loaded } = useStore();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const filtered = useMemo(
    () => store.projects.filter((p) => !p.archivedAt).filter((p) => matchProject(p, q)),
    [store.projects, q],
  );

  const counts = useMemo(() => {
    const m: Record<ProjectStatus, number> = {
      exploration: 0,
      planning: 0,
      active: 0,
      paused: 0,
      archived: 0,
    };
    for (const p of filtered) m[p.status]++;
    return m;
  }, [filtered]);

  const total = filtered.length;
  const maxLog = Math.max(1, ...filtered.map((p) => p.log.length), 5);

  const upcomingDeadlines = useMemo(() => {
    return store.cfps
      .filter((c) => !c.archivedAt && c.submissionDeadline && deadlineUrgency(c.submissionDeadline) !== "passed")
      .sort((a, b) => a.submissionDeadline.localeCompare(b.submissionDeadline))
      .slice(0, 3);
  }, [store.cfps]);

  const recentActivity = useMemo(() => {
    type Row = { projectId: string; projectName: string; date: string; body: string; status: ProjectStatus };
    const rows: Row[] = [];
    for (const p of filtered) {
      for (const l of p.log.slice(0, 4)) {
        rows.push({ projectId: p.id, projectName: p.name, date: l.date, body: l.body, status: p.status });
      }
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [filtered]);

  if (!loaded) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <section className="stats">
        <div className="stat"><span className="stat-num">{total}</span><span className="stat-label">total</span></div>
        <div className="stat"><span className="stat-num">{counts.active}</span><span className="stat-label">active</span></div>
        <div className="stat"><span className="stat-num">{counts.planning}</span><span className="stat-label">planning</span></div>
        <div className="stat"><span className="stat-num">{counts.exploration}</span><span className="stat-label">exploration</span></div>
        <div className="stat"><span className="stat-num">{counts.paused}</span><span className="stat-label">paused</span></div>
      </section>

      {upcomingDeadlines.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2>Upcoming deadlines</h2>
            <Link href="/cfps" className="muted small">View all →</Link>
          </div>
          <ul className="list">
            {upcomingDeadlines.map((cfp) => (
              <UpcomingDeadlineRow key={cfp.id} cfp={cfp} projects={filtered} />
            ))}
          </ul>
        </section>
      )}

      <section className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2>Active research projects</h2>
            <Link href="/projects" className="muted small">View all →</Link>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              {q ? "No projects match your search." : <>No projects yet. <Link href="/projects/new">Create one</Link>.</>}
            </div>
          ) : (
            <table className="ptable">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Contributors</th>
                  <th>Log activity</th>
                  <th>Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/projects/${p.id}`}>{p.name}</Link>
                      {p.description && <div className="muted small" style={{ marginTop: 2 }}>{p.description}</div>}
                    </td>
                    <td><AvatarStack people={p.contributors} /></td>
                    <td><Progress value={p.log.length} max={maxLog} /></td>
                    <td className="muted small">{relativeTime(p.updatedAt)}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Status overview</h2>
            <span className="muted small">{total} project{total === 1 ? "" : "s"}</span>
          </div>
          <StatusDonut counts={counts} total={total} />
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2>Recent activity</h2>
            <span className="muted small">log entries across projects</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty">No log entries yet.</div>
          ) : (
            <div className="activity">
              {recentActivity.map((a, i) => (
                <div className="activity-item" key={`${a.projectId}-${i}`}>
                  <span
                    className="avatar"
                    style={{ background: STATUS_COLOR[a.status], marginLeft: 0 }}
                    title={a.status}
                  >
                    {a.projectName[0]?.toUpperCase() ?? "·"}
                  </span>
                  <div className="body">
                    <Link href={`/projects/${a.projectId}`}>{a.projectName}</Link>
                    <span className="when"> · {a.date}</span>
                    <p>{a.body.length > 180 ? a.body.slice(0, 180) + "…" : a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Top contributors</h2>
            <span className="muted small">across projects</span>
          </div>
          <TopContributors projects={filtered} />
        </div>
      </section>
    </div>
  );
}

function UpcomingDeadlineRow({ cfp, projects }: { cfp: CallForPaper; projects: Project[] }) {
  const days = daysUntil(cfp.submissionDeadline);
  const urgency = deadlineUrgency(cfp.submissionDeadline);
  const assigned = projects.filter((p) => p.cfpAssignments.some((a) => a.cfpId === cfp.id));
  return (
    <li className="list-item">
      <div className="row-between" style={{ gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={`/cfps/${cfp.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{cfp.name}</Link>
          <div className="muted small" style={{ marginTop: 2 }}>
            {cfp.venue || "—"} · submission {cfp.submissionDeadline}
            {Number.isFinite(days) ? ` · in ${days}d` : ""}
          </div>
          {assigned.length > 0 && (
            <div className="pi-tags" style={{ marginTop: 6 }}>
              {assigned.slice(0, 4).map((p) => {
                const a = p.cfpAssignments.find((x) => x.cfpId === cfp.id)!;
                return (
                  <span className="tag" key={p.id} style={{ background: "var(--card-2)", color: "var(--text)" }}>
                    {p.name}
                    <span style={{ marginLeft: 6 }}>
                      <CFPStatusBadge status={a.status} />
                    </span>
                  </span>
                );
              })}
              {assigned.length > 4 && <span className="muted small">+{assigned.length - 4} more</span>}
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className={`deadline-pill ${urgency}`}>
            {urgency === "passed" ? "passed" : `in ${days}d`}
          </span>
          <Countdown target={cfp.submissionDeadline} compact />
        </div>
      </div>
    </li>
  );
}

const DASHBOARD_STATUSES: ProjectStatus[] = ["exploration", "planning", "active", "paused"];

function StatusDonut({ counts, total }: { counts: Record<ProjectStatus, number>; total: number }) {
  const stops: string[] = [];
  let acc = 0;
  if (total > 0) {
    for (const s of DASHBOARD_STATUSES) {
      const c = counts[s];
      if (c === 0) continue;
      const start = (acc / total) * 100;
      acc += c;
      const end = (acc / total) * 100;
      stops.push(`${STATUS_COLOR[s]} ${start}% ${end}%`);
    }
  }
  const bg = total === 0 ? "#eef0f7" : `conic-gradient(${stops.join(", ")})`;
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: bg }}>
        <div className="donut-inner">
          <div className="donut-num">{total}</div>
          <div className="donut-label">projects</div>
        </div>
      </div>
      <div className="legend">
        {DASHBOARD_STATUSES.map((s) => (
          <div className="legend-row" key={s}>
            <span><span className="dot" style={{ background: STATUS_COLOR[s] }} /></span>
            <span className="name">{s}</span>
            <span className="pct">{counts[s]} · {total === 0 ? 0 : Math.round((counts[s] / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopContributors({ projects }: { projects: Project[] }) {
  const tally = new Map<string, { count: number; projects: Set<string> }>();
  for (const p of projects) {
    for (const c of p.contributors) {
      const key = c.name.toLowerCase();
      const cur = tally.get(key) ?? { count: 0, projects: new Set<string>() };
      cur.count++;
      cur.projects.add(p.id);
      tally.set(key, cur);
    }
  }
  const rows = Array.from(tally.entries())
    .map(([k, v]) => ({ name: k, count: v.count, projects: v.projects.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (rows.length === 0) {
    return <div className="empty">No contributors yet.</div>;
  }

  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="list">
      {rows.map((r) => (
        <li key={r.name} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center" }}>
          <span className="avatar" style={{ marginLeft: 0 }} title={r.name}>
            {r.name
              .split(" ")
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase() ?? "")
              .join("")}
          </span>
          <Progress value={r.count} max={max} />
          <span className="muted small">{r.projects} proj</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <DashboardInner />
    </Suspense>
  );
}
