import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFundamentals } from '../../api/data';
import { queryKeys } from '../../hooks/queryKeys';

interface FundamentalsSnapshotCardProps {
  symbol: string;
}

export const FundamentalsSnapshotCard: React.FC<FundamentalsSnapshotCardProps> = ({ symbol }) => {
  const { data: fund, isLoading, isError } = useQuery({
    queryKey: ['fundamentals', symbol],
    queryFn: () => getFundamentals(symbol),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000 // 1 hour cached
  });

  const formatMarketCap = (num: number | null): string => {
    if (num === null || num === undefined) return '—';
    const absNum = Math.abs(num);
    if (absNum >= 1.0e12) {
      return `$${(num / 1.0e12).toFixed(2)}T`;
    }
    if (absNum >= 1.0e9) {
      return `$${(num / 1.0e9).toFixed(2)}B`;
    }
    if (absNum >= 1.0e6) {
      return `$${(num / 1.0e6).toFixed(2)}M`;
    }
    return `$${num.toLocaleString()}`;
  };

  const formatPercentage = (num: number | null): string => {
    if (num === null || num === undefined) return '—';
    // If the mock/API returns e.g. 0.082 for 8.2%, format correctly
    const val = Math.abs(num) < 1.0 ? num * 100 : num;
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const formatValue = (num: number | null, prefix = '', suffix = ''): string => {
    if (num === null || num === undefined) return '—';
    return `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  };

  if (isLoading) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 flex flex-col justify-between h-full min-h-[220px] animate-pulse">
        <div className="space-y-2">
          <div className="h-2 bg-gray-800 rounded w-1/3"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !fund) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 flex flex-col justify-center items-center h-full min-h-[220px] text-center">
        <span className="material-symbols-outlined text-[24px] text-gray-600 mb-2">info_outline</span>
        <span className="text-[10px] font-mono text-gray-500 uppercase">FUNDAMENTALS_NOT_AVAILABLE // {symbol}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 flex flex-col justify-between h-full min-h-[220px]">
      <div>
        <span className="text-[10px] font-mono text-[#4F8EF7] font-bold block uppercase tracking-wider">[EQUITY FUNDAMENTALS SNAPSHOT]</span>
        <div className="flex justify-between items-baseline mt-1 pb-2 border-b border-[#1a1a1a]">
          <span className="text-sm font-sans font-extrabold text-white">{fund.symbol || symbol}</span>
          <span className="text-[9px] font-mono text-gray-500">as of {fund.as_of ? fund.as_of.split('T')[0] : 'N/A'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-4">
        <div>
          <span className="text-[9px] font-mono text-gray-500 uppercase block">Market Cap</span>
          <span className="text-xs font-sans font-bold text-white mt-0.5 block">
            {formatMarketCap(fund.market_cap)}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-gray-500 uppercase block">P/E Ratio</span>
          <span className="text-xs font-sans font-bold text-[#c5a059] mt-0.5 block">
            {formatValue(fund.pe_ratio)}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-gray-500 uppercase block">Revenue Growth</span>
          <span className={`text-xs font-sans font-bold mt-0.5 block ${fund.revenue_growth && fund.revenue_growth >= 0 ? 'text-[#2ECC8F]' : 'text-[#E05252]'}`}>
            {formatPercentage(fund.revenue_growth)}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-gray-500 uppercase block">EPS (TTM)</span>
          <span className="text-xs font-sans font-bold text-white mt-0.5 block">
            {formatValue(fund.eps, '$')}
          </span>
        </div>
      </div>

      <div className="text-[8px] font-mono text-[#6A7488] uppercase text-right border-t border-[#1a1a1a]/40 pt-2 mt-2">
        SURPRISE: <span className={fund.earnings_surprise && fund.earnings_surprise >= 0 ? 'text-[#2ECC8F]' : 'text-[#E05252]'}>{formatPercentage(fund.earnings_surprise)}</span>
      </div>
    </div>
  );
};
