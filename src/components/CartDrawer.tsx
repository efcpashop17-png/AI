import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  Gamepad2,
  QrCode,
  CreditCard,
  Building,
} from 'lucide-react';
import { PaymentMethod } from '../types';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    checkoutCart,
    setActiveTab,
    setNotification,
  } = useApp();

  const [contactPhone, setContactPhone] = useState('089-888-7766');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');

  if (!isCartOpen) return null;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalOriginalPrice = cart.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0
  );
  const totalSavings = totalOriginalPrice > totalPrice ? totalOriginalPrice - totalPrice : 0;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!contactPhone.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอกเบอร์โทรศัพท์สำหรับรับการแจ้งเตือน',
      });
      return;
    }

    checkoutCart({
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim() || undefined,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#0B0813]/85 backdrop-blur-md transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0B0813]/95 backdrop-blur-2xl border-l border-violet-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col text-white">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-violet-500/25 flex items-center justify-between bg-[#120E24]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-violet-400/40">
                <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-white font-heading">
                  ตะกร้าสินค้าของคุณ
                </h3>
                <span className="text-xs text-cyan-300 font-bold">
                  {cart.length === 0
                    ? 'ไม่มีรายการสินค้า'
                    : `มี ${cart.length} แพ็กเกจ (รวม ${totalQuantity} รายการ)`}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-violet-300 hover:text-white hover:bg-violet-950/60 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-[#120E24] border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <Gamepad2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg font-heading">ตะกร้าของคุณยังว่างอยู่</h4>
                  <p className="text-xs text-violet-300/70 font-medium mt-1">
                    เลือกเกมที่ต้องการเติม แล้วกด &quot;เพิ่มลงในตะกร้า&quot; ได้ตามต้องการ
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveTab('store');
                  }}
                  className="neon-btn-purple px-6 py-3 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ไปเลือกเกมเติมเงิน</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-violet-200 px-1">
                  <span>รายการที่เลือก ({cart.length})</span>
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างตะกร้า</span>
                  </button>
                </div>

                {cart.map((item) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="p-4.5 rounded-2xl bg-[#120E24]/90 border border-violet-500/30 space-y-3.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-violet-950/80 text-violet-300 border border-violet-600/40">
                            {item.gameName}
                          </span>
                          <h4 className="font-extrabold text-base text-white mt-1.5 leading-snug font-heading">
                            {item.packageName}
                          </h4>
                          <p className="text-xs font-mono font-bold text-cyan-400 mt-1">
                            UID: {item.playerUid}
                            {item.serverId ? ` (${item.serverId})` : ''}
                          </p>
                          {item.playerNamePreview && (
                            <p className="text-xs text-violet-200/80 font-medium mt-0.5">
                              ตัวละคร: {item.playerNamePreview}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 rounded-xl text-violet-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Quantity & Price Row */}
                      <div className="pt-3 border-t border-violet-500/20 flex items-center justify-between">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-[#0B0813] p-1 rounded-xl border border-violet-500/30">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-white flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span className="w-8 text-center text-sm font-black font-mono text-cyan-400 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-white flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-violet-400/80 font-medium block tabular-nums">
                            (฿{item.unitPrice.toLocaleString()} x {item.quantity})
                          </span>
                          <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 text-lg tabular-nums">
                            ฿{lineTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout Footer Form */}
          {cart.length > 0 && (
            <form
              onSubmit={handleCheckout}
              className="p-5 sm:p-6 border-t border-violet-500/25 bg-[#120E24] space-y-4"
            >
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-violet-200 uppercase tracking-wider mb-2">
                  เลือกวิธีชำระเงิน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      paymentMethod === 'promptpay'
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#0B0813] border-violet-500/30 text-violet-200 hover:bg-violet-950/40'
                    }`}
                  >
                    PromptPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('truemoney')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      paymentMethod === 'truemoney'
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#0B0813] border-violet-500/30 text-violet-200 hover:bg-violet-950/40'
                    }`}
                  >
                    TrueMoney
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#0B0813] border-violet-500/30 text-violet-200 hover:bg-violet-950/40'
                    }`}
                  >
                    ไทยพาณิชย์
                  </button>
                </div>
              </div>

              {/* Price Calculations */}
              <div className="pt-2 border-t border-violet-500/25 space-y-1.5 text-xs">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>ประหยัดได้ทั้งหมด:</span>
                    <span className="font-mono text-sm tabular-nums">-฿{totalSavings.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-extrabold text-white text-base font-heading">ยอดชำระทั้งหมด:</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 font-mono tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    ฿{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit Checkout Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl neon-btn-purple text-base shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] font-heading"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>ชำระเงินในตะกร้า ({cart.length} รายการ)</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
