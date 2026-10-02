import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Copy,
  Calendar,
  Zap,
  ShoppingBag,
  Gamepad2,
  DollarSign,
  ChevronRight,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Sparkles,
  Server,
  Layers,
  BarChart3,
  X,
  Wallet,
  Plus,
  User,
} from 'lucide-react';
import { TopUpOrder, TopUpStatus } from '../types';

export const CustomerDashboard: React.FC = () => {
  const {
    orders,
    setActiveTab,
    setSelectedGame,
    games,
    setNotification,
    currentCustomerUser,
    setIsTopupModalOpen,
    setIsAdminLoginModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('this_month');
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<TopUpOrder | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);

  // Current month & year reference
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (9 for October)
  const currentMonthName = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const ordDate = new Date(ord.createdAt);

      // Month filter
      if (monthFilter === 'this_month') {
        if (
          ordDate.getFullYear() !== currentYear ||
          ordDate.getMonth() !== currentMonth
        ) {
          return false;
        }
      } else if (monthFilter === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (
          ordDate.getFullYear() !== lastYear ||
          ordDate.getMonth() !== lastMonth
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid') {
          if (ord.paymentStatus !== 'paid' && ord.status !== 'completed') return false;
        } else if (ord.status !== statusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = ord.id.toLowerCase().includes(q);
        const matchesGame = ord.gameName.toLowerCase().includes(q);
        const matchesPkg = ord.packageName.toLowerCase().includes(q);
        const matchesUid = ord.playerUid.toLowerCase().includes(q);
        const matchesNick = ord.playerNamePreview?.toLowerCase().includes(q);
        if (!matchesId && !matchesGame && !matchesPkg && !matchesUid && !matchesNick) {
          return false;
        }
      }

      return true;
    });
  }, [orders, monthFilter, statusFilter, searchQuery, currentYear, currentMonth]);

  // Spending analytics
  const thisMonthOrders = useMemo(() => {
    return orders.filter((ord) => {
      const d = new Date(ord.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [orders, currentYear, currentMonth]);

  const thisMonthSpent = useMemo(() => {
    return thisMonthOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' || o.status === 'completed' ? o.price : 0), 0);
  }, [thisMonthOrders]);

  const allTimeSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' || o.status === 'completed' ? o.price : 0), 0);
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'completed').length;
  }, [orders]);

  const inProgressCount = useMemo(() => {
    return orders.filter((o) => o.status === 'processing' || o.status === 'verifying').length;
  }, [orders]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      type: 'success',
      message: `คัดลอก${label}เรียบร้อย: ${text}`,
    });
  };

  const handleReorder = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (game) {
      setSelectedGame(game);
      setActiveTab('store');
    } else {
      setActiveTab('store');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header Banner - Futuristic Cyber Stock Portal */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#120E24] via-[#1B1433] to-[#120E24] border border-violet-500/30 p-6 sm:p-8 overflow-hidden shadow-[0_0_35px_rgba(139,92,246,0.2)] mb-8 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>ระบบจัดส่งสต็อกสินค้าผ่านเซิร์ฟเวอร์อัตโนมัติ (Server Direct Stock)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-heading tracking-tight">
              แดชบอร์ดลูกค้า &amp; ประวัติการสั่งซื้อสต็อก
            </h1>
            <p className="text-xs sm:text-sm text-violet-200/80 font-medium leading-relaxed">
              ตรวจสอบข้อมูลการสั่งซื้อสต็อก ยอดการสั่งซื้อในเดือนนี้ และติดตามสถานะการจัดส่งสินค้าเข้าไอดีเกมแบบเรียลไทม์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTopupModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer transition-all hover:scale-105 font-heading"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>เติมเครดิตด้วยสลิป</span>
            </button>

            <button
              onClick={() => setActiveTab('store')}
              className="px-5 py-3 rounded-2xl neon-btn-purple text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer transition-all hover:scale-105 font-heading"
            >
              <Zap className="w-4 h-4 fill-current text-white" />
              <span>สั่งซื้อสต็อกใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer User Wallet Bar */}
      {currentCustomerUser ? (
        <div className="rounded-3xl bg-gradient-to-r from-[#171A33] via-[#120E24] to-[#162725] border-2 border-emerald-500/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">{currentCustomerUser.customerName || currentCustomerUser.username}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                  {currentCustomerUser.role === 'vip_dealer' ? '👑 วีไอพีดีลเลอร์' : currentCustomerUser.role === 'agent' ? '🚀 ตัวแทนจำหน่าย' : '⭐ สมาชิกลูกค้า'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ไอดี: <span className="font-mono text-cyan-300">@{currentCustomerUser.username}</span> {currentCustomerUser.contactPhone && `• เบอร์: ${currentCustomerUser.contactPhone}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                ยอดเครดิตคงเหลือในกระเป๋า
              </span>
              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                ฿{currentCustomerUser.balance.toLocaleString()}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTopupModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer hover:scale-105 transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>เติมเครดิต</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#120E24]/90 border border-violet-500/30 p-4 sm:p-5 shadow-lg backdrop-blur-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">เข้าสู่ระบบสมาชิกลูกค้า เพื่อเติมเครดิตและใช้งานกระเป๋าเงิน</span>
              <span className="text-xs text-violet-300/70">สแกนสลิปผ่าน EasySlip ตรวจสอบยอดเงินอัตโนมัติ 24 ชม.</span>
            </div>
          </div>

          <button
            onClick={() => setIsAdminLoginModalOpen(true)}
            className="neon-btn-purple px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer hover:scale-105 transition-all"
          >
            เข้าสู่ระบบลูกค้า
          </button>
        </div>
      )}

      {/* 4 SUMMARY METRIC CARDS - Monthly Spend Focus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Card 1: เดือนนี้สั่งไปเท่าไหร่แล้ว (User Requested Feature) */}
        <div className="rounded-3xl bg-[#120E24]/90 border-2 border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-xl relative overflow-hidden group hover:border-cyan-400 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>ยอดสั่งซื้อเดือนนี้</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {currentMonthName}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 font-mono tracking-tight tabular-nums drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            ฿{thisMonthSpent.toLocaleString()}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-violet-300/80 font-medium">
            <span>สั่งซื้อ {thisMonthOrders.length} รายการ</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> เดือนปัจจุบัน
            </span>
          </div>
        </div>

        {/* Card 2: ยอดสั่งซื้อรวมทั้งหมด */}
        <div className="rounded-3xl bg-[#120E24]/85 border border-violet-500/30 p-5 sm:p-6 shadow-[0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:border-violet-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-violet-400" />
              <span>ยอดสั่งซื้อรวมทั้งหมด</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-600/40">
              ตลอดชีพ
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 font-mono tracking-tight tabular-nums">
            ฿{allTimeSpent.toLocaleString()}
          </div>
          <p className="mt-2.5 text-xs text-violet-300/70 font-medium">
            จากคำสั่งซื้อสต็อกทั้งหมด {orders.length} ออเดอร์
          </p>
        </div>

        {/* Card 3: จัดส่งสต็อกสำเร็จแล้ว (Delivered) with Pulsing Green Indicator */}
        <div className="rounded-3xl bg-[#120E24]/85 border border-emerald-500/30 p-5 sm:p-6 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-xl hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>จัดส่งสต็อกสำเร็จแล้ว</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              DELIVERED
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight tabular-nums flex items-baseline gap-2">
            <span>{completedCount}</span>
            <span className="text-xs font-bold text-emerald-300/80 font-sans">รายการ</span>
          </div>
          <p className="mt-2.5 text-xs text-emerald-200/80 font-medium">
            อัตราความสำเร็จ: {orders.length > 0 ? Math.round((completedCount / orders.length) * 100) : 100}%
          </p>
        </div>

        {/* Card 4: กำลังจัดส่งสต็อกผ่านเซิร์ฟเวอร์ (In Progress / Server Delivery) */}
        <div className="rounded-3xl bg-[#120E24]/85 border border-amber-500/30 p-5 sm:p-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-xl hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              {inProgressCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
              <span>กำลังจัดส่งสต็อก</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
              PROCESSING
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight tabular-nums flex items-baseline gap-2">
            <span>{inProgressCount}</span>
            <span className="text-xs font-bold text-amber-300/80 font-sans">รายการ</span>
          </div>
          <p className="mt-2.5 text-xs text-amber-200/80 font-medium">
            {inProgressCount > 0 ? 'กำลังส่งข้อมูลเข้า API เซิร์ฟเวอร์' : 'ไม่มีรายการค้างส่ง'}
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-3xl bg-[#120E24]/90 border border-violet-500/25 p-5 sm:p-6 mb-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ (เช่น GP-892410), ชื่อเกม, แพ็กเกจ หรือ UID ผู้เล่น..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0B0813] border border-violet-500/30 text-white placeholder-violet-400/50 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-white p-1 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0B0813] p-1 rounded-2xl border border-violet-500/30">
              <button
                type="button"
                onClick={() => setMonthFilter('this_month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  monthFilter === 'this_month'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                เดือนนี้
              </button>
              <button
                type="button"
                onClick={() => setMonthFilter('last_month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  monthFilter === 'last_month'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                เดือนก่อน
              </button>
              <button
                type="button"
                onClick={() => setMonthFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  monthFilter === 'all'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
            </div>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-[#0B0813] border border-violet-500/30 text-xs font-bold text-violet-200 outline-none cursor-pointer focus:border-cyan-400"
            >
              <option value="all">ทุกสถานะสต็อก</option>
              <option value="completed">จัดส่งสต็อกสำเร็จ (Delivered)</option>
              <option value="processing">กำลังจัดส่ง (Processing)</option>
              <option value="verifying">ชำระแล้ว / รอส่งสต็อก</option>
              <option value="pending_payment">รอการชำระเงิน</option>
            </select>
          </div>
        </div>
      </div>

      {/* ORDER HISTORY LIST (User Requested Feature) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-black text-white font-heading">
              ประวัติการสั่งซื้อสต็อกสินค้า (Order History)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-950 text-cyan-300 border border-violet-600/40 font-bold tabular-nums">
              {filteredOrders.length} รายการ
            </span>
          </div>

          <span className="text-xs text-violet-400/80 font-medium hidden sm:inline-block">
            เรียงตามวันที่ทำรายการล่าสุด
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#120E24]/60 border border-violet-500/20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">ไม่พบรายการสั่งซื้อตามเงื่อนไขที่เลือก</h3>
              <p className="text-xs text-violet-300/70 mt-1">
                ลองเปลี่ยนตัวกรองค้นหา หรือกดสั่งซื้อแพ็กเกจสต็อกใหม่ได้ทันที
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setMonthFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-cyan-300 text-xs font-bold border border-violet-600/40 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOrders.map((ord) => {
              const ordDate = new Date(ord.createdAt);
              const formattedDate = ordDate.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = ordDate.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              // Status badges with pulsing indicators
              const isDelivered = ord.status === 'completed';
              const isProcessing = ord.status === 'processing';
              const isVerifying = ord.status === 'verifying';
              const isPending = ord.status === 'pending_payment';
              const isFailed = ord.status === 'failed';

              return (
                <div
                  key={ord.id}
                  className="rounded-3xl bg-[#120E24]/85 border border-violet-500/25 hover:border-violet-500/50 p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all space-y-4 backdrop-blur-xl group hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                >
                  {/* Top Bar: Order ID, Date, Pulsing Status Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-500/20 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(ord.id, 'รหัสคำสั่งซื้อ')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0B0813] border border-violet-500/30 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 transition-colors cursor-pointer group/btn"
                        title="กดเพื่อคัดลอกรหัสออเดอร์"
                      >
                        <span>{ord.id}</span>
                        <Copy className="w-3 h-3 text-violet-400 group-hover/btn:text-cyan-300" />
                      </button>

                      {/* Date & Time of Transaction (User Requested) */}
                      <span className="text-xs text-violet-300/80 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                        <span>{formattedDate} {formattedTime}</span>
                      </span>
                    </div>

                    {/* PULSING STATUS INDICATOR (User Requested Feature) */}
                    <div>
                      {isDelivered && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span>จัดส่งสต็อกสำเร็จ (Delivered)</span>
                        </div>
                      )}

                      {isProcessing && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                          </span>
                          <span>กำลังจัดส่งสต็อกผ่านเซิร์ฟเวอร์ (Processing)</span>
                        </div>
                      )}

                      {isVerifying && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/50 text-xs font-black shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                          </span>
                          <span>ชำระเงินแล้ว / เตรียมจัดส่งสต็อก</span>
                        </div>
                      )}

                      {isPending && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                          <span>รอชำระเงิน (Pending Payment)</span>
                        </div>
                      )}

                      {isFailed && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs font-bold">
                          <X className="w-3.5 h-3.5" />
                          <span>ยกเลิกคำสั่งซื้อ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Package details, Game info, UID, Amounts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Game & Package details */}
                    <div className="md:col-span-2 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-base shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0 border border-violet-400/40">
                        {ord.gameName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-white font-heading">
                            {ord.gameName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-950/80 text-cyan-300 border border-violet-600/40 font-mono">
                            {ord.packageName}
                          </span>
                        </div>

                        {/* Player UID & Nickname preview */}
                        <div className="flex items-center gap-2 text-xs text-violet-200/80 flex-wrap">
                          <span className="text-violet-400 font-medium">ไอดี (UID):</span>
                          <span className="font-mono font-bold text-white bg-[#0B0813] px-2 py-0.5 rounded border border-violet-500/30">
                            {ord.playerUid}
                          </span>
                          {ord.playerNamePreview && (
                            <span className="text-emerald-400 font-bold">
                              ({ord.playerNamePreview})
                            </span>
                          )}
                          {ord.serverId && (
                            <span className="text-violet-400">เซิร์ฟ: {ord.serverId}</span>
                          )}
                        </div>

                        {/* Stock Item Quantity */}
                        <p className="text-xs text-violet-300/70 font-medium">
                          จำนวนสต็อก: <strong className="text-cyan-300 font-mono">{ord.itemAmount.toLocaleString()} {ord.inGameItem}</strong>
                          {ord.quantity && ord.quantity > 1 ? ` x${ord.quantity} ชุด` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Price and Payment Method Column */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-violet-500/20 pt-3 md:pt-0">
                      <div>
                        <span className="text-[11px] text-violet-400/80 font-medium block md:text-right">
                          ยอดชำระสุทธิ
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-300 to-violet-300 font-mono tracking-tight tabular-nums drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                          ฿{ord.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-xs text-violet-300/80">
                        <span className="text-[11px] font-medium capitalize">
                          {ord.paymentMethod === 'promptpay'
                            ? 'PromptPay QR'
                            : ord.paymentMethod === 'bank_transfer'
                            ? 'ไทยพาณิชย์ (SCB)'
                            : 'TrueMoney'}
                        </span>
                        {ord.paymentStatus === 'paid' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            ชำระแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions Row: Timeline button, Slip preview button, Reorder */}
                  <div className="pt-3 border-t border-violet-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForTimeline(ord)}
                        className="px-3.5 py-2 rounded-xl bg-[#1B1433] hover:bg-[#251b47] text-cyan-300 hover:text-white border border-violet-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ไทม์ไลน์ส่งมอบสต็อก ({ord.timeline.length} ขั้นตอน)</span>
                      </button>

                      {ord.slipUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingSlipUrl(ord.slipUrl || null)}
                          className="px-3 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-emerald-300 border border-emerald-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ดูสลิปหลักฐาน</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReorder(ord.gameId)}
                      className="px-3.5 py-2 rounded-xl bg-[#120E24] hover:bg-[#1B1433] text-violet-200 hover:text-white border border-violet-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                      <span>สั่งซื้อสต็อกเกมนี้อีกครั้ง</span>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: LIVE TIMELINE STEPS (บันทึกความคืบหน้าระบบอัตโนมัติ) */}
      {selectedOrderForTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0813]/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#120E24]/95 border-2 border-cyan-500/40 p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white my-8">
            <button
              onClick={() => setSelectedOrderForTimeline(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-violet-400 hover:text-white hover:bg-violet-950/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-heading">
                  บันทึกความคืบหน้าระบบจัดส่งสต็อกอัตโนมัติ
                </h3>
                <p className="text-xs text-violet-300/80 font-mono">
                  ออเดอร์: <span className="text-cyan-300 font-bold">{selectedOrderForTimeline.id}</span> | {selectedOrderForTimeline.gameName}
                </p>
              </div>
            </div>

            {/* Order Brief Card */}
            <div className="rounded-2xl bg-[#0B0813] border border-violet-500/30 p-3.5 mb-5 flex items-center justify-between text-xs">
              <div>
                <span className="text-violet-400 font-medium block">แพ็กเกจ &amp; ผู้รับ:</span>
                <span className="font-extrabold text-white">
                  {selectedOrderForTimeline.packageName} (UID: {selectedOrderForTimeline.playerUid})
                </span>
              </div>
              <div className="text-right">
                <span className="text-violet-400 font-medium block">ยอดชำระ:</span>
                <span className="font-mono font-black text-cyan-300 text-base">
                  ฿{selectedOrderForTimeline.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timeline Steps Display */}
            <div className="space-y-4">
              <span className="text-xs font-black text-slate-200 block uppercase tracking-wider">
                ขั้นตอนการดำเนินการผ่านเซิร์ฟเวอร์ ({selectedOrderForTimeline.timeline.length} ขั้นตอน)
              </span>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-violet-500/30">
                {selectedOrderForTimeline.timeline.map((step, idx) => {
                  const isLast = idx === selectedOrderForTimeline.timeline.length - 1;
                  return (
                    <div key={idx} className="relative flex items-start gap-3 text-xs">
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          isLast
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                            : 'bg-violet-900 text-violet-300 border border-violet-600'
                        }`}
                      >
                        {isLast ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-300"></span>
                        )}
                      </div>

                      <div className="flex-1 p-3 rounded-2xl bg-[#0B0813] border border-violet-500/25 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-white text-xs">
                            {step.description}
                          </span>
                          {step.actor && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/60 text-cyan-300 font-bold border border-violet-700/50">
                              {step.actor === 'admin' ? 'แอดมิน' : step.actor === 'system' ? 'เซิร์ฟเวอร์' : 'ลูกค้า'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-violet-400 font-mono block">
                          เวลา: {step.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-violet-500/25 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderForTimeline(null)}
                className="px-5 py-2.5 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-white font-bold text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SLIP LIGHTBOX */}
      {viewingSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#120E24] border-2 border-emerald-500/60 rounded-3xl p-5 shadow-2xl text-center">
            <button
              onClick={() => setViewingSlipUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-violet-300 hover:text-white hover:bg-violet-950/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-extrabold text-white mb-3 flex items-center justify-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>หลักฐานสลิปการโอนเงิน</span>
            </h4>
            <div className="rounded-2xl overflow-hidden bg-black/60 border border-slate-700 flex items-center justify-center max-h-[70vh]">
              <img src={viewingSlipUrl} alt="สลิปการโอน" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
