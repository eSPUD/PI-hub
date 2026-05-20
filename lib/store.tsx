"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_PI,
  deleteCFPRecord,
  deleteMemberRecord,
  deleteProjectRecord,
  readStore,
  writeCFP,
  writeMember,
  writePI,
  writeProject,
} from "./idb-store";
import type {
  CallForPaper,
  Member,
  PI,
  Project,
  ProjectCFPAssignment,
  ProjectCFPStatus,
  Store,
} from "./types";

const DEFAULT: Store = {
  pi: DEFAULT_PI,
  projects: [],
  members: [],
  cfps: [],
};

type Ctx = {
  store: Store;
  loaded: boolean;
  setPI: (pi: PI) => Promise<void>;
  addProject: (data: { name: string; description: string }) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (data: { name: string; role?: string; email?: string }) => Promise<Member>;
  updateMember: (id: string, patch: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  assignMemberToProject: (projectId: string, memberId: string) => Promise<void>;
  unassignMemberFromProject: (projectId: string, memberId: string) => Promise<void>;
  addCFP: (data: Partial<CallForPaper> & { name: string }) => Promise<CallForPaper>;
  updateCFP: (id: string, patch: Partial<CallForPaper>) => Promise<void>;
  deleteCFP: (id: string) => Promise<void>;
  assignProjectToCFP: (projectId: string, cfpId: string, status?: ProjectCFPStatus) => Promise<void>;
  updateCFPAssignment: (
    projectId: string,
    cfpId: string,
    patch: Partial<ProjectCFPAssignment>,
  ) => Promise<void>;
  unassignProjectFromCFP: (projectId: string, cfpId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeProject(data: { name: string; description: string }): Project {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: data.name.trim(),
    description: (data.description ?? "").trim(),
    status: "exploration",
    plan: "",
    setup: "",
    discord: "",
    overleaf: "",
    contributors: [],
    memberIds: [],
    artifacts: [],
    log: [],
    cfpAssignments: [],
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

function makeMember(data: { name: string; role?: string; email?: string }): Member {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: data.name.trim(),
    role: (data.role ?? "").trim(),
    email: (data.email ?? "").trim(),
    affiliation: "",
    bio: "",
    avatarUrl: "",
    github: "",
    expertise: [],
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

function makeCFP(data: Partial<CallForPaper> & { name: string }): CallForPaper {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: data.name.trim(),
    venue: (data.venue ?? "").trim(),
    url: (data.url ?? "").trim(),
    abstractDeadline: (data.abstractDeadline ?? "").trim(),
    submissionDeadline: (data.submissionDeadline ?? "").trim(),
    notificationDate: (data.notificationDate ?? "").trim(),
    conferenceDate: (data.conferenceDate ?? "").trim(),
    location: (data.location ?? "").trim(),
    topics: Array.isArray(data.topics) ? data.topics : [],
    notes: (data.notes ?? "").trim(),
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await readStore();
      setStore({ pi: { ...DEFAULT.pi, ...s.pi }, projects: s.projects, members: s.members, cfps: s.cfps });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoaded(true));
  }, [refresh]);

  const setPI = useCallback(async (pi: PI) => {
    setStore((s) => ({ ...s, pi }));
    await writePI(pi);
  }, []);

  const addProject = useCallback(async (data: { name: string; description: string }) => {
    const project = makeProject(data);
    await writeProject(project);
    setStore((s) => ({ ...s, projects: [...s.projects, project] }));
    return project;
  }, []);

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    let updated: Project | undefined;
    setStore((s) => {
      const next = s.projects.map((p) => {
        if (p.id !== id) return p;
        const merged: Project = { ...p, ...patch, updatedAt: new Date().toISOString() };
        updated = merged;
        return merged;
      });
      return { ...s, projects: next };
    });
    if (updated) await writeProject(updated);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setStore((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }));
    await deleteProjectRecord(id);
  }, []);

  const addMember = useCallback(async (data: { name: string; role?: string; email?: string }) => {
    const member = makeMember(data);
    await writeMember(member);
    setStore((s) => ({ ...s, members: [...s.members, member] }));
    return member;
  }, []);

  const updateMember = useCallback(async (id: string, patch: Partial<Member>) => {
    let updated: Member | undefined;
    setStore((s) => {
      const next = s.members.map((m) => {
        if (m.id !== id) return m;
        const merged: Member = { ...m, ...patch, updatedAt: new Date().toISOString() };
        updated = merged;
        return merged;
      });
      return { ...s, members: next };
    });
    if (updated) await writeMember(updated);
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    setStore((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id),
      projects: s.projects.map((p) => ({ ...p, memberIds: p.memberIds.filter((mid) => mid !== id) })),
    }));
    await deleteMemberRecord(id);
  }, []);

  const assignMemberToProject = useCallback(async (projectId: string, memberId: string) => {
    let updated: Project | undefined;
    setStore((s) => {
      const next = s.projects.map((p) => {
        if (p.id !== projectId) return p;
        if (p.memberIds.includes(memberId)) return p;
        const merged = { ...p, memberIds: [...p.memberIds, memberId], updatedAt: new Date().toISOString() };
        updated = merged;
        return merged;
      });
      return { ...s, projects: next };
    });
    if (updated) await writeProject(updated);
  }, []);

  const unassignMemberFromProject = useCallback(async (projectId: string, memberId: string) => {
    let updated: Project | undefined;
    setStore((s) => {
      const next = s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const merged = {
          ...p,
          memberIds: p.memberIds.filter((m) => m !== memberId),
          updatedAt: new Date().toISOString(),
        };
        updated = merged;
        return merged;
      });
      return { ...s, projects: next };
    });
    if (updated) await writeProject(updated);
  }, []);

  const addCFP = useCallback(async (data: Partial<CallForPaper> & { name: string }) => {
    const cfp = makeCFP(data);
    await writeCFP(cfp);
    setStore((s) => ({ ...s, cfps: [...s.cfps, cfp] }));
    return cfp;
  }, []);

  const updateCFP = useCallback(async (id: string, patch: Partial<CallForPaper>) => {
    let updated: CallForPaper | undefined;
    setStore((s) => {
      const next = s.cfps.map((c) => {
        if (c.id !== id) return c;
        const merged: CallForPaper = { ...c, ...patch, updatedAt: new Date().toISOString() };
        updated = merged;
        return merged;
      });
      return { ...s, cfps: next };
    });
    if (updated) await writeCFP(updated);
  }, []);

  const deleteCFP = useCallback(async (id: string) => {
    setStore((s) => ({
      ...s,
      cfps: s.cfps.filter((c) => c.id !== id),
      projects: s.projects.map((p) => ({
        ...p,
        cfpAssignments: p.cfpAssignments.filter((a) => a.cfpId !== id),
      })),
    }));
    await deleteCFPRecord(id);
  }, []);

  const assignProjectToCFP = useCallback(
    async (projectId: string, cfpId: string, status: ProjectCFPStatus = "not_started") => {
      let updated: Project | undefined;
      setStore((s) => {
        const next = s.projects.map((p) => {
          if (p.id !== projectId) return p;
          if (p.cfpAssignments.some((a) => a.cfpId === cfpId)) return p;
          const merged = {
            ...p,
            cfpAssignments: [
              ...p.cfpAssignments,
              { cfpId, status, notes: "", assignedAt: new Date().toISOString() },
            ],
            updatedAt: new Date().toISOString(),
          };
          updated = merged;
          return merged;
        });
        return { ...s, projects: next };
      });
      if (updated) await writeProject(updated);
    },
    [],
  );

  const updateCFPAssignment = useCallback(
    async (projectId: string, cfpId: string, patch: Partial<ProjectCFPAssignment>) => {
      let updated: Project | undefined;
      setStore((s) => {
        const next = s.projects.map((p) => {
          if (p.id !== projectId) return p;
          const merged = {
            ...p,
            cfpAssignments: p.cfpAssignments.map((a) => (a.cfpId === cfpId ? { ...a, ...patch } : a)),
            updatedAt: new Date().toISOString(),
          };
          updated = merged;
          return merged;
        });
        return { ...s, projects: next };
      });
      if (updated) await writeProject(updated);
    },
    [],
  );

  const unassignProjectFromCFP = useCallback(async (projectId: string, cfpId: string) => {
    let updated: Project | undefined;
    setStore((s) => {
      const next = s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const merged = {
          ...p,
          cfpAssignments: p.cfpAssignments.filter((a) => a.cfpId !== cfpId),
          updatedAt: new Date().toISOString(),
        };
        updated = merged;
        return merged;
      });
      return { ...s, projects: next };
    });
    if (updated) await writeProject(updated);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        store,
        loaded,
        setPI,
        addProject,
        updateProject,
        deleteProject,
        addMember,
        updateMember,
        deleteMember,
        assignMemberToProject,
        unassignMemberFromProject,
        addCFP,
        updateCFP,
        deleteCFP,
        assignProjectToCFP,
        updateCFPAssignment,
        unassignProjectFromCFP,
        refresh,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
