import React from 'react';

export const EFLogoBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium backdrop-blur-md ${className}`}>
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      <span>EF CPA VIP Wholesale Stock</span>
    </div>
  );
};
