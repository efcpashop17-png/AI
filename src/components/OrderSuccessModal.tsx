import React from 'react';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrderItems, formatPackageQuantityTag } from '../utils/orderHelper';

export const OrderSuccessModal: React.FC<{ onNavigateToTracking?: () => void }> = ({ onNavigateToTracking }) => {
  const { isOrderSuccessModalOpen, closeOrderSuccessModal, lastCompletedOrder } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!isOrderSuccessModalOpen || !lastCompletedOrder) return null;

  const order = lastCompletedOrder;
  const items = getOrderItems(order);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> บันทึกคำสั่งซื้อเรียบร้อย
          </span>
          <h2 className="text-2xl font-black text-white">ชำระเงินสำเร็จแล้ว!</h2>
          <p className="text-xs text-neutral-400 mt-1">
            แอดมินและระบบสต็อกกำลังดำเนินการเติมไอเทมเข้าสู่บัญชีเกมของคุณ
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
            <span className="text-neutral-400 font-medium">หมายเลขออเดอร์:</span>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 font-mono font-bold text-cyan-400 hover:text-cyan-300 transition"
            >
              <span>#{order.id}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400">เกม:</span>
            <span className="font-bold text-white">{order.gameName}</span>
          </div>

          <div className="space-y-1 py-1 border-t border-neutral-900">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-neutral-300">
                  {it.packageName} ({formatPackageQuantityTag(it)})
                </span>
                <span className="font-mono font-bold text-white">฿{it.price.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
            <span className="text-neutral-400">บัญชีผู้เล่น:</span>
            <span className="font-mono text-neutral-200">
              {order.customerAccount} {order.customerServer && `(${order.customerServer})`}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-sm">
            <span className="font-bold text-neutral-300">ยอดชำระ:</span>
            <span className="font-black text-emerald-400">฿{order.totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          {onNavigateToTracking && (
            <button
              onClick={() => {
                closeOrderSuccessModal();
                onNavigateToTracking();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <span>ไปที่หน้าติดตามสถานะออเดอร์</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={closeOrderSuccessModal}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs transition"
          >
            กลับสู่หน้าร้านค้า
          </button>
        </div>
      </div>
    </div>
  );
};
