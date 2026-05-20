import { NextResponse } from "next/server";
import { deleteMember, readMember, readProjects, writeMember, writeProject } from "@/lib/fs-store";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await readMember(id);
  if (!member) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await readMember(id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = (await req.json()) as Partial<Member>;
  const updated: Member = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    expertise: Array.isArray(patch.expertise) ? patch.expertise.filter((x): x is string => typeof x === "string") : existing.expertise,
  };
  await writeMember(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteMember(id);
  const projects = await readProjects();
  for (const p of projects) {
    if (p.memberIds.includes(id)) {
      await writeProject({
        ...p,
        memberIds: p.memberIds.filter((mid) => mid !== id),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return NextResponse.json({ ok: true });
}
