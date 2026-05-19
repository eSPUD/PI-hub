"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { AvatarStack, Progress, StatusBadge, relativeTime } from "@/components/Bits";
import { STATUSES, type Project, type ProjectStatus } from "@/lib/types";

function matchProject(p: Project, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    p.name.toLowerCase().includes(needle) ||
    p.description.toLowerCase().includes(needle) ||
    p.status.includes(needle) ||
    p.contributors.some((c) => c.name.toLowerCase().includes(needle)) ||
    p.artifacts.some((a) => a.title.toLowerCase().includes(needle))
  );
}

function ProjectsInner() {
  const { store, loaded } = useStore();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const filtered = useMemo(() => {
    return store.projects
      .filter((p) => !p.archivedAt)
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) => matchProject(p, q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [store.projects, filter, q]);

  if (!loaded) return <p className="muted">Loading…</p>;

  const maxLog = Math.max(1, ...filtered.map((p) => p.log.length), 5);

  return (
    <div className="stack">
      <section className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <button
          className="btn"
          style={{ borderColor: filter === "all" ? "var(--accent)" : undefined, color: filter === "all" ? "var(--accent)" : undefined }}
          onClick={() => setFilter("all")}
        >
          All <span className="muted small" style={{ marginLeft: 6 }}>{store.projects.filter((p) => !p.archivedAt).length}</span>
        </button>
        {STATUSES.map((s) => {
          const count = store.projects.filter((p) => !p.archivedAt && p.status === s).length;
          const isActive = filter === s;
          return (
            <button
              key={s}
              className="btn"
              style={{ borderColor: isActive ? "var(--accent)" : undefined, color: isActive ? "var(--accent)" : undefined, textTransform: "capitalize" }}
              onClick={() => setFilter(s)}
            >
              {s} <span className="muted small" style={{ marginLeft: 6 }}>{count}</span>
            </button>
          );
        })}
      </section>

      <section className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            {q ? "No projects match your search." : <>No projects in this view. <Link href="/projects/new">Create one</Link>.</>}
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
              {filtered.map((p) => (
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
      </section>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <ProjectsInner />
    </Suspense>
  );
}
