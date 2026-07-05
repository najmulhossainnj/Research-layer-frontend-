import React from 'react';
import ReactECharts from 'echarts-for-react';

interface CPCVPathDistributionProps {
  paths: { path_id: number; oos_sharpe: number }[];
  height?: number | string;
}

export const CPCVPathDistribution: React.FC<CPCVPathDistributionProps> = ({
  paths = [],
  height = 200
}) => {
  const sharpes = paths.map((p) => p.oos_sharpe);

  // Generate simple binned histogram counts for 1.0 to 2.5
  const bins = ['<1.0', '1.0-1.4', '1.4-1.8', '1.8-2.2', '>2.2'];
  const counts = [0, 0, 0, 0, 0];
  sharpes.forEach((s) => {
    if (s < 1.0) counts[0]++;
    else if (s < 1.4) counts[1]++;
    else if (s < 1.8) counts[2]++;
    else if (s < 2.2) counts[3]++;
    else counts[4]++;
  });

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#141720',
      borderColor: '#252A3A',
      textStyle: { color: '#E8ECF4', fontFamily: 'JetBrains Mono', fontSize: 11 },
      formatter: '{b}: <b style="color:#c5a059">{c} C(n,k) paths</b>'
    },
    grid: {
      top: 15,
      right: 15,
      bottom: 25,
      left: 40
    },
    xAxis: {
      type: 'category',
      data: bins,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 9 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1a1a1a', type: 'dashed' } }
    },
    series: [
      {
        name: 'OOS Sharpe Distribution',
        type: 'bar',
        barWidth: '60%',
        data: counts,
        itemStyle: { color: '#4F8EF7' }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};
