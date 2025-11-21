import { create } from 'zustand';

interface UIStore {
  // State
  sidebarCollapsed: boolean;
  selectedFile: string | null;
  selectedNode: string | null;
  graphLayout: 'dagre' | 'force' | 'circular';
  theme: 'light' | 'dark';

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedFile: (path: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  setGraphLayout: (layout: 'dagre' | 'force' | 'circular') => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  selectedFile: null,
  selectedNode: null,
  graphLayout: 'dagre',
  theme: 'light',

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setSelectedFile: (path) =>
    set({ selectedFile: path }),

  setSelectedNode: (id) =>
    set({ selectedNode: id }),

  setGraphLayout: (layout) =>
    set({ graphLayout: layout }),

  setTheme: (theme) =>
    set({ theme }),
}));
