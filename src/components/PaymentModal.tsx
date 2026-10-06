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
  ArrowLeft,
  Share2,
  Image as ImageIcon,
  Check,
  Wallet,
  RefreshCw,
  Download,
} from 'lucide-react';
import QRCode from 'qrcode';
import { verifySlipWithEasySlip, EasySlipVerifyResult } from '../services/easySlipService';
import { generatePromptPayPayload, formatPromptPayDisplay } from '../utils/promptpay';
import { getOrderItems, formatOrderPackagesNotation, formatPackageQuantityTag } from '../utils/orderHelper';

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
    paymentConfig,
    games,
    setSelectedGame,
    setSelectedPackage,
  } = useApp();

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipUrl, setSlipUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [easySlipResult, setEasySlipResult] = useState<EasySlipVerifyResult | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPaymentModalOpen) {
      setTimeLeft(600);
      setSlipUploaded(false);
      setSlipUrl('');
      setIsProcessing(false);
      setIsVerifyingSlip(false);
      setEasySlipResult(null);
      setQrCodeDataUrl('');
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

  // Generate genuine PromptPay EMVCo QR code data URL locally with National ID (13 digits) or Phone
  useEffect(() => {
    if (!currentOrderForPayment) return;
    const cleanId = (paymentConfig?.promptPayId || '1100401206065').replace(/[^0-9]/g, '');
    try {
      const payload = generatePromptPayPayload(cleanId, currentOrderForPayment.price);
      QRCode.toDataURL(payload, {
        margin: 1,
        width: 320,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => {
          console.error('Failed to generate local PromptPay QR:', err);
          setQrCodeDataUrl(`https://promptpay.io/${cleanId}/${currentOrderForPayment.price}.png`);
        });
    } catch (e) {
      console.error('PromptPay payload generation error:', e);
      setQrCodeDataUrl(`https://promptpay.io/${cleanId}/${currentOrderForPayment.price}.png`);
    }
  }, [currentOrderForPayment, paymentConfig]);

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

  const rawPromptPay = paymentConfig?.promptPayId || '1100401206065';
  const cleanPromptPay = rawPromptPay.replace(/[^0-9]/g, '');
  const formattedPromptPay = formatPromptPayDisplay(cleanPromptPay);
  const isCitizenId = cleanPromptPay.length === 13;
  const promptPayLabel = isCitizenId ? 'เลขประจำตัวประชาชน' : 'เบอร์โทรศัพท์';
  const accountHolderName = paymentConfig?.accountName || 'ชยพล ปุญนนท์';

  const handleSaveQrImage = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `PromptPay-QR-${order.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({
      type: 'success',
      message: 'บันทึกรูปภาพ QR Code พร้อมเพย์ลงในเครื่องเรียบร้อยแล้ว! สามารถเปิดแอปธนาคารแล้วเลือกสแกนรูปภาพได้ทันที',
    });
  };

  const handleCopyTransactionDetails = () => {
    const promptPayLine = isCitizenId
      ? `⚡ พร้อมเพย์ (PromptPay): ${accountHolderName} (สแกนผ่าน QR Code ในบิลคำสั่งซื้อ)`
      : `⚡ พร้อมเพย์ (PromptPay): ${formattedPromptPay}\nชื่อบัญชี: ${accountHolderName}`;

    const details = `🎮 บิลชำระเงินสั่งซื้อสต็อกสินค้า
รหัสคำสั่งซื้อ: ${order.id}
เกม: ${order.gameName}
แพ็กเกจ: ${order.packageName}
ไอดีผู้เล่น (UID): ${order.playerUid}
ยอดชำระ: ฿${order.price.toLocaleString()}

ช่องทางการชำระเงิน:
🏦 ${paymentConfig?.bankName || 'ธนาคารไทยพาณิชย์ (SCB)'}
เลขที่บัญชี: ${paymentConfig?.bankAccountRaw || paymentConfig?.bankAccount || '4190566897'}
ชื่อบัญชี: ${accountHolderName}

📱 TrueMoney Wallet: ${paymentConfig?.trueMoneyRaw || paymentConfig?.trueMoney || '0948201166'}
ชื่อบัญชี: ${accountHolderName}

${promptPayLine}
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

  const handleConfirmOrderPayment = () => {
    if (!isPaid && !slipUrl) {
      fileInputRef.current?.click();
      return;
    }
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

  const handleBackToEditOrder = () => {
    setIsPaymentModalOpen(false);

    // Restore matching game and package in order form for customer to edit
    const targetGame = games.find((g) => g.id === order.gameId || g.name === order.gameName);
    if (targetGame) {
      setSelectedGame(targetGame);
      const targetPkg = targetGame.packages.find((p) => p.name === order.packageName || p.price === order.price);
      if (targetPkg) {
        setSelectedPackage(targetPkg);
      }
    }

    setActiveTab('store');

    setNotification({
      type: 'info',
      message: 'ย้อนกลับมายังหน้าคำสั่งซื้อแล้ว คุณสามารถเปลี่ยนแพ็กเกจหรือแก้ไข UID ได้ทันที',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B0813]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-[#120E24]/95 border border-violet-500/30 p-4 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white my-auto max-h-[92vh] flex flex-col backdrop-blur-2xl">
        {/* Top Navigation Bar: Back Button, Timer, and Close Button */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-violet-500/20 shrink-0">
          {/* Back button to edit order */}
          <button
            type="button"
            onClick={handleBackToEditOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-900/50 hover:bg-violet-800/80 border border-violet-600/40 text-violet-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm group"
            title="ย้อนกลับไปแก้ไขคำสั่งซื้อ"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>ย้อนกลับแก้ไข</span>
          </button>

          {/* Timer Countdown Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[11px] sm:text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Clock className="w-3 h-3 stroke-[2.5]" />
            <span>{formatTimer(timeLeft)} นาที</span>
          </div>

          {/* Close X Button */}
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            className="p-1.5 rounded-xl text-violet-400 hover:text-white hover:bg-violet-950/60 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1 scrollbar-thin">
          {/* Header Title */}
          <div className="text-center pt-0.5">
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
              สแกนเพื่อชำระเงิน
            </h3>
            <p className="text-[11px] text-violet-300/80 font-medium">
              รหัสคำสั่งซื้อ: <span className="font-mono font-bold text-cyan-300 tabular-nums">{order.id}</span>
            </p>
          </div>

          {/* Amount & Package Card */}
          <div className="rounded-2xl bg-[#0B0813] border border-violet-500/30 p-3 sm:p-3.5 text-center shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-violet-400 font-bold uppercase tracking-wider mb-0.5">
              <span>ยอดที่ต้องชำระ</span>
              <span className="text-cyan-300 font-mono font-normal">UID: {order.playerUid}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-300 to-violet-300 font-mono tracking-tight my-0.5 tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              ฿{order.price.toLocaleString()}
            </div>

            {/* Shop Notation: e.g. 12800x10  5700x10  3250x2 */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              {getOrderItems(order).map((it, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black font-mono text-xs shadow-sm"
                >
                  {formatPackageQuantityTag(it)}
                </span>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-violet-500/20 space-y-1 text-left">
              {getOrderItems(order).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-violet-200 font-bold truncate">
                    {order.gameName} - {it.packageName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[11px] shrink-0 ml-2 font-mono">
                    {formatPackageQuantityTag(it)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Copy Payment Link & Copy Bill Details (Compact 2-col) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyPaymentLink}
              className="py-2 px-2.5 rounded-xl neon-btn-purple text-[11px] sm:text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer truncate"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-300 shrink-0 stroke-[2.5]" />
              <span className="truncate">คัดลอกลิงก์ชำระ</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTransactionDetails}
              className="py-2 px-2.5 rounded-xl bg-[#1B1433] hover:bg-[#251b47] border border-violet-500/30 text-[11px] sm:text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">คัดลอกบิลทั้งหมด</span>
            </button>
          </div>

          {/* Thai QR Payment Box */}
          <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white text-slate-900 shadow-xl">
            {/* Header Banner */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs">
                <QrCode className="w-3.5 h-3.5 text-blue-800" />
                <span>Thai QR Payment (สแกนได้ทุกแอปธนาคาร &amp; TrueMoney)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
                PromptPay
              </span>
            </div>

            {/* PromptPay QR Code - Genuine EMVCo generated locally with fallback */}
            <div className="relative p-1.5 bg-white rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={qrCodeDataUrl || `https://promptpay.io/${cleanPromptPay}/${order.price}.png`}
                alt={`PromptPay QR Code ${formattedPromptPay}`}
                className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                onError={(e) => {
                  // Fallback to stylized SVG if external image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="hidden w-40 h-40 sm:w-44 sm:h-44">
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

            {/* Recipient Account Details - Citizen ID hidden for privacy & security */}
            <div className="mt-2.5 text-center space-y-1">
              <span className="text-xs font-bold text-slate-800 block font-heading">
                ชื่อบัญชี: <strong className="text-blue-900 text-sm">{accountHolderName}</strong>
              </span>
              {isCitizenId ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] sm:text-[11px] font-bold text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>พร้อมเพย์ QR (สแกนได้ทุกแอปธนาคาร &amp; TrueMoney)</span>
                </div>
              ) : (
                <span className="text-xs font-mono font-bold text-slate-700 block">
                  พร้อมเพย์: {formattedPromptPay}
                </span>
              )}
            </div>
          </div>

          {/* Bank & Wallet Direct Transfer Cards (User Provided Accounts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. SCB ไทยพาณิชย์ */}
            <div className="p-3 rounded-2xl bg-[#0B0813] border border-purple-500/40 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-purple-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>{paymentConfig?.bankName || 'ธนาคารไทยพาณิชย์ (SCB)'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(paymentConfig?.bankAccountRaw || paymentConfig?.bankAccount?.replace(/-/g, '') || '4190566897', 'เลขบัญชีธนาคาร')}
                  className="px-2 py-0.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-cyan-300 text-[10px] font-bold border border-purple-600/40 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> คัดลอก
                </button>
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white tabular-nums tracking-wide">
                {paymentConfig?.bankAccount || '419-056-6897'}
              </div>
              <p className="text-[10px] text-violet-300/80">
                ชื่อบัญชี: <strong className="text-white">{accountHolderName}</strong>
              </p>
            </div>

            {/* 2. TrueMoney Wallet */}
            <div className="p-3 rounded-2xl bg-[#0B0813] border border-amber-500/40 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>TrueMoney Wallet</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(paymentConfig?.trueMoneyRaw || paymentConfig?.trueMoney?.replace(/-/g, '') || '0948201166', 'เบอร์ TrueMoney')}
                  className="px-2 py-0.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-[10px] font-bold border border-amber-600/40 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> คัดลอก
                </button>
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white tabular-nums tracking-wide">
                {paymentConfig?.trueMoney || '094-820-1166'}
              </div>
              <p className="text-[10px] text-violet-300/80">
                ชื่อบัญชี: <strong className="text-white">{accountHolderName}</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            {isCitizenId ? (
              <button
                type="button"
                onClick={handleSaveQrImage}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 hover:from-blue-600 hover:to-indigo-600 border border-blue-500/40 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              >
                <Download className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
                <span>บันทึกรูป QR พร้อมเพย์</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCopyText(cleanPromptPay, 'เบอร์พร้อมเพย์')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1B1433] hover:bg-[#251b47] border border-violet-500/30 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
                <span className="truncate">คัดลอกพร้อมเพย์ ({formattedPromptPay})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCopyText(order.price.toString(), 'ยอดเงิน')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1B1433] hover:bg-[#251b47] border border-violet-500/30 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer tabular-nums font-mono"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
              <span>คัดลอกยอดเงิน (฿{order.price.toLocaleString()})</span>
            </button>
          </div>

          {/* AUTOMATED PROGRESS & PAID STATUS BANNER - Shown immediately when slip attached */}
          {isPaid && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-fadeIn text-left">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/40">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-white">
                      สถานะ: ชำระเงินเรียบร้อยแล้ว
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                      PAID
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 font-medium mt-0.5 leading-relaxed">
                    ⚡ ระบบตรวจพบสลิปและปรับสถานะเป็น <strong className="text-white">&quot;ชำระเงินแล้ว&quot;</strong> เรียบร้อยทันที พร้อมเข้าสู่คิวจัดส่งสต็อกผ่านเซิร์ฟเวอร์
                  </p>
                </div>
              </div>

              {/* Slip Thumbnail if available */}
              {slipUrl && (
                <div className="mt-2.5 pt-2.5 border-t border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/40 border border-emerald-500/40 flex items-center justify-center">
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

          {/* Slip Upload / Attachment Box */}
          <div className="p-3 rounded-2xl bg-[#0B0813] border border-violet-500/30 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-violet-200">
              <span className="font-bold flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                <span>แนบสลิปโอนเงิน (ตรวจสอบผ่านระบบทันที)</span>
              </span>
              {isPaid ? (
                <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> แนบสลิปแล้ว
                </span>
              ) : (
                <span className="text-[10px] text-violet-400">รองรับ JPG, PNG</span>
              )}
            </div>

            <button
              type="button"
              disabled={isVerifyingSlip}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-[#18113c] hover:bg-[#231854] border border-violet-500/40 hover:border-cyan-400 text-xs font-bold text-violet-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              {isVerifyingSlip ? (
                <>
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>EasySlip กำลังตรวจสลิป...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>{isPaid ? 'เปลี่ยนรูปสลิปจากเครื่อง' : 'เลือกและอัปโหลดสลิปโอนเงิน (JPG / PNG)'}</span>
                </>
              )}
            </button>

            {/* EasySlip Verification Feedback Badge */}
            {easySlipResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
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
                  <p className="text-[10px] sm:text-[11px] opacity-90">{easySlipResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Confirmation & Back To Edit Buttons (Footer) */}
        <div className="pt-2.5 mt-1 border-t border-violet-500/20 space-y-2 shrink-0">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirmOrderPayment}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer font-heading"
          >
            {isProcessing ? (
              <span>กำลังตรวจสอบยอดเงินและจัดส่งสต็อกสินค้าผ่านเซิร์ฟเวอร์...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 fill-current" />
                <span>
                  {isPaid || slipUrl
                    ? 'ยืนยันและเริ่มจัดส่งสต็อกเข้าไอดีทันที'
                    : 'แนบสลิปโอนเงินเพื่อยืนยันคำสั่งซื้อ'}
                </span>
              </>
            )}
          </button>

          {/* Secondary Back Button to Edit Order */}
          <button
            type="button"
            onClick={handleBackToEditOrder}
            className="w-full py-2.5 px-3 rounded-xl border border-violet-700/50 bg-violet-950/40 hover:bg-violet-900/60 text-violet-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span>ย้อนกลับไปแก้ไขคำสั่งซื้อ (เปลี่ยนแพ็กเกจ / แก้ไข UID)</span>
          </button>

          <p className="text-[10px] sm:text-[11px] text-center text-violet-400/70 font-medium">
            ระบบจัดส่งสต็อกผ่านเซิร์ฟเวอร์อัตโนมัติ ใช้เวลาประมาณ 10-30 วินาที
          </p>
        </div>

        {/* Hidden file input for actual slip image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRealFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};
