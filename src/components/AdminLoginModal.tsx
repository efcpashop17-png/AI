import React, { useState } from 'react';
import { X, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminLoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { loginAsAdmin } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAsAdmin(password)) {
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">เข้าสู่ระบบแอดมิน</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">รหัสผ่านผู้ดูแลระบบ</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="กรอกรหัสผ่านแอดมิน"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-neutral-950 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-neutral-800 focus:border-cyan-500 focus:ring-cyan-500'
                }`}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-1">รหัสผ่านไม่ถูกต้อง (ลอง admin8899)</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
          >
            <span>เข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
