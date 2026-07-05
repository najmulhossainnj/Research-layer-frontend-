import React from 'react';
import { useUIStore, WorkspaceTab } from '../../store/useUIStore';

interface NavItem {
  id: WorkspaceTab;
  label: string;
  icon: string;
  badge?: string;
}

export const SidebarNav: React.FC = () => {
  const { activeWorkspace, setWorkspace, pendingTasks, removeTask, sidebarCollapsed } = useUIStore();

  const navList: NavItem[] = [
    { id: 'explorer', label: 'Strategy Explorer', icon: 'explore' },
    { id: 'strategy_builder', label: 'Pipeline Builder', icon: 'account_tree', badge: 'FLOW' },
    { id: 'feature_builder', label: 'Feature Builder', icon: 'dataset' },
    { id: 'model_builder', label: 'Model Builder', icon: 'psychology' },
    { id: 'signal_builder', label: 'Signal Builder', icon: 'sensors' },
    { id: 'backtest_lab', label: 'Backtest Lab', icon: 'stacked_line_chart' },
    { id: 'experiment_tracker', label: 'Experiment Tracker', icon: 'science' },
    { id: 'validation_center', label: 'Validation Center', icon: 'verified', badge: 'GATE' },
    { id: 'ai_researcher', label: 'AI Researcher', icon: 'smart_toy', badge: 'GEMINI' }
  ];

  return (
    <aside 
      className={`bg-[#080808] border-r border-[#1a1a1a] flex flex-col shrink-0 transition-all duration-300 select-none z-30 h-full ${
        sidebarCollapsed 
          ? 'w-0 md:w-16 overflow-hidden border-r-0 md:border-r' 
          : 'w-60 absolute md:relative inset-y-0 left-0 md:inset-y-auto md:left-auto md:w-60 shadow-2xl md:shadow-none'
      }`}
    >
      {/* Primary Navigation */}
      <div className="p-3 flex-1 overflow-y-auto scrollbar-thin">
        {sidebarCollapsed ? (
          <div className="text-[8px] uppercase tracking-wider text-[#555] mb-3 font-bold text-center font-sans">
            NAV
          </div>
        ) : (
          <div className="text-[10px] uppercase tracking-tighter text-[#555] mb-2 font-bold px-2 font-sans">
            Research Layer
          </div>
        )}
        
        <div className="space-y-1">
          {navList.map((item) => {
            const active = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setWorkspace(item.id)}
                title={item.label}
                className={`w-full flex items-center rounded text-left border-none cursor-pointer transition-colors ${
                  sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } ${
                  active
                    ? 'bg-[#141720] text-white border-l-2 border-[#4F8EF7]'
                    : 'bg-transparent text-[#8B95A8] hover:bg-[#11131a] hover:text-[#d4d4d4]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[18px] shrink-0 ${active ? 'text-[#4F8EF7]' : 'text-[#6A7488]'}`}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-[12px] font-sans font-medium truncate">{item.label}</span>
                  )}
                </div>
                {!sidebarCollapsed && item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    active ? 'bg-[#4F8EF7]/20 text-[#4F8EF7]' : 'bg-[#1c2030] text-[#6A7488]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Universe Panel */}
      {sidebarCollapsed ? (
        <div className="p-2 border-t border-[#1a1a1a] mt-2 flex flex-col items-center gap-2.5 py-3">
          <span className="material-symbols-outlined text-[16px] text-[#c5a059]" title="Universe: Active">language</span>
          <span className="inline-block w-2 h-2 bg-[#52a447] rounded-full" title="NVDA.O: Bullish"></span>
          <span className="inline-block w-2 h-2 bg-[#888] rounded-full" title="AAPL.O: Neutral"></span>
          <span className="inline-block w-2 h-2 bg-[#e54b4b] rounded-full" title="TSLA.O: Bearish"></span>
        </div>
      ) : (
        <div className="p-4 border-t border-[#1a1a1a] mt-2">
          <div className="text-[10px] uppercase tracking-tighter text-[#555] mb-3 font-bold">
            Active Universe
          </div>
          <div className="space-y-1.5">
            <div className="bg-[#141414] border-l-2 border-[#c5a059] p-2.5 rounded-r flex justify-between items-center cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white font-mono uppercase">NVDA.O</div>
                <div className="text-[10px] text-[#666]">Semiconductors</div>
              </div>
              <div className="text-[10px] text-[#52a447] font-mono font-semibold">BULLISH</div>
            </div>
            <div className="p-2.5 hover:bg-[#111] transition-colors flex justify-between items-center border-l-2 border-transparent cursor-pointer rounded">
              <div>
                <div className="text-xs font-bold text-[#888] font-mono uppercase">AAPL.O</div>
                <div className="text-[10px] text-[#555]">Consumer Tech</div>
              </div>
              <div className="text-[10px] text-[#888] font-mono">NEUTRAL</div>
            </div>
            <div className="p-2.5 hover:bg-[#111] transition-colors flex justify-between items-center border-l-2 border-transparent cursor-pointer rounded">
              <div>
                <div className="text-xs font-bold text-[#888] font-mono uppercase">TSLA.O</div>
                <div className="text-[10px] text-[#555]">Automotive</div>
              </div>
              <div className="text-[10px] text-[#e54b4b] font-mono">BEARISH</div>
            </div>
          </div>
        </div>
      )}

      {/* Celery Task Queue Poller */}
      {sidebarCollapsed ? (
        <div className="mt-auto p-2 border-t border-[#1a1a1a] bg-[#07080b] flex flex-col items-center gap-3.5 py-4">
          <div className="relative cursor-pointer" title={`${pendingTasks.length} active tasks`}>
            <span className="material-symbols-outlined text-[16px] animate-spin text-[#4F8EF7] block">sync</span>
            {pendingTasks.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[7px] font-mono px-1 rounded-full scale-90">
                {pendingTasks.length}
              </span>
            )}
          </div>
          <div className="w-5 h-5 rounded-full bg-[#1c2030] flex items-center justify-center text-[8px] font-mono text-white" title="User Session: JD">
            JD
          </div>
        </div>
      ) : (
        <div className="mt-auto p-4 border-t border-[#1a1a1a] bg-[#07080b]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#c5a059] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] animate-spin text-[#4F8EF7]">sync</span>
              Celery Queue
            </span>
            <span className="text-[10px] font-mono text-[#8B95A8]">{pendingTasks.length} ACTIVE</span>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="text-[11px] font-mono text-[#4A5268] py-2 text-center bg-[#0d0f14] rounded border border-[#1a1a1a]">
              QUEUE_IDLE // 0 JOBS
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {pendingTasks.map((task) => (
                <div key={task.id} className="bg-[#141720] border border-[#252A3A] p-2 rounded text-[11px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-mono truncate max-w-[130px]">{task.label}</span>
                    <button 
                      onClick={() => removeTask(task.id)}
                      className="border-none bg-transparent text-[#6A7488] hover:text-[#E05252] cursor-pointer p-0 text-xs"
                      title="Dismiss task"
                    >
                      ×
                    </button>
                  </div>
                  <div className="w-full h-1 bg-[#0D0F14] rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${task.status === 'SUCCESS' ? 'bg-[#2ECC8F]' : 'bg-[#4F8EF7]'}`}
                      style={{ width: `${task.progress ?? 50}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[9px] font-mono">
                    <span className={task.status === 'SUCCESS' ? 'text-[#2ECC8F]' : 'text-[#4F8EF7]'}>
                      {task.status}
                    </span>
                    <span className="text-[#8B95A8]">{task.progress ?? 50}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#141720]">
            <div className="flex -space-x-1.5">
              <div className="w-5 h-5 rounded-full bg-[#1c2030] border border-[#080808] flex items-center justify-center text-[8px] font-mono text-white">JD</div>
              <div className="w-5 h-5 rounded-full bg-[#252a3a] border border-[#080808] flex items-center justify-center text-[8px] font-mono text-[#c5a059]">SK</div>
              <div className="w-5 h-5 rounded-full bg-[#141720] border border-[#080808] flex items-center justify-center text-[8px] font-mono text-[#4F8EF7]">+4</div>
            </div>
            <span className="text-[9px] font-mono text-[#4A5268]">NODE: ASIA-SE1</span>
          </div>
        </div>
      )}
    </aside>
  );
};
