import { NextResponse } from "next/server";
import { deleteProject, readProject, writeProject } from "@/lib/fs-store";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await readProject(id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await readProject(id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = (await req.json()) as Partial<Project>;
  const updated: Project = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await writeProject(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
