import React from 'react';
import { Handle, Position } from 'reactflow';

export const QuantNode: React.FC<any> = ({ data, selected }) => {
  const colorMap: Record<string, { border: string; text: string; bg: string; icon: string }> = {
    data_source: { border: 'border-[#4F8EF7]', text: 'text-[#4F8EF7]', bg: 'bg-[#4F8EF7]/10', icon: 'database' },
    feature: { border: 'border-[#a855f7]', text: 'text-[#a855f7]', bg: 'bg-[#a855f7]/10', icon: 'functions' },
    feature_selector: { border: 'border-[#14b8a6]', text: 'text-[#14b8a6]', bg: 'bg-[#14b8a6]/10', icon: 'filter_alt' },
    model: { border: 'border-[#f97316]', text: 'text-[#f97316]', bg: 'bg-[#f97316]/10', icon: 'psychology' },
    signal_logic: { border: 'border-[#eab308]', text: 'text-[#eab308]', bg: 'bg-[#eab308]/10', icon: 'sensors' },
    backtest: { border: 'border-[#2ECC8F]', text: 'text-[#2ECC8F]', bg: 'bg-[#2ECC8F]/10', icon: 'stacked_line_chart' }
  };

  const style = colorMap[data.type] ?? { border: 'border-[#888]', text: 'text-[#888]', bg: 'bg-[#888]/10', icon: 'extension' };

  return (
    <div className={`bg-[#0a0a0a] border ${selected ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.2)]' : 'border-[#1a1a1a]'} rounded-lg w-56 select-none overflow-hidden transition-all duration-150`}>
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-[#6A7488] !border-2 !border-[#0a0a0a]" />

      <div className={`border-l-4 ${style.border} p-3`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className={`material-symbols-outlined text-[15px] ${style.text}`}>{style.icon}</span>
            <span className="text-[10px] font-sans font-bold text-white uppercase truncate">{data.label}</span>
          </div>
          <span className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded ${style.bg} ${style.text}`}>
            {data.type.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-1 mt-2 border-t border-[#1a1a1a] pt-2">
          {data.config && Object.entries(data.config).slice(0, 3).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-[10px]">
              <span className="text-[#6A7488] font-sans truncate max-w-[90px]">{key}:</span>
              <span className="text-[#C5E0B4] font-mono truncate max-w-[90px]">
                {Array.isArray(val) ? val.join(',') : typeof val === 'object' ? '...' : String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[#c5a059] !border-2 !border-[#0a0a0a]" />
    </div>
  );
};
