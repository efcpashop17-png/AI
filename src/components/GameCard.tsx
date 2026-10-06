import React, { useState } from 'react';
import { Game } from '../types';
import { useApp } from '../context/AppContext';
import { ArrowRight, Tag, Sparkles, TrendingUp, Lock, ShoppingBag } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const {
    isAdminLoggedIn,
    currentCustomerUser,
    setIsAdminLoginModalOpen,
    setNotification,
  } = useApp();

  const [imageError, setImageError] = useState(false);

  const isLoggedIn = isAdminLoggedIn || !!currentCustomerUser;
  const activePackages = game.packages.filter((p) => p.active);
  const minPrice =
    activePackages.length > 0 ? Math.min(...activePackages.map((p) => p.price)) : 0;

  const displayRate = (() => {
    if (!game.todayRate || !game.todayRate.trim()) {
      return `฿${minPrice.toLocaleString()}`;
    }
    const raw = game.todayRate.trim();
    if (/^\d+$/.test(raw)) {
      return `฿${Number(raw).toLocaleString()}`;
    }
    return raw;
  })();

  const handleCardClick = () => {
    if (!isLoggedIn) {
      setNotification({
        type: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อนเพื่อดูราคาและเลือกซื้อแพ็กเกจ',
      });
      setIsAdminLoginModalOpen(true);
      return;
    }
    onSelect(game);
  };

  const hasImage = Boolean(game.iconUrl && !imageError);

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-3xl bg-[#120E24]/90 backdrop-blur-md border border-violet-500/25 hover:border-violet-400 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] overflow-hidden"
    >
      <div>
        {/* Game Cover Banner (ถ้ามีการตั้งค่ารูปภาพหรืออัปโหลดรูป ให้แสดงเป็นภาพหน้าปกเกมสวยงามสะดุดตา) */}
        {hasImage ? (
          <div className="relative w-full h-44 overflow-hidden border-b border-violet-500/25 bg-[#090615]">
            <img
              src={game.iconUrl}
              alt={game.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient shadow for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#120E24] via-transparent to-black/40" />

            {/* Badges on Banner */}
            <div className="absolute top-3 left-3">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-violet-950/90 text-violet-200 border border-violet-700/60 backdrop-blur-md shadow-md">
                {game.category}
              </span>
            </div>

            {game.badge && (
              <div className="absolute top-3 right-3">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.6)] flex items-center gap-1 backdrop-blur-md border border-fuchsia-400/40">
                  <Sparkles className="w-3 h-3 fill-current text-cyan-300" />
                  {game.badge}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Top row when no image */
          <div className="p-5 pb-0 flex items-center justify-between gap-2">
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
        )}

        <div className="p-5 pb-0">
          {/* Game Icon & Title */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div
              className={`w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br ${
                game.iconBgColor || 'from-violet-600 via-purple-600 to-cyan-600'
              } flex-shrink-0 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/40 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300`}
            >
              {hasImage ? (
                <img
                  src={game.iconUrl}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                game.name.slice(0, 2).toUpperCase()
              )}
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

          {/* Packages count */}
          <div className="flex items-center gap-2 text-xs font-medium text-violet-200 mb-4 bg-[#1B1433]/70 p-2.5 rounded-xl border border-violet-500/20">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>มีให้เลือก {activePackages.length} แพ็กเกจ</span>
          </div>
        </div>
      </div>

      {/* Footer: Price & Action */}
      <div className="p-5 pt-3.5 border-t border-violet-500/20 flex items-center justify-between gap-2 mt-2">
        <div>
          <span className="text-[11px] font-bold text-violet-400/80 block uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" />
            <span>เรทของวันนี้</span>
          </span>
          {isLoggedIn ? (
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 font-mono tabular-nums">
              {displayRate}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 mt-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>ล็อกอินเพื่อดูราคา</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            isLoggedIn
              ? 'neon-btn-purple group-hover:scale-105'
              : 'bg-violet-900/60 hover:bg-violet-800 text-cyan-300 border border-violet-500/40'
          }`}
        >
          {isLoggedIn ? (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-cyan-300" />
              <span>เลือกซื้อ</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>เข้าสู่ระบบ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
