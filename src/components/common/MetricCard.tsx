import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  subtext?: string;
  colorRule?: 'success' | 'danger' | 'warning' | 'neutral' | 'primary';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  subtext,
  colorRule = 'neutral',
  className = ''
}) => {
  const colorMap = {
    success: 'text-[#2ECC8F]',
    danger: 'text-[#E05252]',
    warning: 'text-[#E8A838]',
    primary: 'text-[#c5a059]',
    neutral: 'text-white'
  };

  const valColor = colorMap[colorRule];

  return (
    <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-between min-w-[140px] ${className}`}>
      <div className="text-[10px] uppercase tracking-widest text-[#6A7488] font-bold font-sans mb-2 flex justify-between items-center">
        <span>{label}</span>
        {trend && (
          <span className={`font-mono text-[10px] ${trend.startsWith('+') || trend.includes('BULL') ? 'text-[#2ECC8F]' : trend.startsWith('-') || trend.includes('BEAR') ? 'text-[#E05252]' : 'text-[#8B95A8]'}`}>
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-mono font-bold tracking-tight ${valColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-[#6A7488]">{unit}</span>}
      </div>

      {subtext && <div className="text-[10px] font-sans text-[#4A5268] mt-1.5">{subtext}</div>}
    </div>
  );
};
