import React, { useMemo } from 'react';
import { useOHLCV } from '../../hooks/useOHLCV';
import ReactECharts from 'echarts-for-react';

interface MiniSparklineProps {
  symbol: string;
  height?: number | string;
  width?: number | string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ symbol, height = 36, width = 120 }) => {
  const { start, end } = useMemo(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 90);
    return {
      start: past.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  }, []);

  const { data: ohlcvData, isLoading, isError } = useOHLCV(symbol, '1d', start, end);

  const option = useMemo(() => {
    if (!ohlcvData || ohlcvData.data.length === 0) return null;

    const closePrices = ohlcvData.data.map(b => b.close);

    return {
      grid: { left: 4, right: 4, top: 4, bottom: 4 },
      xAxis: { type: 'category', show: false },
      yAxis: { type: 'value', scale: true, show: false },
      series: [
        {
          data: closePrices,
          type: 'line',
          showSymbol: false,
          smooth: true,
          lineStyle: { color: '#2ECC8F', width: 1.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(46, 204, 143, 0.15)' },
                { offset: 1, color: 'rgba(46, 204, 143, 0.0)' }
              ]
            }
          }
        }
      ]
    };
  }, [ohlcvData]);

  const h = typeof height === 'number' ? `${height}px` : height;
  const w = typeof width === 'number' ? `${width}px` : width;

  if (isLoading) {
    return <div style={{ height: h, width: w }} className="bg-[#141414] rounded animate-pulse" />;
  }

  if (isError || !option) {
    return (
      <div 
        style={{ height: h, width: w }} 
        className="bg-[#141414]/50 border border-[#222] rounded flex items-center justify-center text-[8px] font-mono text-[#8B95A8]"
      >
        {symbol} N/A
      </div>
    );
  }

  return (
    <div style={{ height: h, width: w }}>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  );
};
