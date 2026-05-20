"use client";
import JSZip from "jszip";
import yaml from "js-yaml";
import { importStore, readStore, wipeAll } from "./idb-store";
import type { CallForPaper, Member, PI, Project, Store } from "./types";

const VERSION = 1;

type BackupPayload = {
  version: number;
  exportedAt: string;
  store: Store;
};

function parseFrontmatter(text: string): Record<string, unknown> {
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  try {
    const parsed = yaml.load(m[1]);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildMd(data: Record<string, unknown>): string {
  const fm = yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false });
  return `---\n${fm}---\n`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportJSON(): Promise<void> {
  const store = await readStore();
  const payload: BackupPayload = {
    version: VERSION,
    exportedAt: new Date().toISOString(),
    store,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  download(blob, `pi-hub-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function exportZip(): Promise<void> {
  const store = await readStore();
  const zip = new JSZip();
  zip.file("pi.md", buildMd(store.pi as unknown as Record<string, unknown>));
  const projects = zip.folder("projects")!;
  for (const p of store.projects) {
    projects.file(`${p.id}.md`, buildMd(p as unknown as Record<string, unknown>));
  }
  const members = zip.folder("members")!;
  for (const m of store.members) {
    members.file(`${m.id}.md`, buildMd(m as unknown as Record<string, unknown>));
  }
  const cfps = zip.folder("cfps")!;
  for (const c of store.cfps) {
    cfps.file(`${c.id}.md`, buildMd(c as unknown as Record<string, unknown>));
  }
  zip.file(
    "backup.json",
    JSON.stringify(
      { version: VERSION, exportedAt: new Date().toISOString(), store },
      null,
      2,
    ),
  );
  const blob = await zip.generateAsync({ type: "blob" });
  download(blob, `pi-hub-backup-${new Date().toISOString().slice(0, 10)}.zip`);
}

async function parseJSONPayload(text: string): Promise<Store> {
  const parsed = JSON.parse(text) as BackupPayload | Store;
  if ("store" in parsed && parsed.store) return parsed.store;
  if ("projects" in parsed && Array.isArray(parsed.projects)) return parsed as Store;
  throw new Error("Unrecognized backup format");
}

async function parseZipPayload(file: File): Promise<Store> {
  const zip = await JSZip.loadAsync(file);
  const jsonEntry = zip.file("backup.json");
  if (jsonEntry) {
    const text = await jsonEntry.async("string");
    return parseJSONPayload(text);
  }
  // Fallback: read markdown files
  const piFile = zip.file("pi.md");
  const pi = piFile ? (parseFrontmatter(await piFile.async("string")) as Partial<PI>) : undefined;
  const projects: Project[] = [];
  const members: Member[] = [];
  const cfps: CallForPaper[] = [];
  const projectFiles = zip.folder("projects");
  if (projectFiles) {
    projectFiles.forEach((relativePath, entry) => {
      if (!entry.dir && entry.name.endsWith(".md")) {
        // queued
      }
    });
    const paths: string[] = [];
    projectFiles.forEach((rel, e) => {
      if (!e.dir && rel.endsWith(".md")) paths.push(rel);
    });
    for (const p of paths) {
      const entry = projectFiles.file(p);
      if (!entry) continue;
      const text = await entry.async("string");
      const fm = parseFrontmatter(text) as Project;
      if (fm.id && fm.name) projects.push(fm);
    }
  }
  // Members
  const memberFiles = zip.folder("members");
  if (memberFiles) {
    const paths: string[] = [];
    memberFiles.forEach((rel, e) => {
      if (!e.dir && rel.endsWith(".md")) paths.push(rel);
    });
    for (const p of paths) {
      const entry = memberFiles.file(p);
      if (!entry) continue;
      const text = await entry.async("string");
      const fm = parseFrontmatter(text) as Member;
      if (fm.id && fm.name) members.push(fm);
    }
  }
  // CFPs
  const cfpFiles = zip.folder("cfps");
  if (cfpFiles) {
    const paths: string[] = [];
    cfpFiles.forEach((rel, e) => {
      if (!e.dir && rel.endsWith(".md")) paths.push(rel);
    });
    for (const p of paths) {
      const entry = cfpFiles.file(p);
      if (!entry) continue;
      const text = await entry.async("string");
      const fm = parseFrontmatter(text) as CallForPaper;
      if (fm.id && fm.name) cfps.push(fm);
    }
  }
  return {
    pi: { ...(pi ?? {}) } as PI,
    projects,
    members,
    cfps,
  };
}

export async function importBackup(file: File): Promise<void> {
  let store: Store;
  if (file.name.endsWith(".zip")) {
    store = await parseZipPayload(file);
  } else {
    const text = await file.text();
    store = await parseJSONPayload(text);
  }
  await importStore(store);
}

export async function wipeAllData(): Promise<void> {
  await wipeAll();
}
