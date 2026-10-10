import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Search,
  Filter,
  Package,
  Award,
  ChevronDown,
  Sparkles,
  Zap,
  Phone,
  Gamepad2,
  Download,
} from 'lucide-react';
import { TopUpOrder } from '../types';

export const DealerAnalyticsDashboard: React.FC = () => {
  const { orders, dealers } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<'current' | 'all'>('current');
  const [customerSearch, setCustomerSearch] = useState('');
  const [sortBy, setSortBy] = useState<'monthlySpent' | 'totalSpent' | 'orderCount'>('monthlySpent');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  // Filter orders by month
  const relevantOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (ord.paymentStatus !== 'paid' && ord.status !== 'completed' && ord.status !== 'processing') {
        return false;
      }
      if (selectedMonth === 'current') {
        const d = new Date(ord.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      return true;
    });
  }, [orders, selectedMonth, currentYear, currentMonth]);

  // Aggregate stats
  const totalRevenue = useMemo(() => {
    return relevantOrders.reduce((sum, o) => sum + o.price, 0);
  }, [relevantOrders]);

  const totalOrdersCount = relevantOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Group orders by customer (Customer / Dealer Key)
  const customerBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        dealerId?: string;
        dealerName?: string;
        dealerTier?: string;
        monthlySpent: number;
        totalSpent: number;
        orderCount: number;
        monthlyOrdersCount: number;
        gameCounts: Record<string, number>;
        lastOrderDate: string;
      }
    >();

    // Process all orders for total spend, and track monthly spend
    orders.forEach((ord) => {
      if (ord.paymentStatus !== 'paid' && ord.status !== 'completed' && ord.status !== 'processing') {
        return;
      }

      // Unique identifier for customer
      const key = ord.contactPhone && ord.contactPhone !== '-'
        ? ord.contactPhone
        : ord.playerUid || ord.id;

      const customerName = ord.playerNamePreview || ord.playerUid || 'ลูกค้าทั่วไป';
      const ordDate = new Date(ord.createdAt);
      const isCurrentMonth = ordDate.getFullYear() === currentYear && ordDate.getMonth() === currentMonth;

      // Check if linked to registered dealer
      const linkedDealer = dealers.find((d) => d.id === ord.dealerId || d.phone === ord.contactPhone);

      let record = map.get(key);
      if (!record) {
        record = {
          id: key,
          name: linkedDealer ? linkedDealer.name : customerName,
          phone: ord.contactPhone || (linkedDealer ? linkedDealer.phone : '-'),
          dealerId: linkedDealer?.id,
          dealerName: linkedDealer ? (linkedDealer.shopName || linkedDealer.name) : undefined,
          dealerTier: linkedDealer?.tier,
          monthlySpent: 0,
          totalSpent: 0,
          orderCount: 0,
          monthlyOrdersCount: 0,
          gameCounts: {},
          lastOrderDate: ord.createdAt,
        };
        map.set(key, record);
      }

      record.totalSpent += ord.price;
      record.orderCount += 1;

      if (isCurrentMonth) {
        record.monthlySpent += ord.price;
        record.monthlyOrdersCount += 1;
      }

      record.gameCounts[ord.gameName] = (record.gameCounts[ord.gameName] || 0) + 1;

      if (new Date(ord.createdAt) > new Date(record.lastOrderDate)) {
        record.lastOrderDate = ord.createdAt;
      }
    });

    let list = Array.from(map.values());

    // Filter by search
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.dealerName && c.dealerName.toLowerCase().includes(q))
      );
    }

    // Sort list
    list.sort((a, b) => {
      if (sortBy === 'monthlySpent') return b.monthlySpent - a.monthlySpent;
      if (sortBy === 'totalSpent') return b.totalSpent - a.totalSpent;
      return b.orderCount - a.orderCount;
    });

    return list;
  }, [orders, dealers, currentYear, currentMonth, customerSearch, sortBy]);

  // Daily Chart Data for the current month (Days 1 to daysInCurrentMonth)
  const dailyData = useMemo(() => {
    const days: { day: number; dateStr: string; revenue: number; orderCount: number }[] = [];

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        dateStr: `${d} ${now.toLocaleDateString('th-TH', { month: 'short' })}`,
        revenue: 0,
        orderCount: 0,
      });
    }

    relevantOrders.forEach((ord) => {
      const ordDate = new Date(ord.createdAt);
      if (ordDate.getFullYear() === currentYear && ordDate.getMonth() === currentMonth) {
        const dayNum = ordDate.getDate();
        if (dayNum >= 1 && dayNum <= daysInCurrentMonth) {
          days[dayNum - 1].revenue += ord.price;
          days[dayNum - 1].orderCount += 1;
        }
      }
    });

    return days;
  }, [relevantOrders, daysInCurrentMonth, currentYear, currentMonth]);

  // Chart max value for scaling
  const maxDailyRevenue = Math.max(100, ...dailyData.map((d) => d.revenue));
  const maxDailyOrders = Math.max(5, ...dailyData.map((d) => d.orderCount));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#18113c] via-[#120E24] to-[#18113c] border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950 text-cyan-300 border border-violet-700/50 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dealer &amp; Customer Spending Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
            สรุปยอดสั่งซื้อรายเดือนของลูกค้า &amp; ดีลเลอร์
          </h2>
          <p className="text-xs text-violet-300/80 font-medium mt-1">
            วิเคราะห์พฤติกรรมการสั่งซื้อสต็อก ยอดขายรายวัน และข้อมูลลูกค้าแต่ละราย ({monthName})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#0B0813] p-1 rounded-2xl border border-violet-500/30 text-xs font-bold">
            <button
              onClick={() => setSelectedMonth('current')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedMonth === 'current'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-violet-300 hover:text-white'
              }`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setSelectedMonth('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-violet-300 hover:text-white'
              }`}
            >
              ยอดสะสมทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#120E24]/90 border border-violet-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-violet-300 font-bold">
            <span>ยอดขายสต็อกรวม ({selectedMonth === 'current' ? 'เดือนนี้' : 'ทั้งหมด'})</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 font-mono tabular-nums">
            ฿{totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-violet-400/80 font-medium">คำนวณจากออเดอร์ที่ชำระเงินสำเร็จ</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#120E24]/90 border border-violet-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-violet-300 font-bold">
            <span>จำนวนออเดอร์สต็อก</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono tabular-nums">
            {totalOrdersCount} <span className="text-xs font-sans text-amber-200">รายการ</span>
          </div>
          <p className="text-[11px] text-violet-400/80 font-medium">เฉลี่ย ฿{avgOrderValue.toLocaleString()} / รายการ</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#120E24]/90 border border-violet-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-violet-300 font-bold">
            <span>จำนวนลูกค้า &amp; ดีลเลอร์ที่ซื้อ</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums">
            {customerBreakdown.filter((c) => (selectedMonth === 'current' ? c.monthlySpent > 0 : true)).length}{' '}
            <span className="text-xs font-sans text-emerald-200">ราย</span>
          </div>
          <p className="text-[11px] text-violet-400/80 font-medium">มีคำสั่งซื้อที่เกิดขึ้นจริง</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#120E24]/90 border border-violet-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-violet-300 font-bold">
            <span>ยอดซื้อดีลเลอร์สูงสุด</span>
            <Award className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="text-3xl font-black text-fuchsia-400 font-mono tabular-nums">
            ฿{customerBreakdown.length > 0 ? (selectedMonth === 'current' ? customerBreakdown[0].monthlySpent : customerBreakdown[0].totalSpent).toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-violet-400/80 font-medium truncate">
            โดย {customerBreakdown.length > 0 ? customerBreakdown[0].name : '-'}
          </p>
        </div>
      </div>

      {/* DAILY SALES TREND GRAPH (กราฟแสดงยอดรวมรายวัน - User Requested Feature) */}
      <div className="p-6 rounded-3xl bg-[#120E24]/90 border border-violet-500/30 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-500/20 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-heading">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>กราฟแสดงยอดรวมรายวัน (Daily Sales &amp; Orders Trend)</span>
            </h3>
            <p className="text-xs text-violet-300/70 font-medium">
              สถิติยอดการสั่งซื้อสต็อกสินค้าในแต่ละวัน ประจำเดือน {monthName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#0B0813] p-1 rounded-xl border border-violet-500/30 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                ยอดเงินรายวัน (฿)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'orders'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                จำนวนออเดอร์
              </button>
            </div>
          </div>
        </div>

        {/* Hovered day tooltip banner */}
        {hoveredDay !== null && (
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-xs flex items-center justify-between animate-fadeIn">
            <span className="font-bold text-white">
              วันที่ {dailyData[hoveredDay].day} {monthName}:
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-cyan-300 font-extrabold">
                ยอดขาย: ฿{dailyData[hoveredDay].revenue.toLocaleString()}
              </span>
              <span className="font-mono text-amber-300 font-extrabold">
                จำนวน: {dailyData[hoveredDay].orderCount} ออเดอร์
              </span>
            </div>
          </div>
        )}

        {/* Interactive SVG Bar Chart */}
        <div className="w-full overflow-x-auto pt-4 pb-2">
          <div className="min-w-[650px] h-60 flex items-end gap-1.5 px-2">
            {dailyData.map((d, idx) => {
              const val = chartMetric === 'revenue' ? d.revenue : d.orderCount;
              const maxVal = chartMetric === 'revenue' ? maxDailyRevenue : maxDailyOrders;
              const heightPercent = maxVal > 0 ? Math.max(6, Math.round((val / maxVal) * 100)) : 6;
              const isHovered = hoveredDay === idx;
              const hasData = val > 0;

              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Floating tooltip on hover */}
                  <div
                    className={`absolute -top-10 px-2 py-1 rounded-md bg-[#0B0813] text-[10px] font-mono font-bold border border-cyan-400 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-10 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {chartMetric === 'revenue' ? `฿${d.revenue.toLocaleString()}` : `${d.orderCount} บิล`}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      hasData
                        ? isHovered
                          ? 'bg-gradient-to-t from-cyan-500 to-teal-300 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                          : 'bg-gradient-to-t from-violet-600 via-fuchsia-600 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                        : 'bg-violet-950/40 hover:bg-violet-900/40'
                    }`}
                  ></div>

                  {/* Day label */}
                  <span
                    className={`text-[9px] font-mono mt-2 transition-colors ${
                      isHovered ? 'text-cyan-300 font-bold' : hasData ? 'text-violet-200' : 'text-violet-500/70'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-violet-400/80 pt-2 border-t border-violet-500/20">
          <span>แกน X: วันที่ 1 - {daysInCurrentMonth} ประจำเดือน</span>
          <span>แตะหรือชี้เมาส์ที่แท่งกราฟเพื่อดูรายละเอียดรายวัน</span>
        </div>
      </div>

      {/* CUSTOMER & DEALER MONTHLY SPENDING BREAKDOWN TABLE */}
      <div className="p-6 rounded-3xl bg-[#120E24]/90 border border-violet-500/30 space-y-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-heading">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>ตารางสรุปยอดสั่งซื้อของลูกค้า &amp; ดีลเลอร์แต่ละราย (Customer Spend Table)</span>
            </h3>
            <p className="text-xs text-violet-300/70 font-medium">
              แสดงยอดสั่งซื้อรายเดือน ยอดสะสม และพฤติกรรมการสั่งสต็อกเกม
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า, ดีลเลอร์, เบอร์..."
                className="pl-9 pr-3 py-2 rounded-xl bg-[#0B0813] border border-violet-500/30 text-white text-xs placeholder-violet-400/60 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#0B0813] border border-violet-500/30 text-xs font-bold text-violet-200 outline-none cursor-pointer"
            >
              <option value="monthlySpent">เรียงตามยอดเดือนนี้ (มากไปน้อย)</option>
              <option value="totalSpent">เรียงตามยอดสะสมทั้งหมด</option>
              <option value="orderCount">เรียงตามจำนวนออเดอร์</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto rounded-2xl border border-violet-500/25">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#18113c] text-violet-200 uppercase font-bold tracking-wider border-b border-violet-500/30">
                <th className="py-3.5 px-4">ลูกค้า / ดีลเลอร์</th>
                <th className="py-3.5 px-4">ระดับ (Tier)</th>
                <th className="py-3.5 px-4 text-right">ยอดสั่งซื้อเดือนนี้</th>
                <th className="py-3.5 px-4 text-right">ยอดสะสมทั้งหมด</th>
                <th className="py-3.5 px-4 text-center">จำนวนออเดอร์</th>
                <th className="py-3.5 px-4">เกมที่สั่งบ่อย</th>
                <th className="py-3.5 px-4">สั่งซื้อล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-500/20 bg-[#0B0813]/60">
              {customerBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-violet-400">
                    ไม่พบข้อมูลลูกค้าหรือดีลเลอร์ตามคำค้นหา
                  </td>
                </tr>
              ) : (
                customerBreakdown.map((cust, idx) => {
                  const topGame = Object.entries(cust.gameCounts).sort((a, b) => b[1] - a[1])[0];
                  const lastDateFormatted = new Date(cust.lastOrderDate).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-[#18113c]/60 transition-colors"
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-violet-900/60 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold text-white text-xs block font-heading">
                              {cust.name}
                            </span>
                            {cust.dealerName && (
                              <span className="text-[10px] text-fuchsia-300 font-medium block">
                                ร้าน: {cust.dealerName}
                              </span>
                            )}
                            <span className="text-[11px] text-violet-400 font-mono">
                              {cust.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4">
                        {cust.dealerTier ? (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              cust.dealerTier === 'VIP'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                                : cust.dealerTier === 'Gold'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
                                : 'bg-slate-500/20 text-slate-300 border-slate-400/50'
                            }`}
                          >
                            ⭐ ดีลเลอร์ {cust.dealerTier}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-violet-400 px-2 py-0.5 rounded bg-violet-950 border border-violet-800/40">
                            ลูกค้าทั่วไป
                          </span>
                        )}
                      </td>

                      {/* Monthly Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-cyan-300 text-sm tabular-nums">
                          ฿{cust.monthlySpent.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-violet-400 block font-sans">
                          ({cust.monthlyOrdersCount} บิล)
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-white text-xs tabular-nums">
                          ฿{cust.totalSpent.toLocaleString()}
                        </span>
                      </td>

                      {/* Order Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300">
                        {cust.orderCount}
                      </td>

                      {/* Top Game */}
                      <td className="py-3.5 px-4">
                        {topGame ? (
                          <span className="text-xs text-violet-200 font-medium inline-flex items-center gap-1">
                            <Gamepad2 className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{topGame[0]}</span>
                            <span className="text-[10px] text-violet-400 font-mono">({topGame[1]})</span>
                          </span>
                        ) : (
                          <span className="text-violet-500">-</span>
                        )}
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4 text-violet-300/80 font-mono text-[11px]">
                        {lastDateFormatted}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
