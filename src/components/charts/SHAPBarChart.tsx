import React from 'react';
import ReactECharts from 'echarts-for-react';

interface SHAPBarChartProps {
  height?: number | string;
}

export const SHAPBarChart: React.FC<SHAPBarChartProps> = ({ height = 240 }) => {
  const features = [
    'rsi_vol_norm',
    'finbert_nlp_score',
    'tsfresh_mom_30',
    'hurst_regime_bin',
    'macro_yield_spread',
    'vwap_dist_bps'
  ];
  const shapValues = [0.184, 0.142, 0.098, 0.081, 0.045, 0.032];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#141720',
      borderColor: '#252A3A',
      textStyle: { color: '#E8ECF4', fontFamily: 'JetBrains Mono', fontSize: 11 },
      formatter: '{b}: <b style="color:#c5a059">{c} mean(|SHAP|)</b>'
    },
    grid: {
      top: 10,
      right: 25,
      bottom: 20,
      left: 130,
      borderColor: '#1a1a1a'
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1a1a1a', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: features.slice().reverse(),
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#d4d4d4', fontFamily: 'JetBrains Mono', fontSize: 10 }
    },
    series: [
      {
        name: 'SHAP Importance',
        type: 'bar',
        barWidth: '55%',
        data: shapValues.slice().reverse(),
        itemStyle: {
          color: '#c5a059',
          borderRadius: [0, 2, 2, 0]
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};
