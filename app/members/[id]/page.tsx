"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar, StatusBadge } from "@/components/Bits";
import type { Member } from "@/lib/types";

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { store, loaded, updateMember, assignMemberToProject, unassignMemberFromProject } = useStore();
  const router = useRouter();
  const member = store.members.find((m) => m.id === id);

  const [form, setForm] = useState<Member | null>(member ?? null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (member) setForm(member);
  }, [member]);

  const dirty = useMemo(() => {
    if (!form || !member) return false;
    return JSON.stringify(form) !== JSON.stringify(member);
  }, [form, member]);

  if (!loaded) return <p className="muted">Loading…</p>;
  if (!member || !form) {
    return (
      <div className="stack">
        <h1>Member not found</h1>
        <Link href="/members" className="btn">Back to members</Link>
      </div>
    );
  }

  const set = <K extends keyof Member>(key: K, value: Member[K]) => setForm({ ...form, [key]: value });

  const save = async () => {
    await updateMember(member.id, form);
    setSavedAt(Date.now());
  };

  const initials = (form.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div className="stack">
      {member.archivedAt && (
        <div className="archive-banner">
          <span>Archived {new Date(member.archivedAt).toLocaleDateString()}</span>
          <button className="btn btn-primary" onClick={() => updateMember(member.id, { archivedAt: "" })}>Restore</button>
        </div>
      )}
      <section className="card">
        <div className="pi-hero">
          {form.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatarUrl} alt={form.name} className="pi-avatar" />
          ) : (
            <div className="pi-avatar">{initials}</div>
          )}
          <div>
            <div className="row-between">
              <Link href="/members" className="muted small">← All members</Link>
            </div>
            <h1 className="pi-name" style={{ marginTop: 4 }}>{form.name || "Untitled member"}</h1>
            <p className="pi-sub">
              {form.role || "—"}
              {form.affiliation ? ` · ${form.affiliation}` : ""}
            </p>
            {form.email && <p className="pi-sub"><a href={`mailto:${form.email}`}>{form.email}</a></p>}
            {form.expertise.length > 0 && (
              <div className="pi-tags">
                {form.expertise.map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="pi-actions" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary" disabled={!dirty} onClick={save}>
              {dirty ? "Save changes" : "Saved"}
            </button>
            {!member.archivedAt ? (
              <button
                className="btn"
                onClick={() => {
                  if (confirm(`Archive ${member.name}? Their project assignments are preserved and they can be restored from /archives.`)) {
                    updateMember(member.id, { archivedAt: new Date().toISOString() });
                    router.push("/members");
                  }
                }}
              >
                Archive member
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => updateMember(member.id, { archivedAt: "" })}>
                Restore
              </button>
            )}
            {savedAt && !dirty && (
              <p className="muted small" style={{ margin: 0, textAlign: "right" }}>
                Saved {new Date(savedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Details</h2>
        <div className="section-grid-2">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Role"><input className="input" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. ML Engineer" /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="person@example.org" /></Field>
          <Field label="Affiliation"><input className="input" value={form.affiliation} onChange={(e) => set("affiliation", e.target.value)} placeholder="e.g. UT Austin" /></Field>
          <Field label="GitHub"><input className="input" value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="username" /></Field>
          <Field label="Avatar URL"><input className="input" value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} placeholder="https://…" /></Field>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Bio</label>
          <textarea className="textarea" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Short bio, background, interests…" />
        </div>
        <Field label="Expertise (comma-separated)">
          <input
            className="input"
            value={form.expertise.join(", ")}
            onChange={(e) =>
              set(
                "expertise",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. PyTorch, quantization, distillation"
          />
        </Field>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Project assignments</h2>
          <span className="muted small">toggle to assign or unassign</span>
        </div>
        {store.projects.length === 0 ? (
          <div className="empty">No projects yet. <Link href="/projects/new">Create one</Link>.</div>
        ) : (
          <ul className="list">
            {store.projects.map((p) => {
              const assigned = p.memberIds.includes(member.id);
              return (
                <li key={p.id} className="list-item">
                  <div className="row-between">
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/projects/${p.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>{p.name}</Link>
                      {p.description && <div className="muted small" style={{ marginTop: 2 }}>{p.description}</div>}
                      <div style={{ marginTop: 6 }}><StatusBadge status={p.status} /></div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={(e) => {
                          if (e.target.checked) assignMemberToProject(p.id, member.id);
                          else unassignMemberFromProject(p.id, member.id);
                        }}
                      />
                      <span>{assigned ? "Assigned" : "Assign"}</span>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" disabled={!dirty} onClick={save}>
          {dirty ? "Save changes" : "Saved"}
        </button>
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
