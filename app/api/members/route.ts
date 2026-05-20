import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readMembers, writeMember } from "@/lib/fs-store";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readMembers());
}

export async function POST(req: Request) {
  const data = (await req.json()) as Partial<Member>;
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const member: Member = {
    id: randomUUID(),
    name: data.name.trim(),
    role: (data.role ?? "").trim(),
    email: (data.email ?? "").trim(),
    affiliation: (data.affiliation ?? "").trim(),
    bio: (data.bio ?? "").trim(),
    avatarUrl: (data.avatarUrl ?? "").trim(),
    github: (data.github ?? "").trim(),
    expertise: Array.isArray(data.expertise) ? data.expertise.filter((x): x is string => typeof x === "string") : [],
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeMember(member);
  return NextResponse.json(member);
}
