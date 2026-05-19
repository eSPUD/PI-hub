"use client";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Bits";
import type { Member } from "@/lib/types";

function matchMember(m: Member, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  return (
    m.name.toLowerCase().includes(n) ||
    m.role.toLowerCase().includes(n) ||
    m.email.toLowerCase().includes(n) ||
    m.affiliation.toLowerCase().includes(n) ||
    m.expertise.some((t) => t.toLowerCase().includes(n))
  );
}

function MembersInner() {
  const { store, loaded } = useStore();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const projectsByMember = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of store.projects) {
      for (const mid of p.memberIds) {
        const arr = map.get(mid) ?? [];
        arr.push(p.name);
        map.set(mid, arr);
      }
    }
    return map;
  }, [store.projects]);

  const members = useMemo(
    () =>
      [...store.members]
        .filter((m) => !m.archivedAt)
        .filter((m) => matchMember(m, q))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [store.members, q],
  );

  if (!loaded) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <section className="section-title">
        <div>
          <h1>Team members</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {store.members.filter((m) => !m.archivedAt).length} member{store.members.filter((m) => !m.archivedAt).length === 1 ? "" : "s"} · assign them to projects
          </p>
        </div>
        <Link href="/members/new" className="btn btn-primary">+ New member</Link>
      </section>

      {members.length === 0 ? (
        <div className="empty">
          {q ? "No members match your search." : <>No members yet. <Link href="/members/new">Add the first one</Link>.</>}
        </div>
      ) : (
        <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {members.map((m) => {
            const projects = projectsByMember.get(m.id) ?? [];
            return (
              <Link href={`/members/${m.id}`} key={m.id} className="card card-hover" style={{ display: "block" }}>
                <div className="row" style={{ gap: 12 }}>
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt={m.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} />
                  ) : (
                    <Avatar name={m.name} size={44} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block" }}>{m.name}</strong>
                    <span className="muted small">{m.role || "—"}</span>
                  </div>
                </div>
                <div className="muted small" style={{ marginTop: 12 }}>
                  {projects.length === 0
                    ? "Not assigned to any project"
                    : `On ${projects.length} project${projects.length === 1 ? "" : "s"}: ${projects.slice(0, 3).join(", ")}${projects.length > 3 ? "…" : ""}`}
                </div>
                {m.expertise.length > 0 && (
                  <div className="pi-tags" style={{ marginTop: 10 }}>
                    {m.expertise.slice(0, 4).map((t) => (
                      <span className="tag" key={t}>{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <MembersInner />
    </Suspense>
  );
}
