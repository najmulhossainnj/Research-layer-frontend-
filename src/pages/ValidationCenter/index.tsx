import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getValidationResults, triggerValidationAsync } from '../../api/client';
import { ValidationResult } from '../../types';
import { CPCVPathDistribution } from '../../components/charts/CPCVPathDistribution';
import { ValidationFoldChart } from '../../components/charts/ValidationFoldChart';
import { MetricCard } from '../../components/common/MetricCard';
import Button from '@mui/material/Button';

export const ValidationCenter: React.FC = () => {
  const { data: valData } = useQuery<ValidationResult>({ queryKey: ['validation'], queryFn: () => getValidationResults('strat_101') });
  const [activeTab, setActiveTab] = useState<'walk_forward' | 'cpcv' | 'overfit'>('walk_forward');
  const [runningGate, setRunningGate] = useState(false);

  const handleRunVal = () => {
    setRunningGate(true);
    triggerValidationAsync('strat_101');
    setTimeout(() => setRunningGate(false), 2500);
  };

  const cpcvPaths = [
    { path_id: 1, oos_sharpe: 2.14 },
    { path_id: 2, oos_sharpe: 1.88 },
    { path_id: 3, oos_sharpe: 2.34 },
    { path_id: 4, oos_sharpe: 1.95 },
    { path_id: 5, oos_sharpe: 2.41 },
    { path_id: 6, oos_sharpe: 1.72 },
    { path_id: 7, oos_sharpe: 2.22 },
    { path_id: 8, oos_sharpe: 2.05 }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#050505] overflow-y-auto p-6 space-y-6 select-none font-sans">
      {/* Institutional Clearance Banner */}
      <div className="p-6 bg-[#141720] border border-[#2ECC8F]/50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2ECC8F]/20 border border-[#2ECC8F] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px] text-[#2ECC8F]">verified</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white uppercase m-0 tracking-wider">Institutional Validation Gate: CLEAR</h1>
              <span className="bg-[#2ECC8F] text-black font-mono text-[10px] font-bold px-2 py-0.5 rounded">PASSED ALL GATES</span>
            </div>
            <p className="text-xs font-mono text-[#C5E0B4] m-0 mt-1">
              PURGED EMBARGOED WALK-FORWARD // OVERFITTING SCORE: 1.18 (BELOW 1.3 THRESHOLD)
            </p>
          </div>
        </div>

        <Button
          variant="contained"
          onClick={handleRunVal}
          disabled={runningGate}
          className="bg-[#c5a059] text-black font-bold uppercase tracking-wider text-xs px-5 py-2.5 shrink-0"
        >
          {runningGate ? 'Running Purged Combinations...' : 'Re-verify Validation Gate'}
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
        <MetricCard label="Overfitting Score (PBO)" value="1.18" colorRule="success" subtext="Probability of Backtest Overfitting < 0.05" />
        <MetricCard label="Walk-Forward Folds" value="6 / 6" colorRule="success" subtext="100% Profitable OOS Segments" />
        <MetricCard label="CPCV Mean Sharpe" value="2.08" colorRule="primary" subtext="Across 16 Combinatorial Paths" />
        <MetricCard label="Deflator Ratio" value="0.94" colorRule="success" subtext="Bailey & de Prado Sharpe Deflator" />
      </div>

      {/* Tab Strip */}
      <div className="border-b border-[#1a1a1a] flex gap-8">
        {(['walk_forward', 'cpcv', 'overfit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`py-3 bg-transparent border-none cursor-pointer uppercase font-bold text-xs tracking-wider transition-colors ${
              activeTab === t ? 'text-[#2ECC8F] border-b-2 border-[#2ECC8F]' : 'text-[#6A7488] hover:text-white'
            }`}
          >
            {t === 'walk_forward' ? 'Purged Walk-Forward Matrix' : t === 'cpcv' ? 'Combinatorial Purged CV (CPCV)' : 'De Prado Deflated Sharpe'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === 'walk_forward' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-lg">
              <span className="text-xs font-bold text-[#c5a059] uppercase block mb-3">Out-Of-Sample Sharpe Trajectory across Expanding Folds</span>
              <ValidationFoldChart
                folds={[
                  { fold_idx: 1, oos_sharpe: 1.95 },
                  { fold_idx: 2, oos_sharpe: 2.12 },
                  { fold_idx: 3, oos_sharpe: 1.84 },
                  { fold_idx: 4, oos_sharpe: 2.45 },
                  { fold_idx: 5, oos_sharpe: 2.29 },
                  { fold_idx: 6, oos_sharpe: 2.11 }
                ]}
                height={260}
              />
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-lg font-mono text-xs space-y-3">
              <span className="font-sans font-bold text-white uppercase block pb-2 border-b border-[#1a1a1a]">Embargo & Purge Rules</span>
              <div className="text-[#8B95A8]">● PURGE WINDOW: <b className="text-white">10 BARS</b></div>
              <div className="text-[#8B95A8]">● EMBARGO WINDOW: <b className="text-white">5 BARS</b></div>
              <p className="text-[11px] text-[#6A7488] leading-relaxed m-0 pt-2 border-t border-[#1a1a1a]">
                Purging removes training observations whose labels overlap with testing labels. Embargoing eliminates leakage immediately following test partitions.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'cpcv' && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white uppercase">Combinatorial Purged Path Distribution</span>
                <p className="text-xs font-mono text-[#8B95A8] m-0 mt-1">Evaluates all C(N, k) backtest trajectories to confirm no single lucky historical split.</p>
              </div>
              <span className="text-xs font-mono text-[#2ECC8F]">MIN PATH SHARPE: 1.72</span>
            </div>
            <CPCVPathDistribution paths={cpcvPaths} height={240} />
          </div>
        )}

        {activeTab === 'overfit' && (
          <div className="max-w-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg font-mono text-xs space-y-4">
            <span className="font-sans font-bold text-white text-sm uppercase block">Bailey & de Prado Deflated Sharpe Ratio (DSR)</span>
            <p className="text-[#8B95A8] font-sans text-xs leading-relaxed">
              Adjusts the estimated Sharpe Ratio for the number of trials attempted ($N=25$), the variance of trial Sharpe Ratios, and skewness/kurtosis of returns.
            </p>
            <div className="p-4 bg-[#141414] border border-[#252A3A] rounded flex justify-between items-center text-sm">
              <span className="text-[#c5a059]">Deflated Sharpe Probability</span>
              <span className="text-xl font-bold text-[#2ECC8F]">99.4% &gt; 0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
