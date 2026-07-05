import { createStore, useStore } from './index';

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

interface ProjectsState {
  list: Project[];
  activeId: string | null;
}

function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('hhr_projects_db');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProjects(projects: Project[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('hhr_projects_db', JSON.stringify(projects)); } catch {}
}

export const projectsStore = createStore<ProjectsState>({
  list: loadProjects(),
  activeId: null,
});

let hydrated = false;
const origSetState = projectsStore.setState.bind(projectsStore);
projectsStore.setState = (partial) => {
  origSetState(partial);
  const state = projectsStore.getState();
  if (hydrated) saveProjects(state.list);
};

hydrated = true;

export function useProjectsStore() {
  const state = useStore(projectsStore, s => s);
  const active = state.list.find(p => p.id === state.activeId) ?? null;
  return {
    list: state.list,
    activeId: state.activeId,
    active,
    setActive: (id: string | null) => projectsStore.setState({ activeId: id }),
    create: (data: Partial<Project>): Project => {
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
      const { list } = projectsStore.getState();
      projectsStore.setState({ list: [...list, project], activeId: project.id });
      return project;
    },
    update: (id: string, data: Partial<Project>) => {
      const { list } = projectsStore.getState();
      projectsStore.setState({ list: list.map(p => p.id === id ? { ...p, ...data } : p) });
    },
    delete: (id: string) => {
      const { list, activeId } = projectsStore.getState();
      const next = list.filter(p => p.id !== id);
      projectsStore.setState({
        list: next,
        activeId: activeId === id ? (next.length > 0 ? next[0].id : null) : activeId,
      });
    },
    linkVendor: (projectId: string, vendorId: string) => {
      const { list } = projectsStore.getState();
      projectsStore.setState({
        list: list.map(p =>
          p.id === projectId && !p.linkedVendors.includes(vendorId)
            ? { ...p, linkedVendors: [...p.linkedVendors, vendorId] }
            : p
        ),
      });
    },
    unlinkVendor: (projectId: string, vendorId: string) => {
      const { list } = projectsStore.getState();
      projectsStore.setState({
        list: list.map(p =>
          p.id === projectId
            ? { ...p, linkedVendors: p.linkedVendors.filter(v => v !== vendorId) }
            : p
        ),
      });
    },
    bookEquipment: (projectId: string, equipId: string) => {
      const { list } = projectsStore.getState();
      projectsStore.setState({
        list: list.map(p =>
          p.id === projectId && !p.bookedEquipment.includes(equipId)
            ? { ...p, bookedEquipment: [...p.bookedEquipment, equipId] }
            : p
        ),
      });
    },
    releaseEquipment: (projectId: string, equipId: string) => {
      const { list } = projectsStore.getState();
      projectsStore.setState({
        list: list.map(p =>
          p.id === projectId
            ? { ...p, bookedEquipment: p.bookedEquipment.filter(e => e !== equipId) }
            : p
        ),
      });
    },
  };
}
