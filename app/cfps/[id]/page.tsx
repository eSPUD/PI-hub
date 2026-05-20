"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { CFPStatusBadge, Countdown, daysUntil, deadlineUrgency } from "@/components/Bits";
import { CFP_STATUSES, type CallForPaper, type ProjectCFPStatus } from "@/lib/types";

function fmtDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CFPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    store,
    loaded,
    updateCFP,
    assignProjectToCFP,
    updateCFPAssignment,
    unassignProjectFromCFP,
  } = useStore();
  const router = useRouter();
  const cfp = store.cfps.find((c) => c.id === id);
  const [form, setForm] = useState<CallForPaper | null>(cfp ?? null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (cfp) setForm(cfp);
  }, [cfp]);

  const dirty = useMemo(() => {
    if (!form || !cfp) return false;
    return JSON.stringify(form) !== JSON.stringify(cfp);
  }, [form, cfp]);

  if (!loaded) return <p className="muted">Loading…</p>;
  if (!cfp || !form) {
    return (
      <div className="stack">
        <h1>CFP not found</h1>
        <Link href="/cfps" className="btn">Back to deadlines</Link>
      </div>
    );
  }

  const set = <K extends keyof CallForPaper>(key: K, value: CallForPaper[K]) =>
    setForm({ ...form, [key]: value });

  const save = async () => {
    await updateCFP(cfp.id, form);
    setSavedAt(Date.now());
  };

  const assigned = store.projects
    .map((p) => {
      const a = p.cfpAssignments.find((x) => x.cfpId === cfp.id);
      return a ? { project: p, assignment: a } : null;
    })
    .filter((x): x is { project: typeof store.projects[number]; assignment: typeof store.projects[number]["cfpAssignments"][number] } => !!x);
  const available = store.projects.filter((p) => !p.cfpAssignments.some((a) => a.cfpId === cfp.id));

  return (
    <div className="stack">
      {cfp.archivedAt && (
        <div className="archive-banner">
          <span>Archived {new Date(cfp.archivedAt).toLocaleDateString()}</span>
          <button className="btn btn-primary" onClick={() => updateCFP(cfp.id, { archivedAt: "" })}>Restore</button>
        </div>
      )}
      <section className="card">
        <div className="row-between">
          <Link href="/cfps" className="muted small">← All CFPs</Link>
          <div className="row">
            <button className="btn btn-primary" disabled={!dirty} onClick={save}>
              {dirty ? "Save changes" : "Saved"}
            </button>
            {!cfp.archivedAt ? (
              <button
                className="btn"
                onClick={async () => {
                  if (confirm(`Archive CFP "${cfp.name}"? It can be restored from /archives.`)) {
                    await updateCFP(cfp.id, { archivedAt: new Date().toISOString() });
                    router.push("/cfps");
                  }
                }}
              >
                Archive
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => updateCFP(cfp.id, { archivedAt: "" })}>
                Restore
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>{form.name}</h1>
            <span className={`deadline-pill ${deadlineUrgency(form.submissionDeadline)}`}>
              submission {form.submissionDeadline ? `· ${fmtDate(form.submissionDeadline)}` : "not set"}
            </span>
          </div>
          {form.venue && <p className="muted" style={{ marginTop: 6 }}>{form.venue}{form.location ? ` · ${form.location}` : ""}</p>}
          {form.url && <p><a href={form.url} target="_blank" rel="noreferrer">{form.url}</a></p>}
          {form.submissionDeadline && (
            <div style={{ marginTop: 12 }}>
              <Countdown target={form.submissionDeadline} />
            </div>
          )}
          {savedAt && !dirty && <p className="muted small" style={{ marginTop: 6 }}>Saved {new Date(savedAt).toLocaleTimeString()}</p>}
        </div>
      </section>

      <section className="card">
        <h2>Details</h2>
        <div className="section-grid-2">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Venue"><input className="input" value={form.venue} onChange={(e) => set("venue", e.target.value)} /></Field>
          <Field label="CFP URL"><input className="input" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" /></Field>
          <Field label="Location"><input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Vancouver" /></Field>
        </div>
        <div className="section-grid-4" style={{ marginTop: 12 }}>
          <Field label="Abstract deadline"><input className="input" type="date" value={form.abstractDeadline} onChange={(e) => set("abstractDeadline", e.target.value)} /></Field>
          <Field label="Submission deadline"><input className="input" type="date" value={form.submissionDeadline} onChange={(e) => set("submissionDeadline", e.target.value)} /></Field>
          <Field label="Notification"><input className="input" type="date" value={form.notificationDate} onChange={(e) => set("notificationDate", e.target.value)} /></Field>
          <Field label="Conference"><input className="input" type="date" value={form.conferenceDate} onChange={(e) => set("conferenceDate", e.target.value)} /></Field>
        </div>
        <Field label="Topics (comma-separated)">
          <input
            className="input"
            value={form.topics.join(", ")}
            onChange={(e) => set("topics", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="e.g. on-device AI, compression, edge inference"
          />
        </Field>
        <Field label="Notes">
          <textarea className="textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Submission requirements, reviewer expectations, etc." />
        </Field>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Project assignments</h2>
          <span className="muted small">{assigned.length} project{assigned.length === 1 ? "" : "s"} targeting this CFP</span>
        </div>

        {assigned.length === 0 ? (
          <div className="empty">No projects assigned yet.</div>
        ) : (
          <ul className="list">
            {assigned.map(({ project, assignment }) => {
              const days = daysUntil(cfp.submissionDeadline);
              return (
                <li key={project.id} className="list-item">
                  <div className="row-between" style={{ gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link href={`/projects/${project.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{project.name}</Link>
                      {project.description && <div className="muted small" style={{ marginTop: 2 }}>{project.description}</div>}
                      {assignment.notes && <p style={{ marginTop: 6, marginBottom: 0 }}>{assignment.notes}</p>}
                      <p className="muted small" style={{ marginTop: 6, marginBottom: 0 }}>
                        Assigned {new Date(assignment.assignedAt).toLocaleDateString()} · deadline {Number.isFinite(days) ? (days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`) : "no date"}
                      </p>
                    </div>
                    <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <CFPStatusBadge status={assignment.status} />
                      <select
                        className="select"
                        style={{ width: "auto" }}
                        value={assignment.status}
                        onChange={(e) => updateCFPAssignment(project.id, cfp.id, { status: e.target.value as ProjectCFPStatus })}
                      >
                        {CFP_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <button className="btn btn-danger" onClick={() => unassignProjectFromCFP(project.id, cfp.id)}>Unassign</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {available.length > 0 && (
          <>
            <div className="divider" />
            <h3>Add a project</h3>
            <ul className="list">
              {available.map((p) => (
                <li key={p.id} className="list-item">
                  <div className="row-between">
                    <div style={{ minWidth: 0 }}>
                      <strong>{p.name}</strong>
                      {p.description && <div className="muted small" style={{ marginTop: 2 }}>{p.description}</div>}
                    </div>
                    <button className="btn" onClick={() => assignProjectToCFP(p.id, cfp.id)}>Assign</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}
