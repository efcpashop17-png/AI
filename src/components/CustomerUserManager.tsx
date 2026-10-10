import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Search,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit2,
  DollarSign,
  Phone,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  X,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerUser } from '../types';

export const CustomerUserManager: React.FC = () => {
  const {
    customerUsers,
    addCustomerUser,
    updateCustomerUser,
    deleteCustomerUser,
    adjustCustomerBalance,
    restoreAllCustomerUsers,
    setNotification,
  } = useApp();

  const [isRestoringUsers, setIsRestoringUsers] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CustomerUser | null>(null);
  const [adjustBalanceUser, setAdjustBalanceUser] = useState<CustomerUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustNote, setAdjustNote] = useState<string>('');

  // Password visibility map
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New user form state (Simplified to Username, Password, and Contact Channel - Admin Only)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    contactChannel: '',
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCopyCredentials = (user: CustomerUser) => {
    const text = `🎮 บัญชีสมาชิกลูกค้าราคาส่ง EF CPA Shop ของคุณ:\n` +
      `👤 Username: ${user.username}\n` +
      `🔑 Password: ${user.password}\n` +
      `⭐ สิทธิ์: ${
        user.role === 'vip_dealer'
          ? 'VIP Dealer (เรทราคาส่งพิเศษ)'
          : user.role === 'agent'
          ? 'ตัวแทนจำหน่าย (Agent)'
          : 'ลูกค้าราคาส่ง (Wholesale)'
      }\n` +
      `🔒 ระบบนี้แอดมินเป็นผู้สมัครให้โดยตรง กรุณาเก็บรหัสผ่านเป็นความลับครับ`;

    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setNotification({
      type: 'success',
      message: `คัดลอกข้อมูล User "${user.username}" สำหรับส่งให้ลูกค้าเรียบร้อยแล้ว`,
    });
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.contactChannel.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอกชื่อผู้ใช้ (Username), รหัสผ่าน (Password) และช่องทางติดต่อให้ครบถ้วน',
      });
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase();
    const isDuplicate = customerUsers.some((u) => u.username.toLowerCase() === cleanUsername);
    if (isDuplicate) {
      setNotification({
        type: 'error',
        message: `Username "${formData.username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`,
      });
      return;
    }

    addCustomerUser({
      username: cleanUsername,
      password: formData.password.trim(),
      customerName: cleanUsername,
      contactChannel: formData.contactChannel.trim(),
      contactPhone: formData.contactChannel.trim(),
      role: 'wholesale_customer',
      balance: 0,
      notes: `ช่องทางติดต่อ: ${formData.contactChannel.trim()}`,
      status: 'active',
    });

    setIsAddModalOpen(false);
    setFormData({
      username: '',
      password: '',
      contactChannel: '',
    });
    setNotification({
      type: 'success',
      message: `สมัครยูสเซอร์ @${cleanUsername} ให้ลูกค้าเรียบร้อยแล้ว`,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanUsername = editingUser.username.trim().toLowerCase();
    if (!cleanUsername) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอกชื่อผู้ใช้ (Username)',
      });
      return;
    }

    if (!editingUser.password.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอกรหัสผ่าน (Password)',
      });
      return;
    }

    const contactVal = (editingUser.contactChannel || editingUser.contactPhone || '').trim();
    if (!contactVal) {
      setNotification({
        type: 'error',
        message: 'กรุณาระบุช่องทางติดต่อ (LINE ID, เบอร์โทรศัพท์ หรือ Facebook)',
      });
      return;
    }

    const isDuplicate = customerUsers.some(
      (u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      setNotification({
        type: 'error',
        message: `Username "${cleanUsername}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`,
      });
      return;
    }

    updateCustomerUser(editingUser.id, {
      username: cleanUsername,
      customerName: cleanUsername,
      password: editingUser.password.trim(),
      contactChannel: contactVal,
      contactPhone: contactVal,
      notes: `ช่องทางติดต่อ: ${contactVal}`,
    });

    setEditingUser(null);
    setNotification({
      type: 'success',
      message: `บันทึกการแก้ไขยูสเซอร์ @${cleanUsername} เรียบร้อยแล้ว`,
    });
  };

  const handleAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBalanceUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      setNotification({ type: 'error', message: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' });
      return;
    }

    const finalAmount = adjustType === 'add' ? num : -num;
    adjustCustomerBalance(adjustBalanceUser.id, finalAmount, adjustNote.trim());
    setAdjustBalanceUser(null);
    setAdjustAmount('');
    setAdjustNote('');
  };

  // Filtered Users
  const filteredUsers = customerUsers.filter((user) => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !user.username.toLowerCase().includes(q) &&
      !user.customerName.toLowerCase().includes(q) &&
      !user.contactPhone.includes(q) &&
      !(user.notes || '').toLowerCase().includes(q)
    ) {
      return false;
    }

    if (filterRole !== 'all' && user.role !== filterRole) {
      return false;
    }

    if (filterStatus !== 'all' && user.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const totalBalance = customerUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  const activeCount = customerUsers.filter((u) => u.status === 'active').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Policy Banner: Admin Only Registration */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-violet-900/30 to-purple-900/20 border-2 border-amber-400/40 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white font-display">
                ระบบจัดการยูสเซอร์ลูกค้า (แอดมินสมัครให้เท่านั้น)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                Closed Registration
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              ลูกค้าทั่วไปไม่สามารถกดสมัครเองที่หน้าเว็บได้ เพื่อรักษาเรทราคาส่งของร้าน EF CPA Shop 
              โดยแอดมินจะเป็นผู้สร้าง User + รหัสผ่านให้ลูกค้า และส่งมอบผ่านทาง LINE หรือแชตโดยตรง
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={async () => {
              setIsRestoringUsers(true);
              try {
                await restoreAllCustomerUsers();
              } finally {
                setIsRestoringUsers(false);
              }
            }}
            disabled={isRestoringUsers}
            className="px-4 py-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-cyan-300 hover:text-white border border-cyan-400/40 font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            title="ดึงและกู้คืนรายชื่อยูสเซอร์ลูกค้าทั้งหมดจากเซิร์ฟเวอร์และแบ็กอัปถาวร"
          >
            <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isRestoringUsers ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRestoringUsers ? 'กำลังซิงค์ยูสเซอร์...' : '🔄 ซิงค์/กู้คืนยูสลูกค้าทั้งหมด'}</span>
          </button>

          <button
            onClick={() => {
              setFormData((prev) => ({ ...prev, password: generateRandomPassword() }));
              setIsAddModalOpen(true);
            }}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>➕ สมัครยูสเซอร์ใหม่ให้ลูกค้า</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4.5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">ยูสเซอร์ลูกค้าทั้งหมด</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">
              {customerUsers.length} <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">สถานะเปิดใช้งาน (Active)</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
              {activeCount} <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#141928] border-2 border-slate-700/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Username, ชื่อลูกค้า, เบอร์โทร..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0b0e17] border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0b0e17] border border-slate-700 text-xs text-slate-200 outline-none focus:border-amber-400 font-bold cursor-pointer"
          >
            <option value="all">ทุกระดับสมาชิก</option>
            <option value="wholesale_customer">ลูกค้าราคาส่งทั่วไป</option>
            <option value="vip_dealer">VIP Dealer</option>
            <option value="agent">ตัวแทนจำหน่าย (Agent)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0b0e17] border border-slate-700 text-xs text-slate-200 outline-none focus:border-amber-400 font-bold cursor-pointer"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">เปิดใช้งาน (Active)</option>
            <option value="suspended">ระงับใช้งาน (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#141928] border-2 border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#0b0e17] text-slate-400 uppercase text-[11px] font-black border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ข้อมูลบัญชี (Username / รหัสผ่าน)</th>
                <th className="py-3 px-4">ช่องทางติดต่อ (🔒 แอดมินเห็นคนเดียว)</th>
                <th className="py-3 px-4">ระดับสมาชิก</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4">วันที่สมัคร (โดยแอดมิน)</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-75" />
                    <p className="text-sm font-bold text-slate-200">
                      {customerUsers.length === 0
                        ? 'ยังไม่มีรายชื่อยูสเซอร์ในหน้านี้ หรือแคชเบราว์เซอร์ยังไม่ได้ซิงค์'
                        : 'ไม่พบยูสเซอร์ลูกค้าตามเงื่อนไขที่ค้นหา'}
                    </p>
                    {customerUsers.length === 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsRestoringUsers(true);
                          try {
                            await restoreAllCustomerUsers();
                          } finally {
                            setIsRestoringUsers(false);
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRestoringUsers ? 'animate-spin' : ''}`} />
                        <span>กดเพื่อกู้คืนยูสเซอร์ลูกค้าทั้งหมด 9 บัญชีจากฐานข้อมูลทันที</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPassVisible = !!showPasswordMap[user.id];
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Username & Password */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-amber-300 text-sm">
                              {user.username}
                            </span>
                            <button
                              onClick={() => handleCopyCredentials(user)}
                              title="คัดลอกข้อมูลส่งให้ลูกค้า"
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedId === user.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <span>รหัส:</span>
                            <span className="bg-[#0b0e17] px-2 py-0.5 rounded border border-slate-700 text-slate-200">
                              {isPassVisible ? user.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="p-0.5 hover:text-white text-slate-400 cursor-pointer"
                              title={isPassVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                            >
                              {isPassVisible ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Contact Channel (Admin Only) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>แอดมินเห็นคนเดียว</span>
                          </span>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{user.contactChannel || user.contactPhone || user.notes || '-'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Role / Tier */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                            user.role === 'vip_dealer'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : user.role === 'agent'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {user.role === 'vip_dealer'
                            ? '⭐ VIP Dealer'
                            : user.role === 'agent'
                            ? '🚀 ตัวแทน (Agent)'
                            : '📦 ราคาส่งทั่วไป'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = user.status === 'active' ? 'suspended' : 'active';
                            updateCustomerUser(user.id, { status: nextStatus });
                          }}
                          title="คลิกเพื่อสลับสถานะเปิดใช้งาน / ระงับชั่วคราว"
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block transition-transform hover:scale-105 cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {user.status === 'active' ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'}
                        </button>
                      </td>

                      {/* Creation Date */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-400 block">
                          {new Date(user.createdAt).toLocaleDateString('th-TH')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          โดย: {user.createdBy}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCopyCredentials(user)}
                            title="คัดลอกข้อความส่งให้ลูกค้าทาง LINE/Chat"
                            className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingUser(user)}
                            title="แก้ไขข้อมูล / รหัสผ่าน"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบยูสเซอร์ "${user.username}" หรือไม่?`)) {
                                deleteCustomerUser(user.id);
                              }
                            }}
                            title="ลบยูสเซอร์นี้"
                            className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW USER (ADMIN ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#141928] border-2 border-amber-400 p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <UserPlus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display">
                  สมัครยูสเซอร์ใหม่ให้ลูกค้า
                </h3>
                <p className="text-xs text-amber-300/90 font-medium">
                  เฉพาะแอดมินเป็นผู้สร้างให้เท่านั้น ลูกค้าไม่สามารถสมัครเองได้
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ชื่อผู้ใช้ (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="เช่น shop_gamer01"
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">รหัสผ่าน (Password) *</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>สุ่มรหัสผ่าน</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="ระบุรหัสผ่านเข้าใช้งาน"
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ช่องทางติดต่อ (LINE ID, เบอร์โทรศัพท์, Facebook) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactChannel}
                  onChange={(e) => setFormData({ ...formData, contactChannel: e.target.value })}
                  placeholder="เช่น LINE ID: arm_game หรือ โทร 08X-XXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                />
                <div className="mt-2.5 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium leading-relaxed">
                    🔒 ข้อมูลช่องทางติดต่อนี้ แอดมินสามารถเห็นได้คนเดียวเท่านั้น (ลูกค้าไม่สามารถมองเห็นได้)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20"
                >
                  ยืนยันการสมัครยูสเซอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#141928] border-2 border-slate-700 p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display">
                  แก้ไขข้อมูลยูสเซอร์ลูกค้า
                </h3>
                <p className="text-xs text-slate-400">
                  แก้ไขเฉพาะชื่อผู้ใช้ (Username), รหัสผ่าน (Password) และช่องทางติดต่อ
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ชื่อผู้ใช้ (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  placeholder="เช่น shop_gamer01"
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">รหัสผ่าน (Password) *</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser({ ...editingUser, password: generateRandomPassword() })
                    }
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>สุ่มรหัสใหม่</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="ระบุรหัสผ่านเข้าใช้งาน"
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ช่องทางติดต่อ (LINE ID, เบอร์โทรศัพท์, Facebook) *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.contactChannel || editingUser.contactPhone || ''}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      contactChannel: e.target.value,
                      contactPhone: e.target.value,
                    })
                  }
                  placeholder="เช่น LINE ID: arm_game หรือ โทร 08X-XXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                />
                <div className="mt-2.5 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium leading-relaxed">
                    🔒 ข้อมูลช่องทางติดต่อนี้ แอดมินสามารถเห็นได้คนเดียวเท่านั้น (ลูกค้าไม่สามารถมองเห็นได้)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END MODALS */}
    </div>
  );
};
