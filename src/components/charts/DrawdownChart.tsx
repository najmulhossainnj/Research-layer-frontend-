import React from 'react';
import ReactECharts from 'echarts-for-react';

interface DrawdownItem {
  date: string;
  drawdown: number;
}

interface DrawdownChartProps {
  data: DrawdownItem[];
  height?: number | string;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  data = [],
  height = 200
}) => {
  const dates = data.map((d) => d.date);
  const values = data.map((d) => d.drawdown);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#141720',
      borderColor: '#252A3A',
      textStyle: { color: '#E8ECF4', fontFamily: 'JetBrains Mono', fontSize: 11 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        if (!p) return '';
        return `
          <div style="color:#888;">${p.axisValue}</div>
          <div style="color:#E05252; font-weight:bold;">DD: ${p.value}%</div>
        `;
      }
    },
    grid: {
      top: 15,
      right: 20,
      bottom: 20,
      left: 55,
      borderColor: '#1a1a1a'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 9 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 0,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: {
        color: '#6A7488',
        fontFamily: 'JetBrains Mono',
        fontSize: 9,
        formatter: (v: number) => `${v}%`
      },
      splitLine: { lineStyle: { color: '#1a1a1a', type: 'dashed' } }
    },
    series: [
      {
        name: 'Drawdown',
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        sampling: 'lttb',
        lineStyle: {
          color: '#E05252',
          width: 1.5
        },
        areaStyle: {
          color: 'rgba(224, 82, 82, 0.35)'
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};
