"use client";
import { useEffect, useState } from "react";
import { useStore, uid } from "@/lib/store";
import type { Education, PI, Publication } from "@/lib/types";

export default function PIProfilePage() {
  const { store, setPI, loaded } = useStore();
  const [form, setForm] = useState<PI>(store.pi);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(store.pi);

  useEffect(() => {
    setForm(store.pi);
  }, [store.pi]);

  if (!loaded) return <p className="muted">Loading…</p>;

  const set = <K extends keyof PI>(key: K, value: PI[K]) => setForm({ ...form, [key]: value });

  const save = async () => {
    await setPI(form);
    setSavedAt(Date.now());
  };

  const initials = (form.name || "PI")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "PI";

  return (
    <div className="stack">
      <section className="card">
        <div className="pi-hero">
          {form.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatarUrl} alt={form.name || "PI"} className="pi-avatar" />
          ) : (
            <div className="pi-avatar">{initials}</div>
          )}
          <div>
            <h1 className="pi-name">{form.name || "Your name"}</h1>
            <p className="pi-sub">
              {form.title || "Principal Investigator"}
              {form.pronouns ? ` · ${form.pronouns}` : ""}
              {form.affiliation ? ` · ${form.affiliation}` : ""}
            </p>
            <p className="pi-sub">
              {[form.location, form.timezone].filter(Boolean).join(" · ") || "Location not set"}
            </p>
            {(form.focusAreas.length > 0 || form.expertise.length > 0) && (
              <div className="pi-tags">
                {form.focusAreas.map((t) => (
                  <span className="tag" key={`f-${t}`}>{t}</span>
                ))}
                {form.expertise.map((t) => (
                  <span className="tag alt" key={`e-${t}`}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="pi-actions">
            <button className="btn btn-primary" disabled={!dirty} onClick={save}>
              {dirty ? "Save changes" : "Saved"}
            </button>
            {savedAt && !dirty && (
              <p className="muted small" style={{ marginTop: 6, textAlign: "right" }}>
                Saved {new Date(savedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Identity</h2>
        <div className="section-grid-2">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dr. Ada Lovelace" /></Field>
          <Field label="Title"><input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Principal Investigator" /></Field>
          <Field label="Pronouns"><input className="input" value={form.pronouns} onChange={(e) => set("pronouns", e.target.value)} placeholder="she/her" /></Field>
          <Field label="Affiliation"><input className="input" value={form.affiliation} onChange={(e) => set("affiliation", e.target.value)} placeholder="eSPUD" /></Field>
          <Field label="Location"><input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Austin, TX" /></Field>
          <Field label="Timezone"><input className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="America/Chicago" /></Field>
          <Field label="Avatar URL">
            <input className="input" value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} placeholder="https://…/photo.jpg" />
          </Field>
        </div>
      </section>

      <section className="card">
        <h2>Contact</h2>
        <div className="section-grid-2">
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@espud.org" /></Field>
          <Field label="Website"><input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://your-site.org" /></Field>
        </div>
      </section>

      <section className="card">
        <h2>Online profiles</h2>
        <div className="section-grid-3">
          <Field label="ORCID"><input className="input" value={form.orcid} onChange={(e) => set("orcid", e.target.value)} placeholder="0000-0000-0000-0000" /></Field>
          <Field label="Google Scholar"><input className="input" value={form.googleScholar} onChange={(e) => set("googleScholar", e.target.value)} placeholder="https://scholar.google.com/…" /></Field>
          <Field label="GitHub"><input className="input" value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="username" /></Field>
          <Field label="LinkedIn"><input className="input" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="username" /></Field>
          <Field label="X / Twitter"><input className="input" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="username" /></Field>
        </div>
      </section>

      <section className="card">
        <h2>Bio</h2>
        <textarea
          className="textarea"
          style={{ minHeight: 140 }}
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="A short bio. Research focus, what you care about, current questions…"
        />
      </section>

      <section className="card">
        <h2>Focus areas & expertise</h2>
        <p className="muted small" style={{ marginTop: -6, marginBottom: 14 }}>
          Press Enter or comma to add. Backspace removes the last chip when the input is empty.
        </p>
        <div className="section-grid-2">
          <Field label="Focus areas">
            <TagInput value={form.focusAreas} onChange={(v) => set("focusAreas", v)} placeholder="e.g. on-device AI, compression" />
          </Field>
          <Field label="Expertise">
            <TagInput value={form.expertise} onChange={(v) => set("expertise", v)} placeholder="e.g. quantization, PyTorch" />
          </Field>
        </div>
      </section>

      <section className="card">
        <h2>Education</h2>
        <EducationEditor
          items={form.education}
          onChange={(v) => set("education", v)}
        />
      </section>

      <section className="card">
        <h2>Selected publications</h2>
        <PublicationsEditor
          items={form.publications}
          onChange={(v) => set("publications", v)}
        />
      </section>

      <section style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {dirty && <span className="muted small" style={{ alignSelf: "center" }}>You have unsaved changes</span>}
        <button className="btn btn-primary" disabled={!dirty} onClick={save}>
          {dirty ? "Save profile" : "Saved"}
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

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const next = input.trim().replace(/,$/, "");
    if (!next) return;
    if (value.some((v) => v.toLowerCase() === next.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, next]);
    setInput("");
  };
  return (
    <div className="tag-input">
      <div className="chips">
        {value.map((t) => (
          <span className="chip" key={t}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>×</button>
          </span>
        ))}
        <input
          value={input}
          placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !input && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
        />
      </div>
    </div>
  );
}

function EducationEditor({
  items,
  onChange,
}: {
  items: Education[];
  onChange: (v: Education[]) => void;
}) {
  const [draft, setDraft] = useState<Omit<Education, "id">>({ institution: "", degree: "", field: "", year: "" });

  const add = () => {
    if (!draft.institution.trim()) return;
    onChange([
      ...items,
      {
        id: uid(),
        institution: draft.institution.trim(),
        degree: draft.degree.trim(),
        field: draft.field?.trim() || undefined,
        year: draft.year?.trim() || undefined,
      },
    ]);
    setDraft({ institution: "", degree: "", field: "", year: "" });
  };

  const remove = (id: string) => onChange(items.filter((e) => e.id !== id));

  return (
    <div>
      {items.length === 0 ? (
        <div className="empty" style={{ padding: 18 }}>No education entries yet.</div>
      ) : (
        <div>
          {items.map((e) => (
            <div className="list-item" key={e.id}>
              <div className="row-between">
                <div>
                  <strong>{e.institution}</strong>
                  <div className="muted small" style={{ marginTop: 2 }}>
                    {[e.degree, e.field].filter(Boolean).join(" in ")}{e.year ? ` · ${e.year}` : ""}
                  </div>
                </div>
                <button className="btn btn-danger" onClick={() => remove(e.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="divider" />
      <div className="section-grid-4">
        <Field label="Institution"><input className="input" value={draft.institution} onChange={(ev) => setDraft({ ...draft, institution: ev.target.value })} placeholder="Required" /></Field>
        <Field label="Degree"><input className="input" value={draft.degree} onChange={(ev) => setDraft({ ...draft, degree: ev.target.value })} placeholder="e.g. PhD" /></Field>
        <Field label="Field"><input className="input" value={draft.field ?? ""} onChange={(ev) => setDraft({ ...draft, field: ev.target.value })} placeholder="e.g. Computer Science" /></Field>
        <Field label="Year"><input className="input" value={draft.year ?? ""} onChange={(ev) => setDraft({ ...draft, year: ev.target.value })} placeholder="2018" /></Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <button className="btn" onClick={add}>+ Add education</button>
      </div>
    </div>
  );
}

function PublicationsEditor({
  items,
  onChange,
}: {
  items: Publication[];
  onChange: (v: Publication[]) => void;
}) {
  const [draft, setDraft] = useState<Omit<Publication, "id">>({ title: "", venue: "", year: "", url: "" });

  const add = () => {
    if (!draft.title.trim()) return;
    onChange([
      ...items,
      {
        id: uid(),
        title: draft.title.trim(),
        venue: draft.venue?.trim() || undefined,
        year: draft.year?.trim() || undefined,
        url: draft.url?.trim() || undefined,
      },
    ]);
    setDraft({ title: "", venue: "", year: "", url: "" });
  };

  const remove = (id: string) => onChange(items.filter((p) => p.id !== id));

  return (
    <div>
      {items.length === 0 ? (
        <div className="empty" style={{ padding: 18 }}>No publications yet.</div>
      ) : (
        <div>
          {items.map((p) => (
            <div className="list-item" key={p.id}>
              <div className="row-between">
                <div style={{ flex: 1 }}>
                  <strong>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a> : p.title}</strong>
                  <div className="muted small" style={{ marginTop: 2 }}>
                    {[p.venue, p.year].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <button className="btn btn-danger" onClick={() => remove(p.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="divider" />
      <Field label="Title">
        <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Paper title (required)" />
      </Field>
      <div className="section-grid-3" style={{ marginTop: 10 }}>
        <Field label="Venue"><input className="input" value={draft.venue ?? ""} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} placeholder="e.g. NeurIPS" /></Field>
        <Field label="Year"><input className="input" value={draft.year ?? ""} onChange={(e) => setDraft({ ...draft, year: e.target.value })} placeholder="2024" /></Field>
        <Field label="URL"><input className="input" value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" /></Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <button className="btn" onClick={add}>+ Add publication</button>
      </div>
    </div>
  );
}
