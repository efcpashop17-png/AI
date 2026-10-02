import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckCircle2,
  Clock,
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
} from 'lucide-react';
import { TopUpOrder } from '../types';
import { verifySlipWithEasySlip, EasySlipVerifyResult } from '../services/easySlipService';

export const OrderTrackingView: React.FC = () => {
  const {
    orders,
    setSelectedGame,
    games,
    setActiveTab,
    attachSlipAndMarkPaid,
    setNotification,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [easySlipResult, setEasySlipResult] = useState<EasySlipVerifyResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.id.toLowerCase().includes(q) ||
      o.playerUid.toLowerCase().includes(q) ||
      o.gameName.toLowerCase().includes(q) ||
      (o.contactPhone && o.contactPhone.includes(q))
    );
  });

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
          ตรวจสอบประวัติการเติมเกม
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          ค้นหาด้วยรหัสคำสั่งซื้อ (เช่น GP-892410) หรือไอดีเกม (UID) ที่คุณใช้เติม
        </p>

        {/* Search bar */}
        <div className="pt-3 max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="กรอก Order ID หรือ UID ผู้เล่น..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141928] border-2 border-slate-700 focus:border-amber-400 text-white text-sm outline-none shadow-lg placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Orders List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
            <span>รายการคำสั่งซื้อล่าสุด ({filteredOrders.length})</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-amber-400 hover:text-amber-300 font-bold text-[11px]"
              >
                ดูทั้งหมด
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#141928] border-2 border-slate-700 text-center text-slate-400 text-xs">
              ไม่พบรายการคำสั่งซื้อที่ค้นหา
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

              {/* Order Info Grid - Exact 5 Fields Requested by User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#0d111d] border-2 border-slate-700/80 text-xs">
                {/* 1. ชื่อเกมส์ */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold">1. ชื่อเกมส์:</span>
                  <p className="font-black text-white text-sm">{selectedOrder.gameName}</p>
                </div>

                {/* 2. เเพ็กเกจที่เลือก */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold">2. เเพ็กเกจที่เลือก:</span>
                  <div className="flex items-center gap-2">
                    {selectedOrder.packageImageUrl && (
                      <img src={selectedOrder.packageImageUrl} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0 shadow-sm" />
                    )}
                    <p className="font-black text-white text-sm">{selectedOrder.packageName}</p>
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
                  <span>เติมเกมนี้อีกครั้ง</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#141928] border-2 border-slate-700 text-center text-slate-400 text-sm font-medium">
              กรุณาเลือกคำสั่งซื้อจากรายการด้านซ้ายเพื่อดูรายละเอียด
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
    </div>
  );
};
