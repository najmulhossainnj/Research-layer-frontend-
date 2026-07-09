export type StrategyStatus = 'draft' | 'backtested' | 'validated' | 'promoted' | 'archived';

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  universe: string[];
  timeframe: string;
  status: StrategyStatus;
  version?: number;
  last_updated?: string;
  created_at?: string;
  pipeline_config?: PipelineConfig;
  best_metrics?: StrategyMetrics;
  governance_flags?: GovernanceFlag[];
  feature_ids?: string[];
  model_id?: string;
  signal_logic_id?: string;
}

export interface StrategyCreate {
  name: string;
  description?: string;
  universe: string[];
  timeframe: string;
  feature_ids?: string[];
  model_id?: string;
  signal_logic_id?: string;
  pipeline_config?: PipelineConfig;
}

export interface StrategyUpdate {
  name?: string;
  description?: string;
  universe?: string[];
  timeframe?: string;
  status?: StrategyStatus;
  feature_ids?: string[];
  model_id?: string;
  signal_logic_id?: string;
  pipeline_config?: PipelineConfig;
}

export interface StrategyMetrics {
  sharpe_ratio: number;
  cagr: number;
  max_drawdown: number;
  win_rate: number;
  sortino_ratio: number;
  calmar_ratio: number;
  profit_factor: number;
  total_return: number;
}

export interface GovernanceFlag {
  id: string;
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
}

export interface PipelineNode {
  id: string;
  type: 'data_source' | 'feature' | 'feature_selector' | 'model' | 'signal_logic' | 'backtest';
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface PipelineConfig {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

// Features
export interface Feature {
  id: string;
  name: string;
  type?: string;  // Backend may return lowercase or uppercase
  description?: string;
  parameters?: Record<string, any>;  // Backend uses 'parameters'
  plugin_key: string;
  version?: string | number;
  storage_uri?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy compatibility
  params?: Record<string, any>;
  last_generated?: string;
  storage_size?: string;
}

// Feature creation request body (matches backend API)
export interface FeatureCreateRequest {
  name: string;
  type: string;
  description?: string;
  parameters?: Record<string, any>;
  plugin_key: string;
}

// Feature generation request body (matches backend API)
export interface FeatureGenerateRequest {
  symbol: string;
  timeframe?: string;
  start_date: string;
  end_date: string;
}

// Feature generation response (matches backend API)
export interface FeatureGenerateResponse {
  dataset: {
    id: string;
    feature_id: string;
    symbol: string;
    timeframe: string;
    start_date: string;
    end_date: string;
    version_hash: string;
    storage_uri: string;
    row_count?: number;
    columns?: string[];
    created_at: string;
  };
  preview?: Record<string, any>[];
}

export interface FeatureVersion {
  version_hash: string;
  symbol: string;
  timeframe: string;
  row_count: number;
  columns: string[];
  created_at: string;
  storage_uri?: string;
}

export interface PluginOption {
  key: string;
  name: string;
  category: string;
  description: string;
  param_schema: Record<string, ParamSpec>;
}

export interface ParamSpec {
  type: 'int' | 'float' | 'string' | 'boolean' | 'select' | 'categorical';
  default: any;
  min?: number;
  max?: number;
  log?: boolean;
  choices?: string[];
  description?: string;
}

// Models
export interface Model {
  id: string;
  name: string;
  model_type?: string;  // Backend returns 'model_type' instead of 'plugin_key'
  family?: string;  // Backend may return 'ml' or 'machine_learning'
  plugin_key?: string;  // Sometimes returned
  version?: string | number;
  parameters?: Record<string, any>;  // Backend uses 'parameters'
  params?: Record<string, any>;  // Legacy
  created_at?: string;
  updated_at?: string;
  best_score?: number;
  cv_results?: CVResultSummary;
  mlflow_run_id?: string;
  artifact_uri?: string;
  metrics?: Record<string, any>;
}

export interface CVResultSummary {
  mean_mse: number;
  mean_mae: number;
  directional_accuracy: number;
  n_folds: number;
  folds: { fold_idx: number; mse: number; mae: number; directional_accuracy: number }[];
  mlflow_run_id?: string;
}

// Signals
export interface SignalLogic {
  id: string;
  name: string;
  description?: string;
  output_mode: 'discrete' | 'numeric';
  position_mode: 'long_only' | 'long_short' | 'portfolio';
  strategy_id?: string;
  version: number;
  created_at: string;
  updated_at: string;
  rule_tree: RuleNode[];
}

export interface RuleNode {
  id: string;
  type: 'group' | 'condition';
  action?: 'BUY' | 'SELL' | 'HOLD';
  combinator?: 'AND' | 'OR';
  field?: string;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value?: number | string;
  children?: RuleNode[];
}

// Backtests
export interface BacktestRead {
  id: string;
  strategy_id: string;
  engine: 'vectorbt' | 'backtrader';
  status: 'pending' | 'running' | 'completed' | 'failed';
  capital: number;
  commission_bps: number;
  slippage_bps: number;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  created_at: string;
  metrics?: BacktestMetrics;
  task_id?: string;
}

export interface BacktestMetrics extends StrategyMetrics {
  var_95: number;
  cvar_95: number;
  var_99: number;
  cvar_99: number;
  annualised_vol: number;
  max_drawdown_duration_bars: number;
  total_trades: number;
  avg_win: number;
  avg_loss: number;
  expectancy: number;
  turnover: number;
}

export interface Trade {
  id: string;
  entry_date: string;
  exit_date: string;
  side: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  size: number;
  pnl: number;
  return_pct: number;
}

// Experiments
export interface ExperimentRun {
  id: string;
  created_at: string;
  run_type: 'training' | 'tuning' | 'backtest' | 'validation';
  strategy_id?: string;
  strategy_name?: string;
  feature_version: string;
  model_version: string;
  dataset_version: string;
  git_hash: string;
  key_metric: number;
  key_metric_name: string;
  mlflow_run_id: string;
  params: Record<string, any>;
  metrics: Record<string, number>;
}

// Validation
export interface WalkForwardResult {
  passed: boolean;
  n_folds: number;
  mean_oos_sharpe: number;
  std_oos_sharpe: number;
  min_oos_sharpe: number;
  mean_return: number;
  worst_drawdown: number;
  profitable_fold_ratio: number;
  overfitting_score: number; // <2 green, 2-3 yellow, >3 red
  stability: 'stable' | 'unstable';
  folds: {
    fold_idx: number;
    train_bars: [string, string];
    test_bars: [string, string];
    is_directional_accuracy: number;
    oos_sharpe: number;
    oos_return: number;
    oos_drawdown: number;
  }[];
  gate_results: {
    name: string;
    threshold: number;
    actual: number;
    passed: boolean;
  }[];
}

export type ValidationResult = WalkForwardResult;

export interface CPCVResult {
  passed: boolean;
  pbo: number; // Probability of Backtest Overfitting (0-1)
  deflated_sharpe: number;
  n_paths: number;
  paths: {
    path_id: number;
    folds: number[];
    oos_sharpe: number;
    oos_return: number;
    oos_drawdown: number;
    is_proxy: number;
  }[];
}

// Tasks
export interface TaskResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILURE';
  progress?: number;
  result?: any;
  error?: string;
}
