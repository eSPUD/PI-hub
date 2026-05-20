"use client";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CallForPaper, Member, PI, Project, Store } from "./types";

const DB_NAME = "pi-hub";
const DB_VERSION = 1;
const PI_KEY = "pi";

interface Schema extends DBSchema {
  pi: { key: typeof PI_KEY; value: PI };
  projects: { key: string; value: Project };
  members: { key: string; value: Member };
  cfps: { key: string; value: CallForPaper };
}

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

let _db: Promise<IDBPDatabase<Schema>> | null = null;

function getDB(): Promise<IDBPDatabase<Schema>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("idb-store is browser-only"));
  }
  if (!_db) {
    _db = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pi")) db.createObjectStore("pi");
        if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
        if (!db.objectStoreNames.contains("members")) db.createObjectStore("members", { keyPath: "id" });
        if (!db.objectStoreNames.contains("cfps")) db.createObjectStore("cfps", { keyPath: "id" });
      },
    });
  }
  return _db;
}

/* PI ----------------------------------------------------------- */

export async function readPI(): Promise<PI> {
  const db = await getDB();
  const stored = await db.get("pi", PI_KEY);
  return stored ? { ...DEFAULT_PI, ...stored } : DEFAULT_PI;
}

export async function writePI(pi: PI): Promise<void> {
  const db = await getDB();
  await db.put("pi", pi, PI_KEY);
}

/* Projects ----------------------------------------------------- */

export async function readProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll("projects");
}

export async function readProject(id: string): Promise<Project | null> {
  const db = await getDB();
  const p = await db.get("projects", id);
  return p ?? null;
}

export async function writeProject(p: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", p);
}

export async function deleteProjectRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("projects", id);
}

/* Members ------------------------------------------------------ */

export async function readMembers(): Promise<Member[]> {
  const db = await getDB();
  return db.getAll("members");
}

export async function readMember(id: string): Promise<Member | null> {
  const db = await getDB();
  const m = await db.get("members", id);
  return m ?? null;
}

export async function writeMember(m: Member): Promise<void> {
  const db = await getDB();
  await db.put("members", m);
}

export async function deleteMemberRecord(id: string): Promise<void> {
  const db = await getDB();
  const m = await db.get("members", id);
  if (!m) return;
  // Strip member from any project's memberIds
  const projects = await db.getAll("projects");
  const tx = db.transaction(["projects", "members"], "readwrite");
  const projectsStore = tx.objectStore("projects");
  for (const p of projects) {
    if (p.memberIds.includes(id)) {
      await projectsStore.put({
        ...p,
        memberIds: p.memberIds.filter((mid) => mid !== id),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  await tx.objectStore("members").delete(id);
  await tx.done;
}

/* CFPs --------------------------------------------------------- */

export async function readCFPs(): Promise<CallForPaper[]> {
  const db = await getDB();
  return db.getAll("cfps");
}

export async function readCFP(id: string): Promise<CallForPaper | null> {
  const db = await getDB();
  const c = await db.get("cfps", id);
  return c ?? null;
}

export async function writeCFP(c: CallForPaper): Promise<void> {
  const db = await getDB();
  await db.put("cfps", c);
}

export async function deleteCFPRecord(id: string): Promise<void> {
  const db = await getDB();
  const projects = await db.getAll("projects");
  const tx = db.transaction(["projects", "cfps"], "readwrite");
  const projectsStore = tx.objectStore("projects");
  for (const p of projects) {
    if (p.cfpAssignments.some((a) => a.cfpId === id)) {
      await projectsStore.put({
        ...p,
        cfpAssignments: p.cfpAssignments.filter((a) => a.cfpId !== id),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  await tx.objectStore("cfps").delete(id);
  await tx.done;
}

/* Combined ----------------------------------------------------- */

export async function readStore(): Promise<Store> {
  const [pi, projects, members, cfps] = await Promise.all([
    readPI(),
    readProjects(),
    readMembers(),
    readCFPs(),
  ]);
  return { pi, projects, members, cfps };
}

export async function wipeAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["pi", "projects", "members", "cfps"], "readwrite");
  await Promise.all([
    tx.objectStore("pi").clear(),
    tx.objectStore("projects").clear(),
    tx.objectStore("members").clear(),
    tx.objectStore("cfps").clear(),
  ]);
  await tx.done;
}

export async function importStore(s: Partial<Store>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["pi", "projects", "members", "cfps"], "readwrite");
  if (s.pi) await tx.objectStore("pi").put({ ...DEFAULT_PI, ...s.pi }, PI_KEY);
  if (Array.isArray(s.projects)) {
    for (const p of s.projects) await tx.objectStore("projects").put(p);
  }
  if (Array.isArray(s.members)) {
    for (const m of s.members) await tx.objectStore("members").put(m);
  }
  if (Array.isArray(s.cfps)) {
    for (const c of s.cfps) await tx.objectStore("cfps").put(c);
  }
  await tx.done;
}

export { DEFAULT_PI };
