import React, { useState, useMemo } from 'react';
import {
  Package,
  Calendar,
  Clock,
  Copy,
  Check,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Gamepad2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Share2,
  Sparkles,
  ShoppingBag,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { TopUpOrder, Game } from '../types';
import { getOrderItems, formatPackageQuantityTag } from '../utils/orderHelper';

interface AdminStockSummaryProps {
  orders: TopUpOrder[];
  games: Game[];
  onOpenOrderModal?: (order: TopUpOrder) => void;
}

interface PackageStockLine {
  packageId: string;
  packageName: string;
  inGameItem: string;
  itemAmount: number;
  quantity: number; // สั่งกี่ชิ้น
  totalPrice: number;
  unitPrice: number;
  tag: string; // e.g. "12800x10"
  ordersCount: number;
  orderIds: string[];
}

interface GameStockSummary {
  gameId: string;
  gameName: string;
  totalPieces: number; // รวมกี่ชิ้น
  totalOrders: number;
  totalRevenue: number;
  packages: PackageStockLine[];
}

export const AdminStockSummary: React.FC<AdminStockSummaryProps> = ({
  orders,
  games,
  onOpenOrderModal,
}) => {
  // Date filter mode: 'today' | 'yesterday' | 'custom' | 'all'
  const [filterMode, setFilterMode] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  
  // Custom date string: YYYY-MM-DD
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});
  const [selectedPkgForOrders, setSelectedPkgForOrders] = useState<PackageStockLine | null>(null);

  // Today reference dates
  const now = new Date();
  const todayStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const isSameCalendarDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Filter orders according to selected date mode
  const filteredOrders = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return orders.filter((ord) => {
      const ordDate = new Date(ord.createdAt);
      if (isNaN(ordDate.getTime())) return false;

      if (filterMode === 'today') {
        return isSameCalendarDay(ordDate, today);
      } else if (filterMode === 'yesterday') {
        return isSameCalendarDay(ordDate, yesterday);
      } else if (filterMode === 'custom') {
        if (!customDate) return true;
        const [y, m, d] = customDate.split('-').map(Number);
        return (
          ordDate.getFullYear() === y &&
          ordDate.getMonth() === m - 1 &&
          ordDate.getDate() === d
        );
      }
      return true; // 'all'
    });
  }, [orders, filterMode, customDate]);

  // Aggregate breakdown by Game and Package
  const summaryByGame = useMemo<GameStockSummary[]>(() => {
    const gameMap = new Map<string, {
      gameId: string;
      gameName: string;
      orderIdsSet: Set<string>;
      totalPieces: number;
      totalRevenue: number;
      packageMap: Map<string, PackageStockLine>;
    }>();

    filteredOrders.forEach((order) => {
      const items = getOrderItems(order);

      items.forEach((item) => {
        const rawGameId = item.gameId || order.gameId || 'other';
        const cleanGameName = (item.gameName || order.gameName || 'เกมอื่นๆ').replace(/ และอื่นๆ.*$/, '').trim();

        if (!gameMap.has(rawGameId)) {
          gameMap.set(rawGameId, {
            gameId: rawGameId,
            gameName: cleanGameName,
            orderIdsSet: new Set(),
            totalPieces: 0,
            totalRevenue: 0,
            packageMap: new Map(),
          });
        }

        const gameEntry = gameMap.get(rawGameId)!;
        gameEntry.orderIdsSet.add(order.id);
        gameEntry.totalPieces += item.quantity;
        gameEntry.totalRevenue += item.totalPrice;

        // Key by package name & itemAmount
        const pkgKey = `${item.packageId || item.packageName}_${item.itemAmount}`;
        if (!gameEntry.packageMap.has(pkgKey)) {
          const notation = formatPackageQuantityTag(item);
          gameEntry.packageMap.set(pkgKey, {
            packageId: item.packageId || pkgKey,
            packageName: item.packageName || `${item.itemAmount} ${item.inGameItem}`,
            inGameItem: item.inGameItem || '',
            itemAmount: item.itemAmount || 0,
            quantity: 0,
            totalPrice: 0,
            unitPrice: item.unitPrice || 0,
            tag: notation,
            ordersCount: 0,
            orderIds: [],
          });
        }

        const pkgEntry = gameEntry.packageMap.get(pkgKey)!;
        pkgEntry.quantity += item.quantity;
        pkgEntry.totalPrice += item.totalPrice;
        if (!pkgEntry.orderIds.includes(order.id)) {
          pkgEntry.ordersCount += 1;
          pkgEntry.orderIds.push(order.id);
        }
        // Update tag with new accumulated quantity
        pkgEntry.tag = `${item.itemAmount ? item.itemAmount.toLocaleString() : item.packageName}x${pkgEntry.quantity}`;
      });
    });

    const result: GameStockSummary[] = [];
    gameMap.forEach((g) => {
      const packages = Array.from(g.packageMap.values()).sort((a, b) => b.quantity - a.quantity);
      result.push({
        gameId: g.gameId,
        gameName: g.gameName,
        totalPieces: g.totalPieces,
        totalOrders: g.orderIdsSet.size,
        totalRevenue: g.totalRevenue,
        packages,
      });
    });

    // Sort games by total pieces descending
    result.sort((a, b) => b.totalPieces - a.totalPieces);
    return result;
  }, [filteredOrders]);

  // Overall grand totals
  const grandTotals = useMemo(() => {
    let totalPieces = 0;
    let totalRevenue = 0;
    summaryByGame.forEach((g) => {
      totalPieces += g.totalPieces;
      totalRevenue += g.totalRevenue;
    });

    return {
      gamesCount: summaryByGame.length,
      ordersCount: filteredOrders.length,
      totalPieces,
      totalRevenue,
    };
  }, [summaryByGame, filteredOrders]);

  // Filtered list of games for display
  const displayedGames = useMemo(() => {
    if (selectedGameId === 'all') return summaryByGame;
    return summaryByGame.filter((g) => g.gameId === selectedGameId);
  }, [summaryByGame, selectedGameId]);

  const toggleExpand = (gameId: string) => {
    setExpandedGames((prev) => ({
      ...prev,
      [gameId]: prev[gameId] === undefined ? false : !prev[gameId],
    }));
  };

  // Generate LINE/Discord copyable summary text
  const generateTextSummary = (): string => {
    const dateLabel =
      filterMode === 'today'
        ? `วันนี้ (${new Date().toLocaleDateString('th-TH')})`
        : filterMode === 'yesterday'
        ? `เมื่อวาน (${new Date(Date.now() - 86400000).toLocaleDateString('th-TH')})`
        : filterMode === 'custom'
        ? `วันที่ ${customDate}`
        : 'คำสั่งซื้อทั้งหมด';

    let text = `📦 สรุปยอดสต็อกสั่งซื้อ - EF CPA Shop\n`;
    text += `📅 ประจำ: ${dateLabel}\n`;
    text += `⏰ ข้อมูล ณ เวลา: ${new Date().toLocaleTimeString('th-TH')} น.\n`;
    text += `==============================\n\n`;

    if (summaryByGame.length === 0) {
      text += `(ไม่มีคำสั่งซื้อในช่วงเวลาที่เลือก)\n`;
      return text;
    }

    summaryByGame.forEach((g, index) => {
      text += `${index + 1}. 🎮 ${g.gameName}\n`;
      text += `   - รวมสั่ง: ${g.totalPieces} ชิ้น | ยอดเงิน: ฿${g.totalRevenue.toLocaleString()} (${g.totalOrders} ออเดอร์)\n`;
      text += `   - รายละเอียดแพ็กเกจ:\n`;
      g.packages.forEach((p) => {
        text += `     • ${p.packageName}: สั่ง ${p.quantity} ชิ้น [${p.tag}] (฿${p.totalPrice.toLocaleString()})\n`;
      });
      text += `\n`;
    });

    text += `==============================\n`;
    text += `🔥 สรุปรวมสต็อกทั้งหมด: ${grandTotals.totalPieces} ชิ้น\n`;
    text += `📑 จำนวนออเดอร์: ${grandTotals.ordersCount} ออเดอร์\n`;
    text += `💰 ยอดเงินรวม: ฿${grandTotals.totalRevenue.toLocaleString()} บาท\n`;
    text += `⚡ ตรวจสอบและจัดส่งโดยระบบ EF CPA Shop`;

    return text;
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 3000);
  };

  // Export summary to CSV
  const handleExportCsv = () => {
    let csv = `\uFEFFชื่อเกม,ชื่อแพ็กเกจ,จำนวนที่สั่ง (ชิ้น),รหัสแพ็กเกจย่อ,ราคาต่อหน่วย,ยอดเงินรวม,จำนวนออเดอร์\n`;
    summaryByGame.forEach((g) => {
      g.packages.forEach((p) => {
        csv += `"${g.gameName}","${p.packageName}",${p.quantity},"${p.tag}",${p.unitPrice},${p.totalPrice},${p.ordersCount}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_summary_${filterMode}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Date & Range Selector */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#141928] via-[#1a233d] to-[#141928] border-2 border-amber-400/60 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>สรุปสต็อกและแพ็กเกจรายวัน</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                คำนวณจากคำสั่งซื้อจริงของลูกค้า (แยกตามเกมและจำนวนแพ็ก)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2.5">
              <span>📊 สรุปยอดสั่งวันนี้: มีเกมไหนบ้าง & สั่งแพ็กละกี่ชิ้น</span>
            </h2>

            <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>ประจำวันที่: <strong className="text-amber-300">{todayStr}</strong></span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => handleCopyText(generateTextSummary(), 'full')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer active:scale-95"
              title="คัดลอกข้อความสรุปทั้งหมดเพื่อส่งในกลุ่ม LINE / แชต"
            >
              {copiedText === 'full' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3] text-emerald-900" />
                  <span>คัดลอกสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>📋 คัดลอกสรุปส่ง LINE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl bg-[#1b2438] hover:bg-[#25324e] text-slate-200 hover:text-white border-2 border-slate-600 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>เลือกช่วงเวลา:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilterMode('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                filterMode === 'today'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
                  : 'bg-[#0f1422] text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              ⭐ วันนี้ (Today)
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('yesterday')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                filterMode === 'yesterday'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
                  : 'bg-[#0f1422] text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              เมื่อวานนี้ (Yesterday)
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                filterMode === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
                  : 'bg-[#0f1422] text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              ทั้งหมด (All Time)
            </button>

            <div className="flex items-center gap-1.5 bg-[#0f1422] px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-bold">ระบุวันที่:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setFilterMode('custom');
                }}
                className="bg-transparent text-xs text-amber-300 outline-none font-mono font-bold cursor-pointer"
              />
            </div>
          </div>

          {/* Game filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">กรองตามเกม:</span>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0f1422] border border-slate-700 text-xs text-white font-bold outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">ทุกเกม ({summaryByGame.length} เกม)</option>
              {summaryByGame.map((g) => (
                <option key={g.gameId} value={g.gameId}>
                  {g.gameName} ({g.totalPieces} ชิ้น)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Active Games Today */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">เกมที่มีการสั่งซื้อ</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-0.5 block">
              {grandTotals.gamesCount} <span className="text-xs font-normal text-slate-400">เกม</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">แยกตามชนิดเกมวันนี้</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
            <Gamepad2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Pieces Ordered */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">รวมจำนวนแพ็กที่สั่ง</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5 block">
              {grandTotals.totalPieces} <span className="text-xs font-normal text-slate-400">ชิ้น/แพ็ก</span>
            </span>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">ยอดสต็อกที่ต้องเตรียม</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">จำนวนคำสั่งซื้อ</span>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-0.5 block">
              {grandTotals.ordersCount} <span className="text-xs font-normal text-slate-400">ออเดอร์</span>
            </span>
            <span className="text-[10px] text-cyan-400/80 mt-1 block">ลูกค้าสั่งสำเร็จ</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">ยอดเงินรวม</span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 block">
              ฿{grandTotals.totalRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">ราคารวมของวันนี้</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Breakdown Section: Per Game Details */}
      {displayedGames.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#141928] border-2 border-slate-700 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-black text-white">ยังไม่มีรายการสั่งซื้อในช่วงเวลาที่เลือก</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filterMode === 'today'
              ? 'ยังไม่มีออเดอร์เข้ามาในวันนี้ เมื่อลูกค้าสั่งซื้อ รายการเกมและจำนวนแพ็กเกจจะถูกคำนวณและสรุปแสดงที่นี่ทันที'
              : 'ลองปรับเลือกเป็น "ทั้งหมด (All Time)" หรือเลือกวันที่มีการสั่งซื้อเพื่อดูสรุปสต็อก'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayedGames.map((gameSummary) => {
            const isCollapsed = expandedGames[gameSummary.gameId] === false;

            // Generate game-specific copy text
            const gameText = `🎮 ${gameSummary.gameName} (รวม ${gameSummary.totalPieces} ชิ้น | ฿${gameSummary.totalRevenue.toLocaleString()})\n` +
              gameSummary.packages
                .map((p) => `  • ${p.packageName}: ${p.quantity} ชิ้น [${p.tag}]`)
                .join('\n');

            return (
              <div
                key={gameSummary.gameId}
                className="rounded-3xl bg-[#141928] border-2 border-slate-700/90 overflow-hidden shadow-xl hover:border-amber-400/60 transition-all"
              >
                {/* Game Header Bar */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#171e30] via-[#1a233a] to-[#141928] border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                      <Gamepad2 className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white font-display">
                          {gameSummary.gameName}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          รวม {gameSummary.totalPieces} ชิ้น
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {gameSummary.totalOrders} ออเดอร์
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>ยอดขายเกมนี้:</span>
                        <strong className="text-amber-400 font-mono text-sm">
                          ฿{gameSummary.totalRevenue.toLocaleString()} บาท
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyText(gameText, gameSummary.gameId)}
                      className="px-3 py-1.5 rounded-xl bg-[#0f1422] hover:bg-[#1a233a] text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="คัดลอกเฉพาะเกมนี้"
                    >
                      {copiedText === gameSummary.gameId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอกเกมนี้</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(gameSummary.gameId)}
                      className="p-2 rounded-xl bg-[#0f1422] hover:bg-[#1a233a] text-slate-300 border border-slate-700 cursor-pointer"
                      title={isCollapsed ? 'ขยายดูแพ็กเกจ' : 'ย่อรายการ'}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Packages Breakdown Table */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Quick Package Badges Strip */}
                    <div className="p-3 rounded-2xl bg-[#0b0e17] border border-amber-400/40 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span>🏷️ รหัสแพ็กเกจสำหรับจัดเตรียมสต็อก (Notation Code):</span>
                        <span className="text-amber-400 font-mono">
                          {gameSummary.packages.length} แพ็กเกจที่ถูกสั่ง
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {gameSummary.packages.map((pkg, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black font-mono text-xs shadow-md"
                          >
                            <span>{pkg.tag}</span>
                            <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-md font-sans">
                              ({pkg.quantity} ชิ้น)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Table of Packages */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-200">
                        <thead className="bg-[#0b0e17] text-slate-400 uppercase text-[11px] font-black border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">ชื่อแพ็กเกจและไอเทม</th>
                            <th className="py-3 px-4 text-center">จำนวนที่ลูกค้าสั่ง</th>
                            <th className="py-3 px-4 text-center">รหัสสต็อกย่อ</th>
                            <th className="py-3 px-4 text-right">ราคาต่อชิ้น</th>
                            <th className="py-3 px-4 text-right">ราคารวม</th>
                            <th className="py-3 px-4 text-center">ออเดอร์ที่สั่ง</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/80 font-medium">
                          {gameSummary.packages.map((pkg, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              {/* Package Name */}
                              <td className="py-3.5 px-4 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                                  <div>
                                    <span className="block text-sm font-black">{pkg.packageName}</span>
                                    {pkg.itemAmount > 0 && (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        ได้รับ: {pkg.itemAmount.toLocaleString()} {pkg.inGameItem} / ชิ้น
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Quantity Ordered */}
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50 text-sm font-black font-mono">
                                  {pkg.quantity} ชิ้น
                                </span>
                              </td>

                              {/* Tag */}
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/40 font-mono font-black text-xs">
                                  {pkg.tag}
                                </span>
                              </td>

                              {/* Unit Price */}
                              <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                                ฿{pkg.unitPrice.toLocaleString()}
                              </td>

                              {/* Total Price */}
                              <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm">
                                ฿{pkg.totalPrice.toLocaleString()}
                              </td>

                              {/* Orders count */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPkgForOrders(pkg)}
                                  className="text-xs text-amber-300 hover:text-slate-950 font-bold bg-[#0b0e17] hover:bg-amber-400 px-2.5 py-1 rounded-lg border border-amber-400/50 transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                                  title="คลิกเพื่อดูรายการออเดอร์ของแพ็กเกจนี้"
                                >
                                  <Eye className="w-3 h-3 text-amber-400 group-hover:text-slate-950" />
                                  <span>{pkg.ordersCount} ออเดอร์</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Breakdown Orders for Specific Package */}
      {selectedPkgForOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#141928] border-2 border-amber-400 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                    รายละเอียดคำสั่งซื้อของแพ็กเกจนี้
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white font-display">
                    {selectedPkgForOrders.packageName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-xs">
                      รหัสย่อ: {selectedPkgForOrders.tag}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      สั่งรวม {selectedPkgForOrders.quantity} ชิ้น (฿{selectedPkgForOrders.totalPrice.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPkgForOrders(null)}
                className="p-2 rounded-xl bg-[#1b2234] hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Orders */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>พบทั้งหมด {selectedPkgForOrders.orderIds.length} รายการคำสั่งซื้อ:</span>
                <span className="text-amber-400">เรียงตามเวลาสั่งซื้อ</span>
              </div>

              {selectedPkgForOrders.orderIds.map((orderId) => {
                const ord = orders.find((o) => o.id === orderId);
                if (!ord) return null;
                const items = getOrderItems(ord);
                const matchingItem = items.find(
                  (it) => (it.packageId || it.packageName) === (selectedPkgForOrders.packageId || selectedPkgForOrders.packageName)
                ) || items[0];

                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#0b0e17] border border-slate-700 hover:border-amber-400/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-amber-400 text-sm">
                          #{ord.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                          {matchingItem?.quantity || ord.quantity || 1} ชิ้น
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            ord.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ord.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ord.status === 'completed'
                            ? '✅ เติมสำเร็จ'
                            : ord.status === 'failed'
                            ? '❌ ยกเลิก'
                            : '⏳ กำลังดำเนินการ'}
                        </span>
                      </div>

                      {/* Explicit Date and Time */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>วันที่: {new Date(ord.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </span>
                        <span className="flex items-center gap-1 text-cyan-300 font-mono font-bold">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>เวลา {new Date(ord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        UID: <span className="text-white font-bold">{ord.playerUid}</span>
                        {ord.playerNamePreview && ` (${ord.playerNamePreview})`}
                        {ord.customerName && ` | ลูกค้า: ${ord.customerName}`}
                      </div>
                    </div>

                    {onOpenOrderModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPkgForOrders(null);
                          onOpenOrderModal(ord);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#1b2438] hover:bg-amber-400 text-slate-200 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700 hover:border-amber-300 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดจัดการออเดอร์</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedPkgForOrders(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
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
