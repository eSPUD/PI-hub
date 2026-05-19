"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ name }: { name: "dashboard" | "projects" | "members" | "deadlines" | "pi" | "plus" | "person-plus" | "archive" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="5" rx="1.5" />
          <rect x="13" y="10" width="8" height="11" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
      );
    case "members":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5" />
          <circle cx="17" cy="9" r="2.8" />
          <path d="M14.5 14.5c2-1 5-0.4 7 1.5" />
        </svg>
      );
    case "deadlines":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
        </svg>
      );
    case "pi":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} width="20" height="20" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "person-plus":
      return (
        <svg {...common} width="20" height="20" strokeWidth="2">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" />
          <path d="M18 13v6M15 16h6" />
        </svg>
      );
    case "archive":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
          <path d="M10 12h4" />
        </svg>
      );
  }
}

const links = [
  { href: "/", label: "Dashboard", icon: "dashboard" as const },
  { href: "/projects", label: "Projects", icon: "projects" as const },
  { href: "/members", label: "Members", icon: "members" as const },
  { href: "/cfps", label: "Deadlines", icon: "deadlines" as const },
  { href: "/pi", label: "PI Profile", icon: "pi" as const },
];

const archiveLink = { href: "/archives", label: "Archives", icon: "archive" as const };

export default function Sidebar() {
  const pathname = usePathname();
  const archiveActive = pathname.startsWith(archiveLink.href);
  return (
    <aside className="sidebar">
      <Link href="/" className="brand-logo" aria-label="PI-hub">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="PI-hub" />
      </Link>
      <nav className="side-nav">
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? "active" : ""} aria-label={l.label}>
              <Icon name={l.icon} />
              <span className="tip">{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="side-archive">
        <Link
          href={archiveLink.href}
          className={archiveActive ? "active" : ""}
          aria-label={archiveLink.label}
        >
          <Icon name={archiveLink.icon} />
          <span className="tip">{archiveLink.label}</span>
        </Link>
      </div>
    </aside>
  );
}
