"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function NewMemberPage() {
  const { addMember } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="stack">
      <section>
        <h1>New team member</h1>
        <p className="muted">Add a person to the team. You can edit their full profile and assign them to projects after creating.</p>
      </section>

      <section className="card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const m = await addMember({ name: name.trim(), role: role.trim(), email: email.trim() });
            router.push(`/members/${m.id}`);
          }}
        >
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Required"
              autoFocus
              required
            />
          </div>
          <div className="section-grid-2">
            <div className="field">
              <label>Role</label>
              <input
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. ML Engineer"
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.org"
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Create member</button>
        </form>
      </section>
    </div>
  );
}
