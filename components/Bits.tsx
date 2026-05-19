"use client";
import { useEffect, useState } from "react";
import type { Contributor, ProjectCFPStatus, ProjectStatus } from "@/lib/types";

const AVATAR_COLORS = [
  "#5468ff",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ef4444",
  "#a78bfa",
];

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const color = AVATAR_COLORS[hashIndex(name, AVATAR_COLORS.length)];
  return (
    <span
      className="avatar"
      title={name}
      style={{ width: size, height: size, background: color, fontSize: size <= 24 ? 10 : 11 }}
    >
      {initials || "?"}
    </span>
  );
}

export function AvatarStack({ people, max = 3 }: { people: Contributor[]; max?: number }) {
  if (people.length === 0) return <span className="muted small">—</span>;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="avatars">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} />
      ))}
      {extra > 0 && <span className="avatar more">+{extra}</span>}
    </span>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <span className="progress-wrap">
      <span className="progress"><span style={{ width: `${pct}%` }} /></span>
      <span className="count small">{value}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

const CFP_STATUS_COLORS: Record<ProjectCFPStatus, { bg: string; fg: string }> = {
  not_started: { bg: "#eef0f4", fg: "#4b5563" },
  in_progress: { bg: "#eef0ff", fg: "#2742c3" },
  submitted: { bg: "#ede4ff", fg: "#6d28d9" },
  accepted: { bg: "#d8f3e6", fg: "#047857" },
  rejected: { bg: "#ffe1e4", fg: "#b91c1c" },
  late: { bg: "#fff1d6", fg: "#92590b" },
  abandoned: { bg: "#eef0f4", fg: "#6b7280" },
};

export function CFPStatusBadge({ status }: { status: ProjectCFPStatus }) {
  const c = CFP_STATUS_COLORS[status];
  return (
    <span
      className="badge"
      style={{ background: c.bg, color: c.fg, textTransform: "capitalize" }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function cfpStatusColor(status: ProjectCFPStatus): string {
  return CFP_STATUS_COLORS[status].fg;
}

export function daysUntil(date: string): number {
  if (!date) return Number.POSITIVE_INFINITY;
  const target = new Date(date + "T23:59:59").getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86400000);
}

export function deadlineUrgency(date: string): "passed" | "urgent" | "soon" | "ok" {
  const d = daysUntil(date);
  if (!Number.isFinite(d)) return "ok";
  if (d < 0) return "passed";
  if (d < 7) return "urgent";
  if (d < 30) return "soon";
  return "ok";
}

export function useNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function Countdown({
  target,
  compact = false,
}: {
  target: string;
  compact?: boolean;
}) {
  const now = useNow(1000);
  if (!target) {
    return <span className="muted small">no deadline set</span>;
  }
  const t = new Date(target + "T23:59:59").getTime();
  const diff = t - now;
  const past = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);

  if (compact) {
    return (
      <span className={`countdown-compact ${past ? "passed" : ""}`}>
        {past ? "passed · " : ""}
        {days > 0 ? `${days}d ` : ""}
        {pad(hours)}h {pad(mins)}m {pad(secs)}s
      </span>
    );
  }

  return (
    <div className={`countdown ${past ? "passed" : ""}`}>
      <CountdownUnit value={days} label="days" />
      <span className="cd-sep">:</span>
      <CountdownUnit value={hours} label="hours" />
      <span className="cd-sep">:</span>
      <CountdownUnit value={mins} label="min" />
      <span className="cd-sep">:</span>
      <CountdownUnit value={secs} label="sec" />
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="cd-unit">
      <div className="cd-num">{pad(value)}</div>
      <div className="cd-label">{label}</div>
    </div>
  );
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return new Date(iso).toLocaleDateString();
}
