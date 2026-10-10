import React, { useState, useEffect } from 'react';
import { Game, GamePackage, PaymentMethod } from '../types';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  HelpCircle,
  AlertCircle,
  Tag,
  Check,
  ShoppingBag,
  Plus,
  Minus,
  TrendingUp,
  Lock,
} from 'lucide-react';

interface GameTopUpModalProps {
  game: Game;
  onClose: () => void;
}

export const GameTopUpModal: React.FC<GameTopUpModalProps> = ({ game, onClose }) => {
  const {
    createTopUpOrder,
    addToCart,
    cart,
    setIsCartOpen,
    simulateUidCheck,
    setNotification,
    isAdminLoggedIn,
    currentCustomerUser,
    setIsAdminLoginModalOpen,
  } = useApp();

  const isLoggedIn = isAdminLoggedIn || !!currentCustomerUser;

  const [playerUid, setPlayerUid] = useState(() => currentCustomerUser?.username || '');
  const [selectedServer, setSelectedServer] = useState(
    game.accountField.servers ? game.accountField.servers[0] : ''
  );
  const [zoneId, setZoneId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(
    isLoggedIn ? (game.packages.filter((p) => p.active)[0] || null) : null
  );
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [contactPhone, setContactPhone] = useState('089-888-7766');
  const [contactEmail, setContactEmail] = useState('');

  // Player UID preview state
  const [uidVerified, setUidVerified] = useState(false);
  const [playerNickname, setPlayerNickname] = useState('');
  const [playerLevel, setPlayerLevel] = useState<number | null>(null);
  const [isVerifyingUid, setIsVerifyingUid] = useState(false);

  useEffect(() => {
    if (currentCustomerUser?.username && !playerUid) {
      setPlayerUid(currentCustomerUser.username);
    }
  }, [currentCustomerUser]);

  const handleVerifyUid = () => {
    if (!playerUid.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอก UID หรือไอดีเกมก่อนกดตรวจสอบ',
      });
      return;
    }

    setIsVerifyingUid(true);
    setTimeout(() => {
      const res = simulateUidCheck(game.id, playerUid, selectedServer, zoneId);
      if (res.valid) {
        setUidVerified(true);
        setPlayerNickname(res.nickname);
        setPlayerLevel(res.level);
        setNotification({
          type: 'success',
          message: `พบบัญชีผู้เล่น: ${res.nickname} (เลเวล ${res.level})`,
        });
      }
      setIsVerifyingUid(false);
    }, 600);
  };

  const validateInputs = () => {
    if (!isLoggedIn) {
      setNotification({
        type: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อนเพื่อดูราคาและสั่งซื้อ',
      });
      setIsAdminLoginModalOpen(true);
      return false;
    }

    if (!playerUid.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอก User ที่ลงทะเบียนไว้กับแอดมิน',
      });
      return false;
    }

    if (!selectedPackage) {
      setNotification({
        type: 'error',
        message: 'กรุณาเลือกแพ็กเกจที่ต้องสั่งซื้อ',
      });
      return false;
    }

    return true;
  };

  // Action 1: Add to Cart
  const handleAddToCart = () => {
    if (!validateInputs() || !selectedPackage) return;

    let finalNickname = playerNickname;
    if (!finalNickname) {
      const check = simulateUidCheck(game.id, playerUid, selectedServer, zoneId);
      finalNickname = check.nickname;
    }

    addToCart({
      game,
      pkg: selectedPackage,
      quantity,
      playerUid: playerUid.trim(),
      serverId: selectedServer || undefined,
      zoneId: zoneId ? zoneId.trim() : undefined,
      playerNamePreview: finalNickname,
    });
  };

  // Action 2: Direct Immediate Checkout
  const handleDirectBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs() || !selectedPackage) return;

    let finalNickname = playerNickname;
    if (!finalNickname) {
      const check = simulateUidCheck(game.id, playerUid, selectedServer, zoneId);
      finalNickname = check.nickname;
    }

    createTopUpOrder({
      game,
      pkg: selectedPackage,
      quantity,
      playerUid: playerUid.trim(),
      serverId: selectedServer || undefined,
      zoneId: zoneId ? zoneId.trim() : undefined,
      playerNamePreview: finalNickname,
      contactPhone: contactPhone.trim() || '-',
      contactEmail: contactEmail.trim() || undefined,
      paymentMethod,
    });
  };

  const activePackages = game.packages.filter((p) => p.active);
  const totalPrice = selectedPackage ? selectedPackage.price * quantity : 0;
  const totalOriginalPrice = selectedPackage ? selectedPackage.originalPrice * quantity : 0;
  const totalSavings = totalOriginalPrice > totalPrice ? totalOriginalPrice - totalPrice : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Top action bar: Back button + Cart button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#120E24]/90 hover:bg-[#1B1433] text-violet-200 hover:text-white border border-violet-500/30 text-sm font-bold shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>ย้อนกลับไปเลือกเกมอื่น</span>
        </button>

        {cart.length > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#120E24]/90 hover:bg-[#1B1433] text-cyan-300 font-bold text-xs sm:text-sm border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>เปิดดูตะกร้า ({cart.reduce((sum, i) => sum + i.quantity, 0)} รายการ)</span>
          </button>
        )}
      </div>

      {/* Game Header Banner - Cyber Futuristic */}
      <div className="relative rounded-3xl bg-[#120E24]/90 border border-violet-500/30 p-6 sm:p-8 overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.2)] mb-8 backdrop-blur-xl">
        {game.iconUrl && (
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <img
              src={game.iconUrl}
              alt={game.name}
              className="w-full h-full object-cover blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#120E24] via-[#120E24]/80 to-transparent" />
          </div>
        )}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br ${
              game.iconBgColor || 'from-violet-600 via-purple-600 to-cyan-600'
            } flex-shrink-0 flex items-center justify-center text-white font-black text-3xl shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-violet-400/40`}
          >
            {game.iconUrl ? (
              <img
                src={game.iconUrl}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            ) : (
              game.name.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase px-3 py-0.5 rounded-full bg-violet-950/90 text-violet-300 border border-violet-700/50">
                {game.category}
              </span>
              {game.badge && (
                <span className="text-xs font-black px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border border-fuchsia-400/40 shadow-[0_0_10px_rgba(217,70,239,0.5)] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-current text-cyan-300" />
                  {game.badge}
                </span>
              )}
              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current text-cyan-400" /> ระบบเติมอัตโนมัติ API
              </span>
              <span className="text-xs font-black px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> เรทของวันนี้: {game.todayRate || `฿${Math.min(...game.packages.map((p) => p.price)).toLocaleString()}`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
              {game.name}
            </h1>
            <p className="text-sm text-violet-200/80 font-medium">
              ผู้ให้บริการ: <span className="font-bold text-white">{game.publisher}</span> |{' '}
              {game.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Step 1 (UID), Step 2 (Packages & Quantity), Step 3 (Payment) */}
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: Game Account Input - Cyber Theme */}
          <div className="rounded-3xl bg-[#120E24]/85 border border-violet-500/25 p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-extrabold text-sm flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                1
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-white font-heading">
                  กรอก User ที่ลงทะเบียนไว้กับแอดมิน
                </h2>
                <p className="text-xs text-violet-300/70 font-medium">
                  ระบุ User ที่ท่านได้ลงทะเบียนไว้กับแอดมินเพื่อความแม่นยำในการจัดส่ง
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Single UID/Username input for all games */}
              <div>
                <label className="block text-xs font-semibold text-violet-200 mb-1.5">
                  กรอก User ที่ลงทะเบียนไว้กับแอดมิน *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={playerUid}
                    onChange={(e) => {
                      setPlayerUid(e.target.value);
                      setUidVerified(false);
                    }}
                    placeholder="กรอก User ที่ลงทะเบียนไว้กับแอดมิน"
                    className="flex-1 px-4 py-3 rounded-xl bg-[#0B0813] border border-violet-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-white text-sm outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyUid}
                    disabled={isVerifyingUid}
                    className="px-4 py-3 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-cyan-300 text-xs font-bold transition-all border border-violet-500/40 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                  >
                    {isVerifyingUid ? (
                      <span>กำลังเช็ค...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>ตรวจสอบไอดี</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-violet-300/60 mt-1.5 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-cyan-400" />
                  <span>กรอก User ที่ลงทะเบียนไว้กับแอดมินให้ถูกต้องเพื่อส่งเหรียญเข้าบัญชี</span>
                </p>
              </div>

              {/* Verified Nickname Banner */}
              {uidVerified && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-300 font-semibold block">
                      ยืนยันตัวตนสำเร็จ (พบตัวละครในเซิร์ฟเวอร์)
                    </span>
                    <span className="text-sm font-black text-white font-mono">
                      ชื่อตัวละคร: {playerNickname} {playerLevel ? `(Lv.${playerLevel})` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Choose Top-Up Package (CORE FEATURE) */}
          <div className="rounded-3xl bg-[#120E24]/85 border border-violet-500/25 p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.6)] space-y-6 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-extrabold text-sm flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                  2
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-white font-heading">เลือกแพ็กเกจที่ต้องสั่งซื้อ</h2>
                  <p className="text-xs text-violet-300/70 font-medium">
                    เลือกจำนวนเหรียญ/เพชร หรือแพ็กเกจพิเศษที่ต้องการ
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-950/80 text-cyan-300 border border-violet-600/40 hidden sm:inline-block">
                มี {activePackages.length} แพ็กเกจให้เลือก
              </span>
            </div>

            {/* Login Notice Banner if not logged in */}
            {!isLoggedIn && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-black shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-amber-300 block">
                      กรุณาเข้าสู่ระบบก่อนเพื่อดูราคาและเลือกแพ็กเกจสินค้า
                    </span>
                    <span className="text-xs text-amber-200/80">
                      ระบบสงวนสิทธิ์การดูราคาและสั่งซื้อเฉพาะสมาชิกที่เข้าสู่ระบบแล้วเท่านั้น
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all hover:scale-105"
                >
                  เข้าสู่ระบบทันที
                </button>
              </div>
            )}

            {/* Packages Grid - Cyber Glowing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activePackages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      if (!isLoggedIn) {
                        setNotification({
                          type: 'error',
                          message: 'กรุณาเข้าสู่ระบบก่อนเพื่อดูราคาและเลือกแพ็กเกจสินค้า',
                        });
                        setIsAdminLoginModalOpen(true);
                        return;
                      }
                      setSelectedPackage(pkg);
                    }}
                    className={`relative p-4.5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-violet-950/90 to-[#1B1433] border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.02]'
                        : 'bg-[#0B0813]/80 hover:bg-[#1B1433]/70 border border-violet-500/25 hover:border-violet-400'
                    }`}
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      {pkg.badge ? (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_8px_rgba(217,70,239,0.4)]">
                          {pkg.badge}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-violet-300">
                          {pkg.inGameItem}
                        </span>
                      )}
                    </div>

                    {/* Package Name & Amount */}
                    {pkg.imageUrl ? (
                      <div className="flex items-center gap-3 my-2">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-violet-500/40 shrink-0 shadow-inner flex items-center justify-center">
                          <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm sm:text-base text-white line-clamp-2 font-heading leading-tight">
                            {pkg.name}
                          </h4>
                          <span className="text-[11px] text-cyan-300 font-mono font-medium block mt-0.5">
                            {pkg.inGameItem}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="my-1.5">
                        <h4 className="font-extrabold text-base text-white line-clamp-1 font-heading">
                          {pkg.name}
                        </h4>
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="pt-2.5 mt-2 border-t border-violet-500/20 flex items-baseline justify-between">
                      {isLoggedIn ? (
                        <>
                          {pkg.originalPrice > pkg.price ? (
                            <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                              ฿{pkg.originalPrice.toLocaleString()}
                            </span>
                          ) : (
                            <span></span>
                          )}

                          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 font-mono tabular-nums">
                            ฿{pkg.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="w-full text-center inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>ล็อกอินเพื่อดูราคา</span>
                        </span>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-[0_0_12px_#22d3ee] border border-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quantity Stepper Bar */}
            <div className="p-4.5 rounded-2xl bg-[#0B0813]/90 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-sm font-extrabold text-white block font-heading">
                  จำนวนชุดที่ต้องการซื้อ
                </span>
                <span className="text-xs text-violet-300/70 font-medium">
                  เลือกจำนวนแพ็กเกจที่ต้องการเติมสำหรับไอดีนี้
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-[#120E24] p-1.5 rounded-xl border border-violet-500/40">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-white flex items-center justify-center font-black text-sm cursor-pointer"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-12 text-center text-base font-black font-mono text-cyan-400 bg-transparent outline-none tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-white flex items-center justify-center font-black text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {/* Quick Quantity Chips: 1, 5, 10, 15, 20 */}
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quantity === num
                          ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border border-cyan-400 shadow-md scale-105'
                          : 'bg-[#120E24] text-violet-300 hover:bg-[#1B1433] border border-violet-500/30'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Add To Cart Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-[#1B1433] hover:bg-[#251b47] text-cyan-300 font-extrabold text-sm sm:text-base border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                <span>เพิ่มแพ็กเกจนี้ลงในตะกร้า ({quantity} ชุด)</span>
              </button>
            </div>
          </div>

          {/* STEP 3: Payment Method - Cyber Theme */}
          <div className="rounded-3xl bg-[#120E24]/85 border border-violet-500/25 p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-extrabold text-sm flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                3
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-white font-heading">เลือกวิธีชำระเงิน</h2>
                <p className="text-xs text-violet-300/70 font-medium">
                  ระบบตรวจจับยอดอัตโนมัติ รวดเร็ว ปลอดภัย ไร้กังวล
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PromptPay */}
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'promptpay'
                    ? 'bg-gradient-to-br from-violet-950/90 to-[#1B1433] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : 'bg-[#0B0813] border-violet-500/25 hover:border-violet-400'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <QrCode className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-white font-heading">PromptPay QR</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    แนะนำ
                  </span>
                </div>
                <p className="text-xs text-violet-300/80 font-medium mt-1">
                  สแกนจ่ายได้ทุกแอปธนาคาร เวลาเฉลี่ยคือ 6-32 ชม.
                </p>
              </button>

              {/* TrueMoney */}
              <button
                type="button"
                onClick={() => setPaymentMethod('truemoney')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'truemoney'
                    ? 'bg-gradient-to-br from-violet-950/90 to-[#1B1433] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : 'bg-[#0B0813] border-violet-500/25 hover:border-violet-400'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  <CreditCard className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-extrabold text-sm text-white font-heading">TrueMoney Wallet</h4>
                <p className="text-xs text-violet-300/80 font-medium mt-1">
                  โอนผ่านทรูมันนี่วอลเล็ท หรือซองของขวัญ
                </p>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-gradient-to-br from-violet-950/90 to-[#1B1433] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : 'bg-[#0B0813] border-violet-500/25 hover:border-violet-400'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <Building className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-extrabold text-sm text-white font-heading">โอนผ่านธนาคาร</h4>
                <p className="text-xs text-violet-300/80 font-medium mt-1">
                  ไทยพาณิชย์ พร้อมอัปโหลดสลิป
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Sticky Order Summary, Cart Action & Direct Pay */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-3xl bg-[#120E24]/90 border border-violet-500/30 p-6 shadow-[0_0_35px_rgba(0,0,0,0.8)] space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-violet-500/25 pb-4">
              <h3 className="font-extrabold text-xl text-white font-heading">สรุปรายการคำสั่งซื้อ</h3>
              <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                SSL ปลอดภัย 100%
              </span>
            </div>

            {/* Selected item breakdown */}
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300/80">เกมที่เลือก:</span>
                <span className="font-extrabold text-white text-base font-heading">{game.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300/80">User ที่ลงทะเบียน:</span>
                <span className="font-mono text-sm font-bold text-cyan-400 max-w-[170px] truncate">
                  {playerUid || '- ยังไม่ได้กรอก -'}
                </span>
              </div>

              {playerNickname && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-300/80">ชื่อตัวละคร:</span>
                  <span className="font-bold text-emerald-400">{playerNickname}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300/80">แพ็กเกจ:</span>
                <span className="font-bold text-white text-right">
                  {selectedPackage?.name || '- ยังไม่ได้เลือก -'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300/80">จำนวน:</span>
                <span className="font-bold text-cyan-300 text-base font-mono tabular-nums">
                  {quantity} ชุด
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300/80">ช่องทางชำระ:</span>
                <span className="font-bold text-slate-200">
                  {paymentMethod === 'promptpay'
                    ? 'PromptPay QR'
                    : paymentMethod === 'truemoney'
                    ? 'TrueMoney Wallet'
                    : 'โอนเงินธนาคาร'}
                </span>
              </div>
            </div>

            {/* Pricing math */}
            <div className="pt-4 border-t border-violet-500/25 space-y-2">
              {isLoggedIn && totalOriginalPrice > totalPrice && (
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>ราคาเต็มในเกม:</span>
                  <span className="line-through font-mono tabular-nums">
                    ฿{totalOriginalPrice.toLocaleString()}
                  </span>
                </div>
              )}

              {isLoggedIn && totalSavings > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span>ประหยัดได้ทั้งหมด:</span>
                  <span className="font-mono text-sm tabular-nums">-฿{totalSavings.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-2">
                <span className="text-sm font-extrabold text-white font-heading">ยอดชำระสุทธิ:</span>
                {isLoggedIn ? (
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-300 font-mono tracking-tight tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    ฿{totalPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>ล็อกอินเพื่อดูราคา</span>
                  </span>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedPackage}
                    className="w-full py-3.5 rounded-2xl bg-[#1B1433] hover:bg-[#251b47] text-cyan-300 font-extrabold text-sm sm:text-base border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)] flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
                    <span>เพิ่มลงในตะกร้าสินค้า (Add to Cart)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectBuy}
                    disabled={!selectedPackage}
                    className="w-full py-4 rounded-2xl neon-btn-purple text-base shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-heading"
                  >
                    <Zap className="w-5 h-5 text-white fill-current" />
                    <span>ชำระเงินและสั่งซื้อทันที (฿{totalPrice.toLocaleString()})</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Lock className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                  <span>เข้าสู่ระบบเพื่อสั่งซื้อ</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-violet-300/70 font-medium leading-relaxed">
              🔒 ข้อมูลของคุณปลอดภัย ระบบส่งคำสั่งตรงเข้า API เซิร์ฟเวอร์เกม
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
