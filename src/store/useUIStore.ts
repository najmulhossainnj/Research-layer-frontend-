import { create } from 'zustand';

export interface ActiveTask {
  id: string;
  label: string;
  status: 'PENDING' | 'STARTED' | 'RUNNING' | 'SUCCESS' | 'FAILURE';
  progress?: number;
  resultUrl?: string;
  domain?: string;
  taskType?: 'backtest' | 'feature' | 'model' | 'validation';
  createdAt?: string;
}

export interface CeleryWorkerStatus {
  online: boolean;
  workers: string[];
  redisConnected: boolean;
  lastChecked: string | null;
  brokerUrl: string | null;
  error?: string;
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
  celeryStatus: CeleryWorkerStatus;
  setWorkspace: (tab: WorkspaceTab) => void;
  toggleSidebar: () => void;
  selectStrategy: (id: string | null) => void;
  addTask: (task: ActiveTask) => void;
  updateTask: (id: string, updates: Partial<ActiveTask>) => void;
  removeTask: (id: string) => void;
  setCeleryStatus: (status: CeleryWorkerStatus) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeWorkspace: 'explorer',
  sidebarCollapsed: false,
  selectedStrategyId: 'strat_101',
  pendingTasks: [],
  celeryStatus: {
    online: false,
    workers: [],
    redisConnected: false,
    lastChecked: null,
    brokerUrl: null,
  },
  setWorkspace: (tab) => set({ activeWorkspace: tab }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  selectStrategy: (id) => set({ selectedStrategyId: id }),
  addTask: (task) => set((state) => ({ pendingTasks: [...state.pendingTasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      pendingTasks: state.pendingTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })),
  removeTask: (id) =>
    set((state) => ({ pendingTasks: state.pendingTasks.filter((t) => t.id !== id) })),
  setCeleryStatus: (status) => set({ celeryStatus: status })
}));
