'use client';

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { projectsStore, useProjectsStore, type Project } from '@/stores/projects.store';

export type { Project };

interface ProjectContextValue {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProject: (id: string | null) => void;
  createProject: (data: Partial<Project>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  linkVendor: (projectId: string, vendorId: string) => void;
  unlinkVendor: (projectId: string, vendorId: string) => void;
  isVendorLinked: (projectId: string, vendorId: string) => boolean;
  bookEquipment: (projectId: string, equipId: string) => void;
  releaseEquipment: (projectId: string, equipId: string) => void;
  isEquipmentBooked: (projectId: string, equipId: string) => boolean;
  toast: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function useProjectsStoreSync() {
  return useProjectsStore();
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const store = useProjectsStoreSync();
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    setHydrated(true);
    let saved: Project[] = [];
    try {
      const raw = localStorage.getItem('hhr_projects_db');
      saved = raw ? JSON.parse(raw) : [];
    } catch {}

    if (saved.length > 0) {
      projectsStore.setState({ list: saved });
    }
  }, [hydrated]);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);

  return (
    <ProjectContext.Provider
      value={{
        projects: store.list,
        activeProjectId: store.activeId,
        activeProject: store.active,
        setActiveProject: store.setActive,
        createProject: store.create,
        updateProject: store.update,
        deleteProject: store.delete,
        linkVendor: store.linkVendor,
        unlinkVendor: store.unlinkVendor,
        isVendorLinked: (pid, vid) => store.list.find(p => p.id === pid)?.linkedVendors.includes(vid) ?? false,
        bookEquipment: store.bookEquipment,
        releaseEquipment: store.releaseEquipment,
        isEquipmentBooked: (pid, eid) => store.list.find(p => p.id === pid)?.bookedEquipment.includes(eid) ?? false,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
