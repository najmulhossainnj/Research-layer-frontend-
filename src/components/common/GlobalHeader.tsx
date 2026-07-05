import React, { useState, useEffect } from 'react';
import { useUIStore, WorkspaceTab } from '../../store/useUIStore';
import { useResearchSessionStore } from '../../store/useResearchSessionStore';

export const GlobalHeader: React.FC = () => {
  const { activeWorkspace, setWorkspace, toggleSidebar } = useUIStore();
  const { convictionScore } = useResearchSessionStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(`LDN: ${now.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour12: false })}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { label: string; tab: WorkspaceTab }[] = [
    { label: 'Intelligence', tab: 'explorer' },
    { label: 'Alpha Terminal', tab: 'strategy_builder' },
    { label: 'Feature Lab', tab: 'feature_builder' },
    { label: 'Backtest', tab: 'backtest_lab' },
    { label: 'AI Agent', tab: 'ai_researcher' }
  ];

  return (
    <header className="h-14 border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20 select-none">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Trigger */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded bg-transparent text-[#888] hover:text-white hover:bg-[#141414] border border-[#1a1a1a] transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="Toggle Sidebar Navigation"
        >
          <span className="material-symbols-outlined text-[18px] block">menu</span>
        </button>

        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => setWorkspace('explorer')}
        >
          <div className="w-5 h-5 bg-[#c5a059] rounded-sm shadow-[0_0_10px_rgba(197,160,89,0.3)]"></div>
          <span className="font-bold tracking-[0.2em] text-sm text-white font-sans">
            BLACKWOOD CAPITAL
          </span>
          <span className="text-[10px] bg-[#141414] text-[#c5a059] border border-[#252a3a] px-1.5 py-0.5 font-mono rounded">
            QUANT v5.0
          </span>
        </div>

        <nav className="hidden md:flex gap-6 text-[11px] uppercase tracking-wider font-semibold text-[#888]">
          {navItems.map((item) => {
            const isActive = activeWorkspace === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setWorkspace(item.tab)}
                className={`transition-colors cursor-pointer border-none bg-transparent font-sans uppercase tracking-wider font-semibold text-[11px] py-1 ${
                  isActive ? 'text-white border-b-2 border-[#c5a059]' : 'text-[#888] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-5 text-[11px] font-mono">
        <div className="hidden lg:flex items-center gap-3">
          <span className="text-[#52a447] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-[#52a447] rounded-full animate-pulse"></span>
            S&P 500 +0.82%
          </span>
          <span className="text-[#e54b4b]">US10Y 4.12%</span>
          <span className="text-[#c5a059]">NVDA.O +4.31%</span>
        </div>
        
        <div className="h-4 w-px bg-[#222] hidden sm:block"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-[#888] tracking-wider">{time || 'LDN: 14:22:10'}</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-[#161b26] border border-[#252a3a] text-[#4F8EF7] rounded">
            CONV: {convictionScore.toFixed(3)}
          </span>
        </div>
      </div>
    </header>
  );
};
