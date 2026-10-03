import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Edit2,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Search,
  Filter,
  KeyRound,
  LogOut,
  RefreshCw,
  Sparkles,
  Zap,
  Tag,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Sliders,
  Check,
  FileText,
  AlertTriangle,
  Users,
  Bell,
  Send,
  UserCheck,
  UserX,
  Store,
  BarChart3,
  ExternalLink,
  MessageSquare,
  Star,
  Camera,
} from 'lucide-react';
import { Game, GamePackage, TopUpStatus, TopUpOrder, Dealer, WebhookConfig } from '../types';
import { DealerAnalyticsDashboard } from './DealerAnalyticsDashboard';
import { EFCPALogo } from './EFCPALogo';
import { GoogleSheetsSyncPanel } from './GoogleSheetsSyncPanel';
import { CustomerUserManager } from './CustomerUserManager';
import { googleSignIn, googleLogout, initGoogleAuth, getGoogleAccessToken } from '../services/googleAuth';
import { exportOrdersToGoogleSheets } from '../services/googleSheets';

export const AdminDashboard: React.FC = () => {
  const {
    games,
    orders,
    dealers,
    customerUsers,
    webhookConfig,
    isAdminLoggedIn,
    adminCredentials,
    adminLogin,
    adminLogout,
    updateAdminPasscode,
    updatePackagePrice,
    addPackageToGame,
    deletePackage,
    addNewGame,
    updateGame,
    updateGameImage,
    setGameDefaultThumbnail,
    addGameImageVersion,
    deleteGameImageVersion,
    deleteGame,
    addDealer,
    updateDealerStatus,
    updateDealerTier,
    deleteDealer,
    updateWebhookConfig,
    testWebhook,
    adminUpdateOrderStatus,
    adminAddTimelineStep,
    adminDeleteTimelineStep,
    adminUpdateTimelineStep,
    adminQuickSetPaid,
    adminUploadSlip,
    adminUploadDeliveryProof,
    resetAllData,
    setNotification,
    setIsAdminLoginModalOpen,
    setActiveTab,
  } = useApp();

  // Login form state for lock screen
  const [loginUsername, setLoginUsername] = useState('Arm');
  const [loginPasscode, setLoginPasscode] = useState('');

  // Dashboard Sub-Tabs
  const [adminTab, setAdminTab] = useState<'prices' | 'orders' | 'users' | 'games' | 'thumbnails' | 'sheets' | 'security'>('prices');

  // Thumbnail & Version Manager State
  const [selectedThumbnailGameId, setSelectedThumbnailGameId] = useState<string>(games[0]?.id || 'efootball');
  const [versionNoteInput, setVersionNoteInput] = useState('');
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  // Package Image Upload Refs & State
  const [newPkgImageUrl, setNewPkgImageUrl] = useState('');
  const newPkgImageInputRef = useRef<HTMLInputElement>(null);
  const editPkgImageInputRef = useRef<HTMLInputElement>(null);

  // Google Sheets Export State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);

  // Custom Status & Note Modal State
  const [customStatusOrder, setCustomStatusOrder] = useState<TopUpOrder | null>(null);
  const [targetStatusType, setTargetStatusType] = useState<TopUpStatus>('completed');
  const [customStatusText, setCustomStatusText] = useState('');
  const [adminNoteText, setAdminNoteText] = useState('');

  // Initialize Google Auth listener
  useEffect(() => {
    initGoogleAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
  }, []);

  // Price Management State
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || 'rov');
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(null);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);

  // New Package Form State
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgInGameItem, setNewPkgInGameItem] = useState('');
  const [newPkgAmount, setNewPkgAmount] = useState(100);
  const [newPkgBonus, setNewPkgBonus] = useState(0);
  const [newPkgOriginalPrice, setNewPkgOriginalPrice] = useState(100);
  const [newPkgPrice, setNewPkgPrice] = useState(90);
  const [newPkgBadge, setNewPkgBadge] = useState('');
  const [newPkgIsHot, setNewPkgIsHot] = useState(false);

  // New Game Form State
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGamePublisher, setNewGamePublisher] = useState('');
  const [newGameCategory, setNewGameCategory] = useState<'MOBA' | 'Battle Royale' | 'RPG' | 'FPS' | 'Casual' | 'Sports'>('MOBA');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameTodayRate, setNewGameTodayRate] = useState('');
  const [newGameAccountLabel, setNewGameAccountLabel] = useState('Player ID / UID');
  const [newGameAccountPlaceholder, setNewGameAccountPlaceholder] = useState('เช่น 12345678');

  // Today's Rate Inputs for games
  const [todayRateInputs, setTodayRateInputs] = useState<Record<string, string>>({});

  // Change Admin Passcode State
  const [newAdminPasscode, setNewAdminPasscode] = useState('');

  // Order Search & Filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Progress & Timeline Management Modal (บันทึกความคืบหน้าระบบอัตโนมัติ)
  const [selectedOrderForProgress, setSelectedOrderForProgress] = useState<TopUpOrder | null>(null);
  const [newTimelineStatus, setNewTimelineStatus] = useState<TopUpStatus>('verifying');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');
  const [editingTimelineStepIdx, setEditingTimelineStepIdx] = useState<number | null>(null);
  const [editingTimelineDesc, setEditingTimelineDesc] = useState('');
  const [viewingAdminSlipUrl, setViewingAdminSlipUrl] = useState<string | null>(null);
  const adminSlipFileInputRef = useRef<HTMLInputElement>(null);

  // Delivery Proof Images State (Pre-delivery & Post-delivery)
  const [deliveryProofModalOrder, setDeliveryProofModalOrder] = useState<TopUpOrder | null>(null);
  const [preDeliveryImg, setPreDeliveryImg] = useState<string>('');
  const [postDeliveryImg, setPostDeliveryImg] = useState<string>('');
  const [viewingProofFullscreen, setViewingProofFullscreen] = useState<{ url: string; title: string } | null>(null);
  const preDeliveryFileInputRef = useRef<HTMLInputElement>(null);
  const postDeliveryFileInputRef = useRef<HTMLInputElement>(null);

  const openDeliveryProofModal = (ord: TopUpOrder) => {
    setDeliveryProofModalOrder(ord);
    setPreDeliveryImg(ord.preDeliveryImageUrl || '');
    setPostDeliveryImg(ord.postDeliveryImageUrl || '');
  };

  const handlePreDeliveryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'ขนาดไฟล์ภาพเกิน 10MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) setPreDeliveryImg(res);
    };
    reader.readAsDataURL(file);
  };

  const handlePostDeliveryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'ขนาดไฟล์ภาพเกิน 10MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) setPostDeliveryImg(res);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDeliveryProof = (markCompleted: boolean = false) => {
    if (!deliveryProofModalOrder) return;
    adminUploadDeliveryProof(deliveryProofModalOrder.id, {
      preDeliveryImageUrl: preDeliveryImg,
      postDeliveryImageUrl: postDeliveryImg,
    });
    if (markCompleted && deliveryProofModalOrder.status !== 'completed') {
      adminUpdateOrderStatus(
        deliveryProofModalOrder.id,
        'completed',
        'ส่งสำเร็จเเล้ว (แนบภาพหลักฐานจัดส่งเรียบร้อย)'
      );
    }
    setDeliveryProofModalOrder(null);
  };

  // Keep selectedOrderForProgress updated live with orders list
  const activeProgressOrder =
    orders.find((o) => o.id === selectedOrderForProgress?.id) || selectedOrderForProgress;

  const handleAdminAddTimelineStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgressOrder || !newTimelineDesc.trim()) return;
    adminAddTimelineStep(activeProgressOrder.id, {
      status: newTimelineStatus,
      description: newTimelineDesc.trim(),
    });
    setNewTimelineDesc('');
  };

  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeProgressOrder) {
      if (file.size > 8 * 1024 * 1024) {
        setNotification({
          type: 'error',
          message: 'ขนาดไฟล์สลิปใหญ่เกินไป (ไม่เกิน 8MB)',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          adminUploadSlip(activeProgressOrder.id, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // IF NOT LOGGED IN AS ADMIN: STRICT ACCESS DENIED
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 animate-fadeIn">
        <div className="rounded-3xl bg-[#120E24] border border-violet-500/30 p-7 sm:p-8 shadow-2xl text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-violet-600/30 mb-4 border border-violet-400/40">
            <Lock className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <span className="text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-violet-950 text-cyan-300 border border-violet-500/40 inline-block mb-2">
            RESTRICTED ACCESS
          </span>

          <h2 className="text-2xl font-black text-white font-heading">
            ระบบจัดการหลังบ้าน (แอดมิน)
          </h2>
          <p className="text-xs text-violet-200/80 mt-1 mb-6 leading-relaxed font-medium">
            🔒 เฉพาะผู้ดูแลระบบที่มีสิทธิ์เท่านั้น เมื่อล็อกอินด้วยบัญชีที่เป็นแอดมิน ข้อมูลหลังบ้านจะแสดงขึ้นมาโดยอัตโนมัติ
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="w-full py-3.5 rounded-2xl neon-btn-purple text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <KeyRound className="w-4 h-4 stroke-[2.5]" />
              <span>เข้าสู่ระบบด้วยบัญชีแอดมิน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className="w-full py-3 rounded-2xl bg-[#0B0813] hover:bg-[#1B1433] text-violet-300 hover:text-white font-bold text-xs border border-violet-500/30 transition-colors cursor-pointer"
            >
              กลับไปหน้าแรก (หน้าร้านค้า)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN AS ADMIN: FULL DASHBOARD
  const currentGame = games.find((g) => g.id === selectedGameId) || games[0];

  // Stats
  const totalRevenue = orders
    .filter((o) => o.status === 'completed' || o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.price, 0);

  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
  const pendingOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'failed').length;

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    const matchQuery =
      ord.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.gameName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.playerUid.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (ord.contactPhone && ord.contactPhone.includes(orderSearch));

    const matchStatus =
      orderStatusFilter === 'all' ? true : ord.status === orderStatusFilter;

    return matchQuery && matchStatus;
  });

  // Handle Upload Package Image (Base64)
  const handleUploadPackageImage = (file: File, isEditing: boolean) => {
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        type: 'error',
        message: 'ขนาดไฟล์รูปภาพเกิน 5MB กรุณาเลือกไฟล์ที่ขนาดเล็กกว่านี้',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (isEditing && editingPackage) {
          setEditingPackage({ ...editingPackage, imageUrl: result });
        } else {
          setNewPkgImageUrl(result);
        }
        setNotification({
          type: 'success',
          message: 'อัปโหลดรูปภาพแพ็กเกจเรียบร้อยแล้ว',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Price Edit
  const handleSavePriceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage || !currentGame) return;

    updatePackagePrice(currentGame.id, editingPackage.id, {
      price: Number(editingPackage.price),
      originalPrice: Number(editingPackage.originalPrice),
      name: editingPackage.name,
      amount: Number(editingPackage.amount),
      bonusAmount: editingPackage.bonusAmount ? Number(editingPackage.bonusAmount) : 0,
      badge: editingPackage.badge,
      isHot: editingPackage.isHot,
      active: editingPackage.active,
      imageUrl: editingPackage.imageUrl,
    });

    setEditingPackage(null);
  };

  // Handle Add Package
  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGame) return;

    addPackageToGame(currentGame.id, {
      name: newPkgName || `${newPkgAmount} ${newPkgInGameItem || currentGame.packages[0]?.inGameItem || 'เหรียญ'}`,
      inGameItem: newPkgInGameItem || currentGame.packages[0]?.inGameItem || 'เหรียญ',
      amount: Number(newPkgAmount),
      bonusAmount: Number(newPkgBonus) || undefined,
      originalPrice: Number(newPkgOriginalPrice),
      price: Number(newPkgPrice),
      badge: newPkgBadge || undefined,
      isHot: newPkgIsHot,
      active: true,
      imageUrl: newPkgImageUrl.trim() || undefined,
    });

    setIsAddPackageModalOpen(false);
    setNewPkgName('');
    setNewPkgAmount(100);
    setNewPkgPrice(90);
    setNewPkgOriginalPrice(100);
    setNewPkgBonus(0);
    setNewPkgBadge('');
    setNewPkgImageUrl('');
  };

  // Handle Add Game
  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    addNewGame({
      name: newGameName.trim(),
      publisher: newGamePublisher.trim() || 'Independent',
      category: newGameCategory,
      description: newGameDesc.trim() || 'บริการเติมเงินเกมออนไลน์ระบบอัตโนมัติ รวดเร็ว ปลอดภัย',
      todayRate: newGameTodayRate.trim() || undefined,
      badge: '✨ เกมใหม่',
      active: true,
      bannerGradient: 'from-violet-600/30 via-purple-950/40 to-slate-950',
      accountField: {
        label: newGameAccountLabel,
        placeholder: newGameAccountPlaceholder,
        needsServerSelect: false,
      },
      packages: [
        {
          id: `pkg-${Date.now()}-1`,
          name: 'แพ็กเกจทดลอง',
          inGameItem: 'เหรียญ/เพชร',
          amount: 100,
          originalPrice: 100,
          price: 89,
          active: true,
          badge: '⚡ แนะนำ',
        },
      ],
    });

    setIsAddGameModalOpen(false);
    setNewGameName('');
    setNewGamePublisher('');
    setNewGameDesc('');
    setNewGameTodayRate('');
  };

  // Export Orders to CSV for Accounting Needs (Requested by user)
  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      setNotification({
        type: 'error',
        message: 'ไม่มีรายการคำสั่งซื้อสำหรับส่งออกเป็นไฟล์ CSV',
      });
      return;
    }

    const headers = [
      'Order ID (รหัสคำสั่งซื้อ)',
      'Created Date (วันที่สร้าง)',
      'Created Time (เวลาที่สร้าง)',
      'Game Name (ชื่อเกม)',
      'Package Name (แพ็กเกจ)',
      'Quantity (จำนวนชุด)',
      'Player UID (ไอดีผู้เล่น)',
      'Server/Zone (เซิร์ฟเวอร์/โซน)',
      'Player Character Name (ชื่อตัวละคร)',
      'Selling Price (ยอดชำระจริง THB)',
      'Original Price (ราคาปกติ THB)',
      'Discount (ส่วนลด THB)',
      'Payment Method (ช่องทางชำระเงิน)',
      'Payment Status (สถานะการชำระ)',
      'Fulfillment Status (สถานะการเติม)',
      'Customer Phone (เบอร์โทรติดต่อ)',
      'Customer Email (อีเมลติดต่อ)',
      'Last Updated (อัปเดตล่าสุด)',
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = orders.map((ord) => {
      const createdDate = new Date(ord.createdAt);
      const dateStr = !isNaN(createdDate.getTime()) ? createdDate.toLocaleDateString('th-TH') : ord.createdAt;
      const timeStr = !isNaN(createdDate.getTime()) ? createdDate.toLocaleTimeString('th-TH') : '';
      const discount = ord.originalPrice > ord.price ? ord.originalPrice - ord.price : 0;
      const statusLabel =
        ord.status === 'completed'
          ? 'เติมสำเร็จ'
          : ord.status === 'processing'
          ? 'กำลังเติม'
          : ord.status === 'verifying'
          ? 'ตรวจยอดชำระ'
          : ord.status === 'failed'
          ? 'ยกเลิก'
          : 'รอชำระ';

      return [
        escapeCsv(ord.id),
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(ord.gameName),
        escapeCsv(ord.packageName),
        escapeCsv(ord.quantity || 1),
        escapeCsv(ord.playerUid),
        escapeCsv(ord.serverId || ord.zoneId || '-'),
        escapeCsv(ord.playerNamePreview || '-'),
        escapeCsv(ord.price),
        escapeCsv(ord.originalPrice),
        escapeCsv(discount),
        escapeCsv(ord.paymentMethod),
        escapeCsv(ord.paymentStatus),
        escapeCsv(statusLabel),
        escapeCsv(ord.contactPhone || '-'),
        escapeCsv(ord.contactEmail || '-'),
        escapeCsv(new Date(ord.updatedAt).toLocaleString('th-TH')),
      ].join(',');
    });

    // UTF-8 BOM (\uFEFF) for Thai language support in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `gamepay_orders_report_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      type: 'success',
      message: `ส่งออกข้อมูลคำสั่งซื้อ ${orders.length} รายการเป็นไฟล์ CSV เรียบร้อยแล้ว`,
    });
  };

  // Export Sales Financial Summary CSV
  const handleExportSalesSummaryCsv = () => {
    const headers = [
      'ชื่อเกม (Game)',
      'จำนวนออเดอร์ทั้งหมด',
      'ส่งสำเร็จแล้ว',
      'กำลังดำเนินการ',
      'ยกเลิก',
      'ยอดขายรวม (THB)',
      'ส่วนลดรวม (THB)',
      'ราคาเฉลี่ยต่อออเดอร์ (THB)',
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const summaryByGame = games.map((g) => {
      const gameOrders = orders.filter((o) => o.gameId === g.id || o.gameName === g.name);
      const completed = gameOrders.filter((o) => o.status === 'completed').length;
      const processing = gameOrders.filter((o) => o.status === 'processing' || o.status === 'verifying').length;
      const failed = gameOrders.filter((o) => o.status === 'failed').length;
      const revenue = gameOrders
        .filter((o) => o.status === 'completed' || o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.price, 0);
      const totalDiscount = gameOrders.reduce(
        (sum, o) => sum + (o.originalPrice > o.price ? o.originalPrice - o.price : 0),
        0
      );
      const aov = gameOrders.length > 0 ? Math.round(revenue / gameOrders.length) : 0;

      return [
        escapeCsv(g.name),
        escapeCsv(gameOrders.length),
        escapeCsv(completed),
        escapeCsv(processing),
        escapeCsv(failed),
        escapeCsv(revenue),
        escapeCsv(totalDiscount),
        escapeCsv(aov),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...summaryByGame].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ef_cpa_sales_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      type: 'success',
      message: 'ส่งออกรายงานสรุปยอดขายและการเงิน (Sales Financial CSV) สำเร็จ',
    });
  };

  // Google Sign In & Sync to Google Sheets
  const handleGoogleSignInAndExport = async () => {
    setIsExportingSheet(true);
    try {
      let token = await getGoogleAccessToken();
      if (!token) {
        setIsGoogleLoggingIn(true);
        const res = await googleSignIn();
        if (res) {
          setGoogleUser(res.user);
          token = res.accessToken;
        }
      }

      if (!token) {
        throw new Error('ไม่สามารถเข้าสู่ระบบ Google ได้');
      }

      const result = await exportOrdersToGoogleSheets(orders);
      setExportedSheetUrl(result.spreadsheetUrl);
      setNotification({
        type: 'success',
        message: `ส่งออกออเดอร์ ${result.rowCount} รายการไปยัง Google Sheets เรียบร้อยแล้ว!`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการส่งออกไปยัง Google Sheets',
      });
    } finally {
      setIsExportingSheet(false);
      setIsGoogleLoggingIn(false);
    }
  };

  // Handle Upload Thumbnail from Device
  const handleUploadThumbnailFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({
        type: 'error',
        message: 'กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP)',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && selectedThumbnailGameId) {
        addGameImageVersion(
          selectedThumbnailGameId,
          dataUrl,
          versionNoteInput.trim() || `เวอร์ชันอัปโหลดใหม่ ${new Date().toLocaleTimeString('th-TH')}`,
          true // Set as default thumbnail
        );
        setVersionNoteInput('');
        if (thumbnailFileInputRef.current) {
          thumbnailFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Custom Status & Admin Note
  const handleSaveCustomStatus = () => {
    if (!customStatusOrder) return;
    adminUpdateOrderStatus(
      customStatusOrder.id,
      targetStatusType,
      adminNoteText.trim() || undefined,
      targetStatusType === 'custom' ? customStatusText.trim() : undefined
    );
    setCustomStatusOrder(null);
    setCustomStatusText('');
    setAdminNoteText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 shadow-xl shadow-black mb-8">
        <div className="flex items-center gap-3.5">
          <EFCPALogo size="lg" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-display">
                EF CPA Shop - ระบบจัดการหลังบ้านแอดมิน
              </h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">
              เข้าสู่ระบบในชื่อ: <span className="font-mono font-bold text-amber-400">{adminCredentials.username}</span> | สต็อก iOS ราคาถูกที่สุด ประสบการณ์เติมเกมส์มากกว่า 7 ปี
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Orders CSV */}
          <button
            onClick={exportOrdersToCSV}
            title="ดาวน์โหลดข้อมูลประวัติคำสั่งซื้อทั้งหมดเป็นไฟล์ CSV"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-400 shadow flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>CSV ประวัติคำสั่งซื้อ</span>
          </button>

          {/* Export Financial Sales Summary CSV */}
          <button
            onClick={handleExportSalesSummaryCsv}
            title="ดาวน์โหลดรายงานสรุปยอดขายและการเงินแยกตามเกม (CSV Financial Report)"
            className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs border border-cyan-400 shadow flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>CSV สรุปการเงิน</span>
          </button>

          {/* Google Sheets Sync Button */}
          <button
            onClick={handleGoogleSignInAndExport}
            disabled={isExportingSheet}
            title="ส่งออกและซิงค์ออเดอร์ไปยัง Google Sheets"
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 text-white font-black text-xs border border-violet-400 shadow flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isExportingSheet ? 'กำลังซิงค์...' : 'Google Sheets'}</span>
          </button>

          <button
            onClick={resetAllData}
            title="รีเซ็ตข้อมูลเริ่มต้น"
            className="px-2.5 py-2.5 rounded-xl bg-[#1d253b] hover:bg-[#252f4a] border border-slate-600 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={adminLogout}
            className="px-3 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-xs font-black text-rose-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออก</span>
          </button>
        </div>
      </div>

      {/* Metrics Row - Solid, High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span>รายได้รวมทั้งหมด</span>
            <DollarSign className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
            ฿{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 stroke-[2.5]" /> อัปเดตแบบเรียลไทม์
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span>คำสั่งซื้อทั้งหมด</span>
            <Package className="w-4 h-4 text-indigo-400 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
            {orders.length} รายการ
          </div>
          <span className="text-[11px] text-slate-300 font-semibold block mt-1">
            เติมสำเร็จแล้ว <span className="font-bold text-emerald-400">{completedOrdersCount}</span> รายการ
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span>กำลังรอดำเนินการ</span>
            <Clock className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums">
            {pendingOrdersCount} รายการ
          </div>
          <span className="text-[11px] text-amber-400 font-bold block mt-1">
            {pendingOrdersCount > 0 ? '⚠️ ต้องตรวจสอบหรือส่งไอเทม' : '✅ ไม่มีค้างสะสม'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span>เกมที่เปิดให้บริการ</span>
            <Layers className="w-4 h-4 text-fuchsia-400 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
            {games.length} เกม
          </div>
          <span className="text-[11px] text-slate-300 font-semibold block mt-1">
            รวม {games.reduce((acc, g) => acc + g.packages.length, 0)} แพ็กเกจ
          </span>
        </div>
      </div>

      {/* Tab Navigation - Solid chunky buttons */}
      <div className="flex flex-wrap gap-2.5 border-b-2 border-slate-800 pb-4 mb-6">
        <button
          onClick={() => setAdminTab('prices')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'prices'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4 stroke-[2.5]" />
          <span>จัดการราคาแพ็กเกจ (แก้ไขได้ตลอด)</span>
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'orders'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <Package className="w-4 h-4 stroke-[2.5]" />
          <span>คำสั่งซื้อเติมเกม ({orders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'users'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <Users className="w-4 h-4 stroke-[2.5]" />
          <span>สมัครยูสเซอร์ลูกค้า ({customerUsers.length})</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Admin Only
          </span>
        </button>

        <button
          onClick={() => setAdminTab('games')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'games'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <Layers className="w-4 h-4 stroke-[2.5]" />
          <span>จัดการรายชื่อเกม ({games.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('thumbnails')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'thumbnails'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4 stroke-[2.5]" />
          <span>รูปภาพเกม & เวอร์ชัน (Thumbnails)</span>
        </button>

        <button
          onClick={() => setAdminTab('sheets')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'sheets'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
          <span>Google Sheets Sync</span>
        </button>

        <button
          onClick={() => setAdminTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'security'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-[#141928] text-slate-200 hover:text-white hover:bg-[#1e263d] border-2 border-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4 stroke-[2.5]" />
          <span>ความปลอดภัยแอดมิน</span>
        </button>
      </div>

      {/* TAB 1: PRICE MANAGEMENT (USER EXPLICIT REQUIREMENT: "เเละทำให้หลังบ้านเเอดมินสามารถเเก้ไขราคาได้ตลอด") */}
      {adminTab === 'prices' && (
        <div className="space-y-6">
          {/* Game Selector Bar - Solid */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                  เลือกเกมที่ต้องการแก้ไขราคา
                </label>
                <p className="text-xs text-slate-300 font-semibold">
                  คลิกเลือกเกมเพื่อดูและปรับราคาขายของแต่ละแพ็กเกจได้ทันที (แก้ไขได้ตลอดเวลา)
                </p>
              </div>

              <button
                onClick={() => {
                  setNewPkgInGameItem(currentGame?.packages[0]?.inGameItem || 'เหรียญ');
                  setIsAddPackageModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 border-amber-300 shadow-md shadow-amber-400/20 whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>เพิ่มแพ็กเกจใหม่ให้กับเกมนี้</span>
              </button>
            </div>

            {/* Games Pills */}
            <div className="flex flex-wrap gap-2">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                    selectedGameId === game.id
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-md'
                      : 'bg-[#182032] text-slate-200 border-2 border-slate-700 hover:border-slate-500 hover:bg-[#202b42]'
                  }`}
                >
                  <span>{game.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono">
                    {game.packages.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Game Packages Table - Solid */}
          {currentGame && (
            <div className="rounded-3xl bg-[#141928] border-2 border-slate-700 overflow-hidden shadow-xl">
              <div className="p-5 bg-[#1b2234] border-b-2 border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>ตารางแพ็กเกจ: {currentGame.name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600 font-bold">
                      {currentGame.publisher}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold mt-0.5">
                    คลิกปุ่ม &quot;แก้ไขราคา&quot; เพื่อปรับราคาขายโปรโมชั่น หรือราคาเต็มได้ตลอดเวลา
                  </p>
                </div>

                {/* Adjust Today's Rate for this game */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-[#0b0e17] border-2 border-amber-400/50 shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-amber-300 block">
                        เรทของวันนี้ (แสดงหน้าร้าน)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ปัจจุบัน: <strong className="text-white font-mono">{currentGame.todayRate || `฿${(currentGame.packages.length > 0 ? Math.min(...currentGame.packages.map(p => p.price)) : 0).toLocaleString()} (อิงราคาแพ็ก)`}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={todayRateInputs[currentGame.id] !== undefined ? todayRateInputs[currentGame.id] : (currentGame.todayRate || '')}
                      onChange={(e) =>
                        setTodayRateInputs((prev) => ({
                          ...prev,
                          [currentGame.id]: e.target.value,
                        }))
                      }
                      placeholder={`เช่น ฿${currentGame.packages.length > 0 ? Math.min(...currentGame.packages.map(p => p.price)) : 45} หรือ เรท 0.85`}
                      className="px-3 py-1.5 rounded-xl bg-[#141928] border border-slate-700 text-xs text-white font-mono outline-none focus:border-amber-400 w-full sm:w-44 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = (todayRateInputs[currentGame.id] !== undefined ? todayRateInputs[currentGame.id] : (currentGame.todayRate || '')).trim();
                        updateGame(currentGame.id, { todayRate: val });
                        setNotification({
                          type: 'success',
                          message: `อัปเดตเรทของวันนี้สำหรับ ${currentGame.name} เป็น "${val || 'ค่าเริ่มต้น'}" สำเร็จ`,
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all hover:scale-105"
                    >
                      บันทึกเรท
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-[#182032] text-xs font-black text-slate-200 uppercase border-b-2 border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-16">รูปแพ็ก</th>
                      <th className="py-3.5 px-4">ชื่อแพ็กเกจ / จำนวน</th>
                      <th className="py-3.5 px-4">ไอเทมในเกม</th>
                      <th className="py-3.5 px-4">ราคาเต็มปกติ</th>
                      <th className="py-3.5 px-4 text-amber-400">ราคาขายจริง (ปัจจุบัน)</th>
                      <th className="py-3.5 px-4">กำไร / ส่วนลด</th>
                      <th className="py-3.5 px-4">ป้ายกำกับ</th>
                      <th className="py-3.5 px-4 text-center">สถานะ</th>
                      <th className="py-3.5 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentGame.packages.map((pkg) => {
                      const discount =
                        pkg.originalPrice > pkg.price
                          ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
                          : 0;

                      return (
                        <tr key={pkg.id} className="hover:bg-[#1a2135] transition-colors">
                          <td className="py-3 px-4 text-center">
                            {pkg.imageUrl ? (
                              <div
                                onClick={() => setEditingPackage({ ...pkg })}
                                className="relative group w-12 h-12 mx-auto rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-sm flex items-center justify-center cursor-pointer"
                                title="คลิกเพื่อแก้ไขรูปภาพแพ็กเกจนี้"
                              >
                                <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-amber-400 transition-opacity">
                                  <Edit2 className="w-4 h-4" />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingPackage({ ...pkg })}
                                className="w-12 h-12 mx-auto rounded-xl border border-dashed border-slate-600 hover:border-amber-400 hover:bg-amber-400/10 text-slate-400 hover:text-amber-400 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer"
                                title="เพิ่มรูปภาพให้แพ็กเกจนี้"
                              >
                                <ImageIcon className="w-4 h-4 mb-0.5 opacity-80" />
                                <span>+รูป</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-white">
                            <div>{pkg.name}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-bold text-xs">
                            {pkg.inGameItem}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 line-through tabular-nums">
                            ฿{pkg.originalPrice.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-amber-400 text-base tabular-nums">
                            ฿{pkg.price.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            {discount > 0 ? (
                              <span className="text-xs font-black text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                                ถูกกว่า {discount}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {pkg.badge ? (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 border border-amber-300">
                                {pkg.badge}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-xs font-black px-2.5 py-0.5 rounded-full inline-block ${
                                pkg.active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                              }`}
                            >
                              {pkg.active ? 'เปิดขาย' : 'ปิดชั่วคราว'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setEditingPackage({ ...pkg })}
                              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs border border-amber-300 shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 stroke-[2.5]" />
                              <span>แก้ไขราคา</span>
                            </button>

                            <button
                              onClick={() => deletePackage(currentGame.id, pkg.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 hover:text-rose-200 transition-colors"
                              title="ลบแพ็กเกจนี้"
                            >
                              <Trash2 className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          {/* Filter Bar - Solid, Clear */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 stroke-[2.5]" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="ค้นหา Order ID, UID, ชื่อเกม..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-white font-bold text-xs outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {['all', 'pending_payment', 'verifying', 'processing', 'completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-sm'
                      : 'bg-[#182032] text-slate-200 hover:text-white hover:bg-[#202b42] border-2 border-slate-700'
                  }`}
                >
                  {st === 'all'
                    ? 'ทั้งหมด'
                    : st === 'pending_payment'
                    ? 'รอชำระ'
                    : st === 'verifying'
                    ? 'ตรวจสลิป'
                    : st === 'processing'
                    ? 'กำลังเติม'
                    : 'สำเร็จแล้ว'}
                </button>
              ))}

              {/* Export to CSV Button in Orders View */}
              <button
                onClick={exportOrdersToCSV}
                title="ดาวน์โหลดข้อมูลคำสั่งซื้อทั้งหมดเป็นไฟล์ Excel / CSV สำหรับงานบัญชี"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border-2 border-emerald-400 shadow-md shadow-emerald-950 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ml-auto sm:ml-2 hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
                <span>Export to CSV (ฝ่ายบัญชี)</span>
              </button>
            </div>
          </div>

          {/* Orders Table - Solid, Heavy High Contrast */}
          <div className="rounded-3xl bg-[#141928] border-2 border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-[#1b2234] text-xs font-black text-slate-200 uppercase border-b-2 border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">รหัส / เวลา</th>
                    <th className="py-3.5 px-4">เกม & แพ็กเกจ</th>
                    <th className="py-3.5 px-4">ข้อมูลผู้เล่น (UID)</th>
                    <th className="py-3.5 px-4">ยอดเงิน</th>
                    <th className="py-3.5 px-4">วิธีชำระ</th>
                    <th className="py-3.5 px-4">สถานะปัจจุบัน</th>
                    <th className="py-3.5 px-4 text-right">ปรับสถานะ / ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                        ไม่พบคำสั่งซื้อที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#1a2135] transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-extrabold text-amber-400 block">{ord.id}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(ord.createdAt).toLocaleTimeString('th-TH')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-black text-white">{ord.gameName}</div>
                          <div className="text-xs text-slate-300 font-medium">{ord.packageName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-black text-emerald-400">
                            {ord.playerUid}
                          </div>
                          {ord.playerNamePreview && (
                            <div className="text-[11px] text-slate-300 font-semibold">
                              ชื่อ: {ord.playerNamePreview}
                            </div>
                          )}
                          {ord.serverId && (
                            <div className="text-[10px] text-slate-400">
                              เซิร์ฟเวอร์: {ord.serverId}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-amber-400 text-base tabular-nums">
                          ฿{ord.price.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-200">
                          <span className="capitalize">{ord.paymentMethod}</span>
                          {ord.slipUrl ? (
                            <button
                              type="button"
                              onClick={() => setViewingAdminSlipUrl(ord.slipUrl || null)}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1 mt-0.5 cursor-pointer"
                              title="คลิกเพื่อดูรูปสลิป"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>ดูรูปสลิป</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForProgress(ord)}
                              className="text-[10px] text-slate-400 hover:text-amber-400 block mt-0.5 underline cursor-pointer"
                            >
                              + แนบสลิปแทน
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                              ord.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                : ord.status === 'failed'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                                : ord.status === 'processing'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                : ord.customStatus
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}
                          >
                            {ord.customStatus
                              ? `⭐ ${ord.customStatus}`
                              : ord.status === 'completed'
                              ? '✅ ส่งสำเร็จเเล้ว'
                              : ord.status === 'failed'
                              ? '❌ ยกเลิก'
                              : ord.status === 'processing'
                              ? '⏳ กำลังดำเนินการ'
                              : '💳 กำลังดำเนินการ'}
                          </span>
                          {ord.adminNote && (
                            <span className="block text-[11px] text-cyan-300 font-medium mt-1">
                              💬 {ord.adminNote}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Delivery Proof Button (Pre & Post Delivery Images) */}
                          <button
                            type="button"
                            onClick={() => openDeliveryProofModal(ord)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                              ord.preDeliveryImageUrl && ord.postDeliveryImageUrl
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                : ord.preDeliveryImageUrl || ord.postDeliveryImageUrl
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 hover:bg-amber-900'
                                : 'bg-[#1b2234] hover:bg-[#25304a] text-cyan-300 border-slate-700'
                            }`}
                            title="อัปโหลดภาพหลักฐานการจัดส่งสินค้า (ภาพก่อนส่ง & ภาพหลังส่ง) ให้ลูกค้าดู"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>
                              หลักฐานจัดส่ง{' '}
                              {ord.preDeliveryImageUrl && ord.postDeliveryImageUrl
                                ? '✓ 2/2'
                                : ord.preDeliveryImageUrl || ord.postDeliveryImageUrl
                                ? '1/2'
                                : '+ แนบภาพ'}
                            </span>
                          </button>

                          {/* Quick Set Status to ส่งสำเร็จเเล้ว */}
                          {ord.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => adminUpdateOrderStatus(ord.id, 'completed', 'ส่งสำเร็จเเล้ว')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-400 shadow transition-all cursor-pointer"
                              title="ปรับสถานะเป็น ส่งสำเร็จเเล้ว"
                            >
                              ส่งสำเร็จเเล้ว
                            </button>
                          )}

                          {/* Quick Set Status to กำลังดำเนินการ */}
                          {ord.status !== 'processing' && ord.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => adminUpdateOrderStatus(ord.id, 'processing', 'กำลังดำเนินการเติมสต็อก')}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs border border-amber-400 shadow transition-all cursor-pointer"
                              title="ปรับสถานะเป็น กำลังดำเนินการ"
                            >
                              กำลังดำเนินการ
                            </button>
                          )}

                          {/* Quick Set Status to ยกเลิก */}
                          {ord.status !== 'failed' && (
                            <button
                              type="button"
                              onClick={() => adminUpdateOrderStatus(ord.id, 'failed', 'ยกเลิกคำสั่งซื้อ')}
                              className="px-2 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-700/60 shadow transition-all cursor-pointer"
                              title="ยกเลิกคำสั่งซื้อ"
                            >
                              ยกเลิก
                            </button>
                          )}

                          {/* Custom Status & Note Modal Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomStatusOrder(ord);
                              setTargetStatusType(ord.status);
                              setCustomStatusText(ord.customStatus || '');
                              setAdminNoteText(ord.adminNote || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs border border-violet-400 shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="พิมพ์สถานะเองหรือส่งข้อความแจ้งลูกค้าโดยตรง"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>อื่นๆ / แจ้งลูกค้า</span>
                          </button>

                          {/* Dedicated Timeline & Progress Manager Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForProgress(ord)}
                            className="px-2 py-1.5 rounded-lg bg-[#1e273d] hover:bg-[#283552] text-amber-400 hover:text-white font-black text-xs border border-slate-600 shadow transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="ดูไทม์ไลน์รายละเอียด"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CUSTOMER USER MANAGEMENT (ADMIN REGISTRATION ONLY) */}
      {adminTab === 'users' && <CustomerUserManager />}

      {/* TAB 3: GAMES MANAGEMENT */}
      {adminTab === 'games' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">รายชื่อเกมที่เปิดให้บริการทั้งหมด</h3>
              <p className="text-xs text-purple-300/70">
                เพิ่มเกมใหม่ หรือแก้ไขข้อมูลเกมที่มีอยู่
              </p>
            </div>
            <button
              onClick={() => setIsAddGameModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเกมใหม่เข้าสู่ระบบ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="p-5 rounded-2xl bg-purple-950/50 border border-purple-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900 text-purple-200">
                    {game.category}
                  </span>
                  <div className="space-x-1">
                    <button
                      onClick={() => {
                        setSelectedGameId(game.id);
                        setAdminTab('prices');
                      }}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      จัดการราคา ({game.packages.length} แพ็ก)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.iconBgColor || 'from-violet-600 to-indigo-700'} flex items-center justify-center text-white font-black text-lg`}>
                    {game.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base">{game.name}</h4>
                    <p className="text-xs text-purple-300/70">ค่าย: {game.publisher}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{game.description}</p>

                {/* Today's Rate Display & Quick Edit */}
                <div className="p-2.5 rounded-xl bg-[#0b0e17] border border-amber-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>เรทวันนี้:</span>
                    <span className="font-mono text-white font-extrabold ml-1">
                      {game.todayRate || `฿${(game.packages.length > 0 ? Math.min(...game.packages.map(p => p.price)) : 0).toLocaleString()} (อิงราคาแพ็ก)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newRate = prompt(`ระบุเรทของวันนี้สำหรับ ${game.name} (เช่น ฿45 หรือ เรท 0.85):`, game.todayRate || '');
                      if (newRate !== null) {
                        updateGame(game.id, { todayRate: newRate.trim() });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shrink-0 cursor-pointer shadow transition-all hover:scale-105"
                  >
                    ปรับเรท
                  </button>
                </div>

                <div className="pt-2 border-t border-purple-900/50 flex items-center justify-between">
                  <span className="text-xs text-purple-400">
                    ช่องทาง UID: {game.accountField.label}
                  </span>
                  <button
                    onClick={() => deleteGame(game.id)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-950/60"
                    title="ลบเกมนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN SECURITY SETTINGS */}
      {adminTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-purple-950/60 border border-purple-700/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  ความปลอดภัยระบบแอดมินคนเดียว (Single Admin)
                </h3>
                <p className="text-xs text-purple-300/70">
                  ระบบนี้ถูกจำกัดให้มีผู้ดูแลระบบคนเดียวเท่านั้น เพื่อความปลอดภัยสูงสุด
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-900/40 border border-purple-800/40 text-xs space-y-2">
              <div className="flex justify-between text-purple-200">
                <span>ชื่อผู้ใช้แอดมิน (Username):</span>
                <span className="font-mono font-bold text-white">{adminCredentials.username}</span>
              </div>
              <div className="flex justify-between text-purple-200">
                <span>รหัสผ่านปัจจุบัน:</span>
                <span className="font-mono font-bold text-amber-400">•••••••• ({adminCredentials.passcode.length} ตัวอักษร)</span>
              </div>
            </div>

            {/* Change Passcode Form */}
            <div className="pt-2 border-t border-purple-800/40">
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                เปลี่ยนรหัสผ่านแอดมินใหม่ (New Passcode)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newAdminPasscode}
                  onChange={(e) => setNewAdminPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-950 border border-purple-700/60 text-white text-sm outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (updateAdminPasscode(newAdminPasscode)) {
                      setNewAdminPasscode('');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THUMBNAILS & VERSION MANAGER (USER REQUIREMENT) */}
      {adminTab === 'thumbnails' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black mb-2">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>GAME THUMBNAIL & VERSION CONTROL</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  จัดการรูปภาพประจำตัวเกม & เวอร์ชัน (บันทึกถาวร)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
                  กำหนดรูปภาพประจำตัวของแต่ละเกม ตั้งค่าให้แสดงผลเป็นค่าเริ่มต้นในหน้าแรก พร้อมระบบสลับเวอร์ชันรูปภาพย้อนหลัง
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-[#0b0e17] border border-slate-700 text-right">
                <span className="text-[11px] text-slate-400 block font-bold">เกมทั้งหมดในระบบ</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {games.length} เกม
                </span>
              </div>
            </div>
          </div>

          {/* Game Selector Chips */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141928] border-2 border-slate-700 shadow-md">
            <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5">
              เลือกเกมที่ต้องการจัดการรูปภาพ:
            </label>
            <div className="flex flex-wrap gap-2">
              {games.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedThumbnailGameId(g.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    selectedThumbnailGameId === g.id
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-md scale-105'
                      : 'bg-[#1b2234] text-slate-200 hover:text-white hover:bg-[#252f48] border border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Thumbnail Workspace for Selected Game */}
          {(() => {
            const activeGame = games.find((g) => g.id === selectedThumbnailGameId) || games[0];
            if (!activeGame) return null;

            const versions = activeGame.imageVersions || (activeGame.iconUrl ? [{
              id: `ver-orig-${activeGame.id}`,
              url: activeGame.iconUrl,
              name: 'รูปดั้งเดิมของระบบ',
              uploadedAt: new Date().toISOString(),
              isDefault: true,
            }] : []);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Live Storefront Card Preview & Upload Controls (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Live Storefront Mockup Preview */}
                  <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>ตัวอย่างการแสดงผลบนหน้าแรก</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        ⭐ ค่าเริ่มต้นหน้าร้าน
                      </span>
                    </div>

                    {/* Mockup Card */}
                    <div className="cyber-card p-4 rounded-3xl border border-violet-500/40 bg-gradient-to-b from-[#1b1433] to-[#100c24] relative overflow-hidden">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-black/60 border border-violet-500/30">
                        {activeGame.iconUrl ? (
                          <img
                            src={activeGame.iconUrl}
                            alt={activeGame.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${activeGame.iconBgColor || 'from-violet-600 to-indigo-700'} flex items-center justify-center text-white font-black text-2xl`}>
                            {activeGame.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                          {activeGame.category}
                        </div>
                      </div>

                      <h4 className="text-base font-extrabold text-white font-heading">
                        {activeGame.name}
                      </h4>
                      <p className="text-xs text-violet-300/80 mt-0.5 line-clamp-1">
                        {activeGame.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-violet-500/20 flex items-center justify-between">
                        <span className="text-xs text-slate-400">เริ่มต้น</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          ฿{activeGame.packages[0]?.price || 50}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upload New Thumbnail Box */}
                  <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 shadow-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                      <h4 className="text-base font-black text-white font-display">
                        อัปโหลดรูปภาพใหม่จากอุปกรณ์
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                      เลือกรูปภาพจากโทรศัพท์มือถือหรือคอมพิวเตอร์เพื่อใช้เป็นรูปประจำตัวเกม และตั้งค่าให้แสดงผลเป็นค่าเริ่มต้นในหน้าแรกทันที
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ชื่อเวอร์ชัน / บันทึกความจำ (ตัวเลือก)
                      </label>
                      <input
                        type="text"
                        value={versionNoteInput}
                        onChange={(e) => setVersionNoteInput(e.target.value)}
                        placeholder="เช่น รูปอัปเดตซีซั่นใหม่, รูปโปรโมชัน, รูปดั้งเดิม..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 text-white font-medium text-xs outline-none focus:border-amber-400"
                      />
                    </div>

                    <input
                      type="file"
                      ref={thumbnailFileInputRef}
                      onChange={handleUploadThumbnailFile}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => thumbnailFileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>เลือกไฟล์ภาพ & ตั้งเป็นรูปเริ่มต้นหน้าร้าน</span>
                    </button>

                    <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-[11px] text-violet-300 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        รูปภาพจะถูกบันทึกถาวรในระบบของบราวเซอร์ (localStorage) ไม่มีการหมดอายุหรือลบอัตโนมัติ และสลับเวอร์ชันได้ตลอดเวลา
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Version History Gallery (7 cols) */}
                <div className="lg:col-span-7">
                  <div className="p-6 rounded-3xl bg-[#141928] border-2 border-slate-700 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="text-base font-black text-white font-display">
                          คลังเวอร์ชันรูปภาพของ {activeGame.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          มีทั้งหมด {versions.length} เวอร์ชัน | คลิก "สลับใช้เวอร์ชันนี้" เพื่อเปลี่ยนรูปเริ่มต้นในหน้าแรก
                        </p>
                      </div>
                    </div>

                    {/* Version Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {versions.map((ver, idx) => {
                        const isCurrentDefault = activeGame.iconUrl === ver.url;
                        return (
                          <div
                            key={ver.id || idx}
                            className={`p-4 rounded-2xl border-2 transition-all relative ${
                              isCurrentDefault
                                ? 'bg-[#1b2238] border-amber-400 shadow-lg shadow-amber-400/20'
                                : 'bg-[#0e1320] border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {/* Thumbnail Preview */}
                            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-black/60 relative border border-slate-700">
                              <img
                                src={ver.url}
                                alt={ver.name}
                                className="w-full h-full object-cover"
                              />
                              {isCurrentDefault && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] shadow">
                                  ⭐ ค่าเริ่มต้นหน้าร้าน
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 mb-3">
                              <span className="font-bold text-white text-xs block truncate" title={ver.name}>
                                {ver.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {new Date(ver.uploadedAt).toLocaleString('th-TH')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                              {!isCurrentDefault ? (
                                <button
                                  type="button"
                                  onClick={() => setGameDefaultThumbnail(activeGame.id, ver.id)}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                                >
                                  สลับใช้เวอร์ชันนี้
                                </button>
                              ) : (
                                <span className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-center font-bold text-xs border border-emerald-500/40">
                                  ✓ ใช้งานอยู่
                                </span>
                              )}

                              {versions.length > 1 && !isCurrentDefault && (
                                <button
                                  type="button"
                                  onClick={() => deleteGameImageVersion(activeGame.id, ver.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 transition-all cursor-pointer"
                                  title="ลบเวอร์ชันนี้ออกจากคลัง"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 5: GOOGLE SHEETS SYNC (WORKSPACE INTEGRATION) */}
      {adminTab === 'sheets' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Real-time Order Sync & 24-Hour Scheduled Auto-Backup to Google Sheets */}
          <GoogleSheetsSyncPanel />

          <div className="p-6 sm:p-8 rounded-3xl bg-[#141928] border-2 border-slate-700 shadow-xl">
            <div className="pb-4 border-b border-slate-800">
              <h4 className="text-lg font-black text-white font-display">
                ส่งออกรายงานการเงินสำรอง (Offline Export)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                ดาวน์โหลดข้อมูลในรูปแบบไฟล์ CSV สำหรับนำไปเปิดใช้งานใน Excel หรือทำบัญชีออฟไลน์
              </p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              {/* Card 1: Full Orders CSV */}
              <div className="p-5 rounded-2xl bg-[#1b2238] border-2 border-slate-700 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-bold text-white text-base">ดาวน์โหลด Orders CSV</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ดาวน์โหลดข้อมูลประวัติคำสั่งซื้อทั้งหมด พร้อมรหัส วันเวลา ยอดเงิน และช่องทางชำระเงิน
                </p>
                <button
                  type="button"
                  onClick={exportOrdersToCSV}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด Orders CSV</span>
                </button>
              </div>

              {/* Card 2: Financial Sales Report CSV */}
              <div className="p-5 rounded-2xl bg-[#1b2238] border-2 border-slate-700 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-bold text-white text-base">รายงานสรุปการเงิน (Sales CSV)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  สรุปรายได้ ยอดขายรวม ส่วนลด และจำนวนออเดอร์ที่สำเร็จ แยกตามแต่ละเกมเพื่อทำบัญชี
                </p>
                <button
                  type="button"
                  onClick={handleExportSalesSummaryCsv}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ดาวน์โหลด Sales Report CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM STATUS & NOTE TO CUSTOMER (USER EXPLICIT REQUIREMENT) */}
      {customStatusOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#141928] border-2 border-violet-500/60 p-6 shadow-2xl text-white">
            <button
              onClick={() => setCustomStatusOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/30 text-cyan-300 flex items-center justify-center font-bold border border-violet-400/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display">
                  กำหนดสถานะ & แจ้งข้อมูลลูกค้า
                </h3>
                <p className="text-xs text-slate-400">
                  ออเดอร์ #{customStatusOrder.id} - {customStatusOrder.gameName}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Status Radio Choices */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  เลือกสถานะออเดอร์:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatusType('completed')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      targetStatusType === 'completed'
                        ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300'
                        : 'bg-[#0b0e17] border-slate-700 text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ส่งสำเร็จเเล้ว</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatusType('processing')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      targetStatusType === 'processing'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-300'
                        : 'bg-[#0b0e17] border-slate-700 text-slate-300'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>กำลังดำเนินการ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatusType('failed')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      targetStatusType === 'failed'
                        ? 'bg-rose-600/30 border-rose-400 text-rose-300'
                        : 'bg-[#0b0e17] border-slate-700 text-slate-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>ยกเลิก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatusType('custom')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      targetStatusType === 'custom'
                        ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                        : 'bg-[#0b0e17] border-slate-700 text-slate-300'
                    }`}
                  >
                    <Edit2 className="w-4 h-4 text-purple-400" />
                    <span>อื่นๆ (พิมพ์เอง)</span>
                  </button>
                </div>
              </div>

              {/* Custom Status Text Input (if อื่นๆ) */}
              {targetStatusType === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">
                    พิมพ์สถานะที่ต้องการแจ้งลูกค้า: *
                  </label>
                  <input
                    type="text"
                    value={customStatusText}
                    onChange={(e) => setCustomStatusText(e.target.value)}
                    placeholder="เช่น กำลังรอคิวเซิร์ฟเวอร์, UID ไม่ถูกต้องกรุณาติดต่อเพจ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-purple-500/60 focus:border-purple-400 text-white text-xs outline-none"
                  />
                </div>
              )}

              {/* Admin Note Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ข้อความหมายเหตุส่งตรงถึงลูกค้า:
                </label>
                <textarea
                  rows={3}
                  value={adminNoteText}
                  onChange={(e) => setAdminNoteText(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการให้ลูกค้าเห็นบนหน้าเช็คสถานะออเดอร์..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e17] border-2 border-slate-700 focus:border-violet-400 text-white text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomStatusOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomStatus}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 cursor-pointer"
                >
                  บันทึก & อัปเดตทันที
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PACKAGE PRICE & DETAILS */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#18113c] via-[#100a2a] to-[#0a061c] border-2 border-amber-500/60 p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setEditingPackage(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Edit2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  แก้ไขราคาแพ็กเกจ (เรียลไทม์)
                </h3>
                <p className="text-xs text-purple-300/70">
                  {currentGame?.name} - {editingPackage.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePriceEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    💰 ราคาขายจริง (บาท) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPackage.price}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/80 border-2 border-amber-500/60 focus:border-amber-400 text-amber-400 font-mono font-black text-lg outline-none"
                  />
                  <span className="text-[10px] text-purple-300/60">ราคาที่ลูกค้าชำระ</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ราคาเต็มปกติในเกม (บาท) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPackage.originalPrice}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        originalPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/80 border border-purple-700/60 focus:border-amber-400 text-slate-300 font-mono text-sm outline-none"
                  />
                  <span className="text-[10px] text-purple-300/60">แสดงขีดฆ่าเพื่อโปรโมท</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  ชื่อแพ็กเกจ
                </label>
                <input
                  type="text"
                  required
                  value={editingPackage.name}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    จำนวนเหรียญ/เพชร
                  </label>
                  <input
                    type="number"
                    value={editingPackage.amount}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    โบนัสแถมฟรี (ถ้ามี)
                  </label>
                  <input
                    type="number"
                    value={editingPackage.bonusAmount || 0}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        bonusAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-emerald-400 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ป้ายกำกับ (Badge)
                  </label>
                  <input
                    type="text"
                    value={editingPackage.badge || ''}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        badge: e.target.value,
                      })
                    }
                    placeholder="เช่น 🔥 ขายดี, ⚡ คุ้มค่า"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPackage.active}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          active: e.target.checked,
                        })
                      }
                      className="rounded accent-amber-400 w-4 h-4"
                    />
                    <span>เปิดให้ลูกค้าสั่งซื้อได้</span>
                  </label>
                </div>
              </div>

              {/* Package Image Field */}
              <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>รูปภาพแพ็กเกจ (Package Image / Icon)</span>
                  </label>
                  {editingPackage.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingPackage({ ...editingPackage, imageUrl: undefined })}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                    >
                      ลบรูปภาพออก
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {editingPackage.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border-2 border-amber-400 shrink-0 shadow-md">
                      <img src={editingPackage.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-purple-600/60 bg-purple-950/40 shrink-0 flex flex-col items-center justify-center text-[10px] text-purple-300/60">
                      <ImageIcon className="w-5 h-5 mb-0.5 opacity-60" />
                      <span>ไม่มีรูป</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={editPkgImageInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPackageImage(file, true);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editPkgImageInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-amber-300 border border-purple-600/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปจากเครื่อง</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingPackage.imageUrl || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, imageUrl: e.target.value })}
                      placeholder="หรือวางลิงก์ URL รูปภาพ (https://...)"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b0e17] border border-purple-700/60 text-white text-xs outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-800/40 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-950 text-purple-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกราคาใหม่ทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PACKAGE */}
      {isAddPackageModalOpen && currentGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#18113c] via-[#100a2a] to-[#0a061c] border-2 border-purple-600/60 p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setIsAddPackageModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-600/30 text-violet-300 flex items-center justify-center font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  เพิ่มแพ็กเกจใหม่: {currentGame.name}
                </h3>
                <p className="text-xs text-purple-300/70">
                  กำหนดราคาและจำนวนเหรียญที่ต้องการเปิดขาย
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  ชื่อแพ็กเกจ (เช่น 540 คูปอง หรือ บัตรรายเดือน) *
                </label>
                <input
                  type="text"
                  required
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  placeholder="เช่น 540 คูปอง"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ประเภทไอเทมในเกม
                  </label>
                  <input
                    type="text"
                    value={newPkgInGameItem}
                    onChange={(e) => setNewPkgInGameItem(e.target.value)}
                    placeholder="เช่น คูปอง, เพชร, VP"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    จำนวนเหรียญ/เพชร
                  </label>
                  <input
                    type="number"
                    required
                    value={newPkgAmount}
                    onChange={(e) => setNewPkgAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    ราคาขายโปรโมชั่น (บาท) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border-2 border-amber-500/60 text-amber-400 font-mono font-bold text-base outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ราคาเต็มปกติ (บาท)
                  </label>
                  <input
                    type="number"
                    required
                    value={newPkgOriginalPrice}
                    onChange={(e) => setNewPkgOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    โบนัสแถมฟรี (ถ้ามี)
                  </label>
                  <input
                    type="number"
                    value={newPkgBonus}
                    onChange={(e) => setNewPkgBonus(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-emerald-400 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ป้ายกำกับพิเศษ
                  </label>
                  <input
                    type="text"
                    value={newPkgBadge}
                    onChange={(e) => setNewPkgBadge(e.target.value)}
                    placeholder="เช่น 🔥 แนะนำ"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>
              </div>

              {/* Package Image Field */}
              <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>รูปภาพแพ็กเกจ (Package Image / Icon)</span>
                  </label>
                  {newPkgImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewPkgImageUrl('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                    >
                      ลบรูปภาพออก
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {newPkgImageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border-2 border-cyan-400 shrink-0 shadow-md">
                      <img src={newPkgImageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-purple-600/60 bg-purple-950/40 shrink-0 flex flex-col items-center justify-center text-[10px] text-purple-300/60">
                      <ImageIcon className="w-5 h-5 mb-0.5 opacity-60" />
                      <span>ไม่มีรูป</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={newPkgImageInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPackageImage(file, false);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => newPkgImageInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-cyan-300 border border-violet-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปจากเครื่อง</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newPkgImageUrl}
                      onChange={(e) => setNewPkgImageUrl(e.target.value)}
                      placeholder="หรือวางลิงก์ URL รูปภาพ (https://...)"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b0e17] border border-purple-700/60 text-white text-xs outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-800/40 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPackageModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-950 text-purple-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
                >
                  เพิ่มแพ็กเกจเข้าเกม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW GAME */}
      {isAddGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#18113c] via-[#100a2a] to-[#0a061c] border-2 border-purple-600/60 p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setIsAddGameModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-purple-300 hover:text-white hover:bg-purple-900/60"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">เพิ่มเกมใหม่ในหน้าร้าน</h3>

            <form onSubmit={handleCreateGame} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  ชื่อเกม *
                </label>
                <input
                  type="text"
                  required
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="เช่น Black Myth: Wukong หรือ Apex Legends"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ค่ายเกม / Publisher
                  </label>
                  <input
                    type="text"
                    value={newGamePublisher}
                    onChange={(e) => setNewGamePublisher(e.target.value)}
                    placeholder="เช่น EA, Riot Games"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={newGameCategory}
                    onChange={(e) => setNewGameCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  >
                    <option value="MOBA">MOBA</option>
                    <option value="Battle Royale">Battle Royale</option>
                    <option value="RPG">RPG</option>
                    <option value="FPS">FPS</option>
                    <option value="Casual">Casual</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  คำอธิบายเกมสั้นๆ
                </label>
                <textarea
                  rows={2}
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  placeholder="บริการเติมเกมออนไลน์อัตโนมัติ รวดเร็ว ปลอดภัย"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ชื่อช่องกรอกไอดี
                  </label>
                  <input
                    type="text"
                    value={newGameAccountLabel}
                    onChange={(e) => setNewGameAccountLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    ตัวอย่างช่องกรอก
                  </label>
                  <input
                    type="text"
                    value={newGameAccountPlaceholder}
                    onChange={(e) => setNewGameAccountPlaceholder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>เรทของวันนี้ (แสดงที่การ์ดเกมหน้าร้าน)</span>
                </label>
                <input
                  type="text"
                  value={newGameTodayRate}
                  onChange={(e) => setNewGameTodayRate(e.target.value)}
                  placeholder="เช่น ฿45 หรือ เรท 0.85 (เว้นว่างไว้จะอิงราคาแพ็กเกจต่ำสุด)"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/80 border border-amber-500/40 text-white text-sm outline-none font-mono focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-purple-800/40 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGameModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-950 text-purple-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
                >
                  บันทึกเกมใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN PROGRESS & TIMELINE MANAGER (บันทึกความคืบหน้าระบบอัตโนมัติ) */}
      {activeProgressOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#141928] border-2 border-slate-700 p-6 sm:p-7 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto">
            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedOrderForProgress(null);
                setEditingTimelineStepIdx(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold border border-amber-400/40 shrink-0">
                <Sliders className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 inline-block mb-1">
                  หลังบ้านแอดมิน (Admin Control)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  กำหนดบันทึกความคืบหน้าระบบอัตโนมัติ
                </h3>
                <p className="text-xs text-slate-300 font-semibold">
                  รหัสคำสั่งซื้อ: <span className="font-mono text-amber-400">{activeProgressOrder.id}</span> | {activeProgressOrder.gameName} ({activeProgressOrder.packageName})
                </p>
              </div>
            </div>

            {/* Hidden file input for admin slip upload */}
            <input
              type="file"
              ref={adminSlipFileInputRef}
              onChange={handleAdminFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* ORDER SUMMARY STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0b0e17] border-2 border-slate-700/80 mb-6 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">UID ผู้เล่น:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {activeProgressOrder.playerUid}
                </span>
                {activeProgressOrder.playerNamePreview && (
                  <span className="text-[10px] text-slate-300 block">
                    ({activeProgressOrder.playerNamePreview})
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-bold block">ยอดเงิน:</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  ฿{activeProgressOrder.price.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">ช่องทางชำระ:</span>
                <span className="font-bold text-slate-200 capitalize">
                  {activeProgressOrder.paymentMethod}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">สถานะชำระเงิน:</span>
                <span
                  className={`font-black text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    activeProgressOrder.paymentStatus === 'paid' || !!activeProgressOrder.slipUrl
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeProgressOrder.paymentStatus === 'paid' || !!activeProgressOrder.slipUrl
                    ? '✅ ชำระเงินแล้ว'
                    : '💳 ยังไม่ชำระ'}
                </span>
              </div>
            </div>

            {/* SECTION 1: PRIMARY ORDER STATUS CONTROL */}
            <div className="mb-6 p-4 rounded-2xl bg-[#1b2234] border-2 border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. กำหนดสถานะคำสั่งซื้อหลัก (Primary Status)</span>
                </label>
                <span className="text-[10px] text-slate-400">คลิกเพื่อเปลี่ยนสถานะทันที</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'pending_payment', label: 'รอชำระเงิน', desc: 'ยังไม่จ่าย' },
                  { id: 'verifying', label: 'ชำระเงินแล้ว', desc: 'ตรวจสลิป' },
                  { id: 'processing', label: 'กำลังเติม', desc: 'ส่งไอเทม' },
                  { id: 'completed', label: 'เติมสำเร็จ', desc: 'จบงาน' },
                  { id: 'failed', label: 'ยกเลิก', desc: 'ไม่สำเร็จ' },
                ].map((st) => {
                  const isActive = activeProgressOrder.status === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        adminUpdateOrderStatus(
                          activeProgressOrder.id,
                          st.id as TopUpStatus,
                          `แอดมินกำหนดสถานะจากหลังบ้านเป็น "${st.label}"`
                        )
                      }
                      className={`p-2.5 rounded-xl text-center border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-400/20 scale-[1.02]'
                          : 'bg-[#141928] text-slate-200 border-slate-700 hover:border-slate-500 hover:bg-[#202b42]'
                      }`}
                    >
                      <span className="block text-xs font-black">{st.label}</span>
                      <span
                        className={`text-[9px] block font-semibold ${
                          isActive ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {st.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: SLIP MANAGEMENT */}
            <div className="mb-6 p-4 rounded-2xl bg-[#1b2234] border-2 border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>2. จัดการหลักฐานสลิปการโอนเงิน (Slip Verification)</span>
                </label>
                {activeProgressOrder.slipUrl ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> มีสลิปในระบบ
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-400">ยังไม่มีสลิป</span>
                )}
              </div>

              {activeProgressOrder.slipUrl ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-[#0b0e17] border border-slate-700">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div
                      onClick={() => setViewingAdminSlipUrl(activeProgressOrder.slipUrl || null)}
                      className="w-16 h-16 rounded-xl overflow-hidden bg-black border-2 border-amber-400 cursor-pointer shrink-0 relative group shadow-md"
                      title="คลิกเพื่อดูรูปสลิปขนาดเต็ม"
                    >
                      <img
                        src={activeProgressOrder.slipUrl}
                        alt="สลิปโอนเงิน"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">
                        สลิปยอด ฿{activeProgressOrder.price.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-emerald-300 font-semibold">
                        ✅ ระบบปรับสถานะเป็น &quot;ชำระเงินแล้ว&quot; เมื่อมีสลิป
                      </p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        คลิกที่รูปเพื่อเปิดดูภาพขนาดเต็ม
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setViewingAdminSlipUrl(activeProgressOrder.slipUrl || null)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#1e273d] hover:bg-[#283552] text-amber-400 text-xs font-bold border border-slate-600 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูภาพเต็ม</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => adminSlipFileInputRef.current?.click()}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-600 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>เปลี่ยนสลิป</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-300">
                    ลูกค้ายังไม่ได้แนบสลิป แอดมินสามารถแนบสลิปแทนเพื่อบันทึกเป็น &quot;ชำระเงินแล้ว&quot; ได้ทันที
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => adminSlipFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>อัปโหลดสลิปแทน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleSlip =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%231e293b"/><text x="150" y="50" fill="%2310b981" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">โอนเงินสำเร็จ</text><text x="150" y="90" fill="%23ffffff" font-size="24" font-family="sans-serif" font-weight="bold" text-anchor="middle">฿' +
                          activeProgressOrder.price +
                          '</text><text x="30" y="150" fill="%2394a3b8" font-size="12" font-family="sans-serif">รหัสคำสั่งซื้อ:</text><text x="30" y="175" fill="%23f59e0b" font-size="14" font-family="sans-serif" font-weight="bold">' +
                          activeProgressOrder.id +
                          '</text><text x="30" y="215" fill="%2394a3b8" font-size="12" font-family="sans-serif">เกม:</text><text x="30" y="240" fill="%23ffffff" font-size="14" font-family="sans-serif" font-weight="bold">' +
                          activeProgressOrder.gameName +
                          '</text><text x="30" y="280" fill="%2394a3b8" font-size="12" font-family="sans-serif">เวลาที่โอน:</text><text x="30" y="305" fill="%23ffffff" font-size="14" font-family="sans-serif">' +
                          new Date().toLocaleTimeString('th-TH') +
                          '</text></svg>';
                        adminUploadSlip(activeProgressOrder.id, sampleSlip);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#1e273d] hover:bg-[#283552] text-slate-200 text-xs font-bold border border-slate-600 cursor-pointer"
                    >
                      สลิปตัวอย่าง
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: PROOF OF DELIVERY (ภาพหลักฐานก่อนส่ง & หลังส่ง) */}
            <div className="mb-6 p-4 rounded-2xl bg-[#1b2234] border-2 border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>ภาพหลักฐานการจัดส่งสินค้า (ก่อนส่ง & หลังส่ง)</span>
                </label>
                <button
                  type="button"
                  onClick={() => openDeliveryProofModal(activeProgressOrder)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>อัปโหลด / แก้ไขภาพหลักฐาน</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pre-delivery preview */}
                <div className="p-3 rounded-xl bg-[#0b0e17] border border-slate-700 flex items-center gap-3">
                  {activeProgressOrder.preDeliveryImageUrl ? (
                    <div
                      onClick={() => setViewingAdminSlipUrl(activeProgressOrder.preDeliveryImageUrl || null)}
                      className="w-14 h-14 rounded-lg overflow-hidden bg-black border border-amber-400/50 cursor-pointer shrink-0 shadow-sm"
                      title="คลิกเพื่อดูขยาย"
                    >
                      <img src={activeProgressOrder.preDeliveryImageUrl} alt="ก่อนส่ง" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-[10px] text-center font-bold shrink-0">
                      ไม่มีรูป
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">1. ภาพก่อนส่ง (Pre-delivery)</span>
                    <span className="text-[11px] text-slate-400">
                      {activeProgressOrder.preDeliveryImageUrl ? '✅ แนบรูปแล้ว' : 'ยังไม่ได้แนบ'}
                    </span>
                  </div>
                </div>

                {/* Post-delivery preview */}
                <div className="p-3 rounded-xl bg-[#0b0e17] border border-slate-700 flex items-center gap-3">
                  {activeProgressOrder.postDeliveryImageUrl ? (
                    <div
                      onClick={() => setViewingAdminSlipUrl(activeProgressOrder.postDeliveryImageUrl || null)}
                      className="w-14 h-14 rounded-lg overflow-hidden bg-black border border-cyan-400/50 cursor-pointer shrink-0 shadow-sm"
                      title="คลิกเพื่อดูขยาย"
                    >
                      <img src={activeProgressOrder.postDeliveryImageUrl} alt="หลังส่ง" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-[10px] text-center font-bold shrink-0">
                      ไม่มีรูป
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">2. ภาพหลังส่ง (Post-delivery)</span>
                    <span className="text-[11px] text-slate-400">
                      {activeProgressOrder.postDeliveryImageUrl ? '✅ แนบรูปแล้ว' : 'ยังไม่ได้แนบ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: LIVE TIMELINE STEPS MANAGEMENT (บันทึกความคืบหน้าระบบอัตโนมัติ) */}
            <div className="mb-6 p-4 rounded-2xl bg-[#1b2234] border-2 border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>3. รายการขั้นตอนใน &quot;บันทึกความคืบหน้าระบบอัตโนมัติ&quot; ({activeProgressOrder.timeline.length} ขั้นตอน)</span>
                </label>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {activeProgressOrder.timeline.map((step, idx) => {
                  const isEditing = editingTimelineStepIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0b0e17] border border-slate-700/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingTimelineDesc}
                                onChange={(e) => setEditingTimelineDesc(e.target.value)}
                                className="flex-1 px-3 py-1 rounded bg-[#141928] border border-amber-400 text-white text-xs outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingTimelineDesc.trim()) {
                                    adminUpdateTimelineStep(activeProgressOrder.id, idx, {
                                      status: step.status,
                                      description: editingTimelineDesc.trim(),
                                    });
                                  }
                                  setEditingTimelineStepIdx(null);
                                }}
                                className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-xs"
                              >
                                บันทึก
                              </button>
                            </div>
                          ) : (
                            <p className="font-bold text-white leading-relaxed">{step.description}</p>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              เวลา: {step.time}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                step.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : step.status === 'processing'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {step.status}
                            </span>
                            {step.actor && (
                              <span className="text-[9px] font-bold text-purple-300 bg-purple-900/40 px-1.5 py-0.2 rounded border border-purple-700/50">
                                {step.actor === 'customer'
                                  ? 'ลูกค้าแนบสลิป'
                                  : step.actor === 'admin'
                                  ? 'แอดมินหลังบ้าน'
                                  : 'ระบบอัตโนมัติ'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTimelineStepIdx(idx);
                            setEditingTimelineDesc(step.description);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="แก้ไขข้อความ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {activeProgressOrder.timeline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => adminDeleteTimelineStep(activeProgressOrder.id, idx)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60 transition-colors"
                            title="ลบขั้นตอนนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: ADD NEW TIMELINE STEP */}
            <div className="mb-6 p-4 rounded-2xl bg-[#1b2234] border-2 border-slate-700 space-y-3">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>4. เพิ่มขั้นตอนความคืบหน้าใหม่ (Add Custom Step)</span>
              </label>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  เทมเพลตด่วน (คลิกเพื่อเลือกข้อความ):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '✅ แอดมินตรวจสอบยอดเงินและสลิปถูกต้องแล้ว',
                    '⚡ เริ่มส่งเหรียญและไอเทมเข้า UID ของผู้เล่น',
                    '⏳ ระบบเกมกำลังประมวลผลคำสั่งซื้อ กรุณารอสักครู่',
                    '📞 ประสานงานข้อมูลตัวละครกับลูกค้าเรียบร้อย',
                    '🎉 เติมเหรียญ/แพ็กเกจเข้าเกมสำเร็จ ขอให้สนุกกับการเล่น!',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewTimelineDesc(tpl)}
                      className="px-2.5 py-1 rounded-lg bg-[#141928] hover:bg-[#202a42] text-[11px] font-bold text-slate-300 hover:text-amber-400 border border-slate-700 transition-all text-left cursor-pointer"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAdminAddTimelineStep} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      สถานะขั้นตอน
                    </label>
                    <select
                      value={newTimelineStatus}
                      onChange={(e) => setNewTimelineStatus(e.target.value as TopUpStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0b0e17] border border-slate-700 text-white font-bold text-xs outline-none"
                    >
                      <option value="pending_payment">รอชำระเงิน</option>
                      <option value="verifying">ชำระเงินแล้ว / ตรวจสลิป</option>
                      <option value="processing">กำลังเติมเข้าเกม</option>
                      <option value="completed">เติมสำเร็จ</option>
                      <option value="failed">ยกเลิก</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ข้อความระบุความคืบหน้า *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTimelineDesc}
                      onChange={(e) => setNewTimelineDesc(e.target.value)}
                      placeholder="เช่น แอดมินตรวจสอบสลิปแล้ว กำลังจัดส่งเหรียญเข้าเกม..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0b0e17] border border-slate-700 focus:border-amber-400 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>บันทึกขั้นตอนใหม่ลงไทม์ไลน์</span>
                  </button>
                </div>
              </form>
            </div>

            {/* AUTOMATION NOTICE */}
            <div className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-700 text-xs text-slate-300 space-y-1 mb-5">
              <span className="font-extrabold text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ระบบอัตโนมัติเปิดใช้งาน (Automation Active)</span>
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                เมื่อลูกค้าชำระเงินและแนบสลิปผ่านหน้าเว็บ ระบบจะปรับสถานะของคำสั่งซื้อเป็น <strong className="text-emerald-400">&quot;ชำระเงินแล้ว&quot;</strong> อัตโนมัติทันที โดยแอดมินสามารถเข้ามาปรับแก้หรือกำหนดขั้นตอนความคืบหน้าตรงนี้ได้ตลอดเวลา
              </p>
            </div>

            {/* Modal Bottom Close */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForProgress(null);
                  setEditingTimelineStepIdx(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-400/20"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR ADMIN VIEWING SLIP */}
      {viewingAdminSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-xl w-full bg-[#141928] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setViewingAdminSlipUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-black text-white">หลักฐานสลิปการโอนเงิน (ตรวจสอบหลังบ้าน)</h4>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700 max-h-[70vh]">
              <img
                src={viewingAdminSlipUrl}
                alt="สลิปโอนเงิน"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-emerald-400 font-bold">
                ✓ ลูกค้าแนบสลิปเรียบร้อยแล้ว
              </span>
              <button
                type="button"
                onClick={() => setViewingAdminSlipUrl(null)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY PROOF MANAGEMENT MODAL (PRE-DELIVERY & POST-DELIVERY) */}
      {deliveryProofModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative max-w-3xl w-full bg-[#131826] border-2 border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setDeliveryProofModalOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Camera className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 inline-block mb-1">
                  PROOF OF DELIVERY (หลักฐานการจัดส่ง)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  อัปโหลดหลักฐานการจัดส่งสินค้า (ก่อนส่ง & หลังส่ง)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  คำสั่งซื้อ: <span className="font-mono text-amber-400 font-bold">{deliveryProofModalOrder.id}</span> | {deliveryProofModalOrder.gameName} ({deliveryProofModalOrder.packageName}) | UID: <span className="font-mono text-emerald-400 font-bold">{deliveryProofModalOrder.playerUid}</span>
                </p>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={preDeliveryFileInputRef}
              onChange={handlePreDeliveryFileUpload}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={postDeliveryFileInputRef}
              onChange={handlePostDeliveryFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* 2 Column Image Upload Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* SLOT 1: PRE-DELIVERY */}
              <div className="p-4 rounded-2xl bg-[#0b0e17] border-2 border-slate-700/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. ภาพจำนวนของก่อนส่ง (Pre-delivery)</span>
                  </span>
                  {preDeliveryImg ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แนบแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">ยังไม่แนบ</span>
                  )}
                </div>

                {preDeliveryImg ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => setViewingProofFullscreen({ url: preDeliveryImg, title: `ภาพก่อนส่ง (Pre-delivery) - ออเดอร์ ${deliveryProofModalOrder.id}` })}
                      className="relative w-full h-48 rounded-xl overflow-hidden bg-black border border-amber-400/40 cursor-pointer group shadow-inner flex items-center justify-center"
                    >
                      <img
                        src={preDeliveryImg}
                        alt="ภาพก่อนส่ง"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                        <span className="text-xs font-bold text-white">คลิกเพื่อดูขยาย</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => preDeliveryFileInputRef.current?.click()}
                        className="flex-1 py-2 rounded-xl bg-[#1e273d] hover:bg-[#283552] text-xs font-bold text-cyan-300 border border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>เปลี่ยนรูปก่อนส่ง</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreDeliveryImg('')}
                        className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-xs font-bold text-rose-300 border border-rose-600/40 cursor-pointer"
                        title="ลบรูป"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() => preDeliveryFileInputRef.current?.click()}
                      className="w-full h-48 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-[#121624] flex flex-col items-center justify-center p-4 cursor-pointer transition-colors group"
                    >
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                        คลิกเพื่ออัปโหลดภาพก่อนส่ง
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        รองรับไฟล์ JPG, PNG (เช่น แคปภาพเหรียญเดิมก่อนเติม)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const samplePre = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="50" fill="%23f59e0b" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">ภาพก่อนส่ง (Pre-delivery)</text><text x="200" y="90" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">UID: ${deliveryProofModalOrder.playerUid}</text><rect x="50" y="130" width="300" height="80" rx="12" fill="%231e293b" stroke="%23334155"/><text x="200" y="175" fill="%23ffffff" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">ยอดเหรียญเดิม: 0 เหรียญ</text><text x="200" y="260" fill="%2364748b" font-size="12" font-family="sans-serif" text-anchor="middle">${deliveryProofModalOrder.gameName}</text></svg>`;
                        setPreDeliveryImg(samplePre);
                      }}
                      className="w-full py-1.5 rounded-lg bg-[#1e273d] hover:bg-[#283552] text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                    >
                      + ใช้รูปตัวอย่างก่อนส่ง
                    </button>
                  </div>
                )}
              </div>

              {/* SLOT 2: POST-DELIVERY */}
              <div className="p-4 rounded-2xl bg-[#0b0e17] border-2 border-slate-700/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. ภาพจำนวนของหลังส่ง (Post-delivery)</span>
                  </span>
                  {postDeliveryImg ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แนบแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">ยังไม่แนบ</span>
                  )}
                </div>

                {postDeliveryImg ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => setViewingProofFullscreen({ url: postDeliveryImg, title: `ภาพหลังส่ง (Post-delivery) - ออเดอร์ ${deliveryProofModalOrder.id}` })}
                      className="relative w-full h-48 rounded-xl overflow-hidden bg-black border border-cyan-400/40 cursor-pointer group shadow-inner flex items-center justify-center"
                    >
                      <img
                        src={postDeliveryImg}
                        alt="ภาพหลังส่ง"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                        <span className="text-xs font-bold text-white">คลิกเพื่อดูขยาย</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => postDeliveryFileInputRef.current?.click()}
                        className="flex-1 py-2 rounded-xl bg-[#1e273d] hover:bg-[#283552] text-xs font-bold text-cyan-300 border border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>เปลี่ยนรูปหลังส่ง</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostDeliveryImg('')}
                        className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-xs font-bold text-rose-300 border border-rose-600/40 cursor-pointer"
                        title="ลบรูป"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() => postDeliveryFileInputRef.current?.click()}
                      className="w-full h-48 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-400/60 bg-[#121624] flex flex-col items-center justify-center p-4 cursor-pointer transition-colors group"
                    >
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                        คลิกเพื่ออัปโหลดภาพหลังส่ง
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        รองรับไฟล์ JPG, PNG (เช่น แคปภาพเหรียญหลังส่งมอบ)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const samplePost = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23064e3b"/><text x="200" y="50" fill="%2334d399" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">ภาพหลังส่ง (Post-delivery)</text><text x="200" y="90" fill="%23a7f3d0" font-size="14" font-family="sans-serif" text-anchor="middle">UID: ${deliveryProofModalOrder.playerUid}</text><rect x="50" y="130" width="300" height="80" rx="12" fill="%23022c22" stroke="%23059669"/><text x="200" y="175" fill="%23ffffff" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">ยอดเหรียญใหม่: +${deliveryProofModalOrder.itemAmount.toLocaleString()} เหรียญ สำเร็จ!</text><text x="200" y="260" fill="%236ee7b7" font-size="12" font-family="sans-serif" text-anchor="middle">${deliveryProofModalOrder.packageName}</text></svg>`;
                        setPostDeliveryImg(samplePost);
                      }}
                      className="w-full py-1.5 rounded-lg bg-[#1e273d] hover:bg-[#283552] text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                    >
                      + ใช้รูปตัวอย่างหลังส่ง
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setDeliveryProofModalOrder(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveDeliveryProof(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกรูปหลักฐาน</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveDeliveryProof(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>บันทึก & ปรับเป็น &quot;ส่งสำเร็จเเล้ว&quot;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX FOR DELIVERY PROOF */}
      {viewingProofFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-[#141928] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setViewingProofFullscreen(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-cyan-400" />
              <h4 className="text-base font-black text-white">{viewingProofFullscreen.title}</h4>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700 max-h-[75vh]">
              <img
                src={viewingProofFullscreen.url}
                alt="รูปภาพขยาย"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProofFullscreen(null)}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
