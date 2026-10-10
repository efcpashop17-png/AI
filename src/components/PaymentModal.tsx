import React, { useState, useEffect } from 'react';
import { X, QrCode, Upload, Wallet, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { generatePromptPayPayload } from '../utils/promptpay';
import { verifySlipWithServer } from '../services/easySlipService';
import { compressImage } from '../utils/imageCompressor';
import { uploadImageToServer } from '../services/persistentStorageService';
import { getOrderItems, formatPackageQuantityTag } from '../utils/orderHelper';

export const PaymentModal: React.FC = () => {
  const { currentOrderForPayment, isPaymentModalOpen, closePaymentModal, completePayment, settings, currentCustomer } =
    useApp();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedPromptpay, setCopiedPromptpay] = useState<boolean>(false);
  const [paymentTab, setPaymentTab] = useState<'promptpay' | 'credit'>('promptpay');

  const order = currentOrderForPayment;

  // Generate QR Code
  useEffect(() => {
    if (order && isPaymentModalOpen) {
      setSlipPreview('');
      setVerificationResult(null);
      setErrorMsg('');

      const target = settings.promptpayNumber || '0891234567';
      const payload = generatePromptPayPayload(target, order.totalPrice);

      QRCode.toDataURL(payload, { width: 300, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code error:', err));

      if (currentCustomer && currentCustomer.balance >= order.totalPrice) {
        setPaymentTab('credit');
      } else {
        setPaymentTab('promptpay');
      }
    }
  }, [order, isPaymentModalOpen, settings.promptpayNumber, currentCustomer]);

  if (!isPaymentModalOpen || !order) return null;

  const orderItems = getOrderItems(order);

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(settings.promptpayNumber || '0891234567');
    setCopiedPromptpay(true);
    setTimeout(() => setCopiedPromptpay(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsVerifying(true);

    try {
      // 1. Compress Image
      const compressedBase64 = await compressImage(file, 1000, 0.85);
      setSlipPreview(compressedBase64);

      // 2. Upload to server
      const uploadedUrl = await uploadImageToServer(compressedBase64, `slip_${order.id}`);

      // 3. Verify with EasySlip
      let verifyRes = null;
      if (settings.easySlipEnabled) {
        verifyRes = await verifySlipWithServer(compressedBase64);
        setVerificationResult(verifyRes);
      }

      // 4. Complete payment
      await completePayment(order.id, uploadedUrl || compressedBase64, verifyRes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePayWithCredit = async () => {
    if (!currentCustomer || currentCustomer.balance < order.totalPrice) {
      setErrorMsg('ยอดเงินคงเหลือในบัญชีไม่เพียงพอ');
      return;
    }
    setIsVerifying(true);
    try {
      await completePayment(order.id, undefined, { method: 'credit_balance', success: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'ชำระเงินไม่สำเร็จ');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">ออเดอร์ #{order.id}</span>
            <h2 className="text-lg sm:text-xl font-bold text-white">ชำระเงินค่าบริการ</h2>
          </div>
          <button
            onClick={closePaymentModal}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Summary Box */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>เกม:</span>
              <span className="font-bold text-white">{order.gameName}</span>
            </div>
            <div className="space-y-1 pt-1 border-t border-neutral-900">
              {orderItems.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">
                    {it.packageName} ({formatPackageQuantityTag(it)})
                  </span>
                  <span className="font-mono font-bold text-white">฿{it.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-900">
              <span>บัญชีผู้เล่น:</span>
              <span className="font-mono text-neutral-200">
                {order.customerAccount} {order.customerServer && `(${order.customerServer})`}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
              <span className="text-xs font-bold text-neutral-300">ยอดชำระทั้งหมด:</span>
              <span className="text-xl font-black text-cyan-400">฿{order.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
            <button
              onClick={() => setPaymentTab('promptpay')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                paymentTab === 'promptpay'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>พร้อมเพย์ QR Code</span>
            </button>
            {currentCustomer && (
              <button
                onClick={() => setPaymentTab('credit')}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  paymentTab === 'credit'
                    ? 'bg-cyan-500 text-neutral-950 shadow-md font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>เครดิตในบัญชี (฿{currentCustomer.balance.toLocaleString()})</span>
              </button>
            )}
          </div>

          {/* PromptPay Tab Content */}
          {paymentTab === 'promptpay' && (
            <div className="space-y-4">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border border-neutral-200 shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="PromptPay QR Code" className="w-52 h-52 object-contain" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-neutral-400 text-xs">
                    กำลังสร้าง QR Code...
                  </div>
                )}
                <div className="text-center mt-2">
                  <span className="text-neutral-800 font-extrabold text-sm block">สแกนชำระเงินผ่านแอปธนาคาร</span>
                  <span className="text-xs text-neutral-600 font-medium">ยอดเงิน: ฿{order.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* PromptPay Details */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-400 block">บัญชีพร้อมเพย์ ({settings.promptpayName})</span>
                  <span className="text-sm font-mono font-bold text-white">{settings.promptpayNumber || '0891234567'}</span>
                </div>
                <button
                  onClick={handleCopyPromptPay}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedPromptpay ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPromptpay ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              {/* Upload Slip Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-300">
                  แนบสลิปเพื่อยืนยันคำสั่งซื้อ (ระบบตรวจสลิปอัตโนมัติ)
                </label>
                <div className="relative border-2 border-dashed border-neutral-800 hover:border-cyan-500/60 rounded-2xl p-6 text-center transition cursor-pointer bg-neutral-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isVerifying}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="w-8 h-8 text-cyan-400 animate-bounce" />
                    <span className="text-xs font-bold text-white">
                      {isVerifying ? 'กำลังอัปโหลดและตรวจสอบสลิป...' : 'แตะที่นี่เพื่อเลือกรูปภาพสลิปโอนเงิน'}
                    </span>
                    <span className="text-[11px] text-neutral-500">รองรับไฟล์ JPG, PNG</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credit Tab Content */}
          {paymentTab === 'credit' && currentCustomer && (
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-4 text-center">
              <Wallet className="w-10 h-10 text-cyan-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">ชำระด้วยเครดิตคงเหลือในระบบ</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  ยอดเงินคงเหลือ: <strong className="text-emerald-400">฿{currentCustomer.balance.toLocaleString()}</strong>
                </p>
              </div>

              {currentCustomer.balance >= order.totalPrice ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  ยอดเงินเพียงพอ สามารถหักเงินเพื่อทำรายการทันที
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  ยอดเงินไม่เพียงพอ กรุณาเลือกชำระผ่านพร้อมเพย์
                </div>
              )}

              <button
                onClick={handlePayWithCredit}
                disabled={isVerifying || currentCustomer.balance < order.totalPrice}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-neutral-950 font-black text-sm transition shadow-lg shadow-cyan-500/25 disabled:opacity-40"
              >
                {isVerifying ? 'กำลังหักเงินในบัญชี...' : `ยืนยันการหักเงิน ฿${order.totalPrice.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
