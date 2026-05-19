"use client";
import Link from "next/link";
import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function TopbarInner() {
  const { store, loaded } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const setQ = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      if (next) sp.set("q", next);
      else sp.delete("q");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = loaded && store.pi.name ? store.pi.name.split(/\s+/).slice(-1)[0] : "PI";

  const crumbs = (() => {
    if (pathname === "/") {
      return [
        { label: "PI-hub", href: "/" },
        { label: "Dashboard", href: "/" },
      ];
    }
    const parts = pathname.split("/").filter(Boolean);
    const out: { label: string; href: string }[] = [{ label: "PI-hub", href: "/" }];
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      acc += "/" + seg;
      let label = seg;
      if (UUID_RE.test(seg)) {
        const parent = parts[i - 1];
        let name: string | undefined;
        if (parent === "projects") name = store.projects.find((p) => p.id === seg)?.name;
        else if (parent === "members") name = store.members.find((m) => m.id === seg)?.name;
        else if (parent === "cfps") name = store.cfps.find((c) => c.id === seg)?.name;
        label = name ?? seg.slice(0, 8) + "…";
      }
      out.push({ label, href: acc });
    }
    return out;
  })();

  return (
    <header className="topbar">
      <div>
        <h1 className="greeting">
          {greeting}, <span style={{ color: "var(--accent)" }}>{firstName}</span>
        </h1>
        <nav className="crumbs muted small" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={`${i}-${c.href}`} className="crumb">
              {i > 0 && <span className="crumb-sep">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="crumb-current">{c.label}</span>
              ) : (
                <Link href={c.href}>{c.label}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>
      <div className="topbar-actions">
        <input
          className="search"
          placeholder="Search projects, contributors, artifacts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="topbar-add">
          <Link href="/projects/new" className="btn btn-add btn-add-project">+ Project</Link>
          <Link href="/members/new" className="btn btn-add btn-add-member">+ Member</Link>
          <Link href="/cfps/new" className="btn btn-add btn-add-cfp">+ CFP</Link>
        </div>
      </div>
    </header>
  );
}

export default function Topbar() {
  return (
    <Suspense fallback={<header className="topbar"><h1 className="greeting">PI-hub</h1></header>}>
      <TopbarInner />
    </Suspense>
  );
}
