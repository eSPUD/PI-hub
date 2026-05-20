import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readProjects, writeProject } from "@/lib/fs-store";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readProjects());
}

export async function POST(req: Request) {
  const data = (await req.json()) as { name?: string; description?: string };
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    name: data.name.trim(),
    description: (data.description ?? "").trim(),
    status: "exploration",
    plan: "",
    setup: "",
    discord: "",
    overleaf: "",
    contributors: [],
    memberIds: [],
    artifacts: [],
    log: [],
    cfpAssignments: [],
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeProject(project);
  return NextResponse.json(project);
}
