import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Package,
  History,
  Copy,
  Zap,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Eye,
  X,
  XCircle,
  CreditCard,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Camera,
  Lock,
  User,
  Layers,
  Filter,
} from 'lucide-react';
import { TopUpOrder } from '../types';
import { getOrderItems, formatOrderPackagesNotation, formatPackageQuantityTag } from '../utils/orderHelper';
import { verifySlipWithEasySlip, EasySlipVerifyResult } from '../services/easySlipService';

const formatSafeDate = (d?: string, opts?: Intl.DateTimeFormatOptions) => {
  if (!d) return '-';
  const dateObj = new Date(d);
  return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('th-TH', opts);
};

const formatSafeTime = (d?: string, opts?: Intl.DateTimeFormatOptions) => {
  if (!d) return '-';
  const dateObj = new Date(d);
  return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleTimeString('th-TH', opts);
};

export const OrderTrackingView: React.FC = () => {
  const {
    orders,
    setSelectedGame,
    games,
    setActiveTab,
    attachSlipAndMarkPaid,
    setNotification,
    isAdminLoggedIn,
    currentCustomerUser,
    setIsAdminLoginModalOpen,
    adminLogin,
    customerLogin,
    setSelectedOrderForPackagePopup,
    lastCompletedOrder,
  } = useApp();

  const isLoggedIn = isAdminLoggedIn || !!currentCustomerUser;

  const [guestSearchInput, setGuestSearchInput] = useState('');
  const [guestSearchedOrder, setGuestSearchedOrder] = useState<TopUpOrder | null>(null);

  // Orders strictly associated with logged-in customer user
  const myOrders = useMemo(() => {
    if (!currentCustomerUser) return [];
    const custId = currentCustomerUser.id;
    const custUser = currentCustomerUser.username.toLowerCase().trim();
    const custPhone = currentCustomerUser.contactPhone?.trim();
    const custEmail = currentCustomerUser.contactEmail?.toLowerCase().trim();

    return orders.filter((ord) => {
      if (ord.customerId && ord.customerId === custId) return true;
      if (ord.username && ord.username.toLowerCase().trim() === custUser) return true;
      if (custPhone && custPhone !== '-' && ord.contactPhone && ord.contactPhone.trim() !== '-' && ord.contactPhone.trim() === custPhone) return true;
      if (custEmail && ord.contactEmail && ord.contactEmail.toLowerCase().trim() === custEmail) return true;
      return false;
    });
  }, [orders, currentCustomerUser]);

  // Display orders - Customer ONLY sees their own orders. Admin sees all orders.
  // Guest only sees the order they searched or their just-completed order.
  const userOrders = useMemo(() => {
    if (isAdminLoggedIn) {
      return orders;
    }
    if (currentCustomerUser) {
      if (guestSearchedOrder && !myOrders.some((o) => o.id === guestSearchedOrder.id)) {
        return [guestSearchedOrder, ...myOrders];
      }
      return myOrders;
    }
    // Guest (not logged in) - only show searched order or just-completed order
    if (guestSearchedOrder) {
      return [guestSearchedOrder];
    }
    if (lastCompletedOrder) {
      return [lastCompletedOrder];
    }
    return [];
  }, [orders, currentCustomerUser, myOrders, isAdminLoggedIn, guestSearchedOrder, lastCompletedOrder]);

  const [searchQuery, setSearchQuery] = useState('');
  type StatusFilterType = 'all' | 'pending' | 'success' | 'failed';
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    () => lastCompletedOrder?.id || ''
  );

  // Auto-sync selected order with current list
  useEffect(() => {
    if (lastCompletedOrder?.id) {
      setSelectedOrderId(lastCompletedOrder.id);
    } else if (userOrders.length > 0) {
      if (!selectedOrderId || !userOrders.some((o) => o.id === selectedOrderId)) {
        setSelectedOrderId(userOrders[0].id);
      }
    } else {
      setSelectedOrderId('');
    }
  }, [lastCompletedOrder, userOrders, selectedOrderId]);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [easySlipResult, setEasySlipResult] = useState<EasySlipVerifyResult | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
  const [viewingProofTitle, setViewingProofTitle] = useState<string>('');
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status counts for customer filter badges
  const pendingCount = useMemo(() => {
    return userOrders.filter((o) => o.status !== 'completed' && o.status !== 'failed').length;
  }, [userOrders]);

  const successCount = useMemo(() => {
    return userOrders.filter((o) => o.status === 'completed').length;
  }, [userOrders]);

  const failedCount = useMemo(() => {
    return userOrders.filter((o) => o.status === 'failed').length;
  }, [userOrders]);

  const filteredOrders = useMemo(() => {
    return userOrders.filter((o) => {
      // 1. Status Filter (Pending, Success, Failed)
      if (statusFilter === 'pending') {
        if (o.status === 'completed' || o.status === 'failed') return false;
      } else if (statusFilter === 'success') {
        if (o.status !== 'completed') return false;
      } else if (statusFilter === 'failed') {
        if (o.status !== 'failed') return false;
      }

      // 2. Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const qClean = q.startsWith('@') ? q.slice(1) : q;
      const qPhone = q.replace(/[^0-9]/g, '');

      return (
        o.id.toLowerCase().includes(q) ||
        o.playerUid.toLowerCase().includes(q) ||
        o.gameName.toLowerCase().includes(q) ||
        (o.packageName && o.packageName.toLowerCase().includes(q)) ||
        (o.username && (o.username.toLowerCase().includes(q) || o.username.toLowerCase().includes(qClean))) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.playerNamePreview && o.playerNamePreview.toLowerCase().includes(q)) ||
        (o.contactPhone && o.contactPhone.includes(q)) ||
        (qPhone.length >= 4 && o.contactPhone && o.contactPhone.replace(/[^0-9]/g, '').includes(qPhone))
      );
    });
  }, [userOrders, statusFilter, searchQuery]);

  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = filteredOrders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return filteredOrders[0] || userOrders.find((o) => o.id === selectedOrderId) || userOrders[0] || null;
  }, [filteredOrders, userOrders, selectedOrderId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      type: 'success',
      message: `คัดลอก ${text} เรียบร้อยแล้ว`,
    });
  };

  const handleReorder = (order: TopUpOrder) => {
    const game = games.find((g) => g.id === order.gameId);
    if (game) {
      setSelectedGame(game);
      setActiveTab('store');
    }
  };

  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = guestSearchInput.trim().toLowerCase();
    if (!raw) return;
    const cleanUser = raw.startsWith('@') ? raw.slice(1) : raw;
    const cleanPhone = raw.replace(/[^0-9]/g, '');

    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === raw ||
        o.id.toLowerCase().includes(raw) ||
        (o.playerUid && o.playerUid.toLowerCase() === raw) ||
        (o.playerUid && o.playerUid.toLowerCase().includes(raw)) ||
        (o.username && (o.username.toLowerCase() === cleanUser || o.username.toLowerCase().includes(cleanUser))) ||
        (o.customerName && o.customerName.toLowerCase().includes(raw)) ||
        (o.playerNamePreview && o.playerNamePreview.toLowerCase().includes(raw)) ||
        (cleanPhone.length >= 4 && o.contactPhone && o.contactPhone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );
    if (found) {
      setGuestSearchedOrder(found);
      setSelectedOrderId(found.id);
      setNotification({
        type: 'success',
        message: `พบคำสั่งซื้อ ${found.id} (${found.gameName} - ไอดี: ${found.playerUid})`,
      });
    } else {
      setNotification({
        type: 'error',
        message: `ไม่พบคำสั่งซื้อสำหรับ "${guestSearchInput}" กรุณาตรวจสอบรหัสออเดอร์ ไอดีเกม หรือเบอร์โทรอีกครั้ง`,
      });
    }
  };

  const handleAttachSlipFromTracking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedOrder) {
      if (file.size > 10 * 1024 * 1024) {
        setNotification({
          type: 'error',
          message: 'ขนาดไฟล์รูปภาพเกิน 10MB',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        if (!result) return;

        setIsVerifyingSlip(true);
        setEasySlipResult(null);

        try {
          const verifyRes = await verifySlipWithEasySlip(result, selectedOrder.price, true);
          setEasySlipResult(verifyRes);

          if (verifyRes.success) {
            attachSlipAndMarkPaid(selectedOrder.id, result);
            setNotification({
              type: 'success',
              message: `🎉 สลิปผ่านการตรวจสอบโดย EasySlip สำเร็จ! ยอดโอน ฿${verifyRes.amount?.toLocaleString()} (Ref: ${verifyRes.transRef || '-'})`,
            });
          } else {
            attachSlipAndMarkPaid(selectedOrder.id, result);
            setNotification({
              type: 'error',
              message: verifyRes.message || 'สลิปนี้ไม่ผ่านการตรวจสอบ EasySlip กรุณาตรวจสอบรูปภาพ',
            });
          }
        } catch (err: any) {
          console.error('Slip check error in tracking', err);
          attachSlipAndMarkPaid(selectedOrder.id, result);
        } finally {
          setIsVerifyingSlip(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141928] text-amber-400 border border-slate-700 text-xs font-bold">
          <History className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
          <span>ระบบติดตามสถานะคำสั่งซื้อแบบเรียลไทม์</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white font-display">
          ตรวจสอบประวัติการเติมเกม &amp; เช็คไอดี (UID)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          ค้นหาด้วยไอดีเกม (UID), ยูสผู้ใช้ (@username), รหัสคำสั่งซื้อ (เช่น GP-892410) หรือเบอร์โทร
        </p>

        {guestSearchedOrder && (
          <div className="p-3.5 bg-amber-400/15 border-2 border-amber-400/60 rounded-2xl flex items-center justify-between text-xs text-amber-200 shadow-md">
            <span className="font-bold flex items-center gap-1.5">
              <span>🔎 ผลการค้นหาออเดอร์:</span>
              <strong className="text-amber-400 font-mono text-sm">{guestSearchedOrder.id}</strong>
              <span className="text-slate-300">({guestSearchedOrder.gameName})</span>
            </span>
            <button
              type="button"
              onClick={() => { setGuestSearchedOrder(null); setGuestSearchInput(''); }}
              className="text-xs bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-black hover:bg-amber-300 shadow cursor-pointer transition-all hover:scale-105"
            >
              ค้นหารหัสอื่น
            </button>
          </div>
        )}

        {/* Customer Orders Badge */}
        {currentCustomerUser && (
          <div className="pt-2 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 bg-[#141928] px-4 py-2 rounded-2xl border-2 border-slate-700 text-xs sm:text-sm font-bold text-amber-400 shadow-md">
              <History className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>ออเดอร์ของฉัน ({myOrders.length} รายการ)</span>
            </div>
          </div>
        )}

        {/* Quick Search and Tracking Form */}
        <div className="pt-3 max-w-xl mx-auto space-y-2">
          <form onSubmit={handleGuestSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <input
                type="text"
                value={guestSearchInput}
                onChange={(e) => {
                  setGuestSearchInput(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                placeholder="ค้นหาด่วนด้วย ไอดีเกม (UID), ยูสผู้ใช้, รหัสคำสั่งซื้อ หรือเบอร์โทร..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141928] border-2 border-slate-700 focus:border-amber-400 text-white text-xs sm:text-sm outline-none shadow-lg placeholder:text-slate-500 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shrink-0 transition-all hover:scale-105 cursor-pointer shadow-lg"
            >
              ค้นหา
            </button>
          </form>

          {!isLoggedIn && (
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
              <span>เป็นสมาชิกลูกค้าราคาส่ง?</span>
              <button
                type="button"
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                เข้าสู่ระบบที่นี่
              </button>
            </div>
          )}
        </div>

        {/* Status Filtering Tabs (All, Pending, Success, Failed) */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20 scale-105'
                : 'bg-[#141928] text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ทั้งหมด (All)</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                statusFilter === 'all'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {userOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-105'
                : 'bg-[#141928] text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>รอดำเนินการ (Pending)</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                statusFilter === 'pending'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-amber-950/60 text-amber-300'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('success')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              statusFilter === 'success'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-400/25 scale-105'
                : 'bg-[#141928] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-400/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>สำเร็จ (Success)</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                statusFilter === 'success'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-emerald-950/60 text-emerald-300'
              }`}
            >
              {successCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              statusFilter === 'failed'
                ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/25 scale-105'
                : 'bg-[#141928] text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-400/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ยกเลิก (Failed)</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                statusFilter === 'failed'
                  ? 'bg-slate-950/20 text-white'
                  : 'bg-rose-950/60 text-rose-300'
              }`}
            >
              {failedCount}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Orders List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {statusFilter === 'all' && 'รายการคำสั่งซื้อทั้งหมด'}
                {statusFilter === 'pending' && 'รายการรอดำเนินการ'}
                {statusFilter === 'success' && 'รายการสำเร็จแล้ว'}
                {statusFilter === 'failed' && 'รายการที่ยกเลิก'}
                {' '}({filteredOrders.length})
              </span>
            </div>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-amber-400 hover:text-amber-300 font-bold text-[11px] cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#141928] border-2 border-slate-700 text-center text-slate-400 text-xs space-y-2.5">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">ไม่พบรายการคำสั่งซื้อในหมวดหมู่นี้</p>
              {(statusFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow transition-all hover:scale-105"
                >
                  แสดงรายการทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const isPaid = ord.paymentStatus === 'paid' || !!ord.slipUrl;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'bg-[#1b2234] border-amber-400 shadow-xl shadow-black/50'
                        : 'bg-[#141928] border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-black text-amber-400">
                        {ord.id}
                      </span>
                      <div className="flex items-center gap-1">
                        {isPaid && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            📎 สลิปแล้ว
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            ord.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ord.status === 'completed'
                            ? 'สำเร็จแล้ว'
                            : isPaid
                            ? 'ชำระเงินแล้ว'
                            : 'รอชำระ'}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-black text-sm text-white line-clamp-1">
                      {ord.gameName}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium">{ord.packageName}</p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-xs">
                      <span className="font-mono text-slate-400 text-[11px]">
                        UID: {ord.playerUid.slice(0, 8)}...
                      </span>
                      <span className="font-mono font-black text-amber-400">
                        ฿{ord.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{formatSafeDate(ord.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-mono font-bold">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>เวลา {formatSafeTime(ord.createdAt, { hour: '2-digit', minute: '2-digit' })} น.</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Selected Order Details & Animated Timeline */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="rounded-3xl bg-[#141928] border-2 border-slate-700 p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">
                    รายละเอียดคำสั่งซื้อ
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white font-mono">
                      {selectedOrder.id}
                    </h3>
                    <button
                      onClick={() => handleCopy(selectedOrder.id)}
                      className="p-1.5 rounded-lg bg-[#1b2234] hover:bg-[#222b42] text-amber-400 border border-slate-700 cursor-pointer"
                      title="คัดลอกรหัส"
                    >
                      <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 bg-[#0b0e17] px-2.5 py-1 rounded-lg border border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>วันที่สั่งซื้อ:</span>
                      <strong className="text-amber-300">
                        {formatSafeDate(selectedOrder.createdAt, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                      </strong>
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 bg-[#0b0e17] px-2.5 py-1 rounded-lg border border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>เวลาสั่งซื้อ:</span>
                      <strong className="text-cyan-300 font-mono">
                        {formatSafeTime(selectedOrder.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-3.5 py-1.5 rounded-full ${
                      selectedOrder.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50'
                        : selectedOrder.paymentStatus === 'paid' || !!selectedOrder.slipUrl
                        ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50'
                        : selectedOrder.status === 'processing'
                        ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 animate-pulse'
                        : 'bg-slate-800 text-slate-200 border-2 border-slate-600'
                    }`}
                  >
                    {selectedOrder.status === 'completed'
                      ? '✅ เติมเข้าเกมเรียบร้อยแล้ว'
                      : selectedOrder.paymentStatus === 'paid' || !!selectedOrder.slipUrl
                      ? '✅ ชำระเงินแล้ว (แนบสลิปเรียบร้อย)'
                      : selectedOrder.status === 'processing'
                      ? '⏳ กำลังตรวจสอบและส่งเหรียญเข้าไอดี'
                      : '💳 รอชำระเงิน'}
                  </span>
                </div>
              </div>

              {/* Highlighted Pop-up Banner for Order Packages */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_30px_rgba(251,191,36,0.35)] border-2 border-amber-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-300 flex items-center justify-center font-bold text-xl shrink-0 shadow">
                    📦
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 block">
                      รหัสแพ็กเกจที่สั่งซื้อ (กดเปิดดูป๊อปอัพ):
                    </span>
                    <span className="font-mono font-black text-xl text-slate-950 block">
                      {formatOrderPackagesNotation(selectedOrder)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderForPackagePopup(selectedOrder)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>🔍 กดเปิดป๊อปอัพดูเต็มๆ</span>
                </button>
              </div>

              {/* Order Info Grid - Exact 5 Fields Requested by User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#0d111d] border-2 border-slate-700/80 text-xs">
                {/* 1. ชื่อเกมส์ */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold">1. ชื่อเกมส์:</span>
                  <p className="font-black text-white text-sm">{selectedOrder.gameName}</p>
                </div>

                {/* 2. เเพ็กเกจและรายการที่เลือก */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">2. เเพ็กเกจและรายการที่สั่งซื้อ:</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {formatOrderPackagesNotation(selectedOrder)}
                    </span>
                  </div>

                  {/* Pop-up Button: กดดูเเล้วมันจะมีออเดอร์ที่สั่งเด้งขึ้นมา 12800x10 5700x10 3250x2 */}
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForPackagePopup(selectedOrder)}
                    className="w-full my-1.5 px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
                    title="เปิดป๊อปอัพดูรหัสออเดอร์ที่สั่ง (12800x10...)"
                  >
                    <Package className="w-5 h-5 stroke-[2.5]" />
                    <span>📦 กดดูรหัสออเดอร์ที่สั่ง ({formatOrderPackagesNotation(selectedOrder)})</span>
                  </button>

                  {/* Badges for shop notation: e.g. 12800x10  5700x10  3250x2 */}
                  <div
                    onClick={() => setSelectedOrderForPackagePopup(selectedOrder)}
                    className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#141928] border border-amber-400/70 hover:border-amber-400 cursor-pointer transition-colors"
                    title="คลิกเพื่อเปิดป๊อปอัพ"
                  >
                    <span className="text-[11px] text-slate-400 font-bold mr-1">รหัสแพ็ก:</span>
                    {getOrderItems(selectedOrder).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black font-mono text-xs sm:text-sm shadow-sm"
                      >
                        {formatPackageQuantityTag(item)}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2 mt-2">
                    {getOrderItems(selectedOrder).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#141928] border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0 shadow-sm" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{item.packageName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-xs font-mono">
                                {formatPackageQuantityTag(item)}
                              </span>
                            </div>
                            <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                              ได้รับในเกม: {item.totalItemAmount.toLocaleString()} {item.inGameItem}
                              {item.totalBonusAmount && item.totalBonusAmount > 0 ? ` (+โบนัส ${item.totalBonusAmount} ${item.inGameItem})` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            ฿{item.totalPrice.toLocaleString()}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              (ชิ้นละ ฿{item.unitPrice.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. ชื่อ User */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold">3. ชื่อ User:</span>
                  <p className="font-mono font-black text-emerald-400 text-sm flex items-center gap-2 flex-wrap">
                    <span>
                      {selectedOrder.playerNamePreview
                        ? selectedOrder.playerNamePreview
                        : selectedOrder.customerName || selectedOrder.playerUid}
                    </span>
                    {selectedOrder.playerNamePreview && (
                      <span className="text-xs text-slate-400 font-normal">
                        (UID: {selectedOrder.playerUid}{selectedOrder.serverId ? ` | เซิร์ฟ: ${selectedOrder.serverId}` : ''})
                      </span>
                    )}
                  </p>
                </div>

                {/* 4. ยอดชำระเงิน */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold">4. ยอดชำระเงิน:</span>
                  <p className="font-mono font-black text-amber-400 text-base">
                    ฿{selectedOrder.price.toLocaleString()}
                  </p>
                </div>

                {/* 5. สถานะคำสั่งซื้อ */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold">5. สถานะคำสั่งซื้อ:</span>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm ${
                        selectedOrder.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : selectedOrder.status === 'processing'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : selectedOrder.paymentStatus === 'paid' || !!selectedOrder.slipUrl
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : selectedOrder.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {selectedOrder.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ส่งสำเร็จเเล้ว</span>
                        </>
                      ) : selectedOrder.status === 'processing' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>กำลังดำเนินการ</span>
                        </>
                      ) : selectedOrder.paymentStatus === 'paid' || !!selectedOrder.slipUrl ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ชำระเงินแล้ว (กำลังดำเนินการ)</span>
                        </>
                      ) : selectedOrder.status === 'failed' ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>ยกเลิก</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>รอชำระเงิน</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium capitalize">
                      ({selectedOrder.paymentMethod})
                    </span>
                  </div>
                </div>

                {/* 6. วันที่และเวลาที่สั่งซื้อ (User Requested) */}
                <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-xl bg-[#141928] border border-amber-400/40">
                  <span className="text-amber-400 font-bold block text-xs">
                    6. วันที่และเวลาที่สั่งซื้อ (Order Placed Date &amp; Time):
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-slate-200 font-bold text-xs bg-[#0b0e17] px-3 py-1.5 rounded-lg border border-slate-700">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>วันที่สั่งซื้อ:</span>
                      <strong className="text-amber-300">
                        {formatSafeDate(selectedOrder.createdAt, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-200 font-bold text-xs bg-[#0b0e17] px-3 py-1.5 rounded-lg border border-slate-700">
                      <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>เวลาสั่งซื้อ:</span>
                      <strong className="text-cyan-300 font-mono">
                        {formatSafeTime(selectedOrder.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* SLIP ATTACHMENT CARD */}
              <div className="p-4 rounded-2xl bg-[#0d111d] border-2 border-slate-700/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-black text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>หลักฐานสลิปการโอนเงิน</span>
                  </span>
                  {selectedOrder.slipUrl ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แนบสลิปเรียบร้อยแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-bold">
                      ยังไม่ได้แนบสลิป
                    </span>
                  )}
                </div>

                {selectedOrder.slipUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-[#141928] border border-slate-700">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div
                        onClick={() => setViewingSlipUrl(selectedOrder.slipUrl || null)}
                        className="w-16 h-16 rounded-xl overflow-hidden bg-black border-2 border-amber-400/50 hover:border-amber-400 cursor-pointer shrink-0 transition-transform hover:scale-105 relative group shadow-md"
                        title="คลิกเพื่อดูรูปสลิปขนาดเต็ม"
                      >
                        <img
                          src={selectedOrder.slipUrl}
                          alt="สลิปการโอนเงิน"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-black text-white">
                          สลิปการโอนยอด ฿{selectedOrder.price.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-emerald-300 font-medium">
                          ✅ อัปเดตสถานะเป็น &quot;ชำระเงินแล้ว&quot; ทันที
                        </p>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          คลิกที่รูปเพื่อเปิดดูภาพขยาย
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingSlipUrl(selectedOrder.slipUrl || null)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#1f283e] hover:bg-[#283452] text-amber-400 hover:text-white text-xs font-bold border border-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เปิดดูสลิปขนาดเต็ม</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#141928] border border-slate-700 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-200 font-medium block">
                          หากชำระเงินแล้วแต่ยังไม่ได้แนบสลิป สามารถแนบสลิปที่นี่เพื่อตรวจผ่าน EasySlip อัตโนมัติได้ทันที
                        </span>
                        <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> เชื่อมต่อ EasySlip AI ตรวจยอดเงินและชื่อบัญชีตรงกัน
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAttachSlipFromTracking}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isVerifyingSlip}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          {isVerifyingSlip ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>EasySlip กำลังตรวจ...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>แนบสลิปโอนเงิน</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {easySlipResult && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          easySlipResult.success
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        {easySlipResult.success ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            <span>
                              {easySlipResult.success
                                ? '⚡ ยืนยันสลิปสำเร็จ (EasySlip AI)'
                                : '⚠️ ไม่สามารถตรวจสอบสลิปได้'}
                            </span>
                            {easySlipResult.transRef && (
                              <span className="font-mono text-[10px] text-cyan-300">
                                Ref: {easySlipResult.transRef}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] opacity-90 mt-0.5">{easySlipResult.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DELIVERY PROOF CARD (2 SEPARATE SLOTS: PRE-DELIVERY & POST-DELIVERY) */}
              {(selectedOrder.status === 'completed' || selectedOrder.preDeliveryImageUrl || selectedOrder.postDeliveryImageUrl) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0d111d] border-2 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm sm:text-base text-white block font-heading">
                          📸 หลักฐานการจัดส่งสินค้า (Proof of Delivery)
                        </span>
                        <span className="text-[11px] text-slate-300">
                          ตรวจสอบรูปภาพจำนวนของก่อนส่งและหลังส่งโดยแอดมิน เพื่อความโปร่งใส 100%
                        </span>
                      </div>
                    </div>

                    {(selectedOrder.preDeliveryImageUrl || selectedOrder.postDeliveryImageUrl) && (
                      <button
                        type="button"
                        onClick={() => setIsComparisonModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
                      >
                        <Eye className="w-4 h-4" />
                        <span>กดดูแบบ 2 ช่องเปรียบเทียบเต็มจอ</span>
                      </button>
                    )}
                  </div>

                  {/* 2 Distinct Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Box 1: Pre-delivery (ภาพก่อนส่ง) */}
                    <div className="p-3.5 rounded-xl bg-[#141928] border border-slate-700/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>ช่องที่ 1: จำนวนของก่อนส่ง</span>
                        </span>
                        {selectedOrder.preDeliveryImageUrl ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            แนบภาพแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            รอแอดมินแนบ
                          </span>
                        )}
                      </div>

                      {selectedOrder.preDeliveryImageUrl ? (
                        <div className="space-y-2">
                          <div
                            onClick={() => {
                              setViewingProofUrl(selectedOrder.preDeliveryImageUrl || null);
                              setViewingProofTitle(`รูปที่ 1: จำนวนของก่อนส่ง (Pre-delivery) - ออเดอร์ ${selectedOrder.id}`);
                            }}
                            className="relative w-full h-44 rounded-xl overflow-hidden bg-black border border-amber-400/40 hover:border-amber-400 cursor-pointer group shadow-md flex items-center justify-center transition-all"
                            title="คลิกเพื่อดูรูปขยาย"
                          >
                            <img
                              src={selectedOrder.preDeliveryImageUrl}
                              alt="ภาพก่อนส่ง"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                              <span className="text-xs font-bold text-white">คลิกเพื่อดูภาพเต็ม</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingProofUrl(selectedOrder.preDeliveryImageUrl || null);
                              setViewingProofTitle(`รูปที่ 1: จำนวนของก่อนส่ง (Pre-delivery) - ออเดอร์ ${selectedOrder.id}`);
                            }}
                            className="w-full py-1.5 rounded-lg bg-[#1e273d] hover:bg-[#283552] text-amber-400 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูภาพขยายก่อนส่ง</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-44 rounded-xl bg-[#0b0e17] border border-dashed border-slate-700 flex flex-col items-center justify-center p-4 text-center">
                          <Camera className="w-8 h-8 text-slate-600 mb-1.5" />
                          <span className="text-xs font-bold text-slate-400">ยังไม่มีภาพก่อนส่ง</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            แอดมินจะแคปภาพยอดเดิมในไอดีก่อนเริ่มส่งเหรียญ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Box 2: Post-delivery (ภาพหลังส่ง) */}
                    <div className="p-3.5 rounded-xl bg-[#141928] border border-slate-700/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-cyan-400" />
                          <span>ช่องที่ 2: จำนวนของหลังส่ง</span>
                        </span>
                        {selectedOrder.postDeliveryImageUrl ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            แนบภาพแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            รอแอดมินแนบ
                          </span>
                        )}
                      </div>

                      {selectedOrder.postDeliveryImageUrl ? (
                        <div className="space-y-2">
                          <div
                            onClick={() => {
                              setViewingProofUrl(selectedOrder.postDeliveryImageUrl || null);
                              setViewingProofTitle(`รูปที่ 2: จำนวนของหลังส่ง (Post-delivery) - ออเดอร์ ${selectedOrder.id}`);
                            }}
                            className="relative w-full h-44 rounded-xl overflow-hidden bg-black border border-cyan-400/40 hover:border-cyan-400 cursor-pointer group shadow-md flex items-center justify-center transition-all"
                            title="คลิกเพื่อดูรูปขยาย"
                          >
                            <img
                              src={selectedOrder.postDeliveryImageUrl}
                              alt="ภาพหลังส่ง"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                              <span className="text-xs font-bold text-white">คลิกเพื่อดูภาพเต็ม</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingProofUrl(selectedOrder.postDeliveryImageUrl || null);
                              setViewingProofTitle(`รูปที่ 2: จำนวนของหลังส่ง (Post-delivery) - ออเดอร์ ${selectedOrder.id}`);
                            }}
                            className="w-full py-1.5 rounded-lg bg-[#1e273d] hover:bg-[#283552] text-cyan-400 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูภาพขยายหลังส่ง</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-44 rounded-xl bg-[#0b0e17] border border-dashed border-slate-700 flex flex-col items-center justify-center p-4 text-center">
                          <Camera className="w-8 h-8 text-slate-600 mb-1.5" />
                          <span className="text-xs font-bold text-slate-400">ยังไม่มีภาพหลังส่ง</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            เมื่อแอดมินส่งของสำเร็จจะแคปภาพยอดเหรียญใหม่ให้ตรวจ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Timeline - บันทึกความคืบหน้าระบบอัตโนมัติ */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    <span>บันทึกความคืบหน้าระบบอัตโนมัติ</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (แอดมินกำหนดจากหลังบ้านได้ / อัปเดตเมื่อแนบสลิปทันที)
                  </span>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-700 space-y-4 pt-1">
                  {selectedOrder.timeline.map((step, idx) => {
                    const isCompletedStep = step.status === 'completed';
                    const isVerifyingStep = step.status === 'verifying';
                    const isProcessingStep = step.status === 'processing';
                    const isPaidDesc =
                      step.description.includes('ชำระเงิน') || step.description.includes('สลิป');

                    return (
                      <div key={idx} className="relative group">
                        <div
                          className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            isCompletedStep
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                              : isVerifyingStep || isPaidDesc
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                              : isProcessingStep
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse'
                              : 'bg-slate-500'
                          }`}
                        />
                        <div className="p-3 rounded-xl bg-[#0d111d] border border-slate-700/60 hover:border-slate-600 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-black text-white leading-relaxed">
                              {step.description}
                            </p>
                            {step.actor && (
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                  step.actor === 'customer'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                    : step.actor === 'admin'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {step.actor === 'customer'
                                  ? 'ลูกค้าแนบสลิป'
                                  : step.actor === 'admin'
                                  ? 'แอดมินหลังบ้าน'
                                  : 'ระบบอัตโนมัติ'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono mt-1 font-semibold">
                            เวลาบันทึก: {step.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action: Reorder button */}
              <div className="pt-4 border-t-2 border-slate-800 flex justify-end">
                <button
                  onClick={() => handleReorder(selectedOrder)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xl shadow-amber-400/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>ซื้อแพ็กเกจนี้อีกครั้ง</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#141928] border-2 border-slate-700 text-center text-slate-400 text-sm font-medium space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p>ไม่พบรายการคำสั่งซื้อของบัญชีนี้</p>
              <button
                type="button"
                onClick={() => setActiveTab('store')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR FULL-SIZE SLIP IMAGE */}
      {viewingSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-xl w-full bg-[#141928] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setViewingSlipUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-black text-white">หลักฐานสลิปการโอนเงิน</h4>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700 max-h-[70vh]">
              <img
                src={viewingSlipUrl}
                alt="ภาพสลิปขนาดเต็ม"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSlipUrl(null)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DELIVERY PROOF LIGHTBOX */}
      {viewingProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-[#141928] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setViewingProofUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-cyan-400" />
              <h4 className="text-base font-black text-white">{viewingProofTitle}</h4>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700 max-h-[75vh]">
              <img
                src={viewingProofUrl}
                alt="ภาพหลักฐานการจัดส่ง"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProofUrl(null)}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN SIDE-BY-SIDE PROOF COMPARISON MODAL */}
      {isComparisonModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative max-w-5xl w-full bg-[#121624] border-2 border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl my-8 text-white">
            <button
              type="button"
              onClick={() => setIsComparisonModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Camera className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-block mb-1">
                  SIDE-BY-SIDE PROOF OF DELIVERY
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  เปรียบเทียบภาพหลักฐาน: ก่อนส่ง vs หลังส่ง
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  คำสั่งซื้อ: <span className="font-mono text-amber-400 font-bold">{selectedOrder.id}</span> | {selectedOrder.gameName} ({selectedOrder.packageName}) | UID: <span className="font-mono text-emerald-400 font-bold">{selectedOrder.playerUid}</span>
                </p>
              </div>
            </div>

            {/* Side-by-Side Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Left Column: Pre-delivery */}
              <div className="p-4 rounded-2xl bg-[#0b0e17] border-2 border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-amber-400 flex items-center gap-1.5 font-heading">
                    <Camera className="w-4 h-4" />
                    <span>ช่องที่ 1: ภาพจำนวนของก่อนส่ง (Pre-delivery)</span>
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                    ก่อนเติม
                  </span>
                </div>

                {selectedOrder.preDeliveryImageUrl ? (
                  <div className="w-full h-72 sm:h-80 rounded-xl overflow-hidden bg-black border border-slate-700 flex items-center justify-center">
                    <img
                      src={selectedOrder.preDeliveryImageUrl}
                      alt="ก่อนส่ง"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-72 sm:h-80 rounded-xl bg-[#121624] border border-dashed border-slate-700 flex flex-col items-center justify-center p-6 text-center">
                    <Camera className="w-10 h-10 text-slate-600 mb-2" />
                    <span className="text-xs font-bold text-slate-400">ยังไม่มีภาพก่อนส่ง</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 text-center">
                  ภาพบันทึกยอดเหรียญ/เพชรเดิมในไอดีก่อนเริ่มเติม
                </p>
              </div>

              {/* Right Column: Post-delivery */}
              <div className="p-4 rounded-2xl bg-[#0b0e17] border-2 border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 font-heading">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ช่องที่ 2: ภาพจำนวนของหลังส่ง (Post-delivery)</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    ส่งมอบสำเร็จ
                  </span>
                </div>

                {selectedOrder.postDeliveryImageUrl ? (
                  <div className="w-full h-72 sm:h-80 rounded-xl overflow-hidden bg-black border border-slate-700 flex items-center justify-center">
                    <img
                      src={selectedOrder.postDeliveryImageUrl}
                      alt="หลังส่ง"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-72 sm:h-80 rounded-xl bg-[#121624] border border-dashed border-slate-700 flex flex-col items-center justify-center p-6 text-center">
                    <Camera className="w-10 h-10 text-slate-600 mb-2" />
                    <span className="text-xs font-bold text-slate-400">ยังไม่มีภาพหลังส่ง</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 text-center">
                  ภาพยืนยันยอดเหรียญ/แพ็กเกจใหม่ที่เข้าไอดีผู้เล่นเรียบร้อย
                </p>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700 text-xs">
              <span className="text-slate-300">
                หากพบปัญหาหรือยอดเหรียญไม่ตรง สามารถแคปหน้านี้และส่งให้แอดมินช่วยตรวจสอบได้ตลอดเวลา
              </span>
              <button
                type="button"
                onClick={() => setIsComparisonModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
