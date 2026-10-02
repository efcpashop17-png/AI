import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Link2,
  Upload,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Share2,
  Image as ImageIcon,
  Check,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { verifySlipWithEasySlip, EasySlipVerifyResult } from '../services/easySlipService';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    currentOrderForPayment,
    confirmPayment,
    attachSlipAndMarkPaid,
    setActiveTab,
    setNotification,
    currentCustomerUser,
    adjustCustomerBalance,
  } = useApp();

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipUrl, setSlipUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [easySlipResult, setEasySlipResult] = useState<EasySlipVerifyResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPaymentModalOpen) {
      setTimeLeft(600);
      setSlipUploaded(false);
      setSlipUrl('');
      setIsProcessing(false);
      setIsVerifyingSlip(false);
      setEasySlipResult(null);
      return;
    }

    if (currentOrderForPayment?.slipUrl) {
      setSlipUrl(currentOrderForPayment.slipUrl);
      setSlipUploaded(true);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaymentModalOpen, currentOrderForPayment]);

  if (!isPaymentModalOpen || !currentOrderForPayment) return null;

  const order = currentOrderForPayment;
  const isPaid = order.paymentStatus === 'paid' || slipUploaded || !!order.slipUrl;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const paymentLink = `${window.location.origin}/?orderId=${order.id}&amount=${order.price}`;

  const handleCopyPaymentLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setNotification({
      type: 'success',
      message: 'คัดลอกลิงก์ชำระเงิน (Payment Link) เรียบร้อยแล้ว! นำไปเปิดในเบราว์เซอร์อื่นเพื่อชำระเงินได้ทันที',
    });
  };

  const handleCopyTransactionDetails = () => {
    const details = `🎮 บิลชำระเงินสั่งซื้อสต็อกสินค้า
รหัสคำสั่งซื้อ: ${order.id}
เกม: ${order.gameName}
แพ็กเกจ: ${order.packageName}
ไอดีผู้เล่น (UID): ${order.playerUid}
ยอดชำระ: ฿${order.price.toLocaleString()}

ช่องทางการชำระเงิน:
🏦 ธนาคารไทยพาณิชย์ (SCB)
เลขที่บัญชี: 4190566897
ชื่อบัญชี: ชยพล ปุญนนท์

📱 TrueMoney Wallet: 0948201166
ชื่อบัญชี: ชยพล ปุญนนท์

⚡ พร้อมเพย์ (PromptPay): 0948201166
ชื่อบัญชี: ชยพล ปุญนนท์
ลิงก์ชำระเงิน: ${paymentLink}`;

    navigator.clipboard.writeText(details);
    setNotification({
      type: 'success',
      message: 'คัดลอกรายละเอียดคำสั่งซื้อและบัญชีทั้งหมดเรียบร้อยแล้ว',
    });
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      type: 'success',
      message: `คัดลอก${label}แล้ว: ${text}`,
    });
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setNotification({
      type: 'info',
      message: 'ระบบกำลังตรวจสอบยอดชำระเงินและส่งมอบสต็อกผ่านเซิร์ฟเวอร์...',
    });
    confirmPayment(order.id, slipUrl || order.slipUrl || undefined);
  };

  // แนบสลิปแล้วอัปเดตสถานะเป็น "ชำระเงินแล้ว" ทันที!
  const processSlipAttachment = (url: string) => {
    setSlipUrl(url);
    setSlipUploaded(true);
    attachSlipAndMarkPaid(order.id, url);
  };

  const handlePayWithBalance = () => {
    if (!currentCustomerUser) return;
    if (currentCustomerUser.balance < order.price) {
      setNotification({
        type: 'error',
        message: `ยอดเครดิตของคุณ (฿${currentCustomerUser.balance.toLocaleString()}) ไม่เพียงพอสำหรับชำระยอด ฿${order.price.toLocaleString()}`,
      });
      return;
    }

    setIsProcessing(true);
    adjustCustomerBalance(
      currentCustomerUser.id,
      -order.price,
      `ชำระออเดอร์ ${order.id} (${order.gameName} - ${order.packageName})`
    );

    setTimeout(() => {
      confirmPayment(order.id);
      setIsProcessing(false);
      setNotification({
        type: 'success',
        message: `🎉 ชำระเงินด้วยเครดิตคงเหลือสำเร็จ! หัก ฿${order.price.toLocaleString()} และเริ่มจัดส่งสต็อกทันที`,
      });
    }, 600);
  };

  const handleUploadSampleSlip = () => {
    const sampleSlip =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%231e293b"/><text x="150" y="50" fill="%2310b981" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">โอนเงินสำเร็จ</text><text x="150" y="90" fill="%23ffffff" font-size="24" font-family="sans-serif" font-weight="bold" text-anchor="middle">฿' +
      order.price +
      '</text><text x="30" y="150" fill="%2394a3b8" font-size="12" font-family="sans-serif">รหัสคำสั่งซื้อ:</text><text x="30" y="175" fill="%23f59e0b" font-size="14" font-family="sans-serif" font-weight="bold">' +
      order.id +
      '</text><text x="30" y="215" fill="%2394a3b8" font-size="12" font-family="sans-serif">เกม:</text><text x="30" y="240" fill="%23ffffff" font-size="14" font-family="sans-serif" font-weight="bold">' +
      order.gameName +
      '</text><text x="30" y="280" fill="%2394a3b8" font-size="12" font-family="sans-serif">เวลาที่โอน:</text><text x="30" y="305" fill="%23ffffff" font-size="14" font-family="sans-serif">' +
      new Date().toLocaleTimeString('th-TH') +
      '</text></svg>';

    setEasySlipResult({
      success: true,
      verified: true,
      amount: order.price,
      transRef: `DEMO-${Date.now()}`,
      message: 'แนบสลิปทดสอบด่วนเรียบร้อย (Verified Demo)',
    });
    processSlipAttachment(sampleSlip);
  };

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setNotification({
          type: 'error',
          message: 'ขนาดไฟล์รูปสลิปใหญ่เกินไป (จำกัดไม่เกิน 10MB)',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (!result) return;

        setIsVerifyingSlip(true);
        setEasySlipResult(null);

        try {
          // Verify with EasySlip API
          const verifyRes = await verifySlipWithEasySlip(result, order.price, true);
          setEasySlipResult(verifyRes);

          if (verifyRes.success) {
            processSlipAttachment(result);
            setNotification({
              type: 'success',
              message: `🎉 สลิปผ่านการตรวจสอบโดย EasySlip API แล้ว! รหัสอ้างอิง: ${verifyRes.transRef || '-'} ยอดโอน: ฿${verifyRes.amount?.toLocaleString()}`,
            });
          } else {
            // Still set image preview but alert user of verification status
            setSlipUrl(result);
            setNotification({
              type: 'error',
              message: verifyRes.message || 'สลิปนี้ไม่ผ่านการตรวจสอบ กรุณาตรวจสอบความถูกต้อง',
            });
          }
        } catch (err: any) {
          console.error('Slip check error', err);
          processSlipAttachment(result);
        } finally {
          setIsVerifyingSlip(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoToTracking = () => {
    setIsPaymentModalOpen(false);
    setActiveTab('tracking');
    setNotification({
      type: 'info',
      message: `เปิดหน้าระบบติดตามสถานะคำสั่งซื้อ ${order.id} เรียบร้อยแล้ว`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0813]/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#120E24]/95 border border-violet-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white my-8 backdrop-blur-2xl">
        {/* Close Button */}
        <button
          onClick={() => setIsPaymentModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-violet-400 hover:text-white hover:bg-violet-950/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ชำระเงินภายใน {formatTimer(timeLeft)} นาที</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            สแกนเพื่อชำระเงิน
          </h3>
          <p className="text-xs text-violet-300/80 font-medium">
            รหัสคำสั่งซื้อ:{' '}
            <span className="font-mono font-bold text-cyan-300 text-sm tabular-nums">{order.id}</span>
          </p>
        </div>

        {/* MEMBER WALLET PAYMENT OPTION (If Customer is logged in) */}
        {currentCustomerUser && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#1B1433] to-[#120E24] border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">ชำระด้วยเครดิตคงเหลือในบัญชี</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                คงเหลือ ฿{currentCustomerUser.balance.toLocaleString()}
              </span>
            </div>

            {currentCustomerUser.balance >= order.price ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayWithBalance}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer font-heading"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>หักเครดิต ฿{order.price.toLocaleString()} ชำระเงินทันที</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                <span>ยอดเครดิตไม่พอ (ขาดอีก ฿{(order.price - currentCustomerUser.balance).toLocaleString()})</span>
                <span className="text-cyan-300 font-bold">กรุณาสแกน QR ด้านล่าง</span>
              </div>
            )}
          </div>
        )}

        {/* Amount Card */}
        <div className="rounded-2xl bg-[#0B0813] border border-violet-500/30 p-4 text-center mb-5 shadow-lg">
          <span className="text-xs text-violet-400/80 font-bold uppercase tracking-wider block">
            ยอดที่ต้องชำระ (บาท)
          </span>
          <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-300 to-violet-300 font-mono tracking-tight my-1 tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            ฿{order.price.toLocaleString()}
          </div>
          <p className="text-xs text-violet-200/90 font-medium">
            {order.gameName} - {order.packageName}
          </p>
        </div>

        {/* COPY PAYMENT LINK PROMINENT BUTTON (Requested by user) */}
        <div className="mb-5 space-y-2">
          <button
            type="button"
            onClick={handleCopyPaymentLink}
            className="w-full py-3.5 px-4 rounded-xl neon-btn-purple text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-cyan-300 stroke-[2.5]" />
            <span>คัดลอกลิงก์ชำระเงิน (Copy Payment Link)</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyTransactionDetails}
              className="flex-1 py-2 px-3 rounded-xl bg-[#1B1433] hover:bg-[#251b47] border border-violet-500/30 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>คัดลอกรายละเอียดบิลทั้งหมด</span>
            </button>
          </div>
        </div>

        {/* PAYMENT CHANNELS & ACCOUNTS - PromptPay, SCB, TrueMoney (User Specified Details) */}
        <div className="space-y-4 mb-5">
          {/* Thai QR Payment Box */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-slate-900 shadow-xl">
            {/* Header Banner */}
            <div className="w-full flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1.5 font-bold">
                <QrCode className="w-4 h-4 text-blue-800" />
                <span>Thai QR Payment (สแกนได้ทุกแอปธนาคาร &amp; TrueMoney)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
                PromptPay
              </span>
            </div>

            {/* PromptPay QR Code - Live promptpay.io with SVG fallback */}
            <div className="relative p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={`https://promptpay.io/0948201166/${order.price}.png`}
                alt="PromptPay QR Code 0948201166"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                onError={(e) => {
                  // Fallback to stylized SVG if external image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="hidden w-48 h-48 sm:w-52 sm:h-52">
                <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                  <rect width="200" height="200" fill="white" />
                  <rect x="15" y="15" width="45" height="45" rx="4" fill="#0f172a" />
                  <rect x="22" y="22" width="31" height="31" fill="white" />
                  <rect x="27" y="27" width="21" height="21" rx="2" fill="#0f172a" />
                  <rect x="140" y="15" width="45" height="45" rx="4" fill="#0f172a" />
                  <rect x="147" y="22" width="31" height="31" fill="white" />
                  <rect x="152" y="27" width="21" height="21" rx="2" fill="#0f172a" />
                  <rect x="15" y="140" width="45" height="45" rx="4" fill="#0f172a" />
                  <rect x="22" y="147" width="31" height="31" fill="white" />
                  <rect x="27" y="152" width="21" height="21" rx="2" fill="#0f172a" />
                  <rect x="70" y="20" width="8" height="8" fill="#0f172a" />
                  <rect x="90" y="35" width="16" height="8" fill="#0f172a" />
                  <rect x="70" y="70" width="20" height="20" fill="#0f172a" />
                  <rect x="115" y="70" width="16" height="16" fill="#0f172a" />
                  <circle cx="100" cy="100" r="16" fill="#7c3aed" />
                  <text x="100" y="104" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">SCB</text>
                </svg>
              </div>
            </div>

            {/* Recipient Account Details */}
            <div className="mt-3 text-center space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block font-heading">
                ชื่อบัญชี: <strong className="text-blue-900 text-sm">ชยพล ปุญนนท์</strong>
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 block">
                พร้อมเพย์: 094-820-1166
              </span>
            </div>
          </div>

          {/* Bank & Wallet Direct Transfer Cards (User Provided Accounts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. SCB ไทยพาณิชย์ */}
            <div className="p-3.5 rounded-2xl bg-[#0B0813] border border-purple-500/40 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-purple-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>ธนาคารไทยพาณิชย์ (SCB)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText('4190566897', 'เลขบัญชีไทยพาณิชย์')}
                  className="px-2 py-0.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-cyan-300 text-[10px] font-bold border border-purple-600/40 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> คัดลอก
                </button>
              </div>
              <div className="font-mono text-base font-black text-white tabular-nums tracking-wide">
                419-056-6897
              </div>
              <p className="text-[10px] text-violet-300/80">
                ชื่อบัญชี: <strong className="text-white">ชยพล ปุญนนท์</strong>
              </p>
            </div>

            {/* 2. TrueMoney Wallet */}
            <div className="p-3.5 rounded-2xl bg-[#0B0813] border border-amber-500/40 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>TrueMoney Wallet</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText('0948201166', 'เบอร์ TrueMoney')}
                  className="px-2 py-0.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-[10px] font-bold border border-amber-600/40 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> คัดลอก
                </button>
              </div>
              <div className="font-mono text-base font-black text-white tabular-nums tracking-wide">
                094-820-1166
              </div>
              <p className="text-[10px] text-violet-300/80">
                ชื่อบัญชี: <strong className="text-white">ชยพล ปุญนนท์</strong>
              </p>
            </div>
          </div>

          {/* Quick Copy Buttons (PromptPay & Amount) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopyText('0948201166', 'เบอร์พร้อมเพย์')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1B1433] hover:bg-[#251b47] border border-violet-500/30 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
              <span>คัดลอกพร้อมเพย์ 0948201166</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyText(order.price.toString(), 'ยอดเงิน')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1B1433] hover:bg-[#251b47] border border-violet-500/30 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer tabular-nums font-mono"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
              <span>คัดลอกยอดเงิน (฿{order.price.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Hidden file input for actual slip image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRealFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* AUTOMATED PROGRESS & PAID STATUS BANNER - Shown immediately when slip attached */}
        {isPaid && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-fadeIn text-left">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">
                    สถานะ: ชำระเงินเรียบร้อยแล้ว
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                    PAID
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 font-medium mt-0.5 leading-relaxed">
                  ⚡ บันทึกความคืบหน้าระบบอัตโนมัติ: ระบบตรวจพบสลิปและปรับสถานะเป็น <strong className="text-white">&quot;ชำระเงินแล้ว&quot;</strong> เรียบร้อยทันที พร้อมเข้าสู่คิวจัดส่งสต็อกผ่านเซิร์ฟเวอร์
                </p>
              </div>
            </div>

            {/* Slip Thumbnail if available */}
            {slipUrl && (
              <div className="mt-3 pt-3 border-t border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-emerald-500/40 flex items-center justify-center">
                    <img src={slipUrl} alt="หลักฐานสลิป" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block">แนบหลักฐานสลิปแล้ว</span>
                    <span className="text-[10px] text-emerald-300/80 font-mono">
                      {order.id} (฿{order.price.toLocaleString()})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToTracking}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูสถานะคำสั่งซื้อ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Slip upload / attachment option */}
        <div className="mb-5 p-4 rounded-2xl bg-[#0B0813] border border-violet-500/30 text-left">
          <div className="flex items-center justify-between text-xs text-violet-200 mb-2.5">
            <span className="font-bold flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>แนบสลิปการโอนเงิน (อัปเดตสถานะเป็น &quot;ชำระเงินแล้ว&quot; ทันที)</span>
            </span>
            {isPaid ? (
              <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> แนบสลิปแล้ว
              </span>
            ) : (
              <span className="text-[11px] text-violet-400">รองรับ JPG, PNG</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isVerifyingSlip}
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-[#18113c] hover:bg-[#231854] border border-violet-500/40 hover:border-cyan-400 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              {isVerifyingSlip ? (
                <>
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>EasySlip กำลังตรวจสลิป...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>{isPaid ? 'เปลี่ยนรูปสลิปจากเครื่อง' : 'อัปโหลดสลิปจากเครื่อง'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleUploadSampleSlip}
              className="py-2.5 px-3 rounded-xl bg-[#120E24] hover:bg-[#1B1433] border border-violet-500/30 text-xs text-violet-300 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>แนบสลิปตัวอย่าง (Quick Slip)</span>
            </button>
          </div>

          {/* EasySlip Verification Feedback Badge */}
          {easySlipResult && (
            <div
              className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                easySlipResult.success
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}
            >
              {easySlipResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between font-bold mb-0.5">
                  <span>
                    {easySlipResult.success
                      ? '⚡ ผ่านการตรวจสอบโดย EasySlip AI'
                      : '⚠️ EasySlip: ไม่ผ่านการตรวจสอบ'}
                  </span>
                  {easySlipResult.transRef && (
                    <span className="font-mono text-[10px] text-cyan-300 font-normal">
                      Ref: {easySlipResult.transRef}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-90">{easySlipResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY ACTION: Simulate instant payment verification */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSimulatePayment}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-extrabold text-base shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer font-heading"
          >
            {isProcessing ? (
              <span>กำลังตรวจสอบยอดเงินและจัดส่งสต็อกสินค้าผ่านเซิร์ฟเวอร์...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 fill-current" />
                <span>
                  {isPaid
                    ? 'ยืนยันและจัดส่งสต็อกเข้าไอดีทันที'
                    : 'จำลองการสแกนจ่ายสำเร็จ (กดเพื่อจัดส่งสต็อกเข้าไอดีทันที)'}
                </span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-violet-400/70 font-medium">
            ระบบจัดส่งสต็อกผ่านเซิร์ฟเวอร์อัตโนมัติ ใช้เวลาประมาณ 10-30 วินาที
          </p>
        </div>
      </div>
    </div>
  );
};
