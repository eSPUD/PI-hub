import "server-only";
import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import type { CallForPaper, Member, PI, Project, Store } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PI_FILE = path.join(CONTENT_DIR, "pi.md");
const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");
const MEMBERS_DIR = path.join(CONTENT_DIR, "members");
const CFPS_DIR = path.join(CONTENT_DIR, "cfps");

const DEFAULT_PI: PI = {
  name: "",
  title: "Principal Investigator",
  pronouns: "",
  affiliation: "eSPUD",
  location: "",
  timezone: "",
  avatarUrl: "",
  email: "",
  website: "",
  orcid: "",
  googleScholar: "",
  github: "",
  linkedin: "",
  twitter: "",
  bio: "",
  focusAreas: [],
  expertise: [],
  education: [],
  publications: [],
};

function coercePI(raw: Partial<PI>): PI {
  return {
    ...DEFAULT_PI,
    ...raw,
    focusAreas: Array.isArray(raw.focusAreas) ? raw.focusAreas : [],
    expertise: Array.isArray(raw.expertise) ? raw.expertise : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    publications: Array.isArray(raw.publications) ? raw.publications : [],
  };
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  await fs.mkdir(MEMBERS_DIR, { recursive: true });
  await fs.mkdir(CFPS_DIR, { recursive: true });
}

function parseFrontmatter(text: string): Record<string, unknown> {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/);
  if (!match) return {};
  try {
    const parsed = yaml.load(match[1]);
    return (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildMd(data: Record<string, unknown>, body: string): string {
  const fm = yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false });
  return `---\n${fm}---\n\n${body.trimEnd()}\n`;
}

export async function readPI(): Promise<PI> {
  await ensureDirs();
  try {
    const text = await fs.readFile(PI_FILE, "utf8");
    const fm = parseFrontmatter(text) as Partial<PI>;
    return coercePI(fm);
  } catch {
    return DEFAULT_PI;
  }
}

function renderPIBody(pi: PI): string {
  const lines: string[] = [];
  const heading = pi.name || "Principal Investigator";
  const subtitle = [pi.title, pi.pronouns ? `(${pi.pronouns})` : ""].filter(Boolean).join(" ");
  lines.push(`# ${heading}`);
  if (subtitle) lines.push(`*${subtitle}*`);
  lines.push("");
  const meta = [pi.affiliation, pi.location, pi.timezone].filter(Boolean).join(" · ");
  if (meta) lines.push(`**${meta}**`, "");
  if (pi.email || pi.website) {
    const contact = [pi.email ? `<${pi.email}>` : "", pi.website ? `[${pi.website}](${pi.website})` : ""]
      .filter(Boolean)
      .join(" · ");
    lines.push(contact, "");
  }
  if (pi.bio) lines.push("## Bio", "", pi.bio, "");
  if (pi.focusAreas.length) lines.push("## Focus areas", "", pi.focusAreas.map((t) => `- ${t}`).join("\n"), "");
  if (pi.expertise.length) lines.push("## Expertise", "", pi.expertise.map((t) => `- ${t}`).join("\n"), "");
  if (pi.education.length) {
    lines.push("## Education", "");
    for (const e of pi.education) {
      const head = [e.degree, e.field].filter(Boolean).join(" in ");
      const yr = e.year ? ` (${e.year})` : "";
      lines.push(`- **${e.institution}**${head ? ` — ${head}` : ""}${yr}`);
    }
    lines.push("");
  }
  if (pi.publications.length) {
    lines.push("## Selected publications", "");
    for (const p of pi.publications) {
      const title = p.url ? `[${p.title}](${p.url})` : p.title;
      const meta2 = [p.venue, p.year].filter(Boolean).join(", ");
      lines.push(`- ${title}${meta2 ? ` — ${meta2}` : ""}`);
    }
    lines.push("");
  }
  const links: string[] = [];
  if (pi.orcid) links.push(`ORCID \`${pi.orcid}\``);
  if (pi.googleScholar) links.push(`[Google Scholar](${pi.googleScholar})`);
  if (pi.github) links.push(`[GitHub](https://github.com/${pi.github.replace(/^@/, "")})`);
  if (pi.linkedin) links.push(`[LinkedIn](https://linkedin.com/in/${pi.linkedin.replace(/^@/, "")})`);
  if (pi.twitter) links.push(`[X / Twitter](https://x.com/${pi.twitter.replace(/^@/, "")})`);
  if (links.length) lines.push("## Online", "", links.join(" · "), "");
  return lines.join("\n");
}

export async function writePI(pi: PI): Promise<void> {
  await ensureDirs();
  await fs.writeFile(PI_FILE, buildMd({ ...pi }, renderPIBody(pi)), "utf8");
}

