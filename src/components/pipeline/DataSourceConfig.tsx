import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchSymbol } from '../../api/data';
import { queryKeys } from '../../hooks/queryKeys';

interface DataSourceConfigProps {
  config: {
    symbols?: string[];
    timeframe?: string;
    start?: string;
    end?: string;
    [key: string]: any;
  };
  onChange: (key: string, val: any) => void;
}

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ config, onChange }) => {
  const [symbolInput, setSymbolInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');

  // Debounce the user input to avoid hammering the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(symbolInput.trim().toUpperCase());
    }, 400);
    return () => clearTimeout(handler);
  }, [symbolInput]);

  const { data: searchResult, isFetching, isError } = useQuery({
    queryKey: queryKeys.symbolSearch(debouncedInput),
    queryFn: () => searchSymbol(debouncedInput),
    enabled: debouncedInput.length >= 1,
    staleTime: 30 * 1000,
  });

  // Watch for valid symbol search result and auto-populate default dates if empty or not set
  useEffect(() => {
    if (searchResult && searchResult.valid) {
      const today = new Date().toISOString().split('T')[0];
      if (!config.start) {
        onChange('start', '2020-01-01');
      }
      if (!config.end) {
        onChange('end', today);
      }
    }
  }, [searchResult, config.start, config.end, onChange]);

  const handleAddSymbol = () => {
    if (searchResult && searchResult.valid) {
      const sym = searchResult.symbol;
      const currentSymbols = config.symbols || [];
      if (!currentSymbols.includes(sym)) {
        onChange('symbols', [...currentSymbols, sym]);
      }
      setSymbolInput('');
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    const currentSymbols = config.symbols || [];
    onChange('symbols', currentSymbols.filter(s => s !== sym));
  };

  return (
    <div className="space-y-4">
      {/* Symbols List */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#8B95A8] block mb-1.5 font-sans">
          Active Symbols ({config.symbols?.length || 0})
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#141414] border border-[#252A3A] rounded min-h-10">
          {(!config.symbols || config.symbols.length === 0) ? (
            <span className="text-[10px] text-gray-500 font-mono">No symbols added</span>
          ) : (
            config.symbols.map((sym) => (
              <div 
                key={sym} 
                className="flex items-center gap-1 bg-[#1c2030] border border-[#2d3748] px-2 py-0.5 rounded text-xs font-mono text-white"
              >
                <span>{sym}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSymbol(sym)}
                  className="text-[#E05252] hover:text-red-400 font-bold ml-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Symbol & Live Validation */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#8B95A8] block mb-1 font-sans">
          Add Symbol (Real-time Validation)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. AAPL, NVDA"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#252A3A] text-[#C5E0B4] font-mono text-xs rounded p-2 outline-none focus:border-[#4F8EF7]"
          />
          <button
            type="button"
            disabled={!searchResult?.valid}
            onClick={handleAddSymbol}
            className={`px-3 py-1.5 rounded font-sans text-xs font-bold transition-all ${
              searchResult?.valid
                ? 'bg-[#2ECC8F] text-black hover:bg-[#27af7a] cursor-pointer'
                : 'bg-[#1a1c23] text-gray-500 cursor-not-allowed border border-[#252A3A]'
            }`}
          >
            Add
          </button>
        </div>

        {/* Inline Validation Status */}
        {debouncedInput && (
          <div className="mt-1.5 text-[11px] font-mono">
            {isFetching ? (
              <div className="text-gray-400 flex items-center gap-1">
                <span className="animate-spin text-[12px] material-symbols-outlined">sync</span>
                Checking {debouncedInput}...
              </div>
            ) : isError ? (
              <span className="text-[#E05252]">Error checking symbol</span>
            ) : searchResult ? (
              searchResult.valid ? (
                <div className="text-[#2ECC8F] flex items-center gap-1">
                  <span>✓</span>
                  <span>
                    {searchResult.symbol} — Last close ${searchResult.latest_close?.toFixed(2)} ({searchResult.latest_date ? new Date(searchResult.latest_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : ''})
                  </span>
                </div>
              ) : (
                <span className="text-[#E05252]">✗ {debouncedInput} — Symbol not found</span>
              )
            ) : null}
          </div>
        )}
      </div>

      {/* Timeframe */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#8B95A8] block mb-1 font-sans">
          Timeframe
        </label>
        <select
          value={config.timeframe || '1d'}
          onChange={(e) => onChange('timeframe', e.target.value)}
          className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2 outline-none focus:border-[#4F8EF7]"
        >
          <option value="1m">1m</option>
          <option value="1h">1h</option>
          <option value="1d">1d</option>
          <option value="1w">1w</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#8B95A8] block mb-1 font-sans">
          Start Date
        </label>
        <input
          type="date"
          value={config.start || ''}
          onChange={(e) => onChange('start', e.target.value)}
          className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2 outline-none focus:border-[#4F8EF7]"
        />
      </div>

      {/* End Date */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#8B95A8] block mb-1 font-sans">
          End Date
        </label>
        <input
          type="date"
          value={config.end || ''}
          onChange={(e) => onChange('end', e.target.value)}
          className="w-full bg-[#141414] border border-[#252A3A] text-white font-mono text-xs rounded p-2 outline-none focus:border-[#4F8EF7]"
        />
      </div>
    </div>
  );
};
