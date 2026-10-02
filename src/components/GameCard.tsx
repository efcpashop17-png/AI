import React from 'react';
import { Game } from '../types';
import { ArrowRight, Tag, Sparkles, Zap } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const activePackages = game.packages.filter((p) => p.active);
  const minPrice =
    activePackages.length > 0 ? Math.min(...activePackages.map((p) => p.price)) : 0;

  const maxDiscountPercent =
    activePackages.length > 0
      ? Math.max(
          ...activePackages.map((p) =>
            p.originalPrice > p.price
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0
          )
        )
      : 0;

  return (
    <div
      onClick={() => onSelect(game)}
      className="group relative rounded-3xl bg-[#120E24]/90 backdrop-blur-md border border-violet-500/25 hover:border-violet-400 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] overflow-hidden"
    >
      {/* Top row: Publisher & Category badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-700/50">
            {game.category}
          </span>
          {game.badge && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.5)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current text-cyan-300" />
              {game.badge}
            </span>
          )}
        </div>

        {/* Game Icon & Title */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
              game.iconBgColor || 'from-violet-600 via-purple-600 to-cyan-600'
            } flex-shrink-0 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300`}
          >
            {game.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-lg text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug font-heading">
              {game.name}
            </h3>
            <p className="text-xs text-violet-300/80 font-medium mt-0.5">
              ค่าย: {game.publisher}
            </p>
            <p className="text-xs text-slate-300 font-normal line-clamp-2 mt-1 leading-relaxed">
              {game.description}
            </p>
          </div>
        </div>

        {/* Packages count & discount badge */}
        <div className="flex items-center gap-2 text-xs font-medium text-violet-200 mb-4 bg-[#1B1433]/70 p-2.5 rounded-xl border border-violet-500/20">
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          <span>มีให้เลือก {activePackages.length} แพ็กเกจ</span>
          {maxDiscountPercent > 0 && (
            <span className="ml-auto text-xs font-black px-2 py-0.5 rounded bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              ลดสูงสุด {maxDiscountPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price & Action */}
      <div className="pt-3.5 border-t border-violet-500/20 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold text-violet-400/80 block uppercase tracking-wider">
            ราคาเริ่มต้น
          </span>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 font-mono tabular-nums">
            ฿{minPrice.toLocaleString()}
          </span>
        </div>

        <button className="neon-btn-purple flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold group-hover:scale-105 transition-all cursor-pointer">
          <span>เลือกเติม</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
