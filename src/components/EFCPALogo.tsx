import React from 'react';
import { EFLogoBadge } from './EFLogoBadge';

interface EFCPALogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const EFCPALogo: React.FC<EFCPALogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const imageSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${imageSize} rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.5)] flex-shrink-0 transition-transform duration-300 hover:scale-105 flex items-center justify-center`}>
        <EFLogoBadge className="w-full h-full" />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-heading">
              EF <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">CPA SHOP</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/25 text-cyan-300 border border-violet-500/40">
              TOP-UP
            </span>
          </div>
          <span className="text-[11px] font-medium text-violet-300/80 tracking-normal mt-0.5">
            Stock iOS ราคาถูกที่สุด
          </span>
        </div>
      )}
    </div>
  );
};
