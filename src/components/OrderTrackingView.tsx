import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Clock, CheckCircle2, AlertCircle, RefreshCw, Eye, Tag, Gamepad2 } from 'lucide-react';
import { getOrderItems, formatPackageQuantityTag } from '../utils/orderHelper';

export const OrderTrackingView: React.FC = () => {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (o.id && o.id.toLowerCase().includes(term)) ||
      (o.customerAccount && o.customerAccount.toLowerCase().includes(term)) ||
      (o.customerContact && o.customerContact.toLowerCase().includes(term)) ||
      (o.gameName && o.gameName.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> สำเร็จแล้ว
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> กำลังดำเนินการ
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> ยกเลิก
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> รอดำเนินการ
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <Clock className="w-7 h-7 text-cyan-400" />
          <span>ติดตามสถานะออเดอร์</span>
        </h2>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">
          ตรวจสอบความคืบหน้าการเติมเงินแบบเรียลไทม์ ปลอดภัย รวดเร็ว
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md mx-auto relative">
        <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="ค้นหาด้วย Order ID, ไอดีเกม หรือเบอร์ติดต่อ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner placeholder:text-neutral-500"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/50 rounded-3xl border border-neutral-800/80 p-8 space-y-3">
            <Gamepad2 className="w-12 h-12 text-neutral-600 mx-auto" />
            <h4 className="text-base font-bold text-neutral-300">ไม่พบประวัติออเดอร์</h4>
            <p className="text-xs text-neutral-500">
              {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการสั่งซื้อในระบบขณะนี้'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const items = getOrderItems(order);
            return (
              <div
                key={order.id}
                className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 hover:border-neutral-700 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-cyan-400">{order.id}</span>
                    <span className="text-xs text-neutral-500">
                      {new Date(order.createdAt).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block mb-0.5">เกมและแพ็กเกจ</span>
                    <span className="font-bold text-white block">{order.gameName}</span>
                    <div className="text-neutral-300 space-y-0.5 mt-1">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-neutral-300">
                          <Tag className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{it.packageName}</span>
                          <span className="text-cyan-400 font-medium">x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-500 block mb-0.5">ข้อมูลไอดีเกม</span>
                    <span className="font-semibold text-neutral-200 block truncate">
                      {order.customerAccount}
                    </span>
                    {order.customerServer && (
                      <span className="text-neutral-400 block text-[11px]">
                        เซิร์ฟเวอร์: {order.customerServer}
                      </span>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <span className="text-neutral-500 block mb-0.5">ยอดชำระ</span>
                    <span className="text-base font-extrabold text-cyan-400">
                      ฿{order.totalPrice.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-400 block capitalize">
                      {order.paymentMethod === 'credit_balance' ? 'เครดิต VIP' : 'พร้อมเพย์'}
                    </span>
                  </div>
                </div>

                {order.adminNotes && (
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80 text-xs text-neutral-400">
                    <span className="text-cyan-400 font-semibold mr-1.5">หมายเหตุจากแอดมิน:</span>
                    {order.adminNotes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
