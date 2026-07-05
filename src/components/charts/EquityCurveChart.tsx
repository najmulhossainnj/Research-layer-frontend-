import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import { getNews } from '../../api/data';
import { queryKeys } from '../../hooks/queryKeys';

interface EquityCurveItem {
  date: string;
  value: number;
  return_pct?: number;
}

interface EquityCurveChartProps {
  data: EquityCurveItem[];
  height?: number | string;
  showDrawdownOverlay?: boolean;
  symbol?: string;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data = [],
  height = 300,
  showDrawdownOverlay = false,
  symbol
}) => {
  const dates = data.map((d) => d.date);
  const values = data.map((d) => d.value);

  const initialVal = values[0] ?? 1000000;

  // Derive start/end dates from equity curve series to fetch matching news timeline
  const start = dates[0] ? `${dates[0]}-01` : '2024-01-01';
  const end = dates[dates.length - 1] ? `${dates[dates.length - 1]}-31` : '2026-12-31';

  // Fetch news if symbol is provided
  const { data: newsRes } = useQuery({
    queryKey: queryKeys.news(symbol || '', start, end),
    queryFn: () => getNews(symbol || '', start, end, 100),
    enabled: !!symbol && dates.length > 0,
    staleTime: 10 * 60 * 1000 // 10 minutes stale
  });

  const newsArticles = newsRes?.data || [];

  // Build vertical markLines for news events
  const markLineData = [
    { yAxis: initialVal, lineStyle: { color: '#888', type: 'dashed', width: 1 }, label: { show: false } },
    ...newsArticles.map((article) => {
      const pubDate = article.published_at.split('T')[0];
      return {
        xAxis: pubDate,
        label: { formatter: '📰', position: 'end', color: '#4F8EF7' },
        tooltip: {
          formatter: `
            <div style="font-weight:bold; color:#4F8EF7; margin-bottom:4px;">${article.source || 'News Event'}</div>
            <div style="max-width:240px; white-space:normal; font-size:11px; font-weight:normal; color:#fff; line-height:1.4;">${article.headline}</div>
            <div style="font-size:10px; color:#888; margin-top:4px;">${pubDate}</div>
          `
        },
        lineStyle: { color: '#4F8EF7', type: 'dashed', opacity: 0.4 }
      };
    })
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#141720',
      borderColor: '#252A3A',
      textStyle: { color: '#E8ECF4', fontFamily: 'JetBrains Mono', fontSize: 11 },
      formatter: (params: any) => {
        let text = '';
        // Separate standard series tooltip and markLine tooltips if any
        const p = Array.isArray(params) ? params[0] : params;
        if (p) {
          const val = p.value;
          const ret = (((val - initialVal) / initialVal) * 100).toFixed(2);
          text += `
            <div style="font-weight:bold; color:#c5a059; margin-bottom:4px;">${p.axisValue}</div>
            <div>NAV: <span style="color:#fff;">$${Number(val).toLocaleString()}</span></div>
            <div>RET: <span style="color:${Number(ret) >= 0 ? '#2ECC8F' : '#E05252'};">${Number(ret) >= 0 ? '+' : ''}${ret}%</span></div>
          `;
        }
        return text;
      }
    },
    grid: {
      top: 30,
      right: 20,
      bottom: 25,
      left: 65,
      borderColor: '#1a1a1a'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 10 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: {
        color: '#6A7488',
        fontFamily: 'JetBrains Mono',
        fontSize: 10,
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`
      },
      splitLine: { lineStyle: { color: '#1a1a1a', type: 'dashed' } }
    },
    series: [
      {
        name: 'NAV Strategy',
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        sampling: 'lttb',
        lineStyle: {
          color: '#4F8EF7',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79, 142, 247, 0.25)' },
              { offset: 0.7, color: 'rgba(79, 142, 247, 0.05)' },
              { offset: 1, color: 'rgba(79, 142, 247, 0.0)' }
            ]
          }
        },
        markLine: {
          silent: false, // Must be false so tooltip on hover works!
          symbol: 'none',
          data: markLineData
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};
