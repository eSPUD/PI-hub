import { renderToBuffer } from "@react-pdf/renderer";
import { readCFPs, readMembers, readPI, readProject } from "@/lib/fs-store";
import { ProjectReport } from "@/lib/report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await readProject(id);
  if (!project) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const [pi, members, cfps] = await Promise.all([readPI(), readMembers(), readCFPs()]);
  const generatedAt = new Date().toISOString();

  const buffer = await renderToBuffer(
    ProjectReport({ project, pi, members, cfps, generatedAt }) as never,
  );

  const filename = `${slugify(project.name)}-report.pdf`;
  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
