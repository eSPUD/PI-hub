import { Document, Page, StyleSheet, Text, View, Link } from "@react-pdf/renderer";
import type { CallForPaper, Member, PI, Project } from "./types";

const COLORS = {
  text: "#1c1f2e",
  muted: "#6b7280",
  accent: "#5468ff",
  border: "#e3e6ee",
  panel: "#f6f7fb",
  panel2: "#eef0f7",
  green: "#047857",
  blue: "#2742c3",
  purple: "#6d28d9",
  amber: "#92590b",
  red: "#b91c1c",
  gray: "#4b5563",
};

const styles = StyleSheet.create({
  page: {
    padding: 52,
    paddingBottom: 72,
    fontSize: 10.5,
    color: COLORS.text,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 16,
    marginBottom: 28,
  },
  brand: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", lineHeight: 1.4 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 4, lineHeight: 1.25 },
  subtitle: { fontSize: 11, color: COLORS.muted, lineHeight: 1.4 },
  rightCol: { textAlign: "right" },
  badge: {
    fontFamily: "Helvetica-Bold",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 999,
    fontSize: 9,
    textTransform: "capitalize",
    lineHeight: 1.2,
  },
  section: { marginTop: 20, marginBottom: 6 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.text,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    lineHeight: 1.3,
  },
  body: { fontSize: 10.5, lineHeight: 1.65, marginBottom: 8 },
  kvRow: { flexDirection: "row", marginBottom: 5 },
  kvKey: { width: 120, color: COLORS.muted, fontSize: 9.5, lineHeight: 1.5 },
  kvVal: { flex: 1, fontSize: 10.5, lineHeight: 1.5 },
  card: {
    padding: 12,
    backgroundColor: COLORS.panel,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: { flexDirection: "row", marginBottom: 5 },
  bulletDot: { width: 12, color: COLORS.accent, lineHeight: 1.5 },
  bulletText: { flex: 1, fontSize: 10.5, lineHeight: 1.55 },
  tag: {
    backgroundColor: COLORS.panel2,
    color: COLORS.blue,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 999,
    fontSize: 9,
    marginRight: 5,
    marginBottom: 5,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  small: { fontSize: 9.5, color: COLORS.muted, lineHeight: 1.5 },
  bold: { fontFamily: "Helvetica-Bold", lineHeight: 1.45 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    lineHeight: 1.4,
  },
});

const PROJECT_STATUS_BG: Record<string, string> = {
  exploration: "#ede4ff",
  planning: "#eef0ff",
  active: "#d8f3e6",
  paused: "#fff1d6",
  archived: "#eef0f4",
};
const PROJECT_STATUS_FG: Record<string, string> = {
  exploration: COLORS.purple,
  planning: COLORS.blue,
  active: COLORS.green,
  paused: COLORS.amber,
  archived: COLORS.gray,
};

const CFP_STATUS_BG: Record<string, string> = {
  not_started: "#eef0f4",
  in_progress: "#eef0ff",
  submitted: "#ede4ff",
  accepted: "#d8f3e6",
  rejected: "#ffe1e4",
  late: "#fff1d6",
  abandoned: "#eef0f4",
};
const CFP_STATUS_FG: Record<string, string> = {
  not_started: COLORS.gray,
  in_progress: COLORS.blue,
  submitted: COLORS.purple,
  accepted: COLORS.green,
  rejected: COLORS.red,
  late: COLORS.amber,
  abandoned: COLORS.gray,
};

function fmtDate(d: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateOnly(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function SectionWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

export function ProjectReport({
  project,
  pi,
  members,
  cfps,
  generatedAt,
}: {
  project: Project;
  pi: PI;
  members: Member[];
  cfps: CallForPaper[];
  generatedAt: string;
}) {
  const assignedMembers = project.memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m);

  const cfpRows = project.cfpAssignments.map((a) => ({
    a,
    cfp: cfps.find((c) => c.id === a.cfpId),
  }));

  return (
    <Document
      title={`${project.name} — project report`}
      author={pi.name || "PI-hub"}
      subject="Project report"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PI-hub · Project Report</Text>
            <Text style={styles.title}>{project.name}</Text>
            {project.description ? <Text style={styles.subtitle}>{project.description}</Text> : null}
          </View>
          <View style={styles.rightCol}>
            <Text
              style={{
                ...styles.badge,
                backgroundColor: PROJECT_STATUS_BG[project.status] ?? COLORS.panel,
                color: PROJECT_STATUS_FG[project.status] ?? COLORS.text,
              }}
            >
              {project.status}
            </Text>
            <Text style={[styles.small, { marginTop: 6 }]}>Generated {fmtDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Overview */}
        <SectionWrap title="Overview">
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Principal Investigator</Text>
            <Text style={styles.kvVal}>
              {pi.name || "—"}
              {pi.title ? ` · ${pi.title}` : ""}
              {pi.affiliation ? ` · ${pi.affiliation}` : ""}
            </Text>
          </View>
          {pi.email ? (
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Contact</Text>
              <Text style={styles.kvVal}>{pi.email}</Text>
            </View>
          ) : null}
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Created</Text>
            <Text style={styles.kvVal}>{fmtDate(project.createdAt)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Last updated</Text>
            <Text style={styles.kvVal}>{fmtDate(project.updatedAt)}</Text>
          </View>
          {project.discord ? (
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Discord</Text>
              <Link src={project.discord} style={{ color: COLORS.accent, fontSize: 10.5 }}>{project.discord}</Link>
            </View>
          ) : null}
          {project.overleaf ? (
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Overleaf</Text>
              <Link src={project.overleaf} style={{ color: COLORS.accent, fontSize: 10.5 }}>{project.overleaf}</Link>
            </View>
          ) : null}
        </SectionWrap>

        {/* Plan */}
        {project.plan ? (
          <SectionWrap title="Research Plan">
            <Text style={styles.body}>{project.plan}</Text>
          </SectionWrap>
        ) : null}

        {/* Setup */}
        {project.setup ? (
          <SectionWrap title="Research Setup">
            <Text style={styles.body}>{project.setup}</Text>
          </SectionWrap>
        ) : null}

        {/* Team */}
        {assignedMembers.length > 0 ? (
          <SectionWrap title={`Team members (${assignedMembers.length})`}>
            {assignedMembers.map((m) => (
              <View key={m.id} style={styles.card} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.bold}>{m.name}</Text>
                  <Text style={styles.small}>{m.role || ""}</Text>
                </View>
                {(m.email || m.affiliation) && (
                  <Text style={[styles.small, { marginTop: 2 }]}>
                    {[m.affiliation, m.email].filter(Boolean).join(" · ")}
                  </Text>
                )}
                {m.expertise.length > 0 && (
                  <Text style={[styles.small, { marginTop: 4 }]}>
                    Expertise: {m.expertise.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </SectionWrap>
        ) : null}

        {/* External contributors */}
        {project.contributors.length > 0 ? (
          <SectionWrap title={`External contributors (${project.contributors.length})`}>
            {project.contributors.map((c) => (
              <View key={c.id} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>{c.name}</Text>
                  {c.role ? ` — ${c.role}` : ""}
                  {c.email ? ` (${c.email})` : ""}
                </Text>
              </View>
            ))}
          </SectionWrap>
        ) : null}

        {/* CFP assignments */}
        {cfpRows.length > 0 ? (
          <SectionWrap title={`Target venues & deadlines (${cfpRows.length})`}>
            {cfpRows.map(({ a, cfp }) => (
              <View key={a.cfpId} style={styles.card} wrap={false}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.bold}>{cfp?.name ?? "(unknown CFP)"}</Text>
                    {cfp?.venue ? <Text style={[styles.small, { marginTop: 2 }]}>{cfp.venue}</Text> : null}
                  </View>
                  <Text
                    style={{
                      ...styles.badge,
                      backgroundColor: CFP_STATUS_BG[a.status] ?? COLORS.panel,
                      color: CFP_STATUS_FG[a.status] ?? COLORS.text,
                    }}
                  >
                    {a.status.replace(/_/g, " ")}
                  </Text>
                </View>
                {cfp?.submissionDeadline ? (
                  <Text style={[styles.small, { marginTop: 6 }]}>
                    Submission: {fmtDateOnly(cfp.submissionDeadline)}
                    {cfp.notificationDate ? ` · Notification: ${fmtDateOnly(cfp.notificationDate)}` : ""}
                    {cfp.conferenceDate ? ` · Conference: ${fmtDateOnly(cfp.conferenceDate)}` : ""}
                  </Text>
                ) : null}
                {a.notes ? <Text style={[styles.body, { marginTop: 6, marginBottom: 0 }]}>{a.notes}</Text> : null}
              </View>
            ))}
          </SectionWrap>
        ) : null}

        {/* Artifacts */}
        {project.artifacts.length > 0 ? (
          <SectionWrap title={`Artifacts (${project.artifacts.length})`}>
            {project.artifacts.map((art) => (
              <View key={art.id} style={styles.card} wrap={false}>
                <Text style={styles.bold}>{art.title}</Text>
                {art.url ? (
                  <Link src={art.url} style={{ color: COLORS.accent, fontSize: 10, marginTop: 3 }}>{art.url}</Link>
                ) : null}
                {art.notes ? <Text style={[styles.body, { marginTop: 5, marginBottom: 0 }]}>{art.notes}</Text> : null}
                <Text style={[styles.small, { marginTop: 5 }]}>Added {fmtDate(art.createdAt)}</Text>
              </View>
            ))}
          </SectionWrap>
        ) : null}

        {/* Log */}
        {project.log.length > 0 ? (
          <SectionWrap title={`Exploration log (${project.log.length} entries)`}>
            {project.log.map((entry) => (
              <View key={entry.id} style={{ marginBottom: 12 }} wrap={false}>
                <Text style={[styles.small, { fontFamily: "Helvetica-Bold", color: COLORS.text, marginBottom: 4 }]}>
                  {entry.date}
                </Text>
                <Text style={[styles.body, { marginBottom: 0 }]}>{entry.body}</Text>
              </View>
            ))}
          </SectionWrap>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{pi.name ? `${pi.name} · ` : ""}{pi.affiliation || "PI-hub"}</Text>
          <Text
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
