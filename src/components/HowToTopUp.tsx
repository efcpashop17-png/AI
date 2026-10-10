import React from 'react';
import { ShoppingCart, QrCode, CheckCircle2, ShieldCheck, Zap, Headphones } from 'lucide-react';

export const HowToTopUp: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'เลือกเกมและแพ็กเกจ',
      desc: 'ค้นหาเกมที่ต้องการ กรอกไอดีเกมหรือเลือกเซิร์ฟเวอร์ จากนั้นระบุแพ็กเกจที่ต้องการเติม',
      icon: <ShoppingCart className="w-6 h-6 text-cyan-400" />,
    },
    {
      step: '02',
      title: 'ชำระเงินผ่าน PromptPay / VIP เครดิต',
      desc: 'สแกน QR Code พร้อมเพย์ด้วยแอปธนาคาร หรือหักผ่านยอดเงินคงเหลือของสมาชิกระดับ VIP',
      icon: <QrCode className="w-6 h-6 text-blue-400" />,
    },
    {
      step: '03',
      title: 'แนบสลิป & ตรวจสอบอัตโนมัติ',
      desc: 'ระบบสลิปอัจฉริยะ (EasySlip) ตรวจสอบยอดเงินแบบเรียลไทม์ทันที ไม่ต้องรอนาน',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    },
    {
      step: '04',
      title: 'รับไอเทมทันทีในเกม',
      desc: 'ทีมงานและระบบบอทส่งไอเทมเข้าตัวละครของคุณอย่างรวดเร็ว ปลอดภัย 100%',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          ขั้นตอนการเติมเกมกับ <span className="text-cyan-400">EF CPA SHOP</span>
        </h2>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">
          เติมง่าย สะดวก รวดเร็ว ด้วยมาตรฐานบริการ Stock iOS ราคาส่งอันดับ 1
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((st, idx) => (
          <div
            key={idx}
            className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                {st.icon}
              </div>
              <span className="text-3xl font-black text-neutral-800 group-hover:text-cyan-500/20 transition-colors font-mono">
                {st.step}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1.5">{st.title}</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">{st.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">พบปัญหาหรือต้องการความช่วยเหลือ?</h4>
            <p className="text-xs text-neutral-400">
              ติดต่อแอดมินและฝ่ายบริการลูกค้าได้ตลอด 24 ชั่วโมง
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://line.me"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
          >
            LINE Official
          </a>
        </div>
      </div>
    </div>
  );
};
