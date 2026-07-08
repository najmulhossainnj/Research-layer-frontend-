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
import { API_BASE_URL } from './config';

export const api = axios.create({
  baseURL: API_BASE_URL,
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

export const demoteStrategy = async (id: string): Promise<any> => {
  const res = await api.post(`/strategies/${id}/demote`);
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

export const getFeature = async (id: string): Promise<Feature> => {
  const res = await api.get<Feature>(`/features/${id}`);
  return res.data;
};

export const createFeature = async (body: Partial<Feature>): Promise<Feature> => {
  const res = await api.post<Feature>('/features', body);
  return res.data;
};

export const updateFeature = async (id: string, body: Partial<Feature>): Promise<Feature> => {
  const res = await api.patch<Feature>(`/features/${id}`, body);
  return res.data;
};

export const deleteFeature = async (id: string): Promise<any> => {
  const res = await api.delete(`/features/${id}`);
  return res.data;
};

export interface FeatureGenerateRequestBody {
  symbol: string;
  timeframe?: string;
  start_date: string;
  end_date: string;
}

export const generateFeatureAsync = async (id: string, body: FeatureGenerateRequestBody): Promise<any> => {
  const res = await api.post(`/features/${id}/generate`, body);
  return res.data;
};

export const regenerateFeature = async (id: string, body: FeatureGenerateRequestBody): Promise<any> => {
  const res = await api.post(`/features/${id}/regenerate`, body);
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

export const getModel = async (id: string): Promise<Model> => {
  const res = await api.get<Model>(`/models/${id}`);
  return res.data;
};

export const createModel = async (body: Partial<Model>): Promise<Model> => {
  const res = await api.post<Model>('/models', body);
  return res.data;
};

export const updateModel = async (id: string, body: Partial<Model>): Promise<Model> => {
  const res = await api.patch<Model>(`/models/${id}`, body);
  return res.data;
};

export const deleteModel = async (id: string): Promise<any> => {
  const res = await api.delete(`/models/${id}`);
  return res.data;
};

export const trainModel = async (id: string, body?: any): Promise<any> => {
  const res = await api.post(`/models/${id}/train`, body);
  return res.data;
};

export const trainModelAsync = async (id: string, body?: any): Promise<any> => {
  const res = await api.post(`/models/${id}/train/async`, body);
  return res.data;
};

export const tuneModel = async (id: string, body?: any): Promise<any> => {
  const res = await api.post(`/models/tune`, { model_id: id, ...body });
  return res.data;
};

export const tuneModelAsync = async (id: string, body?: any): Promise<any> => {
  const res = await api.post(`/models/tune/async`, { model_id: id, ...body });
  return res.data;
};

export const runAutoML = async (body?: any): Promise<any> => {
  const res = await api.post('/models/automl', body);
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

export const getAvailablePlugins = async (domain: 'features' | 'models' | 'signals'): Promise<{ plugins: string[] }> => {
  let endpoint = `/plugins/${domain}`;
  if (domain === 'features') {
    endpoint = '/features/plugins/available';
  } else if (domain === 'models') {
    endpoint = '/models/plugins/available';
  } else if (domain === 'signals') {
    endpoint = '/signals/plugins/available';
  }
  const res = await api.get<any>(endpoint);
  // Handle various response formats the backend might return
  const data = res.data;
  if (Array.isArray(data)) {
    return { plugins: data };
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.plugins)) {
      return data;
    } else if (Array.isArray(data.items)) {
      return { plugins: data.items };
    } else if (Array.isArray(data.values)) {
      return { plugins: data.values };
    }
    // If it's an object with keys, return the keys as plugins
    return { plugins: Object.keys(data) };
  }
  return { plugins: [] };
};

export const getTaskStatus = async (taskId: string): Promise<TaskResponse> => {
  const res = await api.get<TaskResponse>(`/tasks/${taskId}`);
  return res.data;
};

// --- Tracking / MLflow ---
export interface TrackingRun {
  run_id: string;
  experiment_name: string;
  status: string;
  start_time: string;
  end_time?: string;
  metrics: Record<string, number>;
  params: Record<string, string>;
}

export const getTrackingRuns = async (params?: { experiment_id?: string; limit?: number }): Promise<TrackingRun[]> => {
  const res = await api.get('/tracking/runs', { params });
  return res.data;
};

export const getTrackingRun = async (runId: string): Promise<TrackingRun> => {
  const res = await api.get(`/tracking/runs/${runId}`);
  return res.data;
};

export const getTrackingRunMetrics = async (runId: string): Promise<Record<string, number>> => {
  const res = await api.get(`/tracking/runs/${runId}/metrics`);
  return res.data;
};

export const getTrackingRunParams = async (runId: string): Promise<Record<string, string>> => {
  const res = await api.get(`/tracking/runs/${runId}/params`);
  return res.data;
};

export const compareTrackingRuns = async (runIds: string[]): Promise<any> => {
  const res = await api.post('/tracking/runs/compare', { run_ids: runIds });
  return res.data;
};

export const getTrackingExperiments = async (): Promise<any[]> => {
  const res = await api.get('/tracking/experiments');
  return res.data;
};

// --- News Sentiment ---
export const scoreNews = async (body: { text: string }): Promise<any> => {
  const res = await api.post('/news/score', body);
  return res.data;
};

export const aggregateNewsSentiment = async (params: { symbol: string; start: string; end: string }): Promise<any> => {
  const res = await api.post('/news/aggregate', params);
  return res.data;
};

export const getNewsFeatures = async (params: { symbol: string; start: string; end: string }): Promise<any> => {
  const res = await api.get('/news/features', { params });
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

// Create a separate axios instance for long-running agent tasks (5 min timeout)
const researchApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000 // 5 minutes for agentic pipeline (feature discovery + training + backtesting + validation)
});

export const submitResearchQuery = async (body: ResearchQueryBody): Promise<any> => {
  const res = await researchApi.post('/agents/research', body);
  return res.data;
};

// SSE endpoint for streaming research
export const researchQueryStream = (body: ResearchQueryBody): EventSource => {
  const queryParams = new URLSearchParams({
    query: body.query,
    ...(body.symbols && { symbols: body.symbols.join(',') }),
    ...(body.timeframe && { timeframe: body.timeframe }),
    ...(body.start_date && { start_date: body.start_date }),
    ...(body.end_date && { end_date: body.end_date }),
    ...(body.strategy_id && { strategy_id: body.strategy_id }),
  });
  return new EventSource(`${API_BASE_URL}/agents/research/stream?${queryParams}`);
};

export interface AgentChatBody {
  query: string;
  session_id?: string | null;
  context_override?: Record<string, any>;
}

export const chatWithAgent = async (body: AgentChatBody): Promise<any> => {
  const res = await researchApi.post('/agents/chat', body);
  return res.data;
};

export const getSessionContext = async (sessionId: string): Promise<any> => {
  const res = await researchApi.get(`/agents/sessions/${sessionId}`);
  return res.data;
};

export const listAgentSessions = async (): Promise<{ sessions: string[]; total: number }> => {
  const res = await researchApi.get<{ sessions: string[]; total: number }>('/agents/sessions');
  return res.data;
};

// --- Celery Worker Status ---
export interface CeleryStatus {
  celery_configured: boolean;
  redis_reachable: boolean;
  broker_url: string | null;
  workers_available: string[];
  error: string | null;
}

export const getCeleryStatus = async (): Promise<CeleryStatus> => {
  const res = await api.get<CeleryStatus>('/backtests/debug/celery-status');
  return res.data;
};

// Mask sensitive parts of Redis URL for display
export const maskRedisUrl = (url: string | null): string => {
  if (!url) return 'Not configured';
  try {
    // Replace password with asterisks
    return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return url;
  }
};
