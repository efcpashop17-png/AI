import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Zap, Check, AlertCircle, Plus, Minus, Tag } from 'lucide-react';
import { Game, GamePackage } from '../types';
import { useApp } from '../context/AppContext';

export const GameTopUpModal: React.FC = () => {
  const {
    selectedGame,
    selectedPackage: initialPackage,
    isTopUpModalOpen,
    closeTopUpModal,
    createTopUpOrder,
    addToCart,
    currentCustomer,
  } = useApp();

  const [selectedPkg, setSelectedPkg] = useState<GamePackage | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [account, setAccount] = useState<string>('');
  const [server, setServer] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize selected package and quantity when game/package changes
  useEffect(() => {
    if (selectedGame && isTopUpModalOpen) {
      const activePkgs = (selectedGame.packages || []).filter((p) => p.active !== false);
      if (initialPackage && activePkgs.some((p) => p.id === initialPackage.id)) {
        setSelectedPkg(initialPackage);
      } else if (activePkgs.length > 0) {
        setSelectedPkg(activePkgs[0]);
      } else {
        setSelectedPkg(null);
      }
      setQuantity(1); // ALWAYS default to exactly 1 pack
      setAccount('');
      if (selectedGame.accountField.servers && selectedGame.accountField.servers.length > 0) {
        setServer(selectedGame.accountField.servers[0]);
      } else {
        setServer('');
      }
      if (currentCustomer) {
        setContact(currentCustomer.contactPhone || currentCustomer.contactEmail || '');
      } else {
        setContact('');
      }
      setErrorMsg('');
    }
  }, [selectedGame, initialPackage, isTopUpModalOpen, currentCustomer]);

  if (!isTopUpModalOpen || !selectedGame) return null;

  // Ensure no duplicate packages are rendered
  const seenIds = new Set<string>();
  const activePackages = (selectedGame.packages || []).filter((p) => {
    if (p.active === false) return false;
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  const handleQuantityChange = (newQty: number) => {
    const valid = Math.max(1, Math.min(99, newQty || 1));
    setQuantity(valid);
  };

  const validateForm = () => {
    if (!selectedPkg) {
      setErrorMsg('กรุณาเลือกแพ็กเกจที่ต้องการเติม');
      return false;
    }
    if (!account.trim()) {
      setErrorMsg(`กรุณากรอก ${selectedGame.accountField.label}`);
      return false;
    }
    if (selectedGame.accountField.needsServerSelect && !server) {
      setErrorMsg('กรุณาเลือกเซิร์ฟเวอร์');
      return false;
    }
    if (!contact.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลติดต่อ (เบอร์โทร หรือ LINE ID)');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleDirectBuy = async () => {
    if (!validateForm() || !selectedPkg) return;
    setIsSubmitting(true);
    try {
      await createTopUpOrder(selectedGame, selectedPkg, quantity, {
        account: account.trim(),
        server: server || undefined,
        contact: contact.trim(),
      });
    } catch (e: any) {
      setErrorMsg(e?.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!validateForm() || !selectedPkg) return;
    addToCart(selectedGame, selectedPkg, quantity, {
      account: account.trim(),
      server: server || undefined,
      contact: contact.trim(),
    });
    closeTopUpModal();
  };

  const currentTotalPrice = selectedPkg ? selectedPkg.price * quantity : 0;
  const currentTotalOriginal = selectedPkg ? selectedPkg.originalPrice * quantity : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-cyan-950/20 to-neutral-900 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {selectedGame.category}
              </span>
              <span className="text-xs text-neutral-400">{selectedGame.publisher}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{selectedGame.name}</h2>
          </div>
          <button
            onClick={closeTopUpModal}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Account Details Form */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>1. ข้อมูลไอดีผู้เล่น</span>
              <span className="text-red-400">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  {selectedGame.accountField.label}
                </label>
                <input
                  type="text"
                  placeholder={selectedGame.accountField.placeholder}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                {selectedGame.accountField.helperText && (
                  <p className="text-[11px] text-neutral-500 mt-1">{selectedGame.accountField.helperText}</p>
                )}
              </div>

              {selectedGame.accountField.needsServerSelect && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">เซิร์ฟเวอร์</label>
                  <select
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {(selectedGame.accountField.servers || []).map((srv) => (
                      <option key={srv} value={srv}>
                        {srv}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={selectedGame.accountField.needsServerSelect ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ข้อมูลติดต่อ (เบอร์โทร / LINE ID)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 089-xxx-xxxx หรือ @line"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Package Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              2. เลือกแพ็กเกจที่ต้องการเติม ({activePackages.length} แพ็กเกจ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activePackages.map((pkg) => {
                const isSelected = selectedPkg?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-sm text-white">{pkg.name}</span>
                        {pkg.isHot && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {pkg.badge || 'HOT'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-extrabold text-cyan-400">฿{pkg.price.toLocaleString()}</span>
                        {pkg.originalPrice > pkg.price && (
                          <span className="text-[11px] text-neutral-500 line-through">
                            ฿{pkg.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-cyan-500 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Quantity Selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              3. จำนวนแพ็กเกจที่ต้องการเติม
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-800 bg-neutral-950 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-14 text-center bg-transparent text-white font-bold text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 99}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs font-medium text-neutral-400">
                รวมทั้งหมด <strong className="text-cyan-400 font-bold">{quantity} แพ็ก</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">ยอดรวมสุทธิ ({quantity} แพ็ก)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">฿{currentTotalPrice.toLocaleString()}</span>
              {currentTotalOriginal > currentTotalPrice && (
                <span className="text-xs text-neutral-500 line-through">
                  ฿{currentTotalOriginal.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-neutral-700"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>ใส่ตะกร้า</span>
            </button>
            <button
              type="button"
              onClick={handleDirectBuy}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-neutral-950 font-black text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังสร้างออเดอร์...' : 'สั่งซื้อทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
