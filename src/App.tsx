import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroGaming } from './components/HeroGaming';
import { GameCard } from './components/GameCard';
import { GameTopUpModal } from './components/GameTopUpModal';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CustomerLoginModal } from './components/CustomerLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { OrderTrackingView } from './components/OrderTrackingView';
import { HowToTopUp } from './components/HowToTopUp';
import { EFLogoBadge } from './components/EFLogoBadge';
import { ShieldCheck, Flame, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const {
    games,
    selectedGame,
    openTopUpModal,
    isAdmin,
    notification,
    setNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'games' | 'tracking' | 'how-to'>('games');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Filter games based on search and category
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (!g || !g.active) return false;
      const matchesSearch =
        !searchQuery.trim() ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        g.thaiName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (g.aliases && g.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase().trim())));

      const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [games, searchQuery, selectedCategory]);

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'popular', label: 'เกมยอดนิยม' },
    { id: 'stock_ios', label: 'Stock iOS' },
    { id: 'moba', label: 'MOBA' },
    { id: 'gacha', label: 'RPG & Gacha' },
    { id: 'fps', label: 'Shooting & FPS' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold backdrop-blur-xl ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-300'
                : 'bg-cyan-950/90 border-cyan-500/40 text-cyan-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-cyan-400" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenAdminLogin={() => {
          if (isAdmin) {
            setIsAdminDashboardOpen(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onOpenCustomerLogin={() => setIsCustomerLoginOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Admin Floating Control Badge if logged in */}
      {isAdmin && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>เข้าสู่ระบบในฐานะผู้ดูแลระบบแล้ว</span>
          </div>
          <button
            onClick={() => setIsAdminDashboardOpen(true)}
            className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition shadow-sm"
          >
            เปิดแผงควบคุมระบบ (Admin Dashboard)
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'games' && (
          <div className="space-y-8">
            <HeroGaming />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* Category Filters */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500 text-neutral-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-neutral-900/90 text-neutral-400 hover:text-white hover:bg-neutral-850 border border-neutral-800/80'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-neutral-400">
                  พบทั้งหมด <span className="font-bold text-cyan-400">{filteredGames.length}</span> เกม
                </div>
              </div>

              {/* Games Grid */}
              {filteredGames.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8 space-y-3">
                  <p className="text-base font-bold text-neutral-300">ไม่พบเกมที่ตรงกับการค้นหา</p>
                  <p className="text-xs text-neutral-500">กรุณาลองค้นหาด้วยชื่ออื่น หรือเลือกหมวดหมู่อื่น</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => openTopUpModal(g)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tracking' && <OrderTrackingView />}
        {activeTab === 'how-to' && <HowToTopUp />}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-8 text-neutral-500 text-xs text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <EFLogoBadge />
        </div>
        <p>© 2026 EF CPA Shop. ศูนย์บริการเติมเกมและ Stock iOS ราคาส่งระดับ VIP</p>
        <p className="text-[11px] text-neutral-600">
          ระบบความปลอดภัยอัตโนมัติ 24 ชม. • ตรวจสอบสลิปด้วย EasySlip Engine
        </p>
      </footer>

      {/* Modals & Drawers */}
      <GameTopUpModal />
      <CartDrawer />
      <PaymentModal />
      <OrderSuccessModal />
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />
      <CustomerLoginModal
        isOpen={isCustomerLoginOpen}
        onClose={() => setIsCustomerLoginOpen(false)}
      />
      {isAdminDashboardOpen && (
        <AdminDashboard onClose={() => setIsAdminDashboardOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
