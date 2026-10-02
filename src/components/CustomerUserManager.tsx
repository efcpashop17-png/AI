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
    setNotification,
  } = useApp();

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

  // New user form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    customerName: '',
    contactPhone: '',
    contactEmail: '',
    role: 'wholesale_customer' as 'wholesale_customer' | 'vip_dealer' | 'agent',
    balance: 0,
    notes: '',
    status: 'active' as 'active' | 'suspended',
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
      `💳 เครดิตคงเหลือ: ฿${user.balance.toLocaleString()}\n` +
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
    if (!formData.username.trim() || !formData.password.trim() || !formData.customerName.trim()) {
      setNotification({
        type: 'error',
        message: 'กรุณากรอก Username, Password และชื่อลูกค้าให้ครบถ้วน',
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
      customerName: formData.customerName.trim(),
      contactPhone: formData.contactPhone.trim() || '-',
      contactEmail: formData.contactEmail.trim(),
      role: formData.role,
      balance: Number(formData.balance) || 0,
      notes: formData.notes.trim(),
      status: formData.status,
    });

    setIsAddModalOpen(false);
    setFormData({
      username: '',
      password: '',
      customerName: '',
      contactPhone: '',
      contactEmail: '',
      role: 'wholesale_customer',
      balance: 0,
      notes: '',
      status: 'active',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateCustomerUser(editingUser.id, {
      customerName: editingUser.customerName,
      password: editingUser.password,
      contactPhone: editingUser.contactPhone,
      contactEmail: editingUser.contactEmail,
      role: editingUser.role,
      notes: editingUser.notes,
      status: editingUser.status,
    });

    setEditingUser(null);
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <div className="p-4.5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block">ยอดเครดิตสะสมรวมของลูกค้า</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">
              ฿{totalBalance.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
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
                <th className="py-3 px-4">ชื่อลูกค้า / ช่องทางติดต่อ</th>
                <th className="py-3 px-4">ระดับสมาชิก</th>
                <th className="py-3 px-4 text-right">ยอดเครดิตคงเหลือ</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4">วันที่สมัคร (โดยแอดมิน)</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <span>ไม่พบยูสเซอร์ลูกค้าตามเงื่อนไขที่ค้นหา</span>
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

                      {/* Customer Name & Contacts */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-black text-white text-sm">{user.customerName}</p>
                          <p className="text-[11px] text-slate-300 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>{user.contactPhone}</span>
                          </p>
                          {user.contactEmail && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.contactEmail}</span>
                            </p>
                          )}
                          {user.notes && (
                            <p className="text-[10px] text-amber-300/80 italic font-normal">
                              Note: {user.notes}
                            </p>
                          )}
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

                      {/* Balance & Adjust Credit */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="space-y-1">
                          <span className="font-mono font-black text-base text-emerald-400 block">
                            ฿{user.balance.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setAdjustBalanceUser(user);
                              setAdjustAmount('');
                              setAdjustType('add');
                            }}
                            className="text-[10px] text-cyan-300 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>ปรับยอดเงิน</span>
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block ${
                            user.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {user.status === 'active' ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'}
                        </span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ชื่อผู้ใช้ (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="เช่น shop_gamer01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">รหัสผ่าน (Password) *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>สุ่มรหัสผ่าน</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="รหัสผ่านเข้าใช้งาน"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ชื่อลูกค้า / ชื่อร้านค้า *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="เช่น คุณกฤษดา หรือ ร้านเอ็กซ์เกมเมอร์"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">อีเมลลูกค้า (ถ้ามี)</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="customer@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ระดับสมาชิก (Tier)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-xs text-white outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="wholesale_customer">ลูกค้าราคาส่งทั่วไป</option>
                    <option value="vip_dealer">VIP Dealer (เรทราคาส่งพิเศษ)</option>
                    <option value="agent">ตัวแทนจำหน่าย (Agent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">เครดิตเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  หมายเหตุของแอดมิน (เช่น LINE ID หรือข้อตกลงพิเศษ)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="LINE ID: arm_game, ลูกค้าประจำร้าน 2 ปี"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-xs text-white outline-none focus:border-amber-400"
                />
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

            <h3 className="text-lg font-black text-white font-display mb-4">
              แก้ไขข้อมูลยูสเซอร์: <span className="text-amber-400 font-mono">@{editingUser.username}</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">รหัสผ่าน (Password)</label>
                <input
                  type="text"
                  required
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ชื่อลูกค้า / ร้านค้า</label>
                <input
                  type="text"
                  required
                  value={editingUser.customerName}
                  onChange={(e) => setEditingUser({ ...editingUser, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingUser.contactPhone}
                    onChange={(e) => setEditingUser({ ...editingUser, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-sm text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ระดับสมาชิก</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-xs text-white outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="wholesale_customer">ลูกค้าราคาส่งทั่วไป</option>
                    <option value="vip_dealer">VIP Dealer</option>
                    <option value="agent">ตัวแทนจำหน่าย (Agent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">สถานะบัญชี</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-xs text-white outline-none focus:border-amber-400 font-bold"
                >
                  <option value="active">เปิดใช้งาน (Active)</option>
                  <option value="suspended">ระงับการใช้งานชั่วคราว (Suspended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">หมายเหตุแอดมิน</label>
                <input
                  type="text"
                  value={editingUser.notes || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-xs text-white outline-none focus:border-amber-400"
                />
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
                  className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST BALANCE */}
      {adjustBalanceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#141928] border-2 border-emerald-500/60 p-6 shadow-2xl text-white">
            <button
              onClick={() => setAdjustBalanceUser(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-display">
                  ปรับยอดเครดิตลูกค้า
                </h3>
                <p className="text-xs text-slate-400">
                  {adjustBalanceUser.customerName} (@{adjustBalanceUser.username})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800 mb-4 flex justify-between items-center">
              <span className="text-xs text-slate-400">ยอดคงเหลือปัจจุบัน:</span>
              <span className="text-base font-black font-mono text-emerald-400">
                ฿{adjustBalanceUser.balance.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border ${
                    adjustType === 'add'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-[#0b0e17] text-slate-300 border-slate-700'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>เติมเครดิต (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border ${
                    adjustType === 'subtract'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-[#0b0e17] text-slate-300 border-slate-700'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>หักเครดิต (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="เช่น 500 หรือ 1000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-base text-emerald-400 font-mono font-black outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  เหตุผล / บันทึกการปรับยอด
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="เช่น โอนเงินเข้าบัญชีร้าน, เติมสต็อกล่วงหน้า"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0b0e17] border border-slate-700 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustBalanceUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                >
                  บันทึกการปรับยอด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
