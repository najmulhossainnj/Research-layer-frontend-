import { create } from 'zustand';

export interface ActiveTask {
  id: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILURE';
  progress?: number;
  resultUrl?: string;
  domain?: string;
}

export type WorkspaceTab =
  | 'explorer'
  | 'strategy_builder'
  | 'feature_builder'
  | 'model_builder'
  | 'signal_builder'
  | 'backtest_lab'
  | 'experiment_tracker'
  | 'validation_center'
  | 'ai_researcher';

interface UIState {
  activeWorkspace: WorkspaceTab;
  sidebarCollapsed: boolean;
  selectedStrategyId: string | null;
  pendingTasks: ActiveTask[];
  setWorkspace: (tab: WorkspaceTab) => void;
  toggleSidebar: () => void;
  selectStrategy: (id: string | null) => void;
  addTask: (task: ActiveTask) => void;
  updateTask: (id: string, updates: Partial<ActiveTask>) => void;
  removeTask: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeWorkspace: 'explorer',
  sidebarCollapsed: false,
  selectedStrategyId: 'strat_101',
  pendingTasks: [
    { id: 'task_demo_1', label: 'Walk-Forward IS/OOS NVDA.O', status: 'RUNNING', progress: 65, domain: 'validation' },
    { id: 'task_demo_2', label: 'tsfresh Feature Gen MegaCaps', status: 'SUCCESS', progress: 100, domain: 'features' }
  ],
  setWorkspace: (tab) => set({ activeWorkspace: tab }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  selectStrategy: (id) => set({ selectedStrategyId: id }),
  addTask: (task) => set((state) => ({ pendingTasks: [...state.pendingTasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      pendingTasks: state.pendingTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })),
  removeTask: (id) =>
    set((state) => ({ pendingTasks: state.pendingTasks.filter((t) => t.id !== id) }))
}));
