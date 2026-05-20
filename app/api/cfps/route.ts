import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readCFPs, writeCFP } from "@/lib/fs-store";
import type { CallForPaper } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readCFPs());
}

export async function POST(req: Request) {
  const data = (await req.json()) as Partial<CallForPaper>;
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const cfp: CallForPaper = {
    id: randomUUID(),
    name: data.name.trim(),
    venue: (data.venue ?? "").trim(),
    url: (data.url ?? "").trim(),
    abstractDeadline: (data.abstractDeadline ?? "").trim(),
    submissionDeadline: (data.submissionDeadline ?? "").trim(),
    notificationDate: (data.notificationDate ?? "").trim(),
    conferenceDate: (data.conferenceDate ?? "").trim(),
    location: (data.location ?? "").trim(),
    topics: Array.isArray(data.topics) ? data.topics.filter((x): x is string => typeof x === "string") : [],
    notes: (data.notes ?? "").trim(),
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeCFP(cfp);
  return NextResponse.json(cfp);
}