function coerceProject(fm: Partial<Project>): Project | null {
  if (!fm.id || !fm.name) return null;
  const now = new Date().toISOString();
  return {
    id: fm.id,
    name: fm.name,
    description: fm.description ?? "",
    status: fm.status ?? "exploration",
    plan: fm.plan ?? "",
    setup: fm.setup ?? "",
    discord: fm.discord ?? "",
    overleaf: fm.overleaf ?? "",
    contributors: Array.isArray(fm.contributors) ? fm.contributors : [],
    memberIds: Array.isArray(fm.memberIds) ? fm.memberIds : [],
    artifacts: Array.isArray(fm.artifacts) ? fm.artifacts : [],
    log: Array.isArray(fm.log) ? fm.log : [],
    cfpAssignments: Array.isArray(fm.cfpAssignments) ? fm.cfpAssignments : [],
    archivedAt: fm.archivedAt ?? "",
    createdAt: fm.createdAt ?? now,
    updatedAt: fm.updatedAt ?? now,
  };
}

export async function readProjects(): Promise<Project[]> {
  await ensureDirs();
  let files: string[];
  try {
    files = await fs.readdir(PROJECTS_DIR);
  } catch {
    return [];
  }
  const projects: Project[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    try {
      const text = await fs.readFile(path.join(PROJECTS_DIR, f), "utf8");
      const fm = parseFrontmatter(text) as Partial<Project>;
      const project = coerceProject(fm);
      if (project) projects.push(project);
    } catch {
      // skip unreadable file
    }
  }
  return projects;
}

export async function readProject(id: string): Promise<Project | null> {
  const all = await readProjects();
  return all.find((p) => p.id === id) ?? null;
}

function renderProjectBody(p: Project): string {
  const lines: string[] = [];
  lines.push(`# ${p.name}`, "");
  lines.push(`**Status:** \`${p.status}\``, "");
  if (p.description) lines.push(p.description, "");
  if (p.discord) lines.push(`💬 [Discord](${p.discord})`, "");
  if (p.overleaf) lines.push(`📄 [Overleaf project](${p.overleaf})`, "");
  if (p.plan) lines.push("## Plan", "", p.plan, "");
  if (p.setup) lines.push("## Setup", "", p.setup, "");
  if (p.contributors.length) {
    lines.push("## Contributors", "");
    for (const c of p.contributors) {
      const meta = [c.role, c.email].filter(Boolean).join(" · ");
      lines.push(`- **${c.name}**${meta ? ` — ${meta}` : ""}`);
    }
    lines.push("");
  }
  if (p.artifacts.length) {
    lines.push("## Artifacts", "");
    for (const a of p.artifacts) {
      lines.push(`- **${a.title}**${a.url ? ` — <${a.url}>` : ""}`);
      if (a.notes) lines.push(`  - ${a.notes}`);
    }
    lines.push("");
  }
  if (p.log.length) {
    lines.push("## Log", "");
    for (const l of p.log) {
      lines.push(`### ${l.date}`, "", l.body, "");
    }
  }
  return lines.join("\n");
}

export async function writeProject(p: Project): Promise<void> {
  await ensureDirs();
  const file = path.join(PROJECTS_DIR, `${p.id}.md`);
  await fs.writeFile(file, buildMd({ ...p }, renderProjectBody(p)), "utf8");
}

export async function deleteProject(id: string): Promise<void> {
  await ensureDirs();
  const file = path.join(PROJECTS_DIR, `${id}.md`);
  try {
    await fs.unlink(file);
  } catch {
    // already gone
  }
}

/* Members ------------------------------------------------------- */

function coerceMember(fm: Partial<Member>): Member | null {
  if (!fm.id || !fm.name) return null;
  const now = new Date().toISOString();
  return {
    id: fm.id,
    name: fm.name,
    role: fm.role ?? "",
    email: fm.email ?? "",
    affiliation: fm.affiliation ?? "",
    bio: fm.bio ?? "",
    avatarUrl: fm.avatarUrl ?? "",
    github: fm.github ?? "",
    expertise: Array.isArray(fm.expertise) ? fm.expertise : [],
    archivedAt: fm.archivedAt ?? "",
    createdAt: fm.createdAt ?? now,
    updatedAt: fm.updatedAt ?? now,
  };
}

function renderMemberBody(m: Member): string {
  const lines: string[] = [];
  lines.push(`# ${m.name}`, "");
  const meta = [m.role, m.affiliation].filter(Boolean).join(" · ");
  if (meta) lines.push(`**${meta}**`, "");
  if (m.email) lines.push(`<${m.email}>`, "");
  if (m.github) lines.push(`GitHub [@${m.github.replace(/^@/, "")}](https://github.com/${m.github.replace(/^@/, "")})`, "");
  if (m.bio) lines.push("## Bio", "", m.bio, "");
  if (m.expertise.length) {
    lines.push("## Expertise", "");
    for (const t of m.expertise) lines.push(`- ${t}`);
    lines.push("");
  }
  return lines.join("\n");
}

