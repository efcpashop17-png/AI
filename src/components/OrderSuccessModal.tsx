import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  Gamepad2,
  Copy,
} from 'lucide-react';

export const OrderSuccessModal: React.FC = () => {
  const {
    isOrderSuccessModalOpen,
    setIsOrderSuccessModalOpen,
    lastCompletedOrder,
    setActiveTab,
    setNotification,
  } = useApp();

  if (!isOrderSuccessModalOpen || !lastCompletedOrder) return null;

  const order = lastCompletedOrder;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      type: 'success',
      message: `คัดลอกรหัสคำสั่งซื้อ ${text} เรียบร้อยแล้ว`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#131826] border-2 border-emerald-500 p-6 sm:p-8 shadow-2xl shadow-black text-white my-8">
        {/* Close Button */}
        <button
          onClick={() => setIsOrderSuccessModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950 stroke-[3]" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
            เติมเงินสำเร็จแล้ว!
          </h3>
          <p className="text-sm text-emerald-400 font-bold">
            ระบบส่ง {order.itemAmount} {order.inGameItem} เข้าไอดีของคุณเรียบร้อย
          </p>
        </div>

        {/* Order Details Receipt Card */}
        <div className="rounded-2xl bg-[#0d111d] border-2 border-slate-700/80 p-5 space-y-3.5 mb-6 text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400">รหัสคำสั่งซื้อ:</span>
            <button
              onClick={() => handleCopy(order.id)}
              className="flex items-center gap-1.5 font-mono font-black text-amber-400 hover:text-amber-300 text-xs px-2.5 py-1 rounded-lg bg-[#141928] border border-slate-700"
            >
              <span>{order.id}</span>
              <Copy className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold text-slate-400">เกม:</span>
            <span className="font-extrabold text-white">{order.gameName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold text-slate-400">แพ็กเกจ:</span>
            <span className="font-extrabold text-white">{order.packageName}</span>
          </div>

          {order.items && order.items.length > 1 && (
            <div className="p-3 rounded-xl bg-[#141928] border border-slate-700/80 space-y-2 text-xs">
              <span className="font-black text-slate-300 block text-[11px]">รายการทั้งหมดในคำสั่งซื้อนี้:</span>
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-300">
                  <span className="font-medium">{it.gameName} - {it.packageName} x{it.quantity}</span>
                  <span className="font-mono font-bold text-amber-400">฿{(it.unitPrice * it.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold text-slate-400">ไอดีเกม (UID):</span>
            <span className="font-mono text-xs font-black text-emerald-400">
              {order.playerUid}
            </span>
          </div>

          {order.playerNamePreview && (
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-bold text-slate-400">ชื่อตัวละคร:</span>
              <span className="font-bold text-white">{order.playerNamePreview}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold text-slate-400">ยอดเงินที่ชำระ:</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              ฿{order.price.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400">เวลาที่ทำรายการ:</span>
            <span className="text-xs text-slate-300 font-mono">
              {new Date(order.createdAt).toLocaleString('th-TH')}
            </span>
          </div>
        </div>

        {/* Live Timeline Steps */}
        <div className="rounded-2xl bg-[#0d111d] border-2 border-slate-700/80 p-4 mb-6">
          <span className="text-xs font-black text-slate-200 block mb-3">
            ขั้นตอนการดำเนินการอัตโนมัติ
          </span>
          <div className="space-y-3">
            {order.timeline.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1">
                  <span className="text-slate-200 font-semibold">{step.description}</span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              setIsOrderSuccessModalOpen(false);
              setActiveTab('tracking');
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-[#1b2234] hover:bg-[#222b42] text-slate-200 hover:text-white font-black text-xs sm:text-sm border-2 border-slate-700 transition-all text-center cursor-pointer"
          >
            ดูประวัติคำสั่งซื้อทั้งหมด
          </button>

          <button
            type="button"
            onClick={() => setIsOrderSuccessModalOpen(false)}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-400/25 transition-all text-center cursor-pointer"
          >
            เติมเกมเพิ่มอีกรายการ
          </button>
        </div>
      </div>
    </div>
  );
};
