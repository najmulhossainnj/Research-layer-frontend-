import axios from 'axios';
import {
  Strategy,
  StrategyCreate,
  StrategyUpdate,
  Feature,
  Model,
  SignalLogic,
  BacktestRead,
  ExperimentRun,
  WalkForwardResult,
  CPCVResult,
  TaskResponse
} from '../types';

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://hedge-fund-backend-production-459a.up.railway.app/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // Standard 30 second timeout for real backend processing
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail ?? err.message;
    return Promise.reject({ message: detail, status: err.response?.status });
  }
);

// --- Strategies ---
export const getStrategies = async (): Promise<Strategy[]> => {
  const res = await api.get<Strategy[]>('/strategies');
  return res.data;
};

export const getStrategy = async (id: string): Promise<Strategy> => {
  const res = await api.get<Strategy>(`/strategies/${id}`);
  return res.data;
};

export const createStrategy = async (body: StrategyCreate): Promise<Strategy> => {
  const res = await api.post<Strategy>('/strategies', body);
  return res.data;
};

export const updateStrategy = async (id: string, body: StrategyUpdate): Promise<Strategy> => {
  const res = await api.patch<Strategy>(`/strategies/${id}`, body);
  return res.data;
};

export const deleteStrategy = async (id: string): Promise<any> => {
  const res = await api.delete(`/strategies/${id}`);
  return res.data;
};

export const promoteStrategy = async (id: string, confidence?: number): Promise<any> => {
  const res = await api.post(`/strategies/${id}/promote`, confidence ? { confidence } : {});
  return res.data;
};

export const getStrategyStatus = async (id: string): Promise<any> => {
  const res = await api.get(`/strategies/${id}/status`);
  return res.data;
};

// --- Features ---
export const getFeatures = async (): Promise<Feature[]> => {
  const res = await api.get<Feature[]>('/features');
  return res.data;
};

export const createFeature = async (body: Partial<Feature>): Promise<Feature> => {
  const res = await api.post<Feature>('/features', body);
  return res.data;
};

export const generateFeatureAsync = async (id: string): Promise<any> => {
  const res = await api.post(`/features/${id}/generate`);
  return res.data;
};

export const getFeatureVersions = async (id: string): Promise<any> => {
  const res = await api.get(`/features/${id}/versions`);
  return res.data;
};

// --- Models ---
export const getModels = async (): Promise<Model[]> => {
  const res = await api.get<Model[]>('/models');
  return res.data;
};

export const createModel = async (body: Partial<Model>): Promise<Model> => {
  const res = await api.post<Model>('/models', body);
  return res.data;
};

export const trainModelAsync = async (id: string, body?: any): Promise<any> => {
  const res = await api.post(`/models/${id}/train/async`, body);
  return res.data;
};

// --- Signals ---
export const getSignals = async (): Promise<SignalLogic[]> => {
  const res = await api.get<SignalLogic[]>('/signals');
  return res.data;
};

export const saveSignalLogic = async (body: Partial<SignalLogic>): Promise<SignalLogic> => {
  const res = await api.post<SignalLogic>('/signals', body);
  return res.data;
};

export const updateSignalLogic = async (id: string, body: Partial<SignalLogic>): Promise<SignalLogic> => {
  const res = await api.patch<SignalLogic>(`/signals/${id}`, body);
  return res.data;
};

export const validateRuleTree = async (tree: any[]): Promise<any> => {
  const res = await api.post('/signals/validate-rule-tree', { tree });
  return res.data;
};

export const generateSignalsPreview = async (): Promise<any> => {
  const res = await api.post('/signals/generate');
  return res.data;
};

// --- Backtests ---
export const getBacktests = async (): Promise<BacktestRead[]> => {
  const res = await api.get<BacktestRead[]>('/backtests');
  return res.data;
};

export const createBacktest = async (body: any): Promise<BacktestRead> => {
  const res = await api.post<BacktestRead>('/backtests', body);
  return res.data;
};

export const executeBacktest = async (id: string, body: any = { async_mode: false }): Promise<any> => {
  const res = await api.post(`/backtests/${id}/execute`, body);
  return res.data;
};

export const getBacktest = async (id: string): Promise<any> => {
  const res = await api.get<any>(`/backtests/${id}`);
  return res.data;
};

export const runBacktestAsync = async (config: any): Promise<any> => {
  const res = await api.post('/backtests', config);
  return res.data;
};

export const getBacktestEquityCurve = async (id: string): Promise<any> => {
  const res = await api.get(`/backtests/${id}/equity-curve`);
  return res.data;
};

export const getBacktestTrades = async (id: string): Promise<any> => {
  const res = await api.get(`/backtests/${id}/trades`);
  return res.data;
};

// --- Experiments ---
export const getExperiments = async (): Promise<ExperimentRun[]> => {
  const res = await api.get<ExperimentRun[]>('/experiments');
  return res.data;
};

export const compareExperiments = async (ids: string[]): Promise<any> => {
  const res = await api.post('/experiments/compare', { ids });
  return res.data;
};

// --- Validation ---
export const getValidationResults = async (strategyId: string): Promise<any> => {
  const res = await api.get(`/validation/strategies/${strategyId}`);
  return res.data;
};

export const triggerValidationAsync = async (strategyId: string): Promise<any> => {
  const res = await api.post('/validation/walk-forward/async', { strategy_id: strategyId });
  return res.data;
};

export const runWalkForwardAsync = async (config: any): Promise<any> => {
  const res = await api.post('/validation/walk-forward/async', config);
  return res.data;
};

export const runCPCVAsync = async (config: any): Promise<any> => {
  const res = await api.post('/validation/cpcv/async', config);
  return res.data;
};

// --- Plugins & Tasks ---
export const getModelSearchSpaces = async (): Promise<any> => {
  const res = await api.get('/models/plugins/search-spaces');
  return res.data;
};

export const getAvailablePlugins = async (domain: 'features' | 'models' | 'signals'): Promise<any> => {
  let endpoint = `/plugins/${domain}`;
  if (domain === 'features') {
    endpoint = '/features/plugins/available';
  } else if (domain === 'models') {
    endpoint = '/models/plugins/available';
  } else if (domain === 'signals') {
    endpoint = '/signals/plugins/available';
  }
  const res = await api.get(endpoint);
  return res.data;
};

export const getTaskStatus = async (taskId: string): Promise<TaskResponse> => {
  const res = await api.get<TaskResponse>(`/tasks/${taskId}`);
  return res.data;
};

// --- Agents System ---
export interface ResearchQueryBody {
  query: string;
  symbols?: string[];
  timeframe?: string;
  start_date?: string | null;
  end_date?: string | null;
  strategy_id?: string | null;
}

export const submitResearchQuery = async (body: ResearchQueryBody): Promise<any> => {
  const res = await api.post('/agents/research', body);
  return res.data;
};

export interface AgentChatBody {
  query: string;
  session_id: string | null;
  context_override?: Record<string, any>;
}

export const chatWithAgent = async (body: AgentChatBody): Promise<any> => {
  const res = await api.post('/agents/chat', body);
  return res.data;
};

export const getSessionContext = async (sessionId: string): Promise<any> => {
  const res = await api.get(`/agents/sessions/${sessionId}`);
  return res.data;
};

export const listAgentSessions = async (): Promise<{ sessions: string[]; total: number }> => {
  const res = await api.get<{ sessions: string[]; total: number }>('/agents/sessions');
  return res.data;
};
