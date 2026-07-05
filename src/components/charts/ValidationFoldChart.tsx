import React from 'react';
import ReactECharts from 'echarts-for-react';

interface FoldItem {
  fold_idx: number;
  oos_sharpe: number;
}

interface ValidationFoldChartProps {
  folds: FoldItem[];
  height?: number | string;
}

export const ValidationFoldChart: React.FC<ValidationFoldChartProps> = ({
  folds = [],
  height = 220
}) => {
  const foldLabels = folds.map((f) => `Fold ${f.fold_idx}`);
  const sharpeVals = folds.map((f) => f.oos_sharpe);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#141720',
      borderColor: '#252A3A',
      textStyle: { color: '#E8ECF4', fontFamily: 'JetBrains Mono', fontSize: 11 },
      formatter: '{b}: <b style="color:#fff">{c} OOS Sharpe</b>'
    },
    grid: {
      top: 25,
      right: 20,
      bottom: 25,
      left: 45
    },
    xAxis: {
      type: 'category',
      data: foldLabels,
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#252A3A' } },
      axisLabel: { color: '#6A7488', fontFamily: 'JetBrains Mono', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a1a1a', type: 'dashed' } }
    },
    series: [
      {
        name: 'OOS Sharpe',
        type: 'bar',
        barWidth: '45%',
        data: sharpeVals.map((val) => ({
          value: val,
          itemStyle: {
            color: val >= 1.5 ? '#2ECC8F' : val >= 0 ? '#E8A838' : '#E05252'
          }
        }))
      }
    ]
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};
