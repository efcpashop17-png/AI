import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopUpOrder } from '../types';
import { formatSafeDate, formatSafeTime } from '../utils/dateHelper';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  Eye,
  X,
  Sparkles,
  Gamepad2,
  Calendar,
} from 'lucide-react';

export const LiveOrderFeed: React.FC = () => {
  const { orders } = useApp();
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<TopUpOrder | null>(null);

  // Status mapping as requested:
  // ส่งสำเร็จเเล้ว | ยกเลิก | กำลังดำเนินการ | หรือข้อความที่แอดมินพิมพ์
  const getStatusBadge = (order: TopUpOrder) => {
    if (order.customStatus) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          {order.customStatus}
        </span>
      );
    }

    switch (order.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ส่งสำเร็จเเล้ว
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            ยกเลิก
          </span>
        );
      case 'processing':
      case 'verifying':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            กำลังดำเนินการ
          </span>
        );
    }
  };

  // Mask UID for privacy (e.g. 384***294)
  const maskUid = (uid: string) => {
    if (!uid) return '-';
    if (uid.length <= 4) return uid;
    return `${uid.slice(0, 3)}***${uid.slice(-3)}`;
  };

  const recentOrders = orders.slice(0, 10);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="cyber-panel p-6 sm:p-8 rounded-3xl border border-violet-500/30 relative overflow-hidden">
        {/* Glow Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-violet-500/20 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/40 text-xs font-bold text-cyan-300 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE ORDERS FEED</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ออเดอร์สต็อกล่าสุดหน้าร้าน
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              แสดงรายการสั่งซื้อที่ลูกค้าสั่งเข้ามา พร้อมตรวจสอบความโปร่งใสและดูสลิปที่แนบมาได้
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-[#120E24] border border-violet-500/30 text-right">
              <span className="text-[11px] text-violet-300/80 block">ออเดอร์ทั้งหมดในระบบ</span>
              <span className="text-base font-extrabold text-white font-mono">
                {orders.length} รายการ
              </span>
            </div>
          </div>
        </div>

        {/* Orders Table & Cards */}
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-violet-500/20 text-[11px] uppercase tracking-wider text-violet-300/80">
                <th className="pb-3 font-semibold pl-2">เกม & แพ็กเกจ</th>
                <th className="pb-3 font-semibold">ผู้สั่งซื้อ (UID/User)</th>
                <th className="pb-3 font-semibold">ยอดรวม</th>
                <th className="pb-3 font-semibold">สถานะคำสั่งซื้อ</th>
                <th className="pb-3 font-semibold">วันที่ &amp; เวลา</th>
                <th className="pb-3 font-semibold text-center pr-2">หลักฐานสลิป</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-500/10 text-sm">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-violet-950/20 transition-colors">
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-900/40 border border-violet-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block text-sm leading-snug">
                          {ord.gameName}
                        </span>
                        <span className="text-xs text-violet-300/90 font-medium">
                          {ord.packageName}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5">
                    <div className="font-mono text-xs text-slate-200">
                      <span className="text-violet-400 font-bold">UID:</span> {maskUid(ord.playerUid)}
                    </div>
                    {ord.playerNamePreview && (
                      <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                        {ord.playerNamePreview}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 font-bold font-mono text-emerald-400">
                    ฿{(ord.price || 0).toLocaleString()}
                  </td>

                  <td className="py-3.5">
                    {getStatusBadge(ord)}
                    {ord.adminNote && (
                      <span className="text-[11px] text-violet-300 block mt-1">
                        ข้อความ: {ord.adminNote}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 text-xs text-slate-300 font-mono">
                    <div className="font-semibold text-slate-200">
                      📅 {formatSafeDate(ord.createdAt, { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-[11px] text-amber-300 font-bold">
                      ⏰ {formatSafeTime(ord.createdAt, { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                  </td>

                  <td className="py-3.5 pr-2 text-center">
                    {ord.slipUrl ? (
                      <button
                        onClick={() => setSelectedSlipOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูสลิป</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">
                        ไม่มีสลิปแนบ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Modal Lightbox */}
      {selectedSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="cyber-panel w-full max-w-md rounded-3xl border border-violet-500/40 p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSlipOrder(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-violet-950/80 hover:bg-violet-900 border border-violet-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>หลักฐานการโอนเงิน (สลิปชำระเงิน)</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              คำสั่งซื้อ #{selectedSlipOrder.id}
            </h3>

            <div className="p-3 rounded-2xl bg-[#120E24] border border-violet-500/20 text-xs space-y-1.5 mb-4 text-slate-300">
              <div className="flex justify-between">
                <span>เกม:</span>
                <span className="font-bold text-white">{selectedSlipOrder.gameName}</span>
              </div>
              <div className="flex justify-between">
                <span>แพ็กเกจ:</span>
                <span className="font-medium text-violet-200">{selectedSlipOrder.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดเงินตามสลิป:</span>
                <span className="font-bold font-mono text-emerald-400">฿{selectedSlipOrder.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>เวลาทำรายการ:</span>
                <span className="font-mono text-slate-300">
                  {new Date(selectedSlipOrder.createdAt).toLocaleString('th-TH')}
                </span>
              </div>
            </div>

            {/* Slip Image */}
            <div className="rounded-2xl overflow-hidden border border-violet-500/40 bg-black/60 p-2 shadow-inner">
              <img
                src={selectedSlipOrder.slipUrl}
                alt="สลิปโอนเงิน"
                className="w-full max-h-[420px] object-contain rounded-xl mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80';
                }}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-violet-500/20 flex justify-end">
              <button
                onClick={() => setSelectedSlipOrder(null)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
