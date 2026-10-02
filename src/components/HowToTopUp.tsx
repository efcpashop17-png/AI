import React from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  CreditCard,
  CheckCircle2,
  Clock,
  PhoneCall,
  MessageCircle,
  FileQuestion,
  Copy,
} from 'lucide-react';

export const HowToTopUp: React.FC = () => {
  const { setNotification } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn space-y-10">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white font-display">
          วิธีเติมเกมและคำถามที่พบบ่อย
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          ขั้นตอนง่ายๆ 3 สเต็ป เติมไว ไม่ต้องให้รหัสผ่าน พร้อมการดูแลตลอด 24 ชั่วโมง
        </p>
      </div>

      {/* 3 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 space-y-3 relative overflow-hidden shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
            1
          </div>
          <h3 className="font-black text-base text-white">1. เลือกเกม & กรอก User</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            เลือกเกมที่ต้องการสั่งซื้อจากหน้าแรก จากนั้นกรอก User ให้ถูกต้อง
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 space-y-3 relative overflow-hidden shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
            2
          </div>
          <h3 className="font-black text-base text-white">2. เลือกแพ็กเกจ & ชำระเงิน</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            เลือกจำนวนเหรียญ/เพชร หรือใส่ตะกร้าเพื่อรวมหลายแพ็กเกจ แล้วสแกนจ่ายผ่าน QR พร้อมเพย์ / ทรูมันนี่
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 space-y-3 relative overflow-hidden shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
            3
          </div>
          <h3 className="font-black text-base text-white">3. รอรับสินค้าเข้า Stock</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            จัดส่งไอเทมเข้า Stock เวลาเฉลี่ยคือ 6-32 ชม. พร้อมออกใบเสร็จให้ตรวจสอบย้อนหลังได้ 24 ชม.
          </p>
        </div>
      </div>

      {/* Safety Guarantee */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#101e1b] border-2 border-emerald-500/80 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-black text-lg text-white">
            รับประกันความปลอดภัย 100% ยอดไม่เข้ายินดีคืนเงินเต็มจำนวน
          </h4>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            ทุกการเติมเป็นการเติมผ่านช่องทางตัวแทนอย่างเป็นทางการโดยใช้เพียง UID ไม่มีการขอรหัสผ่านหรือเข้าไอดีของลูกค้า ปลอดภัยจากปัญหาแฮ็กหรือแบนไอดีอย่างแน่นอน
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-3xl bg-[#141928] border-2 border-slate-700 p-6 sm:p-8 space-y-5 shadow-xl">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-amber-400 stroke-[2.5]" />
          <span>คำถามที่พบบ่อย (FAQ)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-[#0d111d] border border-slate-700/80 space-y-1.5">
            <h5 className="font-black text-white text-sm">Q: เติมแล้วใช้เวลานานแค่ไหน?</h5>
            <p className="text-slate-400 font-medium leading-relaxed">
              A: ระบบเป็นระบบอัตโนมัติ 24 ชม. หลังจากสแกนจ่ายเงินสำเร็จ ยอดจะเข้าเกมภายใน 30 - 60 วินาทีครับ
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d111d] border border-slate-700/80 space-y-1.5">
            <h5 className="font-black text-white text-sm">Q: ต้องให้รหัสผ่านไอดีไหม?</h5>
            <p className="text-slate-400 font-medium leading-relaxed">
              A: ไม่ต้องให้รหัสผ่านใดๆ ทั้งสิ้น ใช้เพียง UID, OpenID หรือ Player ID เท่านั้นครับ
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d111d] border border-slate-700/80 space-y-1.5">
            <h5 className="font-black text-white text-sm">Q: มีใบเสร็จให้ตรวจสอบไหม?</h5>
            <p className="text-slate-400 font-medium leading-relaxed">
              A: มีใบเสร็จออนไลน์และระบบตรวจสอบคำสั่งซื้อย้อนหลังผ่านหน้า &quot;เช็คสถานะคำสั่งซื้อ&quot; ได้ตลอดเวลา
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d111d] border border-slate-700/80 space-y-1.5">
            <h5 className="font-black text-white text-sm">Q: ถ้ากรอก UID ผิดต้องทำอย่างไร?</h5>
            <p className="text-slate-400 font-medium leading-relaxed">
              A: ก่อนเติมจะมีปุ่ม &quot;ตรวจสอบไอดี&quot; แสดงชื่อตัวละครให้ยืนยัน หากติดปัญหาติดต่อแอดมินทาง Line ได้ตลอดเวลาครับ
            </p>
          </div>
        </div>
      </div>

      {/* Contact Line Support */}
      <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
            <MessageCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-black text-white text-sm sm:text-base">
              ติดต่อฝ่ายบริการลูกค้าและแจ้งปัญหา
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Line Official: @gamepay_topup | ให้บริการทุกวัน 24 ชม.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText('@gamepay_topup');
            setNotification({
              type: 'success',
              message: 'คัดลอก Line ID: @gamepay_topup เรียบร้อยแล้ว',
            });
          }}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 whitespace-nowrap cursor-pointer transition-all"
        >
          คัดลอก Line ID
        </button>
      </div>
    </div>
  );
};
