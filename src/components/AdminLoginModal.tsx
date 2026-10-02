import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  X,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Users,
  AlertCircle,
  ShieldCheck,
  User,
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const {
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    adminLogin,
    customerLogin,
    setActiveTab,
  } = useApp();

  const [loginMode, setLoginMode] = useState<'admin' | 'customer'>('customer');
  const [username, setUsername] = useState('admin');
  const [passcode, setPasscode] = useState('');

  if (!isAdminLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'admin') {
      const success = adminLogin(username, passcode);
      if (success) {
        setActiveTab('admin');
      }
    } else {
      const success = customerLogin(username, passcode);
      if (success) {
        setIsAdminLoginModalOpen(false);
      }
    }
  };

  const fillAdminCreds = () => {
    setLoginMode('admin');
    setUsername('admin');
    setPasscode('admin8888');
  };

  const fillCustomerCreds = () => {
    setLoginMode('customer');
    setUsername('client_arm');
    setPasscode('User@8899');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#131826] border-2 border-slate-700 p-6 sm:p-7 shadow-2xl shadow-black text-white">
        <button
          onClick={() => setIsAdminLoginModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#0b0e17] border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginMode('customer');
              setUsername('');
              setPasscode('');
            }}
            className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              loginMode === 'customer'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ลูกค้าราคาส่ง</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setUsername('admin');
              setPasscode('');
            }}
            className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              loginMode === 'admin'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>แอดมินคนเดียว</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-400/20 mb-3">
            {loginMode === 'admin' ? (
              <Lock className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            ) : (
              <Users className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700 inline-block mb-1.5">
            {loginMode === 'admin' ? 'SINGLE ADMIN ACCESS' : 'WHOLESALE CUSTOMER LOGIN'}
          </span>
          <h3 className="text-xl font-black text-white font-display">
            {loginMode === 'admin' ? 'เข้าสู่ระบบแอดมินคนเดียว' : 'เข้าสู่ระบบลูกค้าราคาส่ง'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {loginMode === 'admin'
              ? 'เข้าถึงระบบหลังบ้าน จัดการราคา และสมัครยูสเซอร์ให้ลูกค้า'
              : 'เข้าถึงสิทธิ์ราคาส่งและระบบสั่งซื้อสต็อกสำหรับลูกค้าที่แอดมินเปิดบัญชีให้'}
          </p>
        </div>

        {/* Customer Registration Closed Notice */}
        {loginMode === 'customer' && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs mb-5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <span className="font-black block">🔒 นโยบายการสมัครสมาชิก:</span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed font-normal">
                ลูกค้าไม่สามารถสมัครเองได้ ต้องให้แอดมินเป็นผู้สมัครให้เท่านั้น หากยังไม่มีบัญชี โปรดติดต่อแอดมินผ่าน LINE หรือแชตของร้านเพื่อขอเปิดบัญชีใช้งานครับ
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {loginMode === 'admin' ? 'ชื่อผู้ใช้แอดมิน (Username)' : 'ชื่อผู้ใช้ของคุณ (Username)'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={loginMode === 'admin' ? 'admin' : 'ระบุ Username ที่แอดมินมอบให้'}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d111d] border-2 border-slate-700 focus:border-amber-400 text-white text-sm outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {loginMode === 'admin' ? 'รหัสผ่านแอดมิน (Passcode)' : 'รหัสผ่าน (Password)'}
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder={loginMode === 'admin' ? 'เช่น admin8888' : 'รหัสผ่าน'}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d111d] border-2 border-slate-700 focus:border-amber-400 text-white text-sm outline-none font-mono"
            />
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-1">
            {loginMode === 'admin' ? (
              <button
                type="button"
                onClick={fillAdminCreds}
                className="w-full p-2.5 rounded-xl bg-[#1a2135] hover:bg-[#202940] border border-slate-700/80 text-xs text-amber-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>กรอกรหัสแอดมินทดสอบ (admin / admin8888)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={fillCustomerCreds}
                className="w-full p-2.5 rounded-xl bg-[#1a2135] hover:bg-[#202940] border border-slate-700/80 text-xs text-cyan-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>ทดสอบล็อกอินลูกค้าราคาส่ง (client_arm / User@8899)</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>
              {loginMode === 'admin' ? 'ยืนยันเข้าสู่ระบบแอดมิน' : 'เข้าสู่ระบบลูกค้าราคาส่ง'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
