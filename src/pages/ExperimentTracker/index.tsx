import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperiments } from '../../api/client';
import { ExperimentRun } from '../../types';
import Button from '@mui/material/Button';

export const ExperimentTracker: React.FC = () => {
  const { data: experiments = [] } = useQuery<ExperimentRun[]>({ queryKey: ['experiments'], queryFn: getExperiments });
  const [selectedIds, setSelectedIds] = useState<string[]>(['exp_501', 'exp_502']);
  const [search, setSearch] = useState('');

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= 3) return; // max 3 compare
      setSelectedIds([...selectedIds, id]);
    }
  };

  const comparedExps = (experiments || []).filter((e) => e && selectedIds.includes(e.id));

  return (
    <div className="flex-1 flex flex-col bg-[#050505] overflow-y-auto p-6 space-y-6 select-none font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1a1a1a] pb-4">
        <div>
          <h1 className="text-2xl font-light text-white m-0 tracking-tight">Experiment Tracker & MLflow Audit Trail</h1>
          <p className="text-xs text-[#8B95A8] m-0 font-mono mt-1">
            IMMUTABLE REPRODUCIBILITY MATRIX // TRACKING {(experiments || []).length} SERIALIZED RUNS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#c5a059]">{selectedIds.length}/3 SELECTED FOR DIFF</span>
          <Button variant="outlined" size="small" onClick={() => setSelectedIds([])} className="text-[#888] border-[#333] text-[10px]">
            Clear Compare
          </Button>
        </div>
      </div>

      {/* Side-by-Side Lineage Diff Table */}
      {comparedExps.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#c5a059]/40 rounded-lg p-5 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-3">
            <span className="text-xs uppercase font-bold text-[#c5a059] tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">difference</span>
              Side-by-Side Strategy Lineage Comparison
            </span>
            <span className="text-[10px] font-mono text-[#6A7488]">HIGHLIGHTING TOPOLOGY & HYPERPARAMETER VARIANCE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#141414] text-[#8B95A8] text-[10px] uppercase border-b border-[#252A3A]">
                  <th className="p-3 w-48 font-sans font-bold text-white">Lineage Metric</th>
                  {comparedExps.map((e) => (
                    <th key={e.id} className="p-3 text-[#4F8EF7]">
                      {e.id} <span className="text-white">({e.git_hash})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                <tr>
                  <td className="p-3 text-[#6A7488]">Strategy Version</td>
                  {comparedExps.map((e) => <td key={e.id} className="p-3 text-white">v{e.strategy_id === 'strat_102' ? '2' : '1'}.0</td>)}
                </tr>
                <tr>
                  <td className="p-3 text-[#6A7488]">IS Sharpe (In-Sample)</td>
                  {comparedExps.map((e) => <td key={e.id} className="p-3 text-[#c5a059] font-bold">{e.key_metric}</td>)}
                </tr>
                <tr>
                  <td className="p-3 text-[#6A7488]">OOS Sharpe (Out-Of-Sample)</td>
                  {comparedExps.map((e) => {
                    const oosVal = e.metrics?.sharpe ?? e.key_metric;
                    return (
                      <td key={e.id} className="p-3 text-[#2ECC8F] font-bold">
                        {oosVal} {oosVal > 2.2 && '★ BEST'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 text-[#6A7488]">Overfitting Ratio (IS/OOS)</td>
                  {comparedExps.map((e) => {
                    const ratio = e.metrics?.overfit_ratio ?? 1.15;
                    return (
                      <td key={e.id} className={`p-3 font-bold ${ratio > 1.3 ? 'text-[#E05252]' : 'text-[#2ECC8F]'}`}>
                        {ratio} {ratio > 1.3 ? '(DEGRADED)' : '(STABLE)'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 text-[#6A7488]">MLflow Artifact Storage</td>
                  {comparedExps.map((e) => {
                    const uri = `s3://mlflow-artifacts/${e.mlflow_run_id || 'default'}`;
                    return (
                      <td key={e.id} className="p-3">
                        <a href={uri} className="text-[#4F8EF7] hover:underline truncate max-w-[150px] inline-block">
                          {uri}
                        </a>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Filterable Lineage Table */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden font-mono text-xs">
        <div className="p-4 bg-[#0e0f14] border-b border-[#1a1a1a] flex justify-between items-center">
          <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">All Logged Experiments</span>
          <input
            type="text"
            placeholder="Search Run ID or Git Hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#141414] border border-[#252A3A] text-white p-1.5 rounded text-xs outline-none focus:border-[#c5a059]"
          />
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#6A7488] text-[10px] uppercase border-b border-[#252A3A]">
              <th className="p-3 w-10 text-center">Diff</th>
              <th className="p-3">Run ID</th>
              <th className="p-3">Git Commit Hash</th>
              <th className="p-3">Strat Version</th>
              <th className="p-3">IS Sharpe</th>
              <th className="p-3">OOS Sharpe</th>
              <th className="p-3">Overfitting Ratio</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {(experiments || [])
              .filter((x) => x && ((x.id || '').includes(search) || (x.git_hash || '').includes(search)))
              .map((exp) => {
                const checked = selectedIds.includes(exp.id);
                const version = exp.strategy_id === 'strat_102' ? '2' : '1';
                const isSharpe = exp.key_metric;
                const oosSharpe = exp.metrics?.sharpe ?? exp.key_metric;
                const overfitRatio = exp.metrics?.overfit_ratio ?? 1.15;
                return (
                  <tr key={exp.id} className={`hover:bg-[#111] transition-colors ${checked ? 'bg-[#141720]' : ''}`}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(exp.id)}
                        className="accent-[#c5a059] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-bold text-[#c5a059]">{exp.id}</td>
                    <td className="p-3 text-[#4F8EF7]">{exp.git_hash || 'N/A'}</td>
                    <td className="p-3 text-white">v{version}.0</td>
                    <td className="p-3 text-[#888]">{isSharpe}</td>
                    <td className="p-3 text-[#2ECC8F] font-bold">{oosSharpe}</td>
                    <td className={`p-3 font-bold ${overfitRatio > 1.3 ? 'text-[#E05252]' : 'text-[#2ECC8F]'}`}>
                      {overfitRatio}
                    </td>
                    <td className="p-3 text-[#6A7488]">{exp.created_at ? exp.created_at.slice(0, 16) : 'N/A'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