export async function readMembers(): Promise<Member[]> {
  await ensureDirs();
  let files: string[];
  try {
    files = await fs.readdir(MEMBERS_DIR);
  } catch {
    return [];
  }
  const members: Member[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    try {
      const text = await fs.readFile(path.join(MEMBERS_DIR, f), "utf8");
      const fm = parseFrontmatter(text) as Partial<Member>;
      const m = coerceMember(fm);
      if (m) members.push(m);
    } catch {
      // skip unreadable file
    }
  }
  return members;
}

export async function readMember(id: string): Promise<Member | null> {
  const all = await readMembers();
  return all.find((m) => m.id === id) ?? null;
}

export async function writeMember(m: Member): Promise<void> {
  await ensureDirs();
  const file = path.join(MEMBERS_DIR, `${m.id}.md`);
  await fs.writeFile(file, buildMd({ ...m }, renderMemberBody(m)), "utf8");
}

export async function deleteMember(id: string): Promise<void> {
  await ensureDirs();
  const file = path.join(MEMBERS_DIR, `${id}.md`);
  try {
    await fs.unlink(file);
  } catch {
    // already gone
  }
}

/* CFPs ---------------------------------------------------------- */

function coerceCFP(fm: Partial<CallForPaper>): CallForPaper | null {
  if (!fm.id || !fm.name) return null;
  const now = new Date().toISOString();
  return {
    id: fm.id,
    name: fm.name,
    venue: fm.venue ?? "",
    url: fm.url ?? "",
    abstractDeadline: fm.abstractDeadline ?? "",
    submissionDeadline: fm.submissionDeadline ?? "",
    notificationDate: fm.notificationDate ?? "",
    conferenceDate: fm.conferenceDate ?? "",
    location: fm.location ?? "",
    topics: Array.isArray(fm.topics) ? fm.topics : [],
    notes: fm.notes ?? "",
    archivedAt: fm.archivedAt ?? "",
    createdAt: fm.createdAt ?? now,
    updatedAt: fm.updatedAt ?? now,
  };
}

function renderCFPBody(c: CallForPaper): string {
  const lines: string[] = [];
  lines.push(`# ${c.name}`, "");
  if (c.venue) lines.push(`**${c.venue}**`, "");
  if (c.url) lines.push(`[Call for papers](${c.url})`, "");
  const dates: string[] = [];
  if (c.abstractDeadline) dates.push(`Abstract: ${c.abstractDeadline}`);
  if (c.submissionDeadline) dates.push(`Submission: ${c.submissionDeadline}`);
  if (c.notificationDate) dates.push(`Notification: ${c.notificationDate}`);
  if (c.conferenceDate) dates.push(`Conference: ${c.conferenceDate}`);
  if (dates.length) lines.push("## Key dates", "", dates.map((d) => `- ${d}`).join("\n"), "");
  if (c.location) lines.push(`**Location:** ${c.location}`, "");
  if (c.topics.length) lines.push("## Topics", "", c.topics.map((t) => `- ${t}`).join("\n"), "");
  if (c.notes) lines.push("## Notes", "", c.notes, "");
  return lines.join("\n");
}

export async function readCFPs(): Promise<CallForPaper[]> {
  await ensureDirs();
  let files: string[];
  try {
    files = await fs.readdir(CFPS_DIR);
  } catch {
    return [];
  }
  const out: CallForPaper[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    try {
      const text = await fs.readFile(path.join(CFPS_DIR, f), "utf8");
      const fm = parseFrontmatter(text) as Partial<CallForPaper>;
      const c = coerceCFP(fm);
      if (c) out.push(c);
    } catch {
      // skip
    }
  }
  return out;
}

export async function readCFP(id: string): Promise<CallForPaper | null> {
  const all = await readCFPs();
  return all.find((c) => c.id === id) ?? null;
}

export async function writeCFP(c: CallForPaper): Promise<void> {
  await ensureDirs();
  await fs.writeFile(path.join(CFPS_DIR, `${c.id}.md`), buildMd({ ...c }, renderCFPBody(c)), "utf8");
}

export async function deleteCFP(id: string): Promise<void> {
  await ensureDirs();
  try {
    await fs.unlink(path.join(CFPS_DIR, `${id}.md`));
  } catch {
    // already gone
  }
}

export async function readStore(): Promise<Store> {
  const [pi, projects, members, cfps] = await Promise.all([
    readPI(),
    readProjects(),
    readMembers(),
    readCFPs(),
  ]);
  return { pi, projects, members, cfps };
}
