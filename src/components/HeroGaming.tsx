import React, { useState, useEffect } from 'react';
import { Search, Zap, ShieldCheck, Flame, Sparkles, Trophy } from 'lucide-react';

interface HeroGamingProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
}

// Exactly the 11 games sold in store (User requirement: no unsold games like RoV/Valorant/FreeFire)
const SEARCH_GAMES_LIST = [
  'eFootball',
  'Last War',
  'Summoners War',
  'FC Mobile',
  'Call Of Duty',
  'Genshin Impact',
  'Honkai : Star Rail',
  'Zenless Zone Zero',
  'Wuthering Waves',
  'Pokrmon Go',
  'Pokemon TCG',
];

const QUICK_GAME_TAGS = [
  { label: '⚽ eFootball', query: 'eFootball' },
  { label: '🛡️ Last War', query: 'Last War' },
  { label: '🔮 Summoners War', query: 'Summoners War' },
  { label: '⚽ FC Mobile', query: 'FC Mobile' },
  { label: '🎯 Call Of Duty', query: 'Call Of Duty' },
  { label: '⭐ Genshin Impact', query: 'Genshin Impact' },
  { label: '🚂 Honkai : Star Rail', query: 'Honkai : Star Rail' },
  { label: '📺 Zenless Zone Zero', query: 'Zenless Zone Zero' },
  { label: '🌊 Wuthering Waves', query: 'Wuthering Waves' },
  { label: '🔴 Pokrmon Go', query: 'Pokrmon Go' },
  { label: '🃏 Pokemon TCG', query: 'Pokemon TCG' },
];

export const HeroGaming: React.FC<HeroGamingProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
}) => {
  const [animIndex, setAnimIndex] = useState(0);

  // Rotate through user's exact list of games for the search placeholder shadow
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimIndex((prev) => (prev + 1) % SEARCH_GAMES_LIST.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentGhostGame = SEARCH_GAMES_LIST[animIndex];

  return (
    <div className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-violet-500/20 bg-gradient-to-b from-[#0B0813] via-[#120E24] to-[#0B0813]">
      {/* Background Cyber Glow & Radial Grids */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-violet-600/20 via-fuchsia-600/15 to-cyan-500/20 blur-[130px] pointer-events-none rounded-full"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf60a_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf60a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Cyber Top Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1B1433]/80 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] text-xs sm:text-sm font-bold text-violet-200 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping"></span>
            <span>CYBER-GAMING TOP-UP PLATFORM</span>
            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              FAST AUTO
            </span>
          </div>

          {/* Slogan & Title (User Specified Text) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-heading">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
              Stock iOS ราคาถูกที่สุด
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed">
            ร้านขายส่งราคาถูก สะดวกกับมือใหม่ไม่จำเป็นต้องมานั่งคำนวณต้นทุน ประสบการณ์เติมเกมส์มากกว่า7ปี
          </p>

          {/* Trust Stats & Live Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 max-w-2xl mx-auto">
            <div className="cyber-card p-3.5 rounded-2xl flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30">
                <Trophy className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <span className="text-xs text-violet-300/80 block font-medium">ยอดเติมสำเร็จแล้ว</span>
                <span className="text-sm font-extrabold text-white font-mono">500,000+ รายการ</span>
              </div>
            </div>

            <div className="cyber-card p-3.5 rounded-2xl flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30">
                <Zap className="w-5 h-5 text-amber-400 fill-current" />
              </div>
              <div className="text-left">
                <span className="text-xs text-violet-300/80 block font-medium">เวลาเฉลี่ย</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">6 - 32 ชม.</span>
              </div>
            </div>

            <div className="cyber-card p-3.5 rounded-2xl flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="text-xs text-violet-300/80 block font-medium">ความปลอดภัย</span>
                <span className="text-sm font-extrabold text-white font-mono">100% ปลอดภัยสูง</span>
              </div>
            </div>
          </div>

          {/* Featured Promotion Banner Card (Only shop games - no unsold games) */}
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-fuchsia-900/40 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white font-heading">
                    PROMO FLASH SALE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-fuchsia-500 text-white font-black text-[10px]">
                    ลดสูงสุด 25%
                  </span>
                </div>
                <p className="text-xs text-violet-200/80">
                  สต็อก eFootball, Last War, FC Mobile, Genshin, Call Of Duty วันนี้ ลดราคาพิเศษทุกแพ็กเกจ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-300 font-mono font-bold bg-violet-950/80 px-2.5 py-1 rounded-lg border border-violet-600/40">
                ⚡ อัปเดตราคาใหม่ล่าสุด
              </span>
            </div>
          </div>

          {/* Search Box with Cyber Violet Focus & User's Exact Game List Placeholder */}
          <div className="pt-2 max-w-xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400 stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`ค้นหาชื่อเกม เช่น ${currentGhostGame} (eFootball, Last War, FC Mobile...)`}
                className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-[#120E24]/90 border border-violet-500/40 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.35)] text-white placeholder-violet-400/60 text-sm sm:text-base font-medium outline-none transition-all shadow-xl backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold px-3 py-1.5 rounded-xl bg-violet-800 hover:bg-violet-700 text-white cursor-pointer transition-colors"
                >
                  ล้างค้นหา
                </button>
              )}
            </div>

            {/* Quick Game Tags (All 11 games sold in store) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] text-violet-400 font-semibold flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> สต็อกเกม:
              </span>
              {QUICK_GAME_TAGS.map((tag) => {
                const isSelected = searchQuery.toLowerCase() === tag.query.toLowerCase();
                return (
                  <button
                    key={tag.query}
                    onClick={() => {
                      if (isSelected) {
                        setSearchQuery('');
                      } else {
                        setSearchQuery(tag.query);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-violet-950/60 hover:bg-violet-800/60 text-violet-200 hover:text-white border-violet-500/30'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Tabs with Cyber Styling (Only valid categories in store) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-violet-300/40'
                    : 'bg-[#120E24]/80 text-slate-300 hover:text-white hover:bg-[#1B1433] border border-violet-500/20'
                }`}
              >
                {cat === 'All' ? '🎮 เกมทั้งหมด' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
