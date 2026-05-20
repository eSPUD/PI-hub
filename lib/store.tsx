"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CallForPaper, Member, PI, Project, ProjectCFPAssignment, ProjectCFPStatus, Store } from "./types";

const DEFAULT: Store = {
  pi: {
    name: "",
    title: "Principal Investigator",
    pronouns: "",
    affiliation: "eSPUD",
    location: "",
    timezone: "",
    avatarUrl: "",
    email: "",
    website: "",
    orcid: "",
    googleScholar: "",
    github: "",
    linkedin: "",
    twitter: "",
    bio: "",
    focusAreas: [],
    expertise: [],
    education: [],
    publications: [],
  },
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
  updateCFPAssignment: (projectId: string, cfpId: string, patch: Partial<ProjectCFPAssignment>) => Promise<void>;
  unassignProjectFromCFP: (projectId: string, cfpId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await jsonFetch<Store>("/api/store");
      setStore({
        pi: { ...DEFAULT.pi, ...s.pi },
        projects: s.projects ?? [],
        members: s.members ?? [],
        cfps: s.cfps ?? [],
      });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoaded(true));
  }, [refresh]);

  const setPI = useCallback(async (pi: PI) => {
    setStore((s) => ({ ...s, pi }));
    await fetch("/api/pi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pi),
    });
  }, []);

  const addProject = useCallback(async (data: { name: string; description: string }) => {
    const project = await jsonFetch<Project>("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStore((s) => ({ ...s, projects: [...s.projects, project] }));
    return project;
  }, []);

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    setStore((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    }));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setStore((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  }, []);

  const addMember = useCallback(async (data: { name: string; role?: string; email?: string }) => {
    const member = await jsonFetch<Member>("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStore((s) => ({ ...s, members: [...s.members, member] }));
    return member;
  }, []);

  const updateMember = useCallback(async (id: string, patch: Partial<Member>) => {
    setStore((s) => ({
      ...s,
      members: s.members.map((m) =>
        m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m,
      ),
    }));
    await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    setStore((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id),
      projects: s.projects.map((p) => ({ ...p, memberIds: p.memberIds.filter((mid) => mid !== id) })),
    }));
    await fetch(`/api/members/${id}`, { method: "DELETE" });
  }, []);

  const assignMemberToProject = useCallback(async (projectId: string, memberId: string) => {
    const p = await new Promise<Project | undefined>((resolve) => {
      setStore((s) => {
        const next = s.projects.map((proj) => {
          if (proj.id !== projectId) return proj;
          if (proj.memberIds.includes(memberId)) return proj;
          return { ...proj, memberIds: [...proj.memberIds, memberId], updatedAt: new Date().toISOString() };
        });
        resolve(next.find((x) => x.id === projectId));
        return { ...s, projects: next };
      });
    });
    if (p) {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: p.memberIds }),
      });
    }
  }, []);

  const unassignMemberFromProject = useCallback(async (projectId: string, memberId: string) => {
    const p = await new Promise<Project | undefined>((resolve) => {
      setStore((s) => {
        const next = s.projects.map((proj) =>
          proj.id !== projectId
            ? proj
            : { ...proj, memberIds: proj.memberIds.filter((m) => m !== memberId), updatedAt: new Date().toISOString() },
        );
        resolve(next.find((x) => x.id === projectId));
        return { ...s, projects: next };
      });
    });
    if (p) {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: p.memberIds }),
      });
    }
  }, []);

  const addCFP = useCallback(async (data: Partial<CallForPaper> & { name: string }) => {
    const cfp = await jsonFetch<CallForPaper>("/api/cfps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStore((s) => ({ ...s, cfps: [...s.cfps, cfp] }));
    return cfp;
  }, []);

  const updateCFP = useCallback(async (id: string, patch: Partial<CallForPaper>) => {
    setStore((s) => ({
      ...s,
      cfps: s.cfps.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
      ),
    }));
    await fetch(`/api/cfps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
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
    await fetch(`/api/cfps/${id}`, { method: "DELETE" });
  }, []);

  const assignProjectToCFP = useCallback(
    async (projectId: string, cfpId: string, status: ProjectCFPStatus = "not_started") => {
      const now = new Date().toISOString();
      const updated = await new Promise<Project | undefined>((resolve) => {
        setStore((s) => {
          const next = s.projects.map((p) => {
            if (p.id !== projectId) return p;
            if (p.cfpAssignments.some((a) => a.cfpId === cfpId)) return p;
            return {
              ...p,
              cfpAssignments: [
                ...p.cfpAssignments,
                { cfpId, status, notes: "", assignedAt: now },
              ],
              updatedAt: now,
            };
          });
          resolve(next.find((p) => p.id === projectId));
          return { ...s, projects: next };
        });
      });
      if (updated) {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cfpAssignments: updated.cfpAssignments }),
        });
      }
    },
    [],
  );

  const updateCFPAssignment = useCallback(
    async (projectId: string, cfpId: string, patch: Partial<ProjectCFPAssignment>) => {
      const updated = await new Promise<Project | undefined>((resolve) => {
        setStore((s) => {
          const next = s.projects.map((p) =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  cfpAssignments: p.cfpAssignments.map((a) => (a.cfpId === cfpId ? { ...a, ...patch } : a)),
                  updatedAt: new Date().toISOString(),
                },
          );
          resolve(next.find((p) => p.id === projectId));
          return { ...s, projects: next };
        });
      });
      if (updated) {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cfpAssignments: updated.cfpAssignments }),
        });
      }
    },
    [],
  );

  const unassignProjectFromCFP = useCallback(async (projectId: string, cfpId: string) => {
    const updated = await new Promise<Project | undefined>((resolve) => {
      setStore((s) => {
        const next = s.projects.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                cfpAssignments: p.cfpAssignments.filter((a) => a.cfpId !== cfpId),
                updatedAt: new Date().toISOString(),
              },
        );
        resolve(next.find((p) => p.id === projectId));
        return { ...s, projects: next };
      });
    });
    if (updated) {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfpAssignments: updated.cfpAssignments }),
      });
    }
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

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
