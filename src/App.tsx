import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroGaming } from './components/HeroGaming';
import { GameCard } from './components/GameCard';
import { GameTopUpModal } from './components/GameTopUpModal';
import { PaymentModal } from './components/PaymentModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CartDrawer } from './components/CartDrawer';
import { PackageNotationModal } from './components/PackageNotationModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { HowToTopUp } from './components/HowToTopUp';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LiveOrderFeed } from './components/LiveOrderFeed';
import { AIAssistantChat } from './components/AIAssistantChat';
import { EFCPALogo } from './components/EFCPALogo';
import {
  Gamepad2,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  MessageCircle,
  QrCode,
  Wallet,
  CreditCard,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Game } from './types';

const MainContent: React.FC = () => {
  const {
    games,
    selectedGame,
    setSelectedGame,
    activeTab,
    setActiveTab,
    notification,
    setNotification,
    isAdminLoggedIn,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Categories list (only valid game categories in store - no unsold game categories)
  const categories = ['All', 'Sports', 'RPG', 'Casual', 'FPS'];

  // Filter games with Thai names and aliases support
  const filteredGames = games.filter((game) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      game.name.toLowerCase().includes(q) ||
      (game.thaiName && game.thaiName.toLowerCase().includes(q)) ||
      (game.badge && game.badge.toLowerCase().includes(q)) ||
      (game.aliases && game.aliases.some((alias) => alias.toLowerCase().includes(q))) ||
      game.publisher.toLowerCase().includes(q) ||
      game.description.toLowerCase().includes(q);

    const matchCategory =
      selectedCategory === 'All' ? true : game.category === selectedCategory;

    return matchQuery && matchCategory && game.active;
  });

  return (
    <div className="min-h-screen bg-[#0B0813] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Toast Notification with Neon Violet / Emerald Glow */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-[#102419]/90 text-emerald-300 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : notification.type === 'error'
                ? 'bg-[#2b0f19]/90 text-rose-300 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-[#1B1433]/90 text-violet-300 border-violet-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 stroke-[2.5]" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar />

      {/* Main Body */}
      <main className="flex-1">
        {/* If a game is selected, show its package selection & top-up page */}
        {selectedGame ? (
          <GameTopUpModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        ) : (
          <>
            {activeTab === 'store' && (
              <div>
                {/* Hero Gaming Section */}
                <HeroGaming
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={categories}
                />

                {/* Games Catalog Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading flex items-center gap-2">
                        <span>เกมยอดนิยมทั้งหมด</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-900/60 text-cyan-300 font-bold border border-violet-500/40">
                          {filteredGames.length} เกม
                        </span>
                      </h2>
                      <p className="text-xs text-violet-300/70 font-medium">
                        คลิกเลือกเกมที่คุณเล่นเพื่อดูแพ็กเกจราคาพิเศษและเริ่มทำรายการสั่งซื้อ
                      </p>
                    </div>
                  </div>

                  {filteredGames.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-3xl cyber-card border border-violet-500/30">
                      <Gamepad2 className="w-12 h-12 text-violet-400/50 mx-auto mb-3" />
                      <h4 className="text-base font-bold text-white">ไม่พบเกมที่ค้นหา</h4>
                      <p className="text-xs text-violet-300/60 mt-1">
                        ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {filteredGames.map((game) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          onSelect={(g) => setSelectedGame(g)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* How It Works (3 ขั้นตอนง่ายๆ) Section */}
                <div className="border-t border-violet-500/20 bg-gradient-to-b from-[#120E24]/60 to-[#0B0813] py-14">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/30 text-xs font-bold">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>FAST 3-STEP SYSTEM</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                        วิธีเติมเกมง่ายๆ ใน 3 ขั้นตอน
                      </h3>
                      <p className="text-xs sm:text-sm text-violet-300/70">
                        ขั้นตอนสะดวก ไม่ต้องรอคิว ระบบประมวลผลผ่านบอท API ส่งเหรียญเข้าเกมทันที
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Step 1 */}
                      <div className="cyber-card p-6 rounded-3xl relative overflow-hidden group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-extrabold text-xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)] mb-4 font-heading group-hover:scale-105 transition-transform">
                          1
                        </div>
                        <h4 className="font-extrabold text-lg text-white font-heading mb-2">
                          1. เลือกเกม & กรอก User
                        </h4>
                        <p className="text-xs text-violet-200/80 leading-relaxed font-normal">
                          เลือกเกมที่ต้องการสั่งซื้อจากหน้าแรก จากนั้นกรอก User ให้ถูกต้อง
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="cyber-card p-6 rounded-3xl relative overflow-hidden group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white font-extrabold text-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] mb-4 font-heading group-hover:scale-105 transition-transform">
                          2
                        </div>
                        <h4 className="font-extrabold text-lg text-white font-heading mb-2">
                          2. เลือกแพ็กเกจ & ชำระเงิน
                        </h4>
                        <p className="text-xs text-violet-200/80 leading-relaxed font-normal">
                          เลือกจำนวนเหรียญ/เพชร หรือใส่ตะกร้าเพื่อรวมหลายแพ็กเกจ แล้วสแกนจ่ายผ่าน QR พร้อมเพย์ / ทรูมันนี่
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="cyber-card p-6 rounded-3xl relative overflow-hidden group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 text-slate-950 font-extrabold text-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-4 font-heading group-hover:scale-105 transition-transform">
                          3
                        </div>
                        <h4 className="font-extrabold text-lg text-white font-heading mb-2">
                          3. รอรับสินค้าเข้า Stock
                        </h4>
                        <p className="text-xs text-violet-200/80 leading-relaxed font-normal">
                          จัดส่งไอเทมเข้า Stock เวลาเฉลี่ยคือ 6-32 ชม. พร้อมออกใบเสร็จให้ตรวจสอบย้อนหลังได้ 24 ชม.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && <CustomerDashboard />}
            {activeTab === 'tracking' && <OrderTrackingView />}
            {activeTab === 'how_to' && <HowToTopUp />}
            {activeTab === 'admin' && (isAdminLoggedIn ? <AdminDashboard /> : <OrderTrackingView />)}
          </>
        )}
      </main>

      {/* Floating AI Stock & Budget Consultant Chatbot */}
      <AIAssistantChat />

      {/* Global Modals */}
      <PaymentModal />
      <OrderSuccessModal />
      <AdminLoginModal />
      <CartDrawer />
      <PackageNotationModal />

      {/* Global Cyber-Gaming Footer */}
      <footer className="mt-auto border-t border-violet-500/20 bg-[#07050D] py-12 text-violet-300/80 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2 space-y-3">
              <EFCPALogo size="lg" />

              <p className="text-xs text-violet-300/70 max-w-md leading-relaxed mt-2">
                ร้านขายส่งราคาถูก สะดวกกับมือใหม่ไม่จำเป็นต้องมานั่งคำนวณต้นทุน ประสบการณ์เติมเกมส์มากกว่า7ปี สต็อก iOS ราคาถูกที่สุด เวลาเฉลี่ยคือ 6-32 ชม. ปลอดภัย 100%
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm font-heading tracking-wide uppercase">
                เมนูด่วน
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => {
                      setSelectedGame(null);
                      setActiveTab('store');
                    }}
                    className="hover:text-cyan-300 transition-colors"
                  >
                    หน้าแรก (เลือกเกม)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('how_to')}
                    className="hover:text-cyan-300 transition-colors"
                  >
                    วิธีสั่งซื้อ & คำถามพบบ่อย
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className="hover:text-cyan-300 transition-colors"
                  >
                    เช็คสถานะคำสั่งซื้อ
                  </button>
                </li>
                {isAdminLoggedIn && (
                  <li>
                    <button
                      onClick={() => setActiveTab('admin')}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ระบบหลังบ้านแอดมิน</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Col 3: Supported Payments & Contact */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm font-heading tracking-wide uppercase">
                ช่องทางชำระเงินที่รองรับ
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1.5 rounded-lg bg-[#1B1433] border border-violet-500/30 text-white font-bold text-[11px] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PromptPay QR</span>
                </span>
                <span className="px-2.5 py-1.5 rounded-lg bg-[#1B1433] border border-violet-500/30 text-white font-bold text-[11px] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>TrueMoney Wallet</span>
                </span>
                <span className="px-2.5 py-1.5 rounded-lg bg-[#1B1433] border border-violet-500/30 text-white font-bold text-[11px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mobile Banking</span>
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-violet-400/80 block mb-1">ติดต่อฝ่ายบริการลูกค้า 24 ชม.:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://line.me/R/ti/p/@820tvyqh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>LINE: @820tvyqh (คลิกเพิ่มเพื่อน)</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('@820tvyqh');
                      setNotification({
                        type: 'success',
                        message: 'คัดลอก Line ID: @820tvyqh เรียบร้อยแล้ว',
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                    title="คัดลอกไอดีไลน์"
                  >
                    คัดลอก ID
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-violet-400/60 text-[11px]">
            <p>© 2026 GamePay TopUp Portal. Futuristic Dark Cyber-Gaming Theme. All rights reserved.</p>
            <p className="flex items-center gap-1.5 justify-center font-medium text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SSL 256-bit Secure Encryption & API Direct Connect</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
