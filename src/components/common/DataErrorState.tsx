import React from 'react';

interface DataErrorStateProps {
  error: any;
  symbol: string;
}

export const DataErrorState: React.FC<DataErrorStateProps> = ({ error, symbol }) => {
  const status = error?.status;
  
  if (status === 404) {
    return (
      <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 p-3.5 rounded text-xs font-mono flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="material-symbols-outlined text-[16px] text-amber-500">warning</span>
          SYMBOL_NOT_FOUND
        </div>
        <div>
          No data found for <strong className="text-white">{symbol}</strong>. Check if the symbol is correct and the date range contains active trading days.
        </div>
      </div>
    );
  }

  if (status === 502) {
    return (
      <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-3.5 rounded text-xs font-mono flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
          UPSTREAM_UNAVAILABLE
        </div>
        <div>
          Market data source is temporarily unavailable. Upstream services might be down. Please try again.
        </div>
      </div>
    );
  }

  if (status === 429) {
    return (
      <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 p-3.5 rounded text-xs font-mono flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="material-symbols-outlined text-[16px] text-amber-500">hourglass_empty</span>
          RATE_LIMIT_EXCEEDED
        </div>
        <div>
          Rate limit hit. Data will refresh automatically in 60 seconds.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-3.5 rounded text-xs font-mono flex flex-col gap-1">
      <div className="flex items-center gap-1.5 font-bold">
        <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
        ERROR
      </div>
      <div>
        Unexpected error: {error?.message || 'Unknown error occurred'}
      </div>
    </div>
  );
};
