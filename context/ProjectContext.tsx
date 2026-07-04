'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  vertical: string;
  zip: string;
  radius: number;
  volume: number;
  trafficFactor: number;
  crewFactor: number;
  linkedVendors: string[];
  bookedEquipment: string[];
  contractRevenue: number;
  laborCost: number;
  contingency: number;
  extractedSpec: string;
  draftProposal: string;
  createdAt: string;
}

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
  clearToast: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = 'hhr_projects_db';

function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveProjects(projects: Project[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    setActiveProjectId(loaded.length > 0 ? loaded[0].id : null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProjects(projects);
  }, [projects, hydrated]);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

  const clearToast = useCallback(() => setToast(null), []);

  const createProject = useCallback((data: Partial<Project>): Project => {
    const project: Project = {
      id: `p-${Date.now()}`,
      name: data.name || 'Untitled Project',
      vertical: data.vertical || 'slurry_processing',
      zip: data.zip || '94538',
      radius: data.radius || 25,
      volume: data.volume || 10000,
      trafficFactor: data.trafficFactor ?? 1.0,
      crewFactor: data.crewFactor ?? 1.0,
      linkedVendors: [],
      bookedEquipment: [],
      contractRevenue: data.contractRevenue || 12000,
      laborCost: data.laborCost || 1500,
      contingency: data.contingency ?? 10,
      extractedSpec: data.extractedSpec || '',
      draftProposal: data.draftProposal || '',
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, project]);
    setActiveProjectId(project.id);
    setToast('Project workspace created');
    return project;
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    setToast('Project state saved');
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      if (activeProjectId === id) {
        setActiveProjectId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
    setToast('Project deleted');
  }, [activeProjectId]);

  const setActiveProject = useCallback((id: string | null) => {
    setActiveProjectId(id);
  }, []);

  const linkVendor = useCallback((projectId: string, vendorId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      if (p.linkedVendors.includes(vendorId)) return p;
      return { ...p, linkedVendors: [...p.linkedVendors, vendorId] };
    }));
  }, []);

  const unlinkVendor = useCallback((projectId: string, vendorId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, linkedVendors: p.linkedVendors.filter(v => v !== vendorId) };
    }));
  }, []);

  const isVendorLinked = useCallback((projectId: string, vendorId: string) => {
    const p = projects.find(pr => pr.id === projectId);
    return p?.linkedVendors.includes(vendorId) ?? false;
  }, [projects]);

  const bookEquipment = useCallback((projectId: string, equipId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      if (p.bookedEquipment.includes(equipId)) return p;
      return { ...p, bookedEquipment: [...p.bookedEquipment, equipId] };
    }));
  }, []);

  const releaseEquipment = useCallback((projectId: string, equipId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, bookedEquipment: p.bookedEquipment.filter(e => e !== equipId) };
    }));
  }, []);

  const isEquipmentBooked = useCallback((projectId: string, equipId: string) => {
    const p = projects.find(pr => pr.id === projectId);
    return p?.bookedEquipment.includes(equipId) ?? false;
  }, [projects]);

  return (
    <ProjectContext.Provider value={{
      projects, activeProjectId, activeProject,
      setActiveProject, createProject, updateProject, deleteProject,
      linkVendor, unlinkVendor, isVendorLinked,
      bookEquipment, releaseEquipment, isEquipmentBooked,
      toast, clearToast,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
