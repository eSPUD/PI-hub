"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useStore, uid } from "@/lib/store";
import { downloadProjectReport } from "@/lib/pdf-client";
import { Avatar, CFPStatusBadge, Countdown, daysUntil, deadlineUrgency } from "@/components/Bits";
import {
  CFP_STATUSES,
  STATUSES,
  type CallForPaper,
  type Member,
  type Project,
  type ProjectCFPStatus,
  type ProjectStatus,
} from "@/lib/types";

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: 2 }}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.974 0c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function OverleafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: 2 }}>
      <path d="M19.5 6.5c-2.6-2.6-6.8-2.6-9.4 0-1 1-1.6 2.3-1.8 3.7-.2 1.4.1 2.8.7 4.1-.1 0-.3 0-.4-.1-.4-.1-.7-.4-.9-.7-.2-.4-.2-.8-.1-1.2.1-.3.3-.5.5-.7-.5-.2-1-.3-1.5-.2-.6.1-1.1.5-1.4 1-.3.5-.4 1.1-.3 1.7.1.6.5 1.1 1 1.4.5.3 1.1.4 1.6.3 2 .9 4.3.7 6.2-.4 1.9-1.2 3-3.2 3-5.4 0-2-1.2-3.7-2.7-3.9z" />
    </svg>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    store,
    loaded,
    updateProject,
    assignMemberToProject,
    unassignMemberFromProject,
    assignProjectToCFP,
    updateCFPAssignment,
    unassignProjectFromCFP,
  } = useStore();
  const router = useRouter();
  const project = store.projects.find((p) => p.id === id);

  if (!loaded) return <p className="muted">Loading…</p>;
  if (!project) {
    return (
      <div className="stack">
        <h1>Project not found</h1>
        <Link href="/projects" className="btn">Back to projects</Link>
      </div>
    );
  }

  const archive = () => {
    if (confirm(`Archive "${project.name}"? It will be hidden from main lists but can be restored from /archives.`)) {
      updateProject(project.id, { archivedAt: new Date().toISOString() });
      router.push("/projects");
    }
  };
  const restore = () => {
    updateProject(project.id, { archivedAt: "" });
  };

  const exportPdf = async () => {
    await downloadProjectReport(project, store.pi, store.members, store.cfps);
  };

  return (
    <div className="stack">
      {project.archivedAt && (
        <div className="archive-banner">
          <span>Archived {new Date(project.archivedAt).toLocaleDateString()}</span>
          <button className="btn btn-primary" onClick={restore}>Restore</button>
        </div>
      )}
      <ProjectHeader
        project={project}
        onChange={(patch) => updateProject(project.id, patch)}
        onArchive={archive}
        onExportPdf={exportPdf}
      />
      <PlanSetup project={project} onChange={(patch) => updateProject(project.id, patch)} />
      <CFPAssignments
        project={project}
        cfps={store.cfps}
        onAssign={(cfpId) => assignProjectToCFP(project.id, cfpId)}
        onUpdate={(cfpId, patch) => updateCFPAssignment(project.id, cfpId, patch)}
        onUnassign={(cfpId) => unassignProjectFromCFP(project.id, cfpId)}
      />
      <MembersSection
        project={project}
        members={store.members}
        onAssign={(memberId) => assignMemberToProject(project.id, memberId)}
        onUnassign={(memberId) => unassignMemberFromProject(project.id, memberId)}
      />
      <Contributors project={project} onChange={(patch) => updateProject(project.id, patch)} />
      <Artifacts project={project} onChange={(patch) => updateProject(project.id, patch)} />
      <LogSection project={project} onChange={(patch) => updateProject(project.id, patch)} />
    </div>
  );
}

