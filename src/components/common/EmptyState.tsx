import React from 'react';
import Button from '@mui/material/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox_customize',
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="w-full py-16 px-6 flex flex-col items-center justify-center border border-dashed border-[#252A3A] rounded-lg bg-[#0a0a0a]/50 text-center my-6">
      <div className="w-12 h-12 rounded-full bg-[#141720] border border-[#252A3A] flex items-center justify-center mb-4 text-[#c5a059]">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <h3 className="text-sm font-sans font-bold text-white uppercase tracking-wider mb-1">
        {title}
      </h3>
      <p className="text-xs font-sans text-[#8B95A8] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={onAction}
          className="font-sans text-[11px] font-bold uppercase tracking-widest px-4 py-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
