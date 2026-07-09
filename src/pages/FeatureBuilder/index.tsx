import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeatures, generateFeatureAsync, createFeature, getAvailablePlugins, regenerateFeature } from '../../api/client';
import { Feature } from '../../types';
import Button from '@mui/material/Button';
import { DataPreviewPanel } from '../../components/pipeline/DataPreviewPanel';

const FALLBACK_FEATURE_PLUGINS = [
  "technical.rsi",
  "technical.atr",
  "statistical.z_score",
  "statistical.volatility_regime",
  "statistical.momentum",
  "statistical.mean_reversion",
  "statistical.hurst_exponent",
  "news.sentiment_momentum",
  "news.sentiment_divergence",
  "news.finbert_sentiment",
  "automated.tsfresh"
];

export const FeatureBuilder: React.FC = () => {
  const { data: features = [] } = useQuery<Feature[]>({ queryKey: ['features'], queryFn: getFeatures });
  const [selectedId, setSelectedId] = useState<string>('f_1');
  const [activeTab, setActiveTab] = useState<'versions' | 'generate' | 'preview'>('versions');
  const [genTask, setGenTask] = useState<{ status: string; hash?: string; rows?: number; error?: string } | null>(null);

  // Available plugins from backend
  const { data: availablePluginsData } = useQuery<{ plugins: string[] }>({
    queryKey: ['available-feature-plugins'],
    queryFn: () => getAvailablePlugins('features'),
  });

  const availablePlugins = availablePluginsData?.plugins && availablePluginsData.plugins.length > 0
    ? availablePluginsData.plugins
    : FALLBACK_FEATURE_PLUGINS;

  // New feature form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(availablePlugins[0] || 'technical.rsi');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Technical' | 'Statistical' | 'Automated' | 'News' | 'Fundamental' | 'Macro'>('Technical');
  const [periodVal, setPeriodVal] = useState(14);

  // Feature generation parameters
  const [genSymbol, setGenSymbol] = useState('AAPL');
  const [genTimeframe, setGenTimeframe] = useState('1d');
  const [genStart, setGenStart] = useState('2024-01-01');
  const [genEnd, setGenEnd] = useState('2024-12-31');
  const [validationStatus, setValidationStatus] = useState<{ canGenerate: boolean; errorMsg?: string; warnMsg?: string }>({ canGenerate: true });

  // Sync selected plugin to auto-fill default name and type
  useEffect(() => {
    if (selectedPlugin) {
      const parts = selectedPlugin.split('.');
      const prefix = parts[0] || '';
      const suffix = parts[1] || '';

      // Set Type (Category)
      if (prefix === 'technical') setNewType('Technical');
      else if (prefix === 'statistical') setNewType('Statistical');
      else if (prefix === 'news') setNewType('News');
      else if (prefix === 'automated') setNewType('Automated');
      else setNewType('Technical');

      // Set default name formatted nicely
      const formattedName = suffix
        ? suffix.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : selectedPlugin;
      setNewName(formattedName);
    }
  }, [selectedPlugin]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (body: Partial<Feature>) => createFeature(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setSelectedId(data.id);
      setShowNewForm(false);
    },
    onError: (error: any) => {
      console.error('Failed to create feature:', error);
    }
  });

  const handleSaveFeature = () => {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName,
      type: newType,
      plugin_key: selectedPlugin,
      parameters: { period: periodVal }  // Use 'parameters' to match backend API
    });
  };

  const selectedFeat = features.find((f) => f.id === selectedId) ?? features[0];

  // Generate feature mutation
  const generateMutation = useMutation({
    mutationFn: ({ featureId, force = false }: { featureId: string; force?: boolean }) => {
      const requestBody = {
        symbol: genSymbol,
        timeframe: genTimeframe,
        start_date: genStart,
        end_date: genEnd
      };
      if (force) {
        return regenerateFeature(featureId, requestBody);
      }
      return generateFeatureAsync(featureId, requestBody);
    },
    onSuccess: (data) => {
      // Update with real response from backend
      setGenTask({
        status: 'SUCCESS',
        hash: data?.dataset?.version_hash || `v_${Math.random().toString(36).slice(2, 8)}`,
        rows: data?.dataset?.row_count || 0
      });
      // Refresh the feature list to get updated data
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
    onError: (error: any) => {
      setGenTask({
        status: 'ERROR',
        error: error?.message || 'Failed to generate feature'
      });
    }
  });

  const handleGenerate = () => {
    if (!selectedId || !validationStatus.canGenerate) return;
    setGenTask({ status: 'RUNNING' });
    generateMutation.mutate({ featureId: selectedId, force: false });
  };

  const handleForceRegenerate = () => {
    if (!selectedId) return;
    setGenTask({ status: 'RUNNING' });
    generateMutation.mutate({ featureId: selectedId, force: true });
  };

  const typesList = ['Technical', 'Statistical', 'Automated', 'News', 'Fundamental', 'Macro'] as const;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050505]">
      {/* Left Feature List */}
      <div className="w-full md:w-72 bg-[#080808] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col shrink-0 max-h-[40vh] md:max-h-none overflow-y-auto">
        <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center shrink-0">
          <span className="text-xs uppercase font-bold text-white font-sans tracking-wider">Feature Bank</span>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-[#c5a059] text-black text-[10px] py-1 min-w-0 px-2.5"
          >
            {showNewForm ? 'Cancel' : '+ New'}
          </Button>
        </div>

        {showNewForm && (
          <div className="p-4 bg-[#141414] border-b border-[#252A3A] space-y-3 font-sans text-xs animate-fadeIn">
            <div className="text-[10px] font-mono text-[#c5a059] uppercase font-bold">Create Feature Spec</div>
            
            <div>
              <label className="text-[9px] uppercase font-bold text-[#6A7488] block mb-1">Select Backend Plugin</label>
              <select
                value={selectedPlugin}
                onChange={(e) => setSelectedPlugin(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#252A3A] text-white p-2 rounded text-xs outline-none cursor-pointer"
              >
                {availablePlugins.map((plugin) => (
                  <option key={plugin} value={plugin}>
                    {plugin}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-[#6A7488] block mb-1">Feature Name</label>
              <input
                type="text"
                placeholder="Feature Name (e.g. RSI Vol)..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#252A3A] text-white p-2 rounded text-xs outline-none font-sans"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-[#6A7488] block mb-1">Category (Detected)</label>
              <div className="w-full bg-[#141414] border border-[#252A3A]/60 text-[#a855f7] p-2 rounded text-xs font-mono select-none">
                {newType}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#8B95A8] flex justify-between font-mono">
                <span>LOOKBACK PERIOD</span><span>{periodVal} BARS</span>
              </label>
              <input type="range" min={2} max={100} value={periodVal} onChange={(e) => setPeriodVal(Number(e.target.value))} className="w-full accent-[#c5a059]" />
            </div>
            <Button
              variant="contained"
              fullWidth
              size="small"
              onClick={handleSaveFeature}
              className="bg-[#2ECC8F] text-black"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Spec'}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {typesList.map((typeGroup) => {
            const groupItems = (features || []).filter((f) => f && f.type === typeGroup);
            if (groupItems.length === 0) return null;
            return (
              <div key={typeGroup}>
                <div className="text-[10px] font-mono font-bold text-[#6A7488] uppercase px-2 mb-1.5">{typeGroup}</div>
                <div className="space-y-1">
                  {groupItems.map((f) => {
                    if (!f) return null;
                    const active = f.id === selectedFeat?.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className={`p-2.5 rounded transition-all cursor-pointer select-none ${
                          active ? 'bg-[#141720] border-l-2 border-[#4F8EF7] text-white' : 'text-[#8B95A8] hover:bg-[#111] hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-sans font-semibold truncate">{f.name || 'Unnamed Feature'}</div>
                        <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-[#6A7488]">
                          <span className="text-[#C5E0B4]">{f.plugin_key || 'N/A'}</span>
                          <span>{f.storage_size ?? 'N/A'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedFeat ? (
        <div className="flex-1 flex flex-col bg-[#050505] overflow-y-auto">
          {/* Header Bar */}
          <div className="p-6 border-b border-[#1a1a1a] bg-[#070707] flex justify-between items-end shrink-0">
            <div>
              <span className="text-[10px] font-mono uppercase bg-[#141414] text-[#c5a059] border border-[#252A3A] px-2 py-0.5 rounded">
                {selectedFeat.type} PLUGIN
              </span>
              <h1 className="text-2xl font-light text-white font-sans mt-2 mb-1">{selectedFeat.name}</h1>
              <p className="text-xs font-mono text-[#8B95A8] m-0">KEY: {selectedFeat.plugin_key} // LAST_GEN: {selectedFeat.last_generated ? selectedFeat.last_generated.slice(0, 16) : 'N/A'}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-[#6A7488] block">DATASET STORAGE SIZE</span>
              <span className="text-xl text-[#2ECC8F] font-bold">{selectedFeat.storage_size ?? '42.8 MB'}</span>
            </div>
          </div>

          {/* Tab Strip */}
          <div className="px-6 border-b border-[#1a1a1a] bg-[#070707] flex gap-8 select-none">
            {(['versions', 'generate', 'preview'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-3 bg-transparent border-none cursor-pointer font-sans uppercase font-bold text-xs tracking-wider transition-colors ${
                  activeTab === t ? 'text-[#4F8EF7] border-b-2 border-[#4F8EF7]' : 'text-[#6A7488] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-6 flex-1">
            {activeTab === 'versions' && (
              <div>
                <span className="text-xs font-mono text-[#8B95A8] block mb-3">LINEAGE VERSION MATRIX // IMMUTABLE PARQUET SNAPSHOTS</span>
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#252A3A] text-[#6A7488] text-[10px] uppercase bg-[#0a0a0a]">
                      <th className="p-3">Version Hash</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Timeframe</th>
                      <th className="p-3">Row Count</th>
                      <th className="p-3">Columns</th>
                      <th className="p-3">Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    <tr className="hover:bg-[#0c0d12]">
                      <td className="p-3 text-[#C5E0B4]">a8c93b1291f0</td>
                      <td className="p-3 text-[#4F8EF7]">AAPL</td>
                      <td className="p-3">1d</td>
                      <td className="p-3 text-white font-bold">5,040</td>
                      <td className="p-3 text-[#8B95A8] truncate max-w-[200px]">open, high, low, close, rsi_norm</td>
                      <td className="p-3 text-[#6A7488]">2026-06-24 06:00</td>
                    </tr>
                    <tr className="hover:bg-[#0c0d12]">
                      <td className="p-3 text-[#C5E0B4]">71f02c918a33</td>
                      <td className="p-3 text-[#4F8EF7]">NVDA</td>
                      <td className="p-3">1d</td>
                      <td className="p-3 text-white font-bold">5,040</td>
                      <td className="p-3 text-[#8B95A8] truncate max-w-[200px]">open, high, low, close, rsi_norm</td>
                      <td className="p-3 text-[#6A7488]">2026-06-23 14:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'generate' && (
              <div className="max-w-xl space-y-5 bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg">
                <div className="text-sm font-sans font-bold text-white uppercase">Dataset Execution Cluster Config</div>
                
                <div className="grid grid-cols-2 gap-4 font-sans text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">Target Symbol</label>
                    <input 
                      type="text" 
                      value={genSymbol} 
                      onChange={(e) => setGenSymbol(e.target.value.toUpperCase())}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white p-2 rounded font-mono text-xs outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">Timeframe</label>
                    <select 
                      value={genTimeframe}
                      onChange={(e) => setGenTimeframe(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white p-2 rounded font-mono text-xs outline-none font-sans"
                    >
                      <option value="1d">1d</option>
                      <option value="1h">1h</option>
                      <option value="15m">15m</option>
                      <option value="5m">5m</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={genStart} 
                      onChange={(e) => setGenStart(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white p-2 rounded font-mono text-xs outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#8B95A8] uppercase block mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={genEnd} 
                      onChange={(e) => setGenEnd(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white p-2 rounded font-mono text-xs outline-none" 
                    />
                  </div>
                </div>

                {/* Live Data Preview Panel */}
                <DataPreviewPanel
                  symbol={genSymbol}
                  timeframe={genTimeframe}
                  start={genStart}
                  end={genEnd}
                  onValidationChange={setValidationStatus}
                />

                {/* Warnings / Errors */}
                {validationStatus.errorMsg && (
                  <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3 rounded font-mono text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
                    {validationStatus.errorMsg}
                  </div>
                )}
                {validationStatus.warnMsg && (
                  <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 p-3 rounded font-mono text-xs flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">warning</span>
                    <span>{validationStatus.warnMsg}</span>
                  </div>
                )}

                {genTask && (
                  <div className={`p-4 rounded border font-mono text-xs ${
                    genTask.status === 'SUCCESS' ? 'bg-[#2ECC8F]/15 border-[#2ECC8F]/40 text-[#2ECC8F]' :
                    genTask.status === 'ERROR' ? 'bg-red-950/20 border-red-500/40 text-red-400' :
                    'bg-[#4F8EF7]/15 border-[#4F8EF7]/40 text-[#4F8EF7]'
                  }`}>
                    {genTask.status === 'RUNNING' ? '● RUNNING_TASK // DISTRIBUTED WORKERS EXTRACTING MOMENTS...' :
                     genTask.status === 'ERROR' ? `✗ ERROR // ${genTask.error}` :
                     `✓ GENERATION_COMPLETE // Rows: ${genTask.rows?.toLocaleString()} // Hash: ${genTask.hash}`}
                  </div>
                )}

                <div className="flex gap-4 pt-3 border-t border-[#1a1a1a]">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleGenerate} 
                    disabled={genTask?.status === 'RUNNING' || !validationStatus.canGenerate || !selectedId} 
                    className={`font-bold tracking-wider ${validationStatus.canGenerate && selectedId ? 'bg-[#4F8EF7] text-white' : 'bg-[#1a1c23] text-gray-500 cursor-not-allowed border border-[#252A3A]'}`}
                  >
                    {genTask?.status === 'RUNNING' ? 'Generating...' : 'Generate Feature Lake'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleForceRegenerate} 
                    disabled={genTask?.status === 'RUNNING' || !validationStatus.canGenerate || !selectedId}
                    className="text-[#c5a059] border-[#c5a059]"
                  >
                    Force Regenerate
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-4 font-mono text-xs">
                <span className="text-[#8B95A8]">PARQUET TABULAR HEAD // TOP 5 ROWS PREVIEW</span>
                <div className="overflow-x-auto border border-[#1a1a1a] rounded">
                  <table className="w-full text-left border-collapse bg-[#0a0a0a]">
                    <thead>
                      <tr className="bg-[#141414] text-[#c5a059] text-[10px] uppercase border-b border-[#252A3A]">
                        <th className="p-2.5">Date</th><th className="p-2.5">Open</th><th className="p-2.5">High</th><th className="p-2.5">Low</th><th className="p-2.5">Close</th><th className="p-2.5">RSI_Norm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      <tr><td className="p-2.5 text-[#8B95A8]">2026-06-24</td><td className="p-2.5">131.20</td><td className="p-2.5">136.40</td><td className="p-2.5">130.10</td><td className="p-2.5 text-white font-bold">135.50</td><td className="p-2.5 text-[#2ECC8F]">0.7842</td></tr>
                      <tr><td className="p-2.5 text-[#8B95A8]">2026-06-23</td><td className="p-2.5">128.40</td><td className="p-2.5">132.00</td><td className="p-2.5">127.90</td><td className="p-2.5 text-white font-bold">131.10</td><td className="p-2.5 text-[#2ECC8F]">0.6912</td></tr>
                      <tr><td className="p-2.5 text-[#8B95A8]">2026-06-22</td><td className="p-2.5">129.00</td><td className="p-2.5">130.50</td><td className="p-2.5">126.20</td><td className="p-2.5 text-white font-bold">128.30</td><td className="p-2.5 text-[#E8A838]">0.5410</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