function CFPAssignments({
  project,
  cfps,
  onAssign,
  onUpdate,
  onUnassign,
}: {
  project: Project;
  cfps: CallForPaper[];
  onAssign: (cfpId: string) => void;
  onUpdate: (cfpId: string, patch: { status?: ProjectCFPStatus; notes?: string }) => void;
  onUnassign: (cfpId: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const assigned = project.cfpAssignments
    .map((a) => {
      const cfp = cfps.find((c) => c.id === a.cfpId);
      return cfp ? { cfp, assignment: a } : null;
    })
    .filter((x): x is { cfp: CallForPaper; assignment: typeof project.cfpAssignments[number] } => !!x)
    .sort((a, b) => (a.cfp.submissionDeadline || "9999").localeCompare(b.cfp.submissionDeadline || "9999"));
  const available = cfps.filter((c) => !project.cfpAssignments.some((a) => a.cfpId === c.id));

  return (
    <section className="card">
      <div className="card-header">
        <h2>Target venues & deadlines</h2>
        <div className="row" style={{ gap: 8 }}>
          {available.length > 0 && (
            <button className="btn" onClick={() => setPicking((p) => !p)}>
              {picking ? "Close" : "+ Assign CFP"}
            </button>
          )}
          <Link href="/cfps/new" className="btn btn-primary">+ New CFP</Link>
        </div>
      </div>

      {assigned.length === 0 ? (
        <div className="empty">
          No deadlines tracked. <Link href="/cfps">Browse CFPs</Link> or create one to target this project at a venue.
        </div>
      ) : (
        <ul className="list">
          {assigned.map(({ cfp, assignment }) => {
            const days = daysUntil(cfp.submissionDeadline);
            const urgency = deadlineUrgency(cfp.submissionDeadline);
            return (
              <li key={cfp.id} className="list-item">
                <div className="row-between" style={{ gap: 12, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/cfps/${cfp.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{cfp.name}</Link>
                      <span className={`deadline-pill ${urgency}`}>
                        {cfp.submissionDeadline
                          ? `${cfp.submissionDeadline}${Number.isFinite(days) ? (days < 0 ? ` · ${Math.abs(days)}d ago` : ` · in ${days}d`) : ""}`
                          : "no date"}
                      </span>
                      {cfp.submissionDeadline && <Countdown target={cfp.submissionDeadline} compact />}
                    </div>
                    {cfp.venue && <div className="muted small" style={{ marginTop: 2 }}>{cfp.venue}</div>}
                    <input
                      className="input"
                      style={{ marginTop: 8 }}
                      placeholder="Notes for this submission (track-specific, status info, etc.)"
                      value={assignment.notes}
                      onChange={(e) => onUpdate(cfp.id, { notes: e.target.value })}
                    />
                  </div>
                  <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <CFPStatusBadge status={assignment.status} />
                    <select
                      className="select"
                      style={{ width: "auto" }}
                      value={assignment.status}
                      onChange={(e) => onUpdate(cfp.id, { status: e.target.value as ProjectCFPStatus })}
                    >
                      {CFP_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <button className="btn btn-danger" onClick={() => onUnassign(cfp.id)}>Unassign</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {picking && available.length > 0 && (
        <>
          <div className="divider" />
          <h3>Pick a CFP</h3>
          <ul className="list">
            {available.map((c) => (
              <li key={c.id} className="list-item">
                <div className="row-between">
                  <div style={{ minWidth: 0 }}>
                    <strong>{c.name}</strong>
                    <div className="muted small" style={{ marginTop: 2 }}>
                      {c.venue || "—"}{c.submissionDeadline ? ` · submission ${c.submissionDeadline}` : ""}
                    </div>
                  </div>
                  <button className="btn" onClick={() => { onAssign(c.id); setPicking(false); }}>Assign</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function MembersSection({
  project,
  members,
  onAssign,
  onUnassign,
}: {
  project: Project;
  members: Member[];
  onAssign: (memberId: string) => void;
  onUnassign: (memberId: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const assigned = project.memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m);
  const available = members.filter((m) => !project.memberIds.includes(m.id));

  return (
    <section className="card">
      <div className="card-header">
        <h2>Team members</h2>
        <div className="row" style={{ gap: 8 }}>
          {available.length > 0 && (
            <button className="btn" onClick={() => setPicking((p) => !p)}>
              {picking ? "Close" : "+ Assign member"}
            </button>
          )}
          <Link href="/members/new" className="btn btn-primary">+ New member</Link>
        </div>
      </div>

      {assigned.length === 0 ? (
        <div className="empty">
          No team members assigned. <Link href="/members">Browse members</Link> or create a new one.
        </div>
      ) : (
        <ul className="list">
          {assigned.map((m) => (
            <li key={m.id} className="list-item">
              <div className="row-between">
                <Link href={`/members/${m.id}`} className="row" style={{ gap: 12, color: "var(--text)" }}>
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt={m.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
                  ) : (
                    <Avatar name={m.name} size={36} />
                  )}
                  <div>
                    <strong>{m.name}</strong>
                    <div className="muted small">{m.role || "—"}{m.email ? ` · ${m.email}` : ""}</div>
                  </div>
                </Link>
                <button className="btn btn-danger" onClick={() => onUnassign(m.id)}>Unassign</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {picking && available.length > 0 && (
        <>
          <div className="divider" />
          <h3>Assign existing member</h3>
          <ul className="list">
            {available.map((m) => (
              <li key={m.id} className="list-item">
                <div className="row-between">
                  <div className="row" style={{ gap: 12 }}>
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatarUrl} alt={m.name} style={{ width: 32, height: 32, borderRadius: 10, objectFit: "cover" }} />
                    ) : (
                      <Avatar name={m.name} size={32} />
                    )}
                    <div>
                      <strong>{m.name}</strong>
                      <div className="muted small">{m.role || "—"}</div>
                    </div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => {
                      onAssign(m.id);
                    }}
                  >
                    Assign
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function ProjectHeader({
  project,
  onChange,
  onArchive,
  onExportPdf,
}: {
  project: Project;
  onChange: (patch: Partial<Project>) => void;
  onArchive: () => void;
  onExportPdf: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [discord, setDiscord] = useState(project.discord);
  const [overleaf, setOverleaf] = useState(project.overleaf);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description);
    setDiscord(project.discord);
    setOverleaf(project.overleaf);
  }, [project.id, project.name, project.description, project.discord, project.overleaf]);

  return (
    <section>
      <div className="row-between">
        <Link href="/projects" className="muted">← All projects</Link>
        <div className="row">
          <button
            type="button"
            onClick={onExportPdf}
            className="btn"
            title="Download a PDF report of this project"
          >
            ⬇ Export PDF
          </button>
          {project.discord && (
            <a
              href={project.discord}
              target="_blank"
              rel="noreferrer"
              className="btn discord-btn"
              title="Open Discord"
            >
              <DiscordIcon /> Discord
            </a>
          )}
          {project.overleaf && (
            <a
              href={project.overleaf}
              target="_blank"
              rel="noreferrer"
              className="btn overleaf-btn"
              title="Open Overleaf project"
            >
              <OverleafIcon /> Overleaf
            </a>
          )}
          <select
            className="select"
            style={{ width: "auto" }}
            value={project.status}
            onChange={(e) => onChange({ status: e.target.value as ProjectStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {!project.archivedAt && <button className="btn" onClick={onArchive}>Archive</button>}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onChange({
                name: name.trim() || project.name,
                description: description.trim(),
                discord: discord.trim(),
                overleaf: overleaf.trim(),
              });
              setEditing(false);
            }}
          >
            <div className="field">
              <label>Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="field">
              <label>Discord link</label>
              <input
                className="input"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="https://discord.gg/your-invite or channel URL"
              />
            </div>
            <div className="field">
              <label>Overleaf project link</label>
              <input
                className="input"
                value={overleaf}
                onChange={(e) => setOverleaf(e.target.value)}
                placeholder="https://www.overleaf.com/project/…"
              />
            </div>
            <div className="row">
              <button className="btn btn-primary" type="submit">Save</button>
              <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="row-between">
              <h1 style={{ margin: 0 }}>{project.name}</h1>
              <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            </div>
            {project.description && <p className="muted" style={{ marginTop: 6 }}>{project.description}</p>}
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Updated {new Date(project.updatedAt).toLocaleString()} · Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function PlanSetup({ project, onChange }: { project: Project; onChange: (patch: Partial<Project>) => void }) {
  const [plan, setPlan] = useState(project.plan);
  const [setup, setSetup] = useState(project.setup);
  const [savedPlan, setSavedPlan] = useState(false);
  const [savedSetup, setSavedSetup] = useState(false);

  useEffect(() => { setPlan(project.plan); setSetup(project.setup); }, [project.id]);

  return (
    <section className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <div className="card">
        <h2>Research plan</h2>
        <textarea
          className="textarea"
          style={{ minHeight: 160 }}
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="Hypothesis, approach, milestones…"
        />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => { onChange({ plan }); setSavedPlan(true); setTimeout(() => setSavedPlan(false), 1200); }}>Save plan</button>
          {savedPlan && <span className="muted">Saved.</span>}
        </div>
      </div>
      <div className="card">
        <h2>Research setup</h2>
        <textarea
          className="textarea"
          style={{ minHeight: 160 }}
          value={setup}
          onChange={(e) => setSetup(e.target.value)}
          placeholder="Datasets, hardware, training recipe, eval harness…"
        />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => { onChange({ setup }); setSavedSetup(true); setTimeout(() => setSavedSetup(false), 1200); }}>Save setup</button>
          {savedSetup && <span className="muted">Saved.</span>}
        </div>
      </div>
    </section>
  );
}

function Contributors({ project, onChange }: { project: Project; onChange: (patch: Partial<Project>) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const add = () => {
    if (!name.trim()) return;
    if (project.contributors.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      alert("Contributor with that name already exists in this project.");
      return;
    }
    onChange({
      contributors: [
        ...project.contributors,
        { id: uid(), name: name.trim(), role: role.trim(), email: email.trim() || undefined },
      ],
    });
    setName(""); setRole(""); setEmail("");
  };

  const remove = (id: string) => {
    onChange({ contributors: project.contributors.filter((c) => c.id !== id) });
  };

  return (
    <section className="card">
      <h2>External contributors</h2>
      <p className="muted" style={{ marginBottom: 12 }}>One-off collaborators who aren&apos;t in the formal team. For permanent team members use the section above.</p>

      {project.contributors.length === 0 ? (
        <div className="empty">No contributors yet.</div>
      ) : (
        <ul className="list">
          {project.contributors.map((c) => (
            <li key={c.id} className="card" style={{ background: "var(--panel-2)" }}>
              <div className="row-between">
                <div>
                  <strong>{c.name}</strong>
                  {c.role && <span className="muted"> · {c.role}</span>}
                  {c.email && <div className="muted" style={{ fontSize: 12 }}>{c.email}</div>}
                </div>
                <button className="btn btn-danger" onClick={() => remove(c.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="divider" />
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Required" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Role</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. ML engineer" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={add}>Add contributor</button>
      </div>
    </section>
  );
}

function Artifacts({ project, onChange }: { project: Project; onChange: (patch: Partial<Project>) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const add = () => {
    if (!title.trim()) return;
    onChange({
      artifacts: [
        ...project.artifacts,
        { id: uid(), title: title.trim(), url: url.trim() || undefined, notes: notes.trim() || undefined, createdAt: new Date().toISOString() },
      ],
    });
    setTitle(""); setUrl(""); setNotes("");
  };

  const remove = (id: string) => onChange({ artifacts: project.artifacts.filter((a) => a.id !== id) });

  return (
    <section className="card">
      <h2>Artifacts</h2>
      <p className="muted" style={{ marginBottom: 12 }}>Papers, datasets, model checkpoints, demos — anything produced.</p>

      {project.artifacts.length === 0 ? (
        <div className="empty">No artifacts yet.</div>
      ) : (
        <ul className="list">
          {project.artifacts.map((a) => (
            <li key={a.id} className="card" style={{ background: "var(--panel-2)" }}>
              <div className="row-between">
                <div style={{ flex: 1 }}>
                  <strong>{a.title}</strong>
                  {a.url && <div style={{ fontSize: 13, marginTop: 4 }}><a href={a.url} target="_blank" rel="noreferrer">{a.url}</a></div>}
                  {a.notes && <p className="muted" style={{ marginTop: 4 }}>{a.notes}</p>}
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Added {new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
                <button className="btn btn-danger" onClick={() => remove(a.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="divider" />
      <div className="field">
        <label>Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Required" />
      </div>
      <div className="field">
        <label>URL</label>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={add}>Add artifact</button>
    </section>
  );
}

function LogSection({ project, onChange }: { project: Project; onChange: (patch: Partial<Project>) => void }) {
  const [body, setBody] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const add = () => {
    if (!body.trim()) return;
    onChange({
      log: [{ id: uid(), date, body: body.trim() }, ...project.log],
    });
    setBody("");
  };

  const remove = (id: string) => onChange({ log: project.log.filter((l) => l.id !== id) });

  return (
    <section className="card">
      <h2>Exploration log</h2>
      <p className="muted" style={{ marginBottom: 12 }}>Append-only journal of findings, experiments, dead ends.</p>

      <div className="grid" style={{ gridTemplateColumns: "160px 1fr" }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Entry</label>
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you learn or try today?" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={add}>Add entry</button>
      </div>

      <div className="divider" />

      {project.log.length === 0 ? (
        <div className="empty">No entries yet.</div>
      ) : (
        <ul className="list">
          {project.log.map((l) => (
            <li key={l.id} className="card" style={{ background: "var(--panel-2)" }}>
              <div className="row-between">
                <strong className="muted">{l.date}</strong>
                <button className="btn btn-danger" onClick={() => remove(l.id)}>Remove</button>
              </div>
              <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{l.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
