import React, { useState } from 'react';
import { ShoppingCart, ShieldCheck, User, LogOut, Search, Clock, Sparkles } from 'lucide-react';
import { EFCPALogo } from './EFCPALogo';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenAdminLogin: () => void;
  onOpenCustomerLogin: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'games' | 'tracking' | 'how-to';
  setActiveTab: (tab: 'games' | 'tracking' | 'how-to') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdminLogin,
  onOpenCustomerLogin,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
}) => {
  const { cart, setIsCartOpen, isAdmin, logoutAdmin, currentCustomer, logoutCustomer } = useApp();
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="cursor-pointer shrink-0" onClick={() => setActiveTab('games')}>
          <EFCPALogo size="md" />
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อเกม, ไอดี หรือแพ็กเกจ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-200 pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-neutral-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800/80 text-sm">
          <button
            onClick={() => setActiveTab('games')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'games'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>เกมทั้งหมด</span>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'tracking'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ติดตามออเดอร์</span>
          </button>
          <button
            onClick={() => setActiveTab('how-to')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'how-to'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <span>ขั้นตอนการเติม</span>
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-neutral-850 transition-all flex items-center gap-2"
            title="ตะกร้าสินค้า"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-semibold">ตะกร้า</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-neutral-950 font-bold text-xs flex items-center justify-center animate-bounce shadow-lg shadow-cyan-500/40">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Customer Profile / Login */}
          {currentCustomer ? (
            <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  {currentCustomer.customerName}
                </span>
                <span className="text-[10px] text-cyan-400 font-medium">
                  ฿{currentCustomer.balance.toLocaleString()}
                </span>
              </div>
              <button
                onClick={logoutCustomer}
                className="p-1 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition"
                title="ออกจากระบบลูกค้า"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCustomerLogin}
              className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">เข้าสู่ระบบลูกค้า</span>
            </button>
          )}

          {/* Admin Button */}
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                แอดมิน
              </span>
              <button
                onClick={logoutAdmin}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition"
                title="ออกจากระบบแอดมิน"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition"
              title="ระบบจัดการร้านค้า (แอดมิน)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
