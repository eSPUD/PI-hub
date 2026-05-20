"use client";
import { pdf } from "@react-pdf/renderer";
import { ProjectReport } from "./report";
import type { CallForPaper, Member, PI, Project } from "./types";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project"
  );
}

export async function downloadProjectReport(
  project: Project,
  pi: PI,
  members: Member[],
  cfps: CallForPaper[],
): Promise<void> {
  const generatedAt = new Date().toISOString();
  const doc = ProjectReport({ project, pi, members, cfps, generatedAt });
  const blob = await pdf(doc as never).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(project.name)}-report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
