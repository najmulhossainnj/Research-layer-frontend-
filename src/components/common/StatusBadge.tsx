import React from 'react';
import { StrategyStatus } from '../../types';

interface StatusBadgeProps {
  status: StrategyStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normStatus = status.toLowerCase();

  let bg = 'bg-[#1c2030]';
  let text = 'text-[#8B95A8]';
  let border = 'border-[#252A3A]';

  if (normStatus === 'validated' || normStatus === 'completed' || normStatus === 'success') {
    bg = 'bg-[#2ECC8F]/15';
    text = 'text-[#2ECC8F]';
    border = 'border-[#2ECC8F]/30';
  } else if (normStatus === 'promoted' || normStatus === 'running' || normStatus === 'active') {
    bg = 'bg-[#4F8EF7]/15';
    text = 'text-[#4F8EF7]';
    border = 'border-[#4F8EF7]/30';
  } else if (normStatus === 'failed' || normStatus === 'danger' || normStatus === 'error') {
    bg = 'bg-[#E05252]/15';
    text = 'text-[#E05252]';
    border = 'border-[#E05252]/30';
  } else if (normStatus === 'backtested' || normStatus === 'warning') {
    bg = 'bg-[#E8A838]/15';
    text = 'text-[#E8A838]';
    border = 'border-[#E8A838]/30';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-mono uppercase font-semibold border rounded ${bg} ${text} ${border} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${text.replace('text-', 'bg-')}`}></span>
      {status}
    </span>
  );
};
