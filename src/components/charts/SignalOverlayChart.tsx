import React, { useMemo } from 'react';
import { useOHLCV } from '../../hooks/useOHLCV';
import ReactECharts from 'echarts-for-react';
import { DataErrorState } from '../common/DataErrorState';

interface SignalOverlayChartProps {
  previewData: {
    symbol?: string;
    preview?: Array<{
      date?: string;
      timestamp?: string;
      signal: 'BUY' | 'SELL' | 'HOLD';
      price: number;
      prediction: number;
    }>;
  };
}

export const SignalOverlayChart: React.FC<SignalOverlayChartProps> = ({ previewData }) => {
  const symbol = previewData.symbol || 'AAPL';
  const previewRows = previewData.preview || [];

  const cleanDate = (d?: string) => {
    if (!d) return '';
    return d.split(' ')[0].split('T')[0];
  };

  // Derive date range from preview rows to fetch matching OHLCV bars
  const { start, end } = useMemo(() => {
    const dates = previewRows.map(r => cleanDate(r.date || r.timestamp)).filter(Boolean);
    if (dates.length === 0) {
      return { start: '2024-01-01', end: '2025-01-01' };
    }
    // Sort to get actual min and max dates
    const sorted = [...dates].sort();
    return {
      start: sorted[0],
      end: sorted[sorted.length - 1]
    };
  }, [previewRows]);

  const { data: ohlcvData, isLoading, error, isError } = useOHLCV(symbol, '1d', start, end);

  const option = useMemo(() => {
    if (!ohlcvData || ohlcvData.data.length === 0) return null;

    const bars = ohlcvData.data;
    const dates = bars.map(b => cleanDate(b.timestamp));

    // Create maps for quick matching of prediction values and signals by date
    const signalByDate = new Map<string, { signal: 'BUY' | 'SELL' | 'HOLD'; prediction: number }>();
    previewRows.forEach(row => {
      const d = cleanDate(row.date || row.timestamp);
      if (d) {
        signalByDate.set(d, { signal: row.signal, prediction: row.prediction });
      }
    });

    const candlestickData = bars.map(b => [b.open, b.close, b.low, b.high]);
    const predictionsData = bars.map(b => {
      const d = cleanDate(b.timestamp);
      return signalByDate.get(d)?.prediction ?? 0.0;
    });

    // Build the triangle markers overlaying the price chart
    const markPoints: any[] = [];
    bars.forEach(b => {
      const d = cleanDate(b.timestamp);
      const sigObj = signalByDate.get(d);
      if (sigObj) {
        if (sigObj.signal === 'BUY') {
          markPoints.push({
            name: 'BUY',
            coord: [d, b.low],
            symbol: 'triangle',
            symbolSize: 10,
            itemStyle: { color: '#2ECC8F' },
            label: { show: true, position: 'bottom', formatter: '▲', color: '#2ECC8F', fontSize: 12 }
          });
        } else if (sigObj.signal === 'SELL') {
          markPoints.push({
            name: 'SELL',
            coord: [d, b.high],
            symbol: 'triangle',
            symbolRotate: 180,
            symbolSize: 10,
            itemStyle: { color: '#E05252' },
            label: { show: true, position: 'top', formatter: '▼', color: '#E05252', fontSize: 12 }
          });
        }
      }
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#0c0d14',
        borderColor: '#1c1c24',
        textStyle: { color: '#fff', fontSize: 11, fontFamily: 'monospace' }
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }]
      },
      grid: [
        {
          left: '5%',
          right: '5%',
          top: '10%',
          height: '45%'
        },
        {
          left: '5%',
          right: '5%',
          top: '65%',
          height: '25%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          gridIndex: 0,
          axisLine: { lineStyle: { color: '#252A3A' } },
          axisLabel: { show: false },
          axisPointer: { show: true }
        },
        {
          type: 'category',
          data: dates,
          gridIndex: 1,
          axisLine: { lineStyle: { color: '#252A3A' } },
          axisLabel: { color: '#6A7488', fontSize: 9, fontFamily: 'monospace' },
          axisPointer: { show: true }
        }
      ],
      yAxis: [
        {
          type: 'value',
          scale: true,
          gridIndex: 0,
          axisLabel: { color: '#6A7488', fontSize: 9, fontFamily: 'monospace' },
          splitLine: { lineStyle: { color: '#1a1a1a' } }
        },
        {
          type: 'value',
          scale: true,
          gridIndex: 1,
          axisLabel: { color: '#6A7488', fontSize: 9, fontFamily: 'monospace' },
          splitLine: { lineStyle: { color: '#1a1a1a' } }
        }
      ],
      series: [
        {
          name: 'Price (Candlestick)',
          type: 'candlestick',
          data: candlestickData,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: '#2ECC8F',
            color0: '#E05252',
            borderColor: '#2ECC8F',
            borderColor0: '#E05252'
          },
          markPoint: {
            data: markPoints
          }
        },
        {
          name: 'Prediction Score',
          type: 'line',
          data: predictionsData,
          xAxisIndex: 1,
          yAxisIndex: 1,
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
                { offset: 0, color: 'rgba(79, 143, 247, 0.2)' },
                { offset: 1, color: 'rgba(79, 143, 247, 0.01)' }
              ]
            }
          }
        }
      ]
    };
  }, [ohlcvData, previewRows]);

  if (isLoading) {
    return (
      <div className="bg-[#0c0d14] border border-[#1a1c23] rounded-lg p-6 flex flex-col items-center justify-center h-[340px] animate-pulse">
        <span className="material-symbols-outlined text-[32px] text-[#4F8EF7] animate-spin mb-2">sync</span>
        <span className="text-xs text-gray-500 font-mono">LOADING_SIGNAL_OVERLAY_DATA...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#0c0d14] border border-[#1a1c23] rounded-lg p-5 h-[340px] overflow-y-auto">
        <span className="text-[10px] uppercase font-bold text-[#e54b4b] block mb-2 font-mono">SIGNAL_PREVIEW_ERROR</span>
        <DataErrorState error={error} symbol={symbol} />
      </div>
    );
  }

  return (
    <div className="bg-[#0c0d14] border border-[#1a1c23] rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[#1a1a1a]">
        <div>
          <span className="text-[10px] font-mono text-[#2ECC8F] font-bold block">[ACTIVE QUANT SIGNAL VISUALIZATION]</span>
          <h4 className="text-xs font-sans font-bold text-white uppercase">{symbol} Price & Signal Overlay</h4>
        </div>
        <div className="text-right text-[10px] font-mono text-gray-500">
          Range: {start} to {end}
        </div>
      </div>

      <div className="h-[320px] w-full">
        {option ? (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
            No price bars to plot.
          </div>
        )}
      </div>
    </div>
  );
};
