import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Gamepad2,
  Search,
  Lock,
  ShieldCheck,
  Zap,
  LogOut,
  Clock,
  Menu,
  X,
  UserCheck,
  CreditCard,
  History,
  ShoppingBag,
  Sparkles,
  User,
  PhoneCall,
  BarChart3,
  Wallet,
  Plus,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { EFCPALogo } from './EFCPALogo';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAdminLoggedIn,
    adminLogout,
    currentCustomerUser,
    customerLogout,
    setIsAdminLoginModalOpen,
    setSelectedGame,
    orders,
    cart,
    setIsCartOpen,
    setIsTopupModalOpen,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'store') {
      setSelectedGame(null);
    }
    setMobileMenuOpen(false);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0813]/90 backdrop-blur-xl border-b border-violet-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      {/* Top Banner Alert - Cyber Neon Style */}
      <div className="bg-gradient-to-r from-[#120E24] via-[#1B1433] to-[#120E24] py-1.5 px-4 text-xs text-center border-b border-violet-500/20 text-slate-200 font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></span>
        <span className="tracking-wide">
          ⚡ <strong className="text-white font-bold">Stock iOS ราคาถูกที่สุด</strong> | ร้านขายส่งราคาถูก สะดวกกับมือใหม่ไม่จำเป็นต้องมานั่งคำนวณต้นทุน ประสบการณ์เติมเกมส์มากกว่า7ปี
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo with EF CPA Shop */}
          <div
            onClick={() => handleNavClick('store')}
            className="cursor-pointer group"
          >
            <EFCPALogo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNavClick('store')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'store'
                  ? 'bg-violet-600/30 text-white border border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-violet-950/40'
              }`}
            >
              หน้าแรก
            </button>

            <button
              onClick={() => handleNavClick('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-violet-600/30 text-white border border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-violet-950/40'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>แดชบอร์ดลูกค้า</span>
            </button>

            <button
              onClick={() => handleNavClick('tracking')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-violet-600/30 text-white border border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-violet-950/40'
              }`}
            >
              <History className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>เช็คคำสั่งซื้อ</span>
              {orders.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/60 text-cyan-300 border border-violet-600/40 font-bold tabular-nums">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('how_to')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'how_to'
                  ? 'bg-violet-600/30 text-white border border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-violet-950/40'
              }`}
            >
              วิธีเติมเงิน
            </button>
          </nav>

          {/* Action Zone: Cart & Login */}
          <div className="hidden md:flex items-center gap-3">
            {/* CART BUTTON with Glassmorphism */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#120E24]/90 hover:bg-[#1B1433] border border-violet-500/30 hover:border-violet-400 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)] cursor-pointer group"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>ตะกร้า</span>
              {totalCartCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-black shadow-[0_0_10px_rgba(217,70,239,0.5)] tabular-nums">
                  {totalCartCount}
                </span>
              ) : (
                <span className="text-xs text-violet-400/80 font-mono">0</span>
              )}
            </button>

            {/* Login / Admin / Customer Action Button */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2 p-1 rounded-xl bg-[#120E24] border border-violet-500/40">
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)]'
                      : 'bg-violet-900/60 text-cyan-300 hover:bg-violet-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>หลังบ้านแอดมิน</span>
                </button>

                <button
                  onClick={adminLogout}
                  title="ออกจากระบบแอดมิน"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentCustomerUser ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#120E24] border border-amber-400/40 text-xs">
                <div
                  onClick={() => handleNavClick('dashboard')}
                  className="flex items-center gap-1.5 px-2 cursor-pointer hover:opacity-85 transition-opacity"
                  title="ไปที่แดชบอร์ดลูกค้า"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px]">
                    👤
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-white block leading-tight">
                      {currentCustomerUser.customerName || currentCustomerUser.username}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                      ฿{currentCustomerUser.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Direct Top-up button with EasySlip */}
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer hover:scale-105 active:scale-95"
                  title="เติมเครดิตอัตโนมัติด้วย EasySlip"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>เติมเครดิต</span>
                </button>

                <button
                  onClick={customerLogout}
                  title="ออกจากระบบลูกค้า"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="neon-btn-purple flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>เข้าสู่ระบบ / สมาชิก</span>
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-[#120E24] text-slate-200 border border-violet-500/30"
            >
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-200 hover:bg-violet-950/40 border border-violet-500/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0813]/95 backdrop-blur-2xl border-b border-violet-500/20 px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => handleNavClick('store')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${
              activeTab === 'store'
                ? 'bg-violet-600/30 text-white border border-violet-400'
                : 'text-slate-300 hover:bg-violet-950/40'
            }`}
          >
            🎮 หน้าแรก
          </button>

          <button
            onClick={() => handleNavClick('how_to')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${
              activeTab === 'how_to'
                ? 'bg-violet-600/30 text-white border border-violet-400'
                : 'text-slate-300 hover:bg-violet-950/40'
            }`}
          >
            📖 วิธีเติมเงิน
          </button>

          <button
            onClick={() => handleNavClick('tracking')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
              activeTab === 'tracking'
                ? 'bg-violet-600/30 text-white border border-violet-400'
                : 'text-slate-300 hover:bg-violet-950/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>เช็คคำสั่งซื้อ</span>
            </span>
            {orders.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/60 text-cyan-300">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsCartOpen(true);
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between text-slate-300 hover:bg-violet-950/40"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>ตะกร้าสินค้า</span>
            </span>
            {totalCartCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold">
                {totalCartCount} รายการ
              </span>
            )}
          </button>

          <div className="pt-2 border-t border-violet-500/20">
            {isAdminLoggedIn ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleNavClick('admin')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-violet-600 text-white text-center"
                >
                  หลังบ้านแอดมิน
                </button>
                <button
                  onClick={adminLogout}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : currentCustomerUser ? (
              <div className="space-y-2 p-3 rounded-xl bg-[#120E24] border border-amber-400/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                      👤
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {currentCustomerUser.customerName || currentCustomerUser.username}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold block">
                        เครดิตคงเหลือ: ฿{currentCustomerUser.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      customerLogout();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 cursor-pointer"
                  >
                    ออกจากระบบ
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsTopupModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>เติมเครดิตด่วน (สแกนสลิป EasySlip)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAdminLoginModalOpen(true);
                }}
                className="w-full neon-btn-purple py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>เข้าสู่ระบบ / สมาชิก</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
