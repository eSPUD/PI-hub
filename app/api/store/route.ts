import { NextResponse } from "next/server";
import { readStore } from "@/lib/fs-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}
