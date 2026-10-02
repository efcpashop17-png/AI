import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  X,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Coins,
  ArrowRight,
  Info,
} from 'lucide-react';
import { verifySlipWithEasySlip, EasySlipVerifyResult } from '../services/easySlipService';

interface TopupCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 300, 500, 1000, 2000, 5000];

export const TopupCreditModal: React.FC<TopupCreditModalProps> = ({ isOpen, onClose }) => {
  const { currentCustomerUser, adjustCustomerBalance, setNotification } = useApp();

  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<EasySlipVerifyResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setNotification({
      type: 'success',
      message: `คัดลอก ${text} เรียบร้อยแล้ว`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentAmount <= 0) {
      setNotification({
        type: 'error',
        message: 'กรุณาเลือกหรือระบุยอดเงินที่ต้องการเติมก่อนอัปโหลดสลิป',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSlipImage(dataUrl);
      await processSlipVerification(dataUrl, currentAmount);
    };
    reader.readAsDataURL(file);
  };

  const processSlipVerification = async (dataUrl: string, expectedAmt: number) => {
    if (!currentCustomerUser) {
      setNotification({
        type: 'error',
        message: 'กรุณาเข้าสู่ระบบบัญชีลูกค้าก่อนเติมเครดิต',
      });
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const result = await verifySlipWithEasySlip(dataUrl, expectedAmt, true);
      setVerifyResult(result);

      if (result.success && result.amount) {
        // Automatically top up customer balance
        adjustCustomerBalance(
          currentCustomerUser.id,
          result.amount,
          `EasySlip Topup Ref: ${result.transRef || 'Auto'}`
        );

        setNotification({
          type: 'success',
          message: `🎉 ตรวจสอบสลิปผ่าน EasySlip สำเร็จ! เติมเครดิต +฿${result.amount.toLocaleString()} เรียบร้อยแล้ว`,
        });
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'ไม่สามารถยืนยันสลิปได้ กรุณาตรวจสอบรูปภาพ',
        });
      }
    } catch (err: any) {
      console.error('Error verifying slip:', err);
      setNotification({
        type: 'error',
        message: 'ระบบตรวจสอบสลิปขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setSlipImage(null);
    setVerifyResult(null);
    setIsVerifying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#120E24] border border-violet-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(139,92,246,0.3)] my-8">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-violet-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white font-heading">
                  เติมเครดิตเข้ากระเป๋า
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> EasySlip AI
                </span>
              </div>
              <p className="text-xs text-violet-300/80">
                ระบบตรวจสลิปอัตโนมัติ 24 ชม. เครดิตเข้ากระเป๋าทันทีไม่ต้องรอแอดมิน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-violet-950/50 hover:bg-violet-900/60 text-violet-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Balance Banner */}
        {currentCustomerUser && (
          <div className="rounded-2xl bg-[#1B1433] border border-violet-500/40 p-4 mb-6 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs text-violet-400 font-bold block">ผู้ใช้งานปัจจุบัน</span>
              <span className="text-sm font-bold text-white">
                {currentCustomerUser.customerName} ({currentCustomerUser.username})
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-violet-400 font-bold block">เครดิตคงเหลือ</span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-300 font-mono">
                ฿{currentCustomerUser.balance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Success State */}
        {verifyResult?.success ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-white font-heading mb-1">
                เติมเครดิตสำเร็จ!
              </h4>
              <p className="text-sm text-emerald-300 font-bold">
                เพิ่มเครดิตเข้าบัญชี +฿{verifyResult.amount?.toLocaleString()} เรียบร้อยแล้ว
              </p>
            </div>

            {/* Slip Details Card */}
            <div className="rounded-2xl bg-[#0B0813] border border-emerald-500/30 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>รหัสอ้างอิง EasySlip:</span>
                <span className="font-mono text-cyan-300 font-bold">{verifyResult.transRef || '-'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ผู้โอนเงิน:</span>
                <span className="font-bold text-white">{verifyResult.senderName || '-'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ผู้รับเงิน:</span>
                <span className="font-bold text-emerald-400">{verifyResult.receiverName || 'EF CPA Shop'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ยอดเงินที่ได้รับ:</span>
                <span className="font-mono text-lg font-black text-emerald-400">
                  ฿{verifyResult.amount?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-violet-950/60 hover:bg-violet-900 border border-violet-500/40 text-xs font-bold text-violet-200 hover:text-white transition-all cursor-pointer"
              >
                เติมเครดิตเพิ่ม
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl neon-btn-purple text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
              >
                เสร็จสิ้น / กลับหน้าหลัก
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Select Amount */}
            <div>
              <label className="text-xs font-bold text-violet-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. เลือกจำนวนเงินที่ต้องการเติม</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {PRESET_AMOUNTS.map((amt) => {
                  const isActive = !isCustom && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setIsCustom(false);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                          : 'bg-[#1B1433] text-violet-300 border-violet-500/20 hover:border-violet-500/50'
                      }`}
                    >
                      ฿{amt.toLocaleString()}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isCustom
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                      : 'bg-violet-950/40 text-violet-400 border-violet-500/20 hover:text-white'
                  }`}
                >
                  กำหนดจำนวนเงินเอง
                </button>
                {isCustom && (
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 font-mono text-xs">
                      ฿
                    </span>
                    <input
                      type="number"
                      min="10"
                      step="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="ระบุจำนวนเงิน เช่น 1500"
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-[#0B0813] border border-cyan-500/50 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: PromptPay QR Code & Account */}
            <div>
              <label className="text-xs font-bold text-violet-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. สแกน QR หรือโอนเงินเข้าบัญชีร้าน (ยอด ฿{currentAmount.toLocaleString()})</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0B0813] border border-violet-500/30">
                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-900 shadow-lg">
                  <div className="text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Thai QR PromptPay</span>
                  </div>
                  <img
                    src={`https://promptpay.io/0948201166/${currentAmount}.png`}
                    alt="PromptPay QR Code"
                    className="w-36 h-36 object-contain"
                  />
                  <span className="text-[10px] text-slate-600 font-bold mt-1 font-mono">
                    ยอดเงิน: ฿{currentAmount.toLocaleString()}
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#1B1433] border border-violet-500/20">
                    <div className="text-[10px] text-violet-400 font-bold">พร้อมเพย์ / TrueMoney</div>
                    <div className="flex items-center justify-between font-mono text-cyan-300 font-bold text-sm">
                      <span>0948201166</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('0948201166', 'pp')}
                        className="p-1 rounded bg-violet-900/60 hover:bg-violet-800 text-violet-200 cursor-pointer"
                      >
                        {copiedField === 'pp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ชื่อบัญชี: ชยพล ปุญนนท์</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1B1433] border border-violet-500/20">
                    <div className="text-[10px] text-violet-400 font-bold">ธนาคารไทยพาณิชย์ (SCB)</div>
                    <div className="flex items-center justify-between font-mono text-purple-300 font-bold text-sm">
                      <span>419-056689-7</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('4190566897', 'scb')}
                        className="p-1 rounded bg-violet-900/60 hover:bg-violet-800 text-violet-200 cursor-pointer"
                      >
                        {copiedField === 'scb' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ชื่อบัญชี: ชยพล ปุญนนท์</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Upload Slip for EasySlip Check */}
            <div>
              <label className="text-xs font-bold text-violet-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. แนบสลิปเพื่อตรวจผ่าน EasySlip ทันที</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Drop Zone */}
              <div
                onClick={() => !isVerifying && fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  isVerifying
                    ? 'border-cyan-400 bg-cyan-950/20 animate-pulse'
                    : 'border-violet-500/40 hover:border-cyan-400 bg-[#120E24]/60 hover:bg-[#1B1433]'
                }`}
              >
                {isVerifying ? (
                  <div className="space-y-3">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                    <div>
                      <span className="text-sm font-bold text-white block">
                        กำลังตรวจสอบสลิปผ่าน EasySlip API...
                      </span>
                      <span className="text-xs text-cyan-300/80">
                        กำลังดึงข้อมูลธุรกรรมจากธนาคารเพื่อยืนยันยอดเงิน
                      </span>
                    </div>
                  </div>
                ) : slipImage ? (
                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={slipImage}
                      alt="สลิปที่อัปโหลด"
                      className="w-16 h-20 object-cover rounded-xl border border-violet-500/50 shadow-md"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">อัปโหลดสลิปเรียบร้อย</span>
                      <span className="text-[11px] text-violet-300/80 block">
                        คลิกเพื่อเปลี่ยนรูปภาพสลิปใหม่
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        คลิกเพื่อเลือกรูปสลิป หรือลากไฟล์มาวางที่นี่
                      </span>
                      <span className="text-[11px] text-violet-300/70">
                        รองรับไฟล์ JPG, PNG ที่มี QR Code ธนาคารชัดเจน
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error banner if verify failed */}
              {verifyResult && !verifyResult.success && (
                <div className="mt-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ไม่สามารถยืนยันสลิปได้</span>
                    <span>{verifyResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Note banner */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2 text-[11px] text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                ระบบเชื่อมต่อ <strong>EasySlip API (Official Key)</strong> เพื่อตรวจสอบยอดโอนและชื่อบัญชีตรงกันทันที
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
