import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, updateCartItemQuantity, removeFromCart, clearCart, createCartOrder } =
    useApp();
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const totalPrice = cart.reduce((sum, item) => sum + item.pkg.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      await createCartOrder({ contact: contact.trim() });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">ตะกร้าสั่งซื้อ ({totalQuantity} แพ็ก)</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto" />
                <p className="text-neutral-400 text-sm">ยังไม่มีสินค้าในตะกร้า</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-cyan-400 text-xs font-semibold hover:bg-neutral-750 transition"
                >
                  เลือกดูเกมทั้งหมด
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col gap-2.5 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                        {item.game.name}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.pkg.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        ID: <span className="text-neutral-300 font-mono">{item.accountDetails.account}</span>
                        {item.accountDetails.server && ` (${item.accountDetails.server})`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                    <div className="flex items-center border border-neutral-800 bg-neutral-900 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-black text-cyan-400">
                      ฿{(item.pkg.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-neutral-800 bg-neutral-950/90 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  เบอร์โทรหรือช่องทางติดต่อสำหรับคำสั่งซื้อนี้
                </label>
                <input
                  type="text"
                  placeholder="เช่น 089-xxx-xxxx หรือ @line"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">ยอดรวมทั้งสิ้น ({totalQuantity} แพ็ก)</span>
                  <span className="text-2xl font-black text-white">฿{totalPrice.toLocaleString()}</span>
                </div>
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition"
                >
                  ล้างตะกร้า
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-neutral-950 font-black text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันและชำระเงิน'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
