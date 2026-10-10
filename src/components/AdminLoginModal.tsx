import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  X,
  KeyRound,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const {
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    adminLogin,
    customerLogin,
    adminCredentials,
    setActiveTab,
    setSelectedGame,
    setNotification,
  } = useApp();

  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdminLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !passcode.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน',
      });
      return;
    }

    setIsSubmitting(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = passcode.trim();

    // Check if entered credentials match Admin account
    const isArmCreds = cleanUser === 'arm' && cleanPass === 'Arm15658';
    const isConfigCreds =
      cleanUser === adminCredentials.username.toLowerCase() &&
      cleanPass === adminCredentials.passcode;

    if (isArmCreds || isConfigCreds) {
      const adminSuccess = adminLogin(username, passcode);
      if (adminSuccess) {
        setActiveTab('admin');
        setIsAdminLoginModalOpen(false);
        setUsername('');
        setPasscode('');
      }
      setIsSubmitting(false);
      return;
    }

    // Otherwise, authenticate as regular customer user
    const customerSuccess = customerLogin(username, passcode);
    if (customerSuccess) {
      setSelectedGame(null);
      setIsAdminLoginModalOpen(false);
      setUsername('');
      setPasscode('');
      setActiveTab('dashboard');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#120E24] border border-violet-500/40 p-6 sm:p-8 shadow-2xl shadow-purple-950/60 text-white">
        <button
          type="button"
          onClick={() => setIsAdminLoginModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-violet-950/40 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-violet-600/30 mb-4 border border-violet-400/40">
            <Lock className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-violet-950 text-cyan-300 border border-violet-500/40 inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>เข้าสู่ระบบเพื่อดูราคาและสั่งซื้อ</span>
          </span>
          <h3 className="text-2xl font-black text-white font-heading">
            เข้าสู่ระบบ (Login)
          </h3>
          <p className="text-xs text-violet-300/80 mt-1 font-medium">
            กรอก Username และ Password เพื่อเข้าใช้งานระบบ
          </p>
        </div>

        {/* Customer Account Notice */}
        <div className="p-3.5 rounded-2xl bg-[#0B0813]/90 border border-violet-500/30 text-xs mb-5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-left">
            <span className="font-bold text-cyan-300 block">นโยบายบัญชีผู้ใช้งาน:</span>
            <p className="text-[11px] text-violet-200/80 leading-relaxed font-normal">
              ต้องล็อกอินก่อนถึงจะสามารถดูราคาและเลือกแพ็กเกจได้ หากยังไม่มีบัญชี โปรดติดต่อแอดมินเพื่อขอเปิดบัญชีใช้งานครับ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-violet-200 mb-1.5">
              ชื่อผู้ใช้ (Username) *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้ของคุณ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0813] border border-violet-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-white text-sm outline-none font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-violet-200 mb-1.5">
              รหัสผ่าน (Password) *
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่านของคุณ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0813] border border-violet-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-white text-sm outline-none font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 hover:scale-[1.01]"
          >
            <KeyRound className="w-4 h-4 text-white stroke-[2.5]" />
            <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
