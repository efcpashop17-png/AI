import React from 'react';
import { Game } from '../types';
import { ChevronRight, Sparkles, Tag, Gamepad2 } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const activePackages = (game.packages || []).filter((p) => p.active !== false);
  const minPrice = activePackages.length > 0 ? Math.min(...activePackages.map((p) => p.price)) : 0;

  return (
    <div
      onClick={() => onSelect(game)}
      className="group relative rounded-2xl bg-neutral-900/70 border border-neutral-800/80 hover:border-cyan-500/50 transition-all duration-300 p-5 cursor-pointer overflow-hidden hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between"
    >
      {/* Background Gradient Accent */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${game.bannerGradient || 'from-cyan-900/20 via-blue-900/10 to-neutral-950'} opacity-30 group-hover:opacity-50 transition-opacity`}
      />

      <div className="relative z-10">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700/60 uppercase tracking-wider">
            {game.category || 'Game'}
          </span>
          {game.todayRate && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {game.todayRate}
            </span>
          )}
        </div>

        {/* Game Title & Thai Name */}
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-neutral-800/90 border border-neutral-700/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-cyan-500/60 transition-all text-cyan-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
              {game.name}
            </h3>
            <p className="text-xs text-neutral-400 font-medium">{game.thaiName || game.publisher}</p>
          </div>
        </div>

        <p className="text-xs text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-neutral-400 block uppercase font-medium">เริ่มต้นเพียง</span>
          <span className="text-base font-extrabold text-white">
            ฿{minPrice > 0 ? minPrice.toLocaleString() : '-'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
          <span>{activePackages.length} แพ็กเกจ</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
