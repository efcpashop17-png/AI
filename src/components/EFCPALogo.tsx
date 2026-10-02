import React, { useState } from 'react';
import efLogoImg from '../assets/images/ef_cpa_logo_1790861925787.jpg';

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
  const [imgErrorCount, setImgErrorCount] = useState(0);

  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const imageSize = sizeMap[size];

  // Try bundled Vite asset first, then root static paths, then public static paths
  const sources = [
    efLogoImg,
    '/ef-cpa-logo.jpg',
    '/logo.png',
    '/public/ef-cpa-logo.jpg',
  ];

  const currentSrc = sources[Math.min(imgErrorCount, sources.length - 1)];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${imageSize} rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-violet-400/40 flex-shrink-0 bg-[#160d2b] transition-transform duration-300 hover:scale-105 flex items-center justify-center`}>
        {imgErrorCount < sources.length ? (
          <img
            src={currentSrc}
            alt="EF CPA Shop Logo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => {
              setImgErrorCount((prev) => prev + 1);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-900 via-indigo-950 to-[#0d071c] p-1 border border-cyan-400/30">
            <span className="font-black text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-300 to-fuchsia-400 tracking-tighter">
              EF
            </span>
            <span className="text-[7px] text-cyan-300 font-bold uppercase tracking-widest -mt-0.5">
              CPA
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/20 to-transparent pointer-events-none" />
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
