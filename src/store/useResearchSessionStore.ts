import { create } from 'zustand';

interface ResearchSessionState {
  sessionId: string | null;
  strategyId: string | null;
  featureIds: string[];
  modelId: string | null;
  backtestIds: string[];
  bestModelPlugin: string | null;
  governanceFlags: string[];
  validationPassed: boolean;
  convictionScore: number;
  setSession: (sessionId: string) => void;
  clearSession: () => void;
  mergeContext: (context: Partial<ResearchSessionState>) => void;
}

export const useResearchSessionStore = create<ResearchSessionState>((set) => ({
  sessionId: null,
  strategyId: 'strat_101',
  featureIds: ['f_1', 'f_3'],
  modelId: 'mod_1',
  backtestIds: ['bt_901'],
  bestModelPlugin: 'lightgbm_quant',
  governanceFlags: ['UNIVERSE_CONCENTRATION_WARNING'],
  validationPassed: true,
  convictionScore: 0.842,
  setSession: (id) => set({ sessionId: id }),
  clearSession: () =>
    set({
      sessionId: null,
      strategyId: null,
      featureIds: [],
      modelId: null,
      backtestIds: [],
      bestModelPlugin: null,
      governanceFlags: [],
      validationPassed: false,
      convictionScore: 0.5
    }),
  mergeContext: (ctx) => set((state) => ({ ...state, ...ctx }))
}));
