"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function NewProjectPage() {
  const { addProject } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="stack">
      <section>
        <h1>New project</h1>
        <p className="muted">Start a new research project. You can fill in plan, setup, contributors, and artifacts afterwards.</p>
      </section>

      <section className="card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const p = await addProject({ name: name.trim(), description: description.trim() });
            router.push(`/projects/${p.id}`);
          }}
        >
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 100KB language model for hearing aids"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label>Short description</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line motivation or scope"
            />
          </div>
          <button className="btn btn-primary" type="submit">Create project</button>
        </form>
      </section>
    </div>
  );
}
