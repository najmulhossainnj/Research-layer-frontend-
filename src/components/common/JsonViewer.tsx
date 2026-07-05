import React, { useState } from 'react';

interface JsonViewerProps {
  data: Record<string, any> | any[];
  title?: string;
  defaultExpanded?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'PAYLOAD_MANIFEST.JSON',
  defaultExpanded = false
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-[#141414] border border-[#252A3A] rounded-lg overflow-hidden my-3">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="bg-[#0a0a0a] px-3 py-2 flex items-center justify-between cursor-pointer border-b border-[#1a1a1a] select-none hover:bg-[#111]"
      >
        <span className="text-[10px] font-mono font-bold text-[#c5a059] flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">code</span>
          {title}
        </span>
        <span className="text-[10px] font-mono text-[#6A7488]">
          {expanded ? 'COLLAPSE [-]' : 'EXPAND [+]'}
        </span>
      </div>
      {expanded && (
        <pre className="p-3 text-[11px] font-mono text-[#C5E0B4] overflow-x-auto m-0 max-h-80 select-text leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};
