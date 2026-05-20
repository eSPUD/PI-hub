import { NextResponse } from "next/server";
import { readPI, writePI } from "@/lib/fs-store";
import type { PI } from "@/lib/types";

export const dynamic = "force-dynamic";

function clean(s: unknown): string {
  return typeof s === "string" ? s : "";
}

function cleanList<T>(v: unknown, predicate: (x: unknown) => x is T): T[] {
  return Array.isArray(v) ? v.filter(predicate) : [];
}

const isString = (x: unknown): x is string => typeof x === "string";

export async function GET() {
  return NextResponse.json(await readPI());
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<PI>;
  const pi: PI = {
    name: clean(body.name),
    title: clean(body.title),
    pronouns: clean(body.pronouns),
    affiliation: clean(body.affiliation),
    location: clean(body.location),
    timezone: clean(body.timezone),
    avatarUrl: clean(body.avatarUrl),
    email: clean(body.email),
    website: clean(body.website),
    orcid: clean(body.orcid),
    googleScholar: clean(body.googleScholar),
    github: clean(body.github),
    linkedin: clean(body.linkedin),
    twitter: clean(body.twitter),
    bio: clean(body.bio),
    focusAreas: cleanList(body.focusAreas, isString),
    expertise: cleanList(body.expertise, isString),
    education: Array.isArray(body.education) ? body.education : [],
    publications: Array.isArray(body.publications) ? body.publications : [],
  };
  await writePI(pi);
  return NextResponse.json(pi);
}
