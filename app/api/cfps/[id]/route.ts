import { NextResponse } from "next/server";
import { deleteCFP, readCFP, readProjects, writeCFP, writeProject } from "@/lib/fs-store";
import type { CallForPaper } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cfp = await readCFP(id);
  if (!cfp) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(cfp);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await readCFP(id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = (await req.json()) as Partial<CallForPaper>;
  const updated: CallForPaper = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    topics: Array.isArray(patch.topics) ? patch.topics.filter((x): x is string => typeof x === "string") : existing.topics,
  };
  await writeCFP(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCFP(id);
  const projects = await readProjects();
  for (const p of projects) {
    if (p.cfpAssignments.some((a) => a.cfpId === id)) {
      await writeProject({
        ...p,
        cfpAssignments: p.cfpAssignments.filter((a) => a.cfpId !== id),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return NextResponse.json({ ok: true });
}
