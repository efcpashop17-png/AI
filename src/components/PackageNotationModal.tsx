import React, { useState } from 'react';
import { X, Copy, Check, Package, Sparkles, User, Gamepad2, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrderItems, formatOrderPackagesNotation, formatPackageQuantityTag } from '../utils/orderHelper';

export const PackageNotationModal: React.FC = () => {
  const { selectedOrderForPackagePopup, setSelectedOrderForPackagePopup, setNotification } = useApp();
  const [copied, setCopied] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  if (!selectedOrderForPackagePopup) return null;

  const order = selectedOrderForPackagePopup;
  const notationText = formatOrderPackagesNotation(order);
  const items = getOrderItems(order);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCopyNotation = () => {
    navigator.clipboard.writeText(notationText);
    setCopied(true);
    setNotification({
      type: 'success',
      message: `คัดลอกรหัสแพ็กเกจเรียบร้อย: ${notationText}`,
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(order.playerUid);
    setCopiedUid(true);
    setNotification({
      type: 'success',
      message: `คัดลอก UID ผู้เล่นเรียบร้อย: ${order.playerUid}`,
    });
    setTimeout(() => setCopiedUid(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e121e] border-2 border-amber-400/70 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(251,191,36,0.35)] text-white max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSelectedOrderForPackagePopup(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10"
          title="ปิดหน้าต่าง"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_20px_rgba(251,191,36,0.45)] shrink-0 border border-amber-300">
            <Package className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black font-mono text-xs">
                {order.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1b233a] border border-slate-700 text-cyan-300 font-extrabold text-xs">
                {(order.gameName || 'เกม').replace(/ และอื่นๆ.*$/, '')}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                รวม {totalQuantity} แพ็ก
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-snug">
              รายการแพ็กเกจที่สั่งซื้อ
            </h3>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Main Requested Shop Notation Display Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#080b14] border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>รหัสแพ็กเกจคำสั่งซื้อ (Shop Notation):</span>
              </span>
              <button
                type="button"
                onClick={handleCopyNotation}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
              </button>
            </div>

            {/* Big Monospace Highlight String */}
            <div className="p-4 rounded-xl bg-[#03060c] border border-amber-400/40 text-center">
              <span className="font-mono font-black text-2xl sm:text-3xl text-amber-300 tracking-wider select-all break-words">
                {notationText}
              </span>
            </div>

            {/* Golden Tag Badges Cluster */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {items.map((it, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black font-mono text-sm sm:text-base tracking-wide shadow-sm"
                >
                  {formatPackageQuantityTag(it)}
                </span>
              ))}
            </div>
          </div>

          {/* Player UID & Account Info */}
          <div className="p-3.5 rounded-2xl bg-[#141928] border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-slate-400 font-bold block text-[11px]">ไอดีเกม (UID ผู้เล่น):</span>
                <span className="font-mono font-black text-emerald-400 text-sm truncate block">
                  {order.playerUid}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyUid}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-600 transition-colors cursor-pointer shrink-0"
            >
              {copiedUid ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUid ? 'คัดลอก UID แล้ว' : 'คัดลอก UID'}</span>
            </button>
          </div>

          {/* Itemized Packages Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>รายละเอียดแต่ละแพ็กเกจ ({items.length} รายการ):</span>
            </span>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#141928] border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {it.imageUrl && (
                      <img
                        src={it.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-sm">
                          {it.packageName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black font-mono text-xs shadow-sm">
                          {formatPackageQuantityTag(it)}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                        ได้รับ: {(it.totalItemAmount || 0).toLocaleString()} {it.inGameItem}
                        {it.totalBonusAmount && it.totalBonusAmount > 0
                          ? ` (+โบนัส ${(it.totalBonusAmount || 0).toLocaleString()} ${it.inGameItem})`
                          : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-mono font-black text-amber-400 text-sm block">
                      ฿{(it.totalPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      จำนวน {it.quantity} ชิ้น
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            <span className="text-slate-400">ยอดรวมทั้งหมด: </span>
            <span className="font-mono font-black text-amber-400 text-base">
              ฿{(order.price || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNotation}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอกข้อความ</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOrderForPackagePopup(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
