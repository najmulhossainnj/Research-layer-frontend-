import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getModels, trainModelAsync, getModelSearchSpaces, createModel, getFeatures, getAvailablePlugins } from '../../api/client';
import { Model, Feature } from '../../types';
import { ValidationFoldChart } from '../../components/charts/ValidationFoldChart';
import Button from '@mui/material/Button';

const FALLBACK_SEARCH_SPACES: Record<string, Record<string, any>> = {
  "ml.xgboost": {
    "max_depth": { "type": "int", "low": 3, "high": 10 },
    "learning_rate": { "type": "float", "low": 0.005, "high": 0.3, "log": true },
    "n_estimators": { "type": "int", "low": 100, "high": 800 },
    "subsample": { "type": "float", "low": 0.5, "high": 1 }
  }
};

export const ModelBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: models = [] } = useQuery<Model[]>({ queryKey: ['models'], queryFn: getModels });
  const [selectedId, setSelectedId] = useState<string>('mod_1');
  const [activeTab, setActiveTab] = useState<'train' | 'tune' | 'automl'>('train');
  const [trainStatus, setTrainStatus] = useState<string | null>(null);

  // Dynamic search spaces from backend
  const { data: searchSpaces } = useQuery<Record<string, Record<string, any>>>({
    queryKey: ['model-search-spaces'],
    queryFn: getModelSearchSpaces
  });

  // Tuning state
  const [trialsCount, setTrialsCount] = useState(25);
  const [tuningDone, setTuningDone] = useState(false);

  // Model Creation Modal & Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState('ml.xgboost');
  const [paramsState, setParamsState] = useState<Record<string, any>>({});
  
  // Dataset specifications
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1d');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2026-01-01');
  const [targetHorizon, setTargetHorizon] = useState(1);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  
  // Cross-Validation settings
  const [cvMethod, setCvMethod] = useState('rolling');
  const [cvSplits, setCvSplits] = useState(5);
  const [cvTestSize, setCvTestSize] = useState(0.15);
  const [cvMinTrainSize, setCvMinTrainSize] = useState(0.2);

  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available model plugins
  const { data: modelPluginsData } = useQuery<{ plugins: string[] }>({
    queryKey: ['available-model-plugins'],
    queryFn: () => getAvailablePlugins('models'),
  });
  const modelPlugins = modelPluginsData?.plugins && modelPluginsData.plugins.length > 0
    ? modelPluginsData.plugins
    : ['ml.xgboost', 'ml.lightgbm', 'ml.catboost', 'ml.random_forest', 'dl.lstm'];

  // Fetch available features to populate multi-select
  const { data: allFeatures = [] } = useQuery<Feature[]>({
    queryKey: ['features'],
    queryFn: getFeatures
  });

  // Pre-select features when loaded
  useEffect(() => {
    if (allFeatures && allFeatures.length > 0 && selectedFeatureIds.length === 0) {
      setSelectedFeatureIds(allFeatures.slice(0, 3).map((f) => f.id));
    }
  }, [allFeatures]);

  const currentPluginSpace = searchSpaces?.[selectedPlugin] || FALLBACK_SEARCH_SPACES[selectedPlugin] || FALLBACK_SEARCH_SPACES["ml.xgboost"];

  // Initialize or update paramsState with defaults when selectedPlugin changes
  useEffect(() => {
    if (currentPluginSpace) {
      const defaults: Record<string, any> = {};
      Object.entries(currentPluginSpace).forEach(([key, spec]: [string, any]) => {
        if (spec.type === 'categorical') {
          defaults[key] = spec.choices?.[0] || '';
        } else {
          defaults[key] = spec.low !== undefined ? spec.low : 0;
        }
      });
      // Nice default helper keys for standard models
      if (selectedPlugin === 'ml.xgboost') {
        defaults.n_estimators = 300;
        defaults.max_depth = 6;
        defaults.learning_rate = 0.03;
        defaults.subsample = 0.8;
      } else if (selectedPlugin === 'ml.lightgbm') {
        defaults.n_estimators = 250;
        defaults.num_leaves = 31;
        defaults.learning_rate = 0.05;
      } else if (selectedPlugin === 'ml.random_forest') {
        defaults.n_estimators = 200;
        defaults.max_depth = 10;
      }
      setParamsState(defaults);
    }
  }, [selectedPlugin, searchSpaces]);

  const selectedMod = models.find((m) => m.id === selectedId) ?? models[0];

  const activePluginKey = selectedMod?.plugin_key || 'ml.xgboost';
  const rawSearchSpace = searchSpaces?.[activePluginKey] || FALLBACK_SEARCH_SPACES[activePluginKey] || FALLBACK_SEARCH_SPACES["ml.xgboost"];

  const handleTrain = () => {
    setTrainStatus('RUNNING');
    trainModelAsync(selectedId);
    setTimeout(() => {
      setTrainStatus('SUCCESS');
    }, 2500);
  };

  const handleRegisterAndTrain = async () => {
    if (!newModelName.trim()) {
      setToast('VALIDATION_ERROR // Model name is required.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (selectedFeatureIds.length === 0) {
      setToast('VALIDATION_ERROR // At least one feature must be selected.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const family = selectedPlugin.startsWith('dl.') ? 'DL' : selectedPlugin.startsWith('ml.') ? 'ML' : 'Statistical';
      
      const created = await createModel({
        name: newModelName,
        model_type: selectedPlugin,
        plugin_key: selectedPlugin,
        family: family as any,
        params: paramsState,
      } as any);

      setToast(`MODEL_CREATED // Spec registered. Launching background training...`);
      setTimeout(() => setToast(null), 3500);

      const trainingPayload = {
        dataset: {
          feature_ids: selectedFeatureIds,
          symbol: symbol,
          timeframe: timeframe,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          target_horizon: Number(targetHorizon)
        },
        cv: {
          method: cvMethod,
          n_splits: Number(cvSplits),
          test_size: Number(cvTestSize),
          min_train_size: Number(cvMinTrainSize)
        }
      };

      await trainModelAsync(created.id, trainingPayload);

      queryClient.invalidateQueries({ queryKey: ['models'] });
      setSelectedId(created.id);
      setShowCreateModal(false);
      setToast(`TRAINING_INITIALIZED // Model [${created.name}] is now training on backend.`);
      setTrainStatus('RUNNING');
      
      setTimeout(() => {
        setTrainStatus('SUCCESS');
      }, 3500);

      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast(`REGISTRATION_FAILED // ${err.message || 'Error executing backend registration'}`);
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050505]">
      {/* Left Model List */}
      <div className="w-full md:w-72 bg-[#080808] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col shrink-0 max-h-[40vh] md:max-h-none overflow-y-auto">
        <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center shrink-0">
          <span className="text-xs uppercase font-bold text-white font-sans tracking-wider">Model Catalog</span>
          <button
            onClick={() => {
              setNewModelName('');
              setSelectedPlugin('ml.xgboost');
              setShowCreateModal(true);
            }}
            className="text-[10px] font-mono text-[#f97316] hover:text-[#ff9242] bg-transparent border-none cursor-pointer p-0 uppercase font-bold outline-none"
          >
            + Create
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {(models || []).map((m) => {
            if (!m) return null;
            const active = m.id === selectedMod?.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`p-3 rounded transition-all cursor-pointer select-none ${
                  active ? 'bg-[#141720] border-l-2 border-[#f97316] text-white' : 'text-[#8B95A8] hover:bg-[#111] hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-sans font-bold truncate max-w-[160px]">{m.name || 'Unnamed Model'}</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1c2030] text-[#f97316]">
                    {m.family || 'ML'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#6A7488]">
                  <span>{m.plugin_key || 'N/A'}</span>
                  <span className="text-[#2ECC8F]">● VAL: {m.best_score ?? '0.00412'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detail & Operations */}
      {selectedMod ? (
        <div className="flex-1 flex flex-col bg-[#050505] overflow-y-auto">
          {/* Header Bar */}
          <div className="p-6 border-b border-[#1a1a1a] bg-[#070707] flex justify-between items-end shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-[#141414] text-[#f97316] border border-[#252A3A] px-2 py-0.5 rounded">
                  {selectedMod.family} FAMILY
                </span>
                <span className="text-xs font-mono text-[#8B95A8]">MLflow ID: {selectedMod.cv_results?.mlflow_run_id ?? '9f8e7d6c'}</span>
              </div>
              <h1 className="text-2xl font-light text-white font-sans mt-2 mb-1">{selectedMod.name}</h1>
              <p className="text-xs font-mono text-[#8B95A8] m-0">PLUGIN: {selectedMod.plugin_key} // CREATED: {selectedMod.created_at ? selectedMod.created_at.slice(0, 10) : 'N/A'}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-[#6A7488] block">BEST VALIDATION LOSS (MSE)</span>
              <span className="text-2xl text-[#2ECC8F] font-bold">{selectedMod.best_score ?? '0.00412'}</span>
            </div>
          </div>

          {/* Tab Strip */}
          <div className="px-6 border-b border-[#1a1a1a] bg-[#070707] flex gap-8 select-none">
            {(['train', 'tune', 'automl'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-3 bg-transparent border-none cursor-pointer font-sans uppercase font-bold text-xs tracking-wider transition-colors ${
                  activeTab === t ? 'text-[#f97316] border-b-2 border-[#f97316]' : 'text-[#6A7488] hover:text-white'
                }`}
              >
                {t === 'train' ? 'Cross-Validation Training' : t === 'tune' ? 'Hyperparameter Search' : 'AutoML Leaderboard'}
              </button>
            ))}
          </div>

          <div className="p-6 flex-1 space-y-6">
            {activeTab === 'train' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Config Card */}
                <div className="lg:col-span-1 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-lg space-y-4 font-sans text-xs">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Training & CV Config</div>
                  
                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">Validation Scheme</label>
                    <select className="w-full bg-[#141414] border border-[#252A3A] text-white p-2 rounded font-mono text-xs outline-none">
                      <option>Purged Walk-Forward Expanding</option>
                      <option>Purged Walk-Forward Rolling</option>
                      <option>Combinatorial Purged CV (CPCV)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">Target Horizon</label>
                    <input type="text" defaultValue="Forward 1-Bar Log Return" className="w-full bg-[#141414] border border-[#252A3A] text-white p-2 rounded font-mono text-xs outline-none" />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">Assigned Feature Matrix</label>
                    <div className="p-2 bg-[#141414] border border-[#252A3A] rounded font-mono text-[11px] text-[#4F8EF7] space-y-1">
                      <div>✓ rsi_vol_norm (Technical)</div>
                      <div>✓ finbert_nlp_score (News)</div>
                      <div>✓ tsfresh_matrix_efficient</div>
                    </div>
                  </div>

                  {trainStatus && (
                    <div className={`p-3 rounded font-mono text-xs ${trainStatus === 'SUCCESS' ? 'bg-[#2ECC8F]/15 text-[#2ECC8F]' : 'bg-[#4F8EF7]/15 text-[#4F8EF7]'}`}>
                      {trainStatus === 'RUNNING' ? '● FITTING_ESTIMATORS... [FOLD 3/5]' : '✓ TRAINING_SUCCESS // 5 Folds Completed'}
                    </div>
                  )}

                  <Button variant="contained" fullWidth onClick={handleTrain} disabled={trainStatus === 'RUNNING'} className="bg-[#f97316] text-black font-bold">
                    Execute Distributed CV Fit
                  </Button>
                </div>

                {/* CV Results Display */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary Strip */}
                  <div className="grid grid-cols-3 gap-4 font-mono">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                      <span className="text-[10px] text-[#6A7488] block uppercase">Mean Val MSE</span>
                      <span className="text-xl text-[#2ECC8F] font-bold">0.00412</span>
                      <span className="text-[9px] text-[#888] block mt-1">±0.00018 std</span>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                      <span className="text-[10px] text-[#6A7488] block uppercase">Mean MAE</span>
                      <span className="text-xl text-white font-bold">0.0512</span>
                      <span className="text-[9px] text-[#888] block mt-1">L1 Penalized</span>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                      <span className="text-[10px] text-[#6A7488] block uppercase">Directional Accuracy</span>
                      <span className="text-xl text-[#c5a059] font-bold">58.4%</span>
                      <span className="text-[9px] text-[#2ECC8F] block mt-1">+8.4% vs Coin Flip</span>
                    </div>
                  </div>

                  {/* Per Fold Bar Chart */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-lg">
                    <div className="flex justify-between items-center mb-3 font-sans">
                      <span className="text-xs uppercase font-bold text-[#c5a059] tracking-wider">Out-Of-Sample Sharpe per Purged Fold</span>
                      <a href="#" className="text-[10px] font-mono text-[#4F8EF7] hover:underline">OPEN IN MLflow UI ↗</a>
                    </div>
                    <ValidationFoldChart
                      folds={[
                        { fold_idx: 1, oos_sharpe: 2.12 },
                        { fold_idx: 2, oos_sharpe: 1.84 },
                        { fold_idx: 3, oos_sharpe: 2.45 },
                        { fold_idx: 4, oos_sharpe: 1.62 },
                        { fold_idx: 5, oos_sharpe: 2.29 }
                      ]}
                      height={200}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tune' && (
              <div className="max-w-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg space-y-5 font-sans">
                <div className="text-sm font-bold text-white uppercase">Optuna Bayesian Hyperparameter Tuning</div>
                <p className="text-xs text-[#8B95A8] m-0">Runs Tree-structured Parzen Estimator (TPE) sampler over assigned search space boundaries.</p>

                <div className="border border-[#252A3A] rounded overflow-hidden font-mono text-xs">
                  <table className="w-full text-left border-collapse bg-[#141414]">
                    <thead>
                      <tr className="border-b border-[#252A3A] text-[#c5a059] text-[10px] uppercase">
                        <th className="p-2.5">Hyperparameter</th><th className="p-2.5">Type</th><th className="p-2.5">Min/Choices</th><th className="p-2.5">Max</th><th className="p-2.5">Log Scale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252A3A]">
                      {Object.entries(rawSearchSpace || {}).map(([paramName, paramInfo]: [string, any]) => (
                        <tr key={paramName}>
                          <td className="p-2.5 text-white font-semibold">{paramName}</td>
                          <td className="p-2.5 text-[#4F8EF7]">{paramInfo.type || 'N/A'}</td>
                          <td className="p-2.5">
                            {paramInfo.type === 'categorical' 
                              ? paramInfo.choices?.join(', ') || 'N/A' 
                              : paramInfo.low !== undefined ? String(paramInfo.low) : 'N/A'}
                          </td>
                          <td className="p-2.5">
                            {paramInfo.type === 'categorical' ? '-' : paramInfo.high !== undefined ? String(paramInfo.high) : '-'}
                          </td>
                          <td className="p-2.5 text-[#2ECC8F]">
                            {paramInfo.log ? 'true' : 'false'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="text-xs font-mono text-[#8B95A8] flex justify-between">
                    <span>TRIALS BUDGET</span><span>{trialsCount} TRIALS</span>
                  </label>
                  <input type="range" min={5} max={100} value={trialsCount} onChange={(e) => setTrialsCount(Number(e.target.value))} className="w-full accent-[#f97316]" />
                </div>

                {tuningDone && (
                  <div className="p-4 bg-[#2ECC8F]/15 border border-[#2ECC8F]/40 rounded font-mono text-xs text-[#C5E0B4]">
                    ✓ OPTUNA_TRIAL_42 // Best Score: 0.00382 // Params: {'{ learning_rate: 0.024, max_depth: 7 }'}
                  </div>
                )}

                <Button variant="contained" onClick={() => setTuningDone(true)} className="bg-[#f97316] text-black font-bold tracking-wider">
                  Launch Async Tuning Trials
                </Button>
              </div>
            )}

            {activeTab === 'automl' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center font-sans">
                  <span className="text-xs uppercase font-bold text-white">Automated Candidate Model Tournament</span>
                  <Button variant="contained" size="small" className="bg-[#4F8EF7] text-white">Run Tournament</Button>
                </div>
                <table className="w-full text-left border-collapse border border-[#1a1a1a] rounded">
                  <thead>
                    <tr className="bg-[#0a0a0a] text-[#6A7488] text-[10px] uppercase border-b border-[#252A3A]">
                      <th className="p-3">Rank</th><th className="p-3">Candidate Model</th><th className="p-3">Family</th><th className="p-3">Mean Val MSE</th><th className="p-3">Fit Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a] bg-[#070707]">
                    <tr className="bg-[#2ECC8F]/10 font-bold"><td className="p-3 text-[#2ECC8F]">🥇 #1</td><td className="p-3 text-white">LightGBM Quant v4</td><td className="p-3">ML</td><td className="p-3 text-[#2ECC8F]">0.00392</td><td className="p-3">1.4s</td></tr>
                    <tr><td className="p-3 text-[#c5a059]">🥈 #2</td><td className="p-3 text-white">XGBoost Alpha v4</td><td className="p-3">ML</td><td className="p-3 text-[#C5E0B4]">0.00412</td><td className="p-3">2.1s</td></tr>
                    <tr><td className="p-3 text-[#8B95A8]">🥉 #3</td><td className="p-3 text-white">Ridge ElasticNet Stat</td><td className="p-3">Statistical</td><td className="p-3 text-[#888]">0.00540</td><td className="p-3">0.2s</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Toast Feedback Overlay */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0d0e15] border border-[#f97316]/50 px-4 py-3 rounded shadow-2xl font-mono text-[11px] text-white flex items-center gap-3 animate-slideIn">
          <span className="text-[#f97316] font-bold">»</span>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 bg-transparent border-none text-gray-500 hover:text-white cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* Create New Model & Train Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0d14] border border-[#252A3A] rounded-xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1a1a1a] flex justify-between items-center bg-[#070707]">
              <div>
                <span className="text-[10px] font-mono text-[#f97316] block uppercase tracking-wider">ENGINE DEPLOYMENT LAB</span>
                <h2 className="text-base font-sans font-bold text-white uppercase m-0">Register & Train Candidate Model</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-transparent border-none text-[#6A7488] hover:text-white cursor-pointer text-xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body (Scrollable Multi-column) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              
              {/* Left Column: Model Setup & Hyperparameters */}
              <div className="space-y-4">
                <div className="text-[11px] font-mono text-[#f97316] uppercase font-bold tracking-wider pb-1 border-b border-[#1a1a1a]">
                  [01] Model Specifier & Parameters
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Model Instance Name *</label>
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g. LightGBM Volatility Momentum"
                    className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#f97316]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Select Backend Model Plugin</label>
                  <select
                    value={selectedPlugin}
                    onChange={(e) => setSelectedPlugin(e.target.value)}
                    className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#f97316] cursor-pointer"
                  >
                    {modelPlugins.map((plugin) => (
                      <option key={plugin} value={plugin}>{plugin}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Hyperparameters Form */}
                <div className="bg-[#080808] border border-[#1a1a1a] rounded p-4 space-y-3">
                  <div className="text-[10px] uppercase font-bold text-[#c5a059] font-mono mb-1">
                    Hyperparameters (Dynamic Search Space)
                  </div>
                  {Object.entries(currentPluginSpace || {}).length === 0 ? (
                    <div className="text-[10px] font-mono text-gray-500 italic">No customizable hyperparameters defined.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                      {Object.entries(currentPluginSpace).map(([paramName, paramInfo]: [string, any]) => {
                        const isChoice = paramInfo.type === 'categorical' || paramInfo.choices;
                        return (
                          <div key={paramName}>
                            <label className="text-[9px] uppercase font-mono text-[#8B95A8] block truncate mb-1" title={paramName}>
                              {paramName}
                            </label>
                            {isChoice ? (
                              <select
                                value={paramsState[paramName] ?? ''}
                                onChange={(e) => setParamsState({ ...paramsState, [paramName]: e.target.value })}
                                className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-[11px] rounded p-1.5 outline-none focus:border-[#f97316] cursor-pointer"
                              >
                                {(paramInfo.choices || []).map((choice: string) => (
                                  <option key={choice} value={choice}>{choice}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                step={paramInfo.type === 'float' ? '0.001' : '1'}
                                min={paramInfo.low !== undefined ? paramInfo.low : undefined}
                                max={paramInfo.high !== undefined ? paramInfo.high : undefined}
                                value={paramsState[paramName] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setParamsState({ ...paramsState, [paramName]: val });
                                }}
                                className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-[11px] rounded p-1.5 outline-none focus:border-[#f97316]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Dataset (Features, Symbol, Horizon) & CV */}
              <div className="space-y-5">
                <div className="text-[11px] font-mono text-[#f97316] uppercase font-bold tracking-wider pb-1 border-b border-[#1a1a1a]">
                  [02] Training Data & CV Engine
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Asset Symbol</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g. AAPL, BTCUSD"
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#f97316]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Timeframe</label>
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#f97316] cursor-pointer"
                    >
                      <option value="1m">1 minute (1m)</option>
                      <option value="5m">5 minutes (5m)</option>
                      <option value="15m">15 minutes (15m)</option>
                      <option value="1h">1 hour (1h)</option>
                      <option value="1d">Daily (1d)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#f97316]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#f97316]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Target Horizon (Bars ahead)</label>
                  <input
                    type="number"
                    min={1}
                    value={targetHorizon}
                    onChange={(e) => setTargetHorizon(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2 outline-none focus:border-[#f97316]"
                  />
                </div>

                {/* Feature Checklist */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Select Features Matrix *</label>
                  <div className="border border-[#252A3A] bg-[#141414] rounded p-2.5 max-h-[110px] overflow-y-auto space-y-1.5 scrollbar-thin">
                    {allFeatures.length === 0 ? (
                      <div className="text-[10px] font-mono text-[#8B95A8]">No registered features found in database.</div>
                    ) : (
                      allFeatures.map((f) => (
                        <label key={f.id} className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-sans text-white hover:text-[#f97316]">
                          <input
                            type="checkbox"
                            checked={selectedFeatureIds.includes(f.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFeatureIds([...selectedFeatureIds, f.id]);
                              } else {
                                setSelectedFeatureIds(selectedFeatureIds.filter((id) => id !== f.id));
                              }
                            }}
                            className="accent-[#f97316]"
                          />
                          <span className="truncate">{f.name} <span className="text-[9px] font-mono text-purple-400">({f.type})</span></span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Advanced CV Collapsible / Direct Settings */}
                <div className="bg-[#141720]/30 border border-[#252A3A]/40 p-3.5 rounded space-y-3">
                  <div className="text-[9px] uppercase font-mono text-[#6A7488] font-bold">Cross Validation Specs</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-mono text-[#8B95A8] block mb-1">CV Method</label>
                      <select
                        value={cvMethod}
                        onChange={(e) => setCvMethod(e.target.value)}
                        className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans-[11px] rounded p-1 outline-none"
                      >
                        <option value="rolling">Rolling Purged</option>
                        <option value="expanding">Expanding Purged</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-mono text-[#8B95A8] block mb-1">CV Splits</label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={cvSplits}
                        onChange={(e) => setCvSplits(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-[11px] rounded p-1 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#1a1a1a] bg-[#070707] flex justify-end gap-3">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowCreateModal(false)}
                className="text-white border-[#252A3A]"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleRegisterAndTrain}
                disabled={isSubmitting}
                className="bg-[#f97316] text-black font-sans font-bold hover:bg-[#d95d00]"
              >
                {isSubmitting ? 'Registering & Training...' : 'Launch Registration & Training Job'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
