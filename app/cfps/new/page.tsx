"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function NewCFPPage() {
  const { addCFP } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [url, setUrl] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");

  return (
    <div className="stack">
      <section>
        <h1>New call for papers</h1>
        <p className="muted">Track a venue and its deadlines. You can flesh out the rest after creating.</p>
      </section>

      <section className="card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const c = await addCFP({
              name: name.trim(),
              venue: venue.trim(),
              url: url.trim(),
              submissionDeadline: submissionDeadline.trim(),
            });
            router.push(`/cfps/${c.id}`);
          }}
        >
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NeurIPS 2026"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label>Venue</label>
            <input
              className="input"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Conference on Neural Information Processing Systems"
            />
          </div>
          <div className="section-grid-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Submission deadline</label>
              <input
                className="input"
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>CFP URL</label>
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" type="submit">Create CFP</button>
          </div>
        </form>
      </section>
    </div>
  );
}
