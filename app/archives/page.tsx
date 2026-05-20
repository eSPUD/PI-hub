"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { StatusBadge } from "@/components/Bits";

export default function ArchivesPage() {
  const { store, loaded, updateProject, updateMember, updateCFP, deleteProject, deleteMember, deleteCFP } = useStore();

  const projects = useMemo(
    () => store.projects.filter((p) => p.archivedAt).sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    [store.projects],
  );
  const members = useMemo(
    () => store.members.filter((m) => m.archivedAt).sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    [store.members],
  );
  const cfps = useMemo(
    () => store.cfps.filter((c) => c.archivedAt).sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    [store.cfps],
  );

  if (!loaded) return <p className="muted">Loading…</p>;

  const totalArchived = projects.length + members.length + cfps.length;

  return (
    <div className="stack">
      <section>
        <h1>Archives</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {totalArchived === 0
            ? "Nothing archived yet. Items you archive will appear here and can be restored."
            : `${totalArchived} archived item${totalArchived === 1 ? "" : "s"}. Restore any to bring it back into the main lists.`}
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Projects ({projects.length})</h2>
        </div>
        {projects.length === 0 ? (
          <div className="empty">No archived projects.</div>
        ) : (
          <ul className="list">
            {projects.map((p) => (
              <li key={p.id} className="list-item">
                <div className="row-between">
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/projects/${p.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{p.name}</Link>
                    {p.description && <div className="muted small" style={{ marginTop: 2 }}>{p.description}</div>}
                    <div className="muted small" style={{ marginTop: 4 }}>
                      Archived {new Date(p.archivedAt).toLocaleDateString()} · last updated {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <StatusBadge status={p.status} />
                    <button className="btn btn-primary" onClick={() => updateProject(p.id, { archivedAt: "" })}>Restore</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (confirm(`Permanently delete "${p.name}"? This removes its markdown file and cannot be undone.`)) {
                          deleteProject(p.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Members ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <div className="empty">No archived members.</div>
        ) : (
          <ul className="list">
            {members.map((m) => (
              <li key={m.id} className="list-item">
                <div className="row-between">
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/members/${m.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{m.name}</Link>
                    {m.role && <div className="muted small" style={{ marginTop: 2 }}>{m.role}</div>}
                    <div className="muted small" style={{ marginTop: 4 }}>
                      Archived {new Date(m.archivedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => updateMember(m.id, { archivedAt: "" })}>Restore</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (confirm(`Permanently delete ${m.name}? Their markdown file is removed and they are unassigned from all projects. This cannot be undone.`)) {
                          deleteMember(m.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Calls for papers ({cfps.length})</h2>
        </div>
        {cfps.length === 0 ? (
          <div className="empty">No archived CFPs.</div>
        ) : (
          <ul className="list">
            {cfps.map((c) => (
              <li key={c.id} className="list-item">
                <div className="row-between">
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/cfps/${c.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{c.name}</Link>
                    {c.venue && <div className="muted small" style={{ marginTop: 2 }}>{c.venue}</div>}
                    <div className="muted small" style={{ marginTop: 4 }}>
                      Archived {new Date(c.archivedAt).toLocaleDateString()}
                      {c.submissionDeadline ? ` · submission was ${c.submissionDeadline}` : ""}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => updateCFP(c.id, { archivedAt: "" })}>Restore</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (confirm(`Permanently delete CFP "${c.name}"? Its markdown file is removed and it is unassigned from all projects. This cannot be undone.`)) {
                          deleteCFP(c.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
