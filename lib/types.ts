export type Education = {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  year?: string;
};

export type Publication = {
  id: string;
  title: string;
  venue?: string;
  year?: string;
  url?: string;
};

export type PI = {
  name: string;
  title: string;
  pronouns: string;
  affiliation: string;
  location: string;
  timezone: string;
  avatarUrl: string;
  email: string;
  website: string;
  orcid: string;
  googleScholar: string;
  github: string;
  linkedin: string;
  twitter: string;
  bio: string;
  focusAreas: string[];
  expertise: string[];
  education: Education[];
  publications: Publication[];
};

export type Contributor = {
  id: string;
  name: string;
  role: string;
  email?: string;
};

export type Artifact = {
  id: string;
  title: string;
  url?: string;
  notes?: string;
  createdAt: string;
};

export type LogEntry = {
  id: string;
  date: string;
  body: string;
};

export type ProjectStatus = "exploration" | "planning" | "active" | "paused" | "archived";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  plan: string;
  setup: string;
  discord: string;
  overleaf: string;
  contributors: Contributor[];
  memberIds: string[];
  artifacts: Artifact[];
  log: LogEntry[];
  cfpAssignments: ProjectCFPAssignment[];
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  id: string;
  name: string;
  role: string;
  email: string;
  affiliation: string;
  bio: string;
  avatarUrl: string;
  github: string;
  expertise: string[];
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CallForPaper = {
  id: string;
  name: string;             // short label, e.g. "NeurIPS 2026"
  venue: string;            // full venue, e.g. "Conference on Neural Information Processing Systems"
  url: string;              // link to the CFP page
  abstractDeadline: string; // YYYY-MM-DD (optional, empty if N/A)
  submissionDeadline: string; // YYYY-MM-DD (required)
  notificationDate: string; // YYYY-MM-DD
  conferenceDate: string;   // YYYY-MM-DD
  location: string;
  topics: string[];
  notes: string;
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCFPStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "accepted"
  | "rejected"
  | "late"
  | "abandoned";

export const CFP_STATUSES: ProjectCFPStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "accepted",
  "rejected",
  "late",
  "abandoned",
];

export type ProjectCFPAssignment = {
  cfpId: string;
  status: ProjectCFPStatus;
  notes: string;
  assignedAt: string;
};

export type Store = {
  pi: PI;
  projects: Project[];
  members: Member[];
  cfps: CallForPaper[];
};

export const STATUSES: ProjectStatus[] = ["exploration", "planning", "active", "paused", "archived"];
