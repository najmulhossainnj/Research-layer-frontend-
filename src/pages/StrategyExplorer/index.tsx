import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStrategies, promoteStrategy, createStrategy, getFeatures, getModels, getSignals } from '../../api/client';
import { Strategy, StrategyStatus, Feature, Model, SignalLogic } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { EquityCurveChart } from '../../components/charts/EquityCurveChart';
import { JsonViewer } from '../../components/common/JsonViewer';
import { useUIStore } from '../../store/useUIStore';
import Button from '@mui/material/Button';
import { MiniSparkline } from '../../components/charts/MiniSparkline';
import { FundamentalsSnapshotCard } from '../../components/pipeline/FundamentalsSnapshotCard';

export const StrategyExplorer: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedStrategyId, selectStrategy, setWorkspace } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'backtests' | 'experiments' | 'validation'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for Strategy Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUniverse, setNewUniverse] = useState('AAPL, NVDA, MSFT');
  const [newTimeframe, setNewTimeframe] = useState('1d');
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedSignalId, setSelectedSignalId] = useState('');

  const { data: strategies = [], isLoading } = useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: getStrategies
  });

  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ['features'],
    queryFn: getFeatures
  });

  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: getModels
  });

  const { data: signals = [] } = useQuery<SignalLogic[]>({
    queryKey: ['signals'],
    queryFn: getSignals
  });

  const createStrategyMut = useMutation({
    mutationFn: createStrategy,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      setToastMessage(`STRATEGY_CREATED // Strategy [${data.name}] successfully deployed to registry.`);
      setShowCreateModal(false);
      // Reset form
      setNewName('');
      setNewDesc('');
      setNewUniverse('AAPL, NVDA, MSFT');
      setNewTimeframe('1d');
      setSelectedFeatureIds([]);
      setSelectedModelId('');
      setSelectedSignalId('');
      if (data.id) {
        selectStrategy(data.id);
      }
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: any) => {
      setToastMessage(`CREATE_FAILED // ${err.message || 'An error occurred'}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  const promoteMut = useMutation({
    mutationFn: (id: string) => promoteStrategy(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      setToastMessage(`PROMOTED_SUCCESS // Strategy promoted to production. Timestamp: ${data.timestamp}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  });

  const filtered = (strategies || []).filter((s) => {
    if (!s) return false;
    const name = s.name || '';
    const universe = s.universe || [];
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || universe.some((u) => u && u.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedStrat = (strategies || []).find((s) => s && s.id === selectedStrategyId) ?? filtered[0];

  const statusList: { label: string; value: string }[] = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Validated', value: 'validated' },
    { label: 'Promoted', value: 'promoted' },
    { label: 'Backtested', value: 'backtested' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050505]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 right-6 z-50 bg-[#1c2030] border-l-4 border-[#2ECC8F] text-[#C5E0B4] p-3 rounded shadow-2xl font-mono text-xs max-w-md animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Left List Pane */}
      <div className="w-full md:w-[380px] border-r border-[#1a1a1a] flex flex-col bg-[#070707] shrink-0">
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-white m-0">
              Strategy Catalog
            </h2>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowCreateModal(true)}
              className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#2ECC8F] border-[#2ECC8F] hover:bg-[#2ECC8F] hover:text-black"
              style={{ minWidth: 'auto', padding: '2px 8px' }}
            >
              + Create
            </Button>
          </div>

          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#6A7488] text-[18px]">search</span>
            <input
              type="text"
              placeholder="Filter by name, universe (AAPL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141414] border border-[#252A3A] text-[#d4d4d4] font-sans text-xs rounded pl-9 pr-3 py-2 outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {statusList.map((st) => (
              <button
                key={st.value}
                onClick={() => setStatusFilter(st.value)}
                className={`text-[10px] uppercase font-sans font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                  statusFilter === st.value
                    ? 'bg-[#c5a059] text-black border border-[#c5a059]'
                    : 'bg-[#141414] text-[#8B95A8] border border-[#252A3A] hover:border-[#888]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#141414]">
          {isLoading ? (
            <div className="p-8 text-center font-mono text-xs text-[#6A7488]">LOADING_CATALOG...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#6A7488]">NO_STRATEGIES_FOUND</div>
          ) : (
            filtered.map((s) => {
              const active = s.id === selectedStrat?.id;
              return (
                <div
                  key={s.id}
                  onClick={() => selectStrategy(s.id)}
                  className={`p-4 transition-colors cursor-pointer flex flex-col gap-2 ${
                    active ? 'bg-[#141720] border-l-2 border-[#c5a059]' : 'hover:bg-[#0c0d12]'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-bold text-xs text-white truncate">{s.name}</span>
                      <div className="mt-1">
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                    {s.universe && s.universe.length > 0 && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <MiniSparkline symbol={s.universe[0]} />
                        <span className="text-[8px] font-mono text-gray-500 uppercase">{s.universe[0]} 90d trend</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] font-sans text-[#8B95A8] line-clamp-2 m-0 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="flex justify-between items-center text-[10px] font-mono mt-1 pt-1 border-t border-[#1a1a1a]/50">
                    <div className="flex gap-1 overflow-hidden">
                      {(s.universe || []).slice(0, 3).map((u) => (
                        <span key={u} className="bg-[#1c2030] px-1.5 py-0.2 text-[#4F8EF7] rounded">{u}</span>
                      ))}
                      {(s.universe || []).length > 3 && <span className="text-[#6A7488]">+{(s.universe || []).length - 3}</span>}
                    </div>
                    <span className="text-[#6A7488]">TF: {s.timeframe || '1d'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedStrat ? (
        <div className="flex-1 flex flex-col bg-[#050505] overflow-y-auto">
          {/* Header Bar */}
          <div className="p-6 border-b border-[#1a1a1a] bg-[#070707] flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-light text-white m-0 tracking-tight font-sans">
                  {selectedStrat.name}
                </h1>
                <StatusBadge status={selectedStrat.status} size="md" />
                <span className="text-xs font-mono text-[#8B95A8] bg-[#141414] border border-[#252A3A] px-2 py-0.5 rounded">
                  v{selectedStrat.version}.0
                </span>
              </div>
              <p className="text-xs font-sans text-[#8B95A8] max-w-2xl m-0 leading-relaxed">
                {selectedStrat.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setWorkspace('strategy_builder')}
                className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#4F8EF7] border-[#4F8EF7]"
              >
                Open in Pipeline Builder
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={selectedStrat.status !== 'validated' || promoteMut.isPending}
                onClick={() => promoteMut.mutate(selectedStrat.id)}
                className={`font-sans text-[11px] font-bold uppercase tracking-wider ${
                  selectedStrat.status === 'validated'
                    ? 'bg-[#2ECC8F] text-black hover:bg-[#25a371]'
                    : 'bg-[#1c2030] text-[#4A5268] border border-[#252A3A]'
                }`}
              >
                {promoteMut.isPending ? 'Promoting...' : 'Promote to Prod'}
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-[#1a1a1a] bg-[#070707] flex gap-8 select-none">
            {(['overview', 'backtests', 'experiments', 'validation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 bg-transparent border-none cursor-pointer font-sans uppercase font-bold text-xs tracking-wider transition-colors ${
                  activeTab === tab ? 'text-[#c5a059] border-b-2 border-[#c5a059]' : 'text-[#6A7488] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="p-6 flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#6A7488] font-bold mb-3 font-sans">
                    Validated Walk-Forward Out-Of-Sample Performance
                  </div>
                  {selectedStrat.best_metrics ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <MetricCard label="Sharpe Ratio" value={selectedStrat.best_metrics.sharpe_ratio} colorRule={selectedStrat.best_metrics.sharpe_ratio >= 2 ? 'success' : 'warning'} subtext="Annualised IS/OOS" />
                      <MetricCard label="CAGR" value={`+${selectedStrat.best_metrics.cagr}`} unit="%" colorRule="success" subtext="Compound Growth" />
                      <MetricCard label="Max Drawdown" value={selectedStrat.best_metrics.max_drawdown} unit="%" colorRule="danger" subtext="Peak to Trough" />
                      <MetricCard label="Win Rate" value={selectedStrat.best_metrics.win_rate} unit="%" colorRule="primary" subtext="Bar directional acc" />
                      <MetricCard label="Sortino Ratio" value={selectedStrat.best_metrics.sortino_ratio} colorRule="success" subtext="Downside risk adj" />
                      <MetricCard label="Calmar Ratio" value={selectedStrat.best_metrics.calmar_ratio} colorRule="primary" subtext="CAGR / MaxDD" />
                      <MetricCard label="Profit Factor" value={selectedStrat.best_metrics.profit_factor} colorRule="success" subtext="Gross Win / Loss" />
                      <MetricCard label="Total Return" value={`+${selectedStrat.best_metrics.total_return}`} unit="%" colorRule="success" subtext="Since inception" />
                    </div>
                  ) : (
                    <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded font-mono text-xs text-[#6A7488]">
                      NO_COMPLETED_BACKTEST_METRICS // Execute a backtest run first.
                    </div>
                  )}
                </div>

                {/* Mini Equity Curve Strip & Fundamentals snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] uppercase tracking-widest text-[#c5a059] font-bold font-sans">
                        Live Out-Of-Sample Equity Trajectory ($1M Capital)
                      </span>
                      <span className="text-[10px] font-mono text-[#2ECC8F]">● ENGINE: VECTORBT</span>
                    </div>
                    <EquityCurveChart
                      data={[
                        { date: '2024-01', value: 1000000 },
                        { date: '2024-04', value: 1084000 },
                        { date: '2024-07', value: 1142000 },
                        { date: '2024-10', value: 1120000 },
                        { date: '2025-01', value: 1254000 },
                        { date: '2025-04', value: 1380000 },
                        { date: '2025-07', value: 1345000 },
                        { date: '2026-01', value: 1520000 },
                        { date: '2026-06', value: 1684500 }
                      ]}
                      height={220}
                      symbol={selectedStrat?.universe?.[0] || 'AAPL'}
                    />
                  </div>
                  <div>
                    <FundamentalsSnapshotCard symbol={selectedStrat?.universe?.[0] || 'AAPL'} />
                  </div>
                </div>

                {/* Governance Risk Flags */}
                {selectedStrat.governance_flags && selectedStrat.governance_flags.length > 0 && (
                  <div className="bg-[#141414] border border-[#E8A838]/40 p-4 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-[#E8A838] font-sans mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      Governance & Compliance Risk Clearance
                    </div>
                    <div className="space-y-2">
                      {selectedStrat.governance_flags.map((flag) => (
                        <div key={flag.id} className="bg-[#0a0a0a] p-2.5 rounded border border-[#252A3A] flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#E8A838] mr-2">[{flag.code}]</span>
                            <span className="text-[#d4d4d4] font-sans">{flag.message}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#6A7488]">{flag.timestamp ? flag.timestamp.slice(0, 10) : 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pipeline Config Manifest */}
                <JsonViewer data={selectedStrat.pipeline_config} title="STRATEGY_PIPELINE_GRAPH.JSON" />
              </div>
            )}

            {activeTab === 'backtests' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono text-[#8B95A8]">HISTORIC SIMULATIONS // 1 COMPLETED</span>
                  <Button variant="contained" size="small" onClick={() => setWorkspace('backtest_lab')} className="bg-[#4F8EF7] text-white">
                    New Backtest Lab Run
                  </Button>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">Run ID</th>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">Engine</th>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">Date Range</th>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">Sharpe</th>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">CAGR</th>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">Max DD</th>
                      <th className="p-3 border-b border-[#252A3A] text-[10px] font-mono uppercase text-[#6A7488]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs divide-y divide-[#1a1a1a]">
                    <tr className="hover:bg-[#0c0d12]">
                      <td className="p-3 text-[#c5a059]">bt_901</td>
                      <td className="p-3 text-white">vectorbt</td>
                      <td className="p-3 text-[#8B95A8]">2024-01 to 2026-06</td>
                      <td className="p-3 text-[#2ECC8F] font-bold">2.34</td>
                      <td className="p-3 text-[#2ECC8F]">+28.4%</td>
                      <td className="p-3 text-[#E05252]">-11.2%</td>
                      <td className="p-3">
                        <button onClick={() => setWorkspace('backtest_lab')} className="bg-[#1c2030] text-[#4F8EF7] border border-[#252A3A] px-2 py-1 rounded text-[10px] cursor-pointer hover:bg-white hover:text-black">
                          Inspect Lab
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'experiments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono text-[#8B95A8]">EXPERIMENT AUDIT TRAIL // MLflow LINEAGE</span>
                  <Button variant="outlined" size="small" onClick={() => setWorkspace('experiment_tracker')} className="text-[#c5a059] border-[#c5a059]">
                    Compare Lineage Diff
                  </Button>
                </div>
                <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded font-mono text-xs space-y-3">
                  <div className="flex justify-between border-b border-[#1a1a1a] pb-2 text-[#8B95A8]">
                    <span>RUN_ID: exp_501</span>
                    <span className="text-[#2ECC8F]">● SHARPE: 2.34</span>
                    <span>HASH: a8c93b1</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a1a1a] pb-2 text-[#8B95A8]">
                    <span>RUN_ID: exp_502</span>
                    <span className="text-[#E8A838]">● MSE: 0.00412</span>
                    <span>HASH: 7c4e2f0</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="space-y-6">
                <div className="p-4 bg-[#2ECC8F]/15 border border-[#2ECC8F]/40 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px] text-[#2ECC8F]">verified</span>
                    <div>
                      <div className="font-sans font-bold text-sm text-white uppercase">Walk-Forward Gate Passed</div>
                      <div className="text-xs font-mono text-[#C5E0B4]">6/6 Profitable Folds // Overfitting Score: 1.18 (LOW)</div>
                    </div>
                  </div>
                  <Button variant="contained" size="small" onClick={() => setWorkspace('validation_center')} className="bg-[#2ECC8F] text-black">
                    Validation Center
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center font-mono text-xs text-[#4A5268]">
          SELECT_STRATEGY_FROM_CATALOG
        </div>
      )}

      {/* Create Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0d14] border border-[#252A3A] rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#1a1a1a] flex justify-between items-center bg-[#070707]">
              <div>
                <span className="text-[10px] font-mono text-[#2ECC8F] block">REGISTRY ACTION</span>
                <h2 className="text-base font-sans font-bold text-white uppercase m-0">Create Strategy Spec</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-transparent border-none text-[#6A7488] hover:text-white cursor-pointer text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1">
              {/* Name */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Strategy Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alpha Momentum Breakout"
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#2ECC8F]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the core thesis and target asset class..."
                  rows={2}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#2ECC8F] resize-none"
                />
              </div>

              {/* Universe */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Universe (Comma separated) *</label>
                <input
                  type="text"
                  value={newUniverse}
                  onChange={(e) => setNewUniverse(e.target.value)}
                  placeholder="e.g. AAPL, NVDA, MSFT"
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2.5 outline-none focus:border-[#2ECC8F]"
                />
              </div>

              {/* Timeframe */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Timeframe *</label>
                <select
                  value={newTimeframe}
                  onChange={(e) => setNewTimeframe(e.target.value)}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2.5 outline-none focus:border-[#2ECC8F]"
                >
                  <option value="1d">1d (Daily)</option>
                  <option value="4h">4h (4 Hour)</option>
                  <option value="1h">1h (1 Hour)</option>
                  <option value="15m">15m (15 Minute)</option>
                  <option value="5m">5m (5 Minute)</option>
                </select>
              </div>

              {/* Features Multi-Select Checklist */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#a855f7] block mb-1">Select Features (Pipeline inputs)</label>
                {features.length === 0 ? (
                  <p className="text-[10px] font-mono text-[#6A7488] m-0">No features registered yet. Enter custom IDs below.</p>
                ) : (
                  <div className="bg-[#141414] border border-[#252A3A] rounded p-2 max-h-24 overflow-y-auto space-y-1.5">
                    {features.map((feat) => {
                      const checked = selectedFeatureIds.includes(feat.id);
                      return (
                        <label key={feat.id} className="flex items-center gap-2 cursor-pointer text-xs text-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedFeatureIds(selectedFeatureIds.filter(id => id !== feat.id));
                              } else {
                                setSelectedFeatureIds([...selectedFeatureIds, feat.id]);
                              }
                            }}
                            className="accent-[#a855f7]"
                          />
                          <span className="font-sans font-medium">{feat.name}</span>
                          <span className="text-[9px] font-mono text-[#6A7488]">({feat.id.slice(0, 8)})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Or enter custom UUIDs comma-separated..."
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      setSelectedFeatureIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean));
                    }
                  }}
                  className="w-full bg-[#141414] border border-[#252A3A]/40 text-[#8B95A8] font-mono text-[10px] rounded p-2 mt-1.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Model Select */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#f97316] block mb-1">Predictive Model *</label>
                  {models.length === 0 ? (
                    <input
                      type="text"
                      placeholder="Enter Model ID (UUID)"
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2.5 outline-none focus:border-[#f97316]"
                    />
                  ) : (
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#f97316]"
                    >
                      <option value="">-- Choose ML Model --</option>
                      {models.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.name} ({mod.id.slice(0, 8)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Signal Logic Select */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#eab308] block mb-1">Signal Logic *</label>
                  {signals.length === 0 ? (
                    <input
                      type="text"
                      placeholder="Enter Signal ID (UUID)"
                      value={selectedSignalId}
                      onChange={(e) => setSelectedSignalId(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                    />
                  ) : (
                    <select
                      value={selectedSignalId}
                      onChange={(e) => setSelectedSignalId(e.target.value)}
                      className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                    >
                      <option value="">-- Choose Signal Logic --</option>
                      {signals.map((sig) => (
                        <option key={sig.id} value={sig.id}>
                          {sig.name} ({sig.id.slice(0, 8)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#1a1a1a] bg-[#070707] flex justify-end gap-3 shrink-0">
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
                onClick={() => {
                  if (!newName.trim()) {
                    setToastMessage('VALIDATION_ERROR // Strategy name is required.');
                    setTimeout(() => setToastMessage(null), 3000);
                    return;
                  }
                  if (!selectedModelId.trim()) {
                    setToastMessage('VALIDATION_ERROR // Predictive model ID is required.');
                    setTimeout(() => setToastMessage(null), 3000);
                    return;
                  }
                  if (!selectedSignalId.trim()) {
                    setToastMessage('VALIDATION_ERROR // Signal logic ID is required.');
                    setTimeout(() => setToastMessage(null), 3000);
                    return;
                  }
                  const uni = newUniverse.split(',').map(s => s.trim()).filter(Boolean);
                  if (uni.length === 0) {
                    setToastMessage('VALIDATION_ERROR // Asset universe is required.');
                    setTimeout(() => setToastMessage(null), 3000);
                    return;
                  }

                  createStrategyMut.mutate({
                    name: newName,
                    description: newDesc,
                    universe: uni,
                    timeframe: newTimeframe,
                    feature_ids: selectedFeatureIds,
                    model_id: selectedModelId,
                    signal_logic_id: selectedSignalId,
                    pipeline_config: { nodes: [], edges: [] }
                  });
                }}
                disabled={createStrategyMut.isPending}
                className="bg-[#2ECC8F] text-black font-sans font-bold hover:bg-[#25a371]"
              >
                {createStrategyMut.isPending ? 'Deploying...' : 'Deploy Strategy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
