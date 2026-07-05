import React, { useEffect } from 'react';
import { useOHLCV } from '../../hooks/useOHLCV';
import ReactECharts from 'echarts-for-react';
import { DataErrorState } from '../common/DataErrorState';

interface DataPreviewPanelProps {
  symbol: string;
  timeframe: string;
  start: string;
  end: string;
  onValidationChange: (status: { canGenerate: boolean; errorMsg?: string; warnMsg?: string }) => void;
}

export const DataPreviewPanel: React.FC<DataPreviewPanelProps> = ({
  symbol,
  timeframe,
  start,
  end,
  onValidationChange
}) => {
  const { data, isLoading, error, isError } = useOHLCV(symbol, timeframe, start, end);

  const bars = data?.data || [];
  const n_bars = bars.length;

  // Run validation and propagate status to the parent
  useEffect(() => {
    if (isLoading) {
      onValidationChange({ canGenerate: false });
      return;
    }
    if (isError) {
      onValidationChange({ canGenerate: false, errorMsg: 'Failed to fetch market data.' });
      return;
    }
    if (n_bars === 0) {
      onValidationChange({ 
        canGenerate: false, 
        errorMsg: `No data found for ${symbol} in the requested range.` 
      });
      return;
    }
    if (n_bars < 50) {
      onValidationChange({ 
        canGenerate: true, 
        warnMsg: 'Short date range — features with long windows (e.g. Hurst 100-bar) will produce mostly NaN.' 
      });
      return;
    }
    onValidationChange({ canGenerate: true });
  }, [isLoading, isError, n_bars, symbol, onValidationChange]);

  if (isLoading) {
    return (
      <div className="bg-[#0e0f14] border border-[#1a1c23] rounded-lg p-5 flex flex-col items-center justify-center h-[260px] animate-pulse">
        <span className="material-symbols-outlined text-[32px] text-gray-600 animate-spin mb-2">sync</span>
        <span className="text-xs text-gray-500 font-mono">LOADING_DATA_PREVIEW...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#0e0f14] border border-[#1a1c23] rounded-lg p-5 h-[260px] overflow-y-auto">
        <span className="text-[10px] uppercase font-bold text-[#e54b4b] block mb-2 font-mono">PREVIEW_ERROR</span>
        <DataErrorState error={error} symbol={symbol} />
      </div>
    );
  }

  // Calculate some simple quality metrics
  const hasGaps = bars.some((b, i) => i > 0 && Math.abs(new Date(b.timestamp).getTime() - new Date(bars[i-1].timestamp).getTime()) > 10 * 24 * 60 * 60 * 1000); // loose gap check (>10 days)
  const volumePresent = bars.some(b => b.volume > 0);

  // ECharts Option for line area chart
  const dates = bars.map(b => b.timestamp.split(' ')[0]);
  const closePrices = bars.map(b => b.close);

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '3%',
      top: '10%',
      bottom: '10%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0c0d14',
      borderColor: '#1c1c24',
      textStyle: { color: '#fff', fontSize: 11, fontFamily: 'monospace' },
      formatter: (params: any) => {
        const item = params[0];
        return `Date: ${item.name}<br/>Close: <span style="color:#2ECC8F;font-weight:bold">$${item.value.toFixed(2)}</span>`;
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontSize: 9, fontFamily: 'monospace' }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false },
      axisLabel: { color: '#6A7488', fontSize: 9, fontFamily: 'monospace' },
      splitLine: { lineStyle: { color: '#1a1a1a' } }
    },
    series: [
      {
        name: 'Price',
        type: 'line',
        data: closePrices,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#4F8EF7', width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79, 143, 247, 0.25)' },
              { offset: 1, color: 'rgba(79, 143, 247, 0.01)' }
            ]
          }
        }
      }
    ]
  };

  return (
    <div className="bg-[#0c0d14] border border-[#1a1c23] rounded-lg p-4 space-y-3 font-sans">
      <div className="flex justify-between items-center pb-2 border-b border-[#1a1a1a]">
        <span className="text-[10px] font-mono font-bold text-[#c5a059] uppercase tracking-wider">[Live Data Preview]</span>
        <span className="text-[10px] font-mono text-gray-500">{symbol} // {timeframe}</span>
      </div>

      {/* Compact ECharts Line */}
      <div className="h-[140px] w-full">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>

      {/* Quality Summary Row */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1a1a1a] text-center font-mono">
        <div className="bg-[#050505] p-1.5 rounded border border-[#1a1a1a]">
          <div className="text-[9px] text-[#6A7488] uppercase">BARS</div>
          <div className="text-[11px] text-white font-bold">{n_bars} available</div>
        </div>
        <div className="bg-[#050505] p-1.5 rounded border border-[#1a1a1a]">
          <div className="text-[9px] text-[#6A7488] uppercase">GAPS</div>
          <div className="text-[11px] font-bold text-[#2ECC8F]">
            {hasGaps ? 'Gaps detected' : 'No gaps'}
          </div>
        </div>
        <div className="bg-[#050505] p-1.5 rounded border border-[#1a1a1a]">
          <div className="text-[9px] text-[#6A7488] uppercase">VOLUME</div>
          <div className="text-[11px] font-bold text-[#2ECC8F]">
            {volumePresent ? 'Present' : 'Missing'}
          </div>
        </div>
      </div>
    </div>
  );
};
