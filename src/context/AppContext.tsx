import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Game,
  GamePackage,
  CartItem,
  TopUpOrder,
  TopUpTimeline,
  AdminCredentials,
  PaymentMethod,
  TopUpStatus,
  ActiveTab,
  Dealer,
  WebhookConfig,
  CustomerUser,
} from '../types';
import {
  INITIAL_GAMES,
  INITIAL_TOPUP_ORDERS,
  DEFAULT_ADMIN,
  INITIAL_DEALERS,
  DEFAULT_WEBHOOK_CONFIG,
  INITIAL_CUSTOMER_USERS,
} from '../data/mockData';
import { pushOrderToGoogleSheets } from '../services/googleSheets';

interface AppContextType {
  games: Game[];
  orders: TopUpOrder[];
  dealers: Dealer[];
  webhookConfig: WebhookConfig;
  cart: CartItem[];
  isCartOpen: boolean;
  selectedGame: Game | null;
  selectedPackage: GamePackage | null;
  activeTab: ActiveTab;
  isAdminLoggedIn: boolean;
  adminCredentials: AdminCredentials;
  isPaymentModalOpen: boolean;
  currentOrderForPayment: TopUpOrder | null;
  setCurrentOrderForPayment: (order: TopUpOrder | null) => void;
  isOrderSuccessModalOpen: boolean;
  lastCompletedOrder: TopUpOrder | null;
  isAdminLoginModalOpen: boolean;
  isTopupModalOpen: boolean;
  notification: { type: 'success' | 'info' | 'error'; message: string } | null;

  // Navigation & Game Selection
  setSelectedGame: (game: Game | null) => void;
  setSelectedPackage: (pkg: GamePackage | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  setIsOrderSuccessModalOpen: (open: boolean) => void;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  setIsTopupModalOpen: (open: boolean) => void;
  setNotification: (notif: { type: 'success' | 'info' | 'error'; message: string } | null) => void;

  // Cart Management
  addToCart: (itemData: {
    game: Game;
    pkg: GamePackage;
    quantity: number;
    playerUid: string;
    serverId?: string;
    zoneId?: string;
    playerNamePreview?: string;
  }) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  checkoutCart: (checkoutData: {
    contactPhone?: string;
    contactEmail?: string;
    paymentMethod: PaymentMethod;
  }) => TopUpOrder | null;

  // Stock Order Direct
  createTopUpOrder: (orderData: {
    game: Game;
    pkg: GamePackage;
    quantity?: number;
    playerUid: string;
    serverId?: string;
    zoneId?: string;
    playerNamePreview?: string;
    contactPhone?: string;
    contactEmail?: string;
    paymentMethod: PaymentMethod;
  }) => TopUpOrder;

  confirmPayment: (orderId: string, slipUrl?: string) => void;
  simulateUidCheck: (gameId: string, uid: string, serverId?: string, zoneId?: string) => {
    valid: boolean;
    nickname: string;
    level: number;
    avatarUrl?: string;
  };

  // Admin Actions (Strictly for single admin user)
  adminLogin: (username: string, passcode: string) => boolean;
  adminLogout: () => void;
  updateAdminPasscode: (newPasscode: string) => boolean;

  // Price & Package Management (แอดมินแก้ไขราคาได้ตลอดเวลา)
  updatePackagePrice: (
    gameId: string,
    packageId: string,
    updates: Partial<Omit<GamePackage, 'id'>>
  ) => void;
  addPackageToGame: (
    gameId: string,
    pkg: Omit<GamePackage, 'id'>
  ) => void;
  deletePackage: (gameId: string, packageId: string) => void;

  // Game Management
  addNewGame: (game: Omit<Game, 'id'>) => void;
  updateGame: (gameId: string, updates: Partial<Game>) => void;
  updateGameImage: (gameId: string, imageUrl: string) => void;
  setGameDefaultThumbnail: (gameId: string, versionId: string) => void;
  addGameImageVersion: (gameId: string, url: string, versionName?: string, setAsDefault?: boolean) => void;
  deleteGameImageVersion: (gameId: string, versionId: string) => void;
  deleteGame: (gameId: string) => void;

  // Dealer Management (จัดการดีลเลอร์และเปิด/ปิดการเข้าถึง)
  addDealer: (dealer: Omit<Dealer, 'id' | 'totalOrders' | 'totalSpent' | 'joinedAt'>) => void;
  updateDealerStatus: (dealerId: string, status: Dealer['status']) => void;
  updateDealerTier: (dealerId: string, tier: Dealer['tier'], discountPercent: number) => void;
  deleteDealer: (dealerId: string) => void;

  // Webhook & Line Notify
  updateWebhookConfig: (updates: Partial<WebhookConfig>) => void;
  testWebhook: () => { success: boolean; message: string };

  // Order Fulfillment & Timeline Management (แอดมินกำหนดจากหลังบ้านได้)
  adminUpdateOrderStatus: (
    orderId: string,
    newStatus: TopUpStatus,
    note?: string,
    customStatusText?: string
  ) => void;
  adminAddTimelineStep: (
    orderId: string,
    step: { status: TopUpStatus; description: string; time?: string }
  ) => void;
  adminDeleteTimelineStep: (orderId: string, stepIndex: number) => void;
  adminUpdateTimelineStep: (
    orderId: string,
    stepIndex: number,
    updated: { status: TopUpStatus; description: string; time?: string }
  ) => void;
  adminQuickSetPaid: (orderId: string, note?: string) => void;
  adminUploadSlip: (orderId: string, slipUrl: string) => void;
  attachSlipAndMarkPaid: (orderId: string, slipUrl: string) => void;
  resetAllData: () => void;

  // Customer User Management (Admin Only Registration)
  customerUsers: CustomerUser[];
  currentCustomerUser: CustomerUser | null;
  addCustomerUser: (user: Omit<CustomerUser, 'id' | 'createdAt' | 'createdBy'>) => CustomerUser;
  updateCustomerUser: (id: string, updates: Partial<CustomerUser>) => void;
  deleteCustomerUser: (id: string) => void;
  adjustCustomerBalance: (id: string, amount: number, note?: string) => void;
  customerLogin: (username: string, passcode: string) => boolean;
  customerLogout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_GAMES = 'gamepay_games_v2';
const LOCAL_STORAGE_ORDERS = 'gamepay_orders_v2';
const LOCAL_STORAGE_DEALERS = 'gamepay_dealers_v2';
const LOCAL_STORAGE_WEBHOOK = 'gamepay_webhook_v2';
const LOCAL_STORAGE_CART = 'gamepay_cart_v2';
const LOCAL_STORAGE_ADMIN_CRED = 'gamepay_admin_cred_v2';
const LOCAL_STORAGE_ADMIN_AUTH = 'gamepay_admin_auth_v2';
const LOCAL_STORAGE_CUSTOMER_USERS = 'efcpa_customer_users_v2';
const LOCAL_STORAGE_CURRENT_CUSTOMER = 'efcpa_current_customer_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load Games
  const [games, setGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GAMES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep only games that are part of INITIAL_GAMES (filter out any old unsold games)
          const validIds = new Set(INITIAL_GAMES.map((ig) => ig.id));
          const filtered = parsed.filter((pg: Game) => validIds.has(pg.id));
          if (filtered.length > 0) {
            return filtered.map((pg: Game) => {
              const initG = INITIAL_GAMES.find((ig) => ig.id === pg.id);
              return initG ? { ...pg, thaiName: initG.thaiName, aliases: initG.aliases } : pg;
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to load games from localStorage', e);
    }
    return INITIAL_GAMES;
  });

  // Load Orders
  const [orders, setOrders] = useState<TopUpOrder[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
    }
    return INITIAL_TOPUP_ORDERS;
  });

  // Load Dealers
  const [dealers, setDealers] = useState<Dealer[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DEALERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load dealers from localStorage', e);
    }
    return INITIAL_DEALERS;
  });

  // Load Webhook Configuration
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_WEBHOOK);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load webhookConfig from localStorage', e);
    }
    return DEFAULT_WEBHOOK_CONFIG;
  });

  // Load Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load cart', e);
    }
    return [];
  });

  // Load Customer Users (Admin-Created Only)
  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOMER_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load customerUsers', e);
    }
    return INITIAL_CUSTOMER_USERS;
  });

  const [currentCustomerUser, setCurrentCustomerUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CURRENT_CUSTOMER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load currentCustomerUser', e);
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(customerUsers));
    } catch (e) {
      console.error('Failed to save customerUsers', e);
    }
  }, [customerUsers]);

  useEffect(() => {
    try {
      if (currentCustomerUser) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_CUSTOMER, JSON.stringify(currentCustomerUser));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_CURRENT_CUSTOMER);
      }
    } catch (e) {
      console.error('Failed to save currentCustomerUser', e);
    }
  }, [currentCustomerUser]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load Admin Credentials
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ADMIN_CRED);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load admin credentials', e);
    }
    return DEFAULT_ADMIN;
  });

  // Load Admin Auth Session
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('store');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentOrderForPayment, setCurrentOrderForPayment] = useState<TopUpOrder | null>(null);

  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<TopUpOrder | null>(null);

  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(games));
    } catch (e) {
      console.error('Error saving games', e);
    }
  }, [games]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DEALERS, JSON.stringify(dealers));
    } catch (e) {
      console.error('Error saving dealers', e);
    }
  }, [dealers]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_WEBHOOK, JSON.stringify(webhookConfig));
    } catch (e) {
      console.error('Error saving webhookConfig', e);
    }
  }, [webhookConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_CRED, JSON.stringify(adminCredentials));
    } catch (e) {
      console.error('Error saving admin cred', e);
    }
  }, [adminCredentials]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_AUTH, isAdminLoggedIn ? 'true' : 'false');
    } catch (e) {
      console.error('Error saving admin auth', e);
    }
  }, [isAdminLoggedIn]);

  // Keep selectedGame synced with any updates (like price edits)
  useEffect(() => {
    if (selectedGame) {
      const updated = games.find((g) => g.id === selectedGame.id);
      if (updated) {
        setSelectedGame(updated);
      }
    }
  }, [games]);

  // Auto clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto check for URL orderId
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlOrderId = params.get('orderId');
      if (urlOrderId) {
        const found = orders.find((o) => o.id === urlOrderId);
        if (found) {
          setCurrentOrderForPayment(found);
          setIsPaymentModalOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // CART MANAGEMENT
  const addToCart = ({
    game,
    pkg,
    quantity,
    playerUid,
    serverId,
    zoneId,
    playerNamePreview,
  }: {
    game: Game;
    pkg: GamePackage;
    quantity: number;
    playerUid: string;
    serverId?: string;
    zoneId?: string;
    playerNamePreview?: string;
  }) => {
    const qty = Math.max(1, quantity);
    const existingIndex = cart.findIndex(
      (item) =>
        item.gameId === game.id &&
        item.packageId === pkg.id &&
        item.playerUid === playerUid &&
        (item.serverId || '') === (serverId || '')
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        gameId: game.id,
        gameName: game.name,
        packageId: pkg.id,
        packageName: pkg.name,
        inGameItem: pkg.inGameItem,
        itemAmount: pkg.amount,
        bonusAmount: pkg.bonusAmount,
        originalPrice: pkg.originalPrice,
        unitPrice: pkg.price,
        quantity: qty,
        playerUid,
        serverId,
        zoneId,
        playerNamePreview,
      };
      setCart((prev) => [newItem, ...prev]);
    }

    setNotification({
      type: 'success',
      message: `เพิ่ม "${pkg.name}" จำนวน ${qty} รายการ ลงในตะกร้าแล้ว`,
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    setNotification({
      type: 'info',
      message: 'นำรายการออกจากตะกร้าแล้ว',
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // CHECKOUT CART (MULTI-ITEM ORDER)
  const checkoutCart = ({
    contactPhone = '',
    contactEmail,
    paymentMethod,
  }: {
    contactPhone?: string;
    contactEmail?: string;
    paymentMethod: PaymentMethod;
  }): TopUpOrder | null => {
    if (cart.length === 0) return null;

    const timestamp = new Date();
    const orderId = `GP-${Math.floor(100000 + Math.random() * 900000)}`;

    const totalPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalOriginalPrice = cart.reduce(
      (sum, item) => sum + item.originalPrice * item.quantity,
      0
    );

    // Primary summary for order list
    const primaryItem = cart[0];
    const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const newOrder: TopUpOrder = {
      id: orderId,
      gameId: primaryItem.gameId,
      gameName:
        cart.length === 1
          ? primaryItem.gameName
          : `${primaryItem.gameName} และอื่นๆ (${cart.length} รายการ)`,
      packageId: primaryItem.packageId,
      packageName:
        cart.length === 1
          ? `${primaryItem.packageName} x${primaryItem.quantity}`
          : `${primaryItem.packageName} และอีก ${cart.length - 1} แพ็กเกจ (รวม ${totalItemsCount} รายการ)`,
      inGameItem: primaryItem.inGameItem,
      itemAmount: primaryItem.itemAmount,
      bonusAmount: primaryItem.bonusAmount,
      playerUid:
        cart.length === 1
          ? primaryItem.playerUid
          : cart.map((i) => `${i.gameName}: ${i.playerUid}`).join(' | '),
      serverId: primaryItem.serverId,
      zoneId: primaryItem.zoneId,
      playerNamePreview: primaryItem.playerNamePreview,
      items: [...cart],
      quantity: totalItemsCount,
      originalPrice: totalOriginalPrice,
      price: totalPrice,
      contactPhone,
      contactEmail,
      paymentMethod,
      paymentStatus: 'unpaid',
      status: 'pending_payment',
      timeline: [
        {
          status: 'pending_payment',
          time: timestamp.toLocaleTimeString('th-TH'),
          description: `สร้างคำสั่งซื้อจากตะกร้า (${totalItemsCount} รายการ) รหัส ${orderId}`,
        },
      ],
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setIsCartOpen(false);
    setCurrentOrderForPayment(newOrder);
    setIsPaymentModalOpen(true);
    pushOrderToGoogleSheets(newOrder).catch(() => null);
    return newOrder;
  };

  // Simulate Player UID Validation & Preview
  const simulateUidCheck = (
    gameId: string,
    uid: string,
    serverId?: string,
    zoneId?: string
  ) => {
    const cleanUid = uid.trim();
    if (!cleanUid || cleanUid.length < 3) {
      return { valid: false, nickname: '', level: 0 };
    }

    const mockNames: Record<string, string[]> = {
      efootball: ['⚽Messi_GOAT_TH', '⚽CR7_Strike', '⚽Haaland_King', '⚽Neymar_Magic'],
      lastwar: ['🛡️Commander_Thai', '🛡️WarLord_99', '🛡️IronBase_TH', '🛡️ApexSurvivor'],
      summonerswar: ['🔮Archangel_User', '🔮Lushen_God', '🔮DragonKnight_TH', '🔮SummonerPro'],
      fcmobile: ['Messi_GOAT_TH', 'CR7_Madrid', 'Haaland_City_9', 'Mbappe_Speed_TH'],
      callofduty: ['🎯Ghost_Sniper_TH', '🎯M4_LaserBeam', '🎯Legendary_Shooter', '🎯ShadowOps_TH'],
      genshin: ['Traveler_Aether', 'HuTao_Main_TH', 'Furina_FanClub', 'Zhongli_Shield', 'Raiden_Shogun'],
      hsr: ['Trailblazer_Stelle', 'Kafka_Lover', 'Firefly_BestGirl', 'DanHeng_IL', 'Acheron_Void'],
      zzz: ['⚡Ellen_Joe_TH', '⚡ZhuYuan_Enforcer', '⚡JaneDoe_Agent', '⚡Proxy_Master'],
      wutheringwaves: ['🌊Rover_Spectro', '🌊Jiyan_Dragon', '🌊Changli_Fire', '🌊Yinlin_Thunder'],
      pokemongo: ['🔴Ash_ThaiTrainer', '🔴Pikachu_Lover', '🔴RaidBoss_Hunter', '🔴MasterBall_TH'],
      pokemontcg: ['🃏Charizard_Collector', '🃏Mewtwo_EX', '🃏Pikachu_Gold', '🃏TCG_Champion_TH'],
    };

    const names = mockNames[gameId] || ['Player_' + cleanUid.slice(-4)];
    const hash = cleanUid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedNick = names[hash % names.length];
    const level = 20 + (hash % 60);

    return {
      valid: true,
      nickname: selectedNick,
      level,
    };
  };

  // Create Direct Top-Up Order
  const createTopUpOrder = ({
    game,
    pkg,
    quantity = 1,
    playerUid,
    serverId,
    zoneId,
    playerNamePreview,
    contactPhone = '',
    contactEmail,
    paymentMethod,
  }: {
    game: Game;
    pkg: GamePackage;
    quantity?: number;
    playerUid: string;
    serverId?: string;
    zoneId?: string;
    playerNamePreview?: string;
    contactPhone?: string;
    contactEmail?: string;
    paymentMethod: PaymentMethod;
  }): TopUpOrder => {
    const timestamp = new Date();
    const orderId = `GP-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalPrice = pkg.price * quantity;
    const finalOriginalPrice = pkg.originalPrice * quantity;

    const newOrder: TopUpOrder = {
      id: orderId,
      gameId: game.id,
      gameName: game.name,
      packageId: pkg.id,
      packageName: quantity > 1 ? `${pkg.name} (x${quantity})` : pkg.name,
      inGameItem: pkg.inGameItem,
      itemAmount: pkg.amount * quantity,
      bonusAmount: pkg.bonusAmount ? pkg.bonusAmount * quantity : undefined,
      playerUid: playerUid.trim(),
      serverId,
      zoneId,
      playerNamePreview: playerNamePreview || `Player_${playerUid.slice(-4)}`,
      quantity,
      originalPrice: finalOriginalPrice,
      price: finalPrice,
      contactPhone: contactPhone || '-',
      contactEmail,
      paymentMethod,
      paymentStatus: 'unpaid',
      status: 'pending_payment',
      timeline: [
        {
          status: 'pending_payment',
          time: timestamp.toLocaleTimeString('th-TH'),
          description: `สร้างคำสั่งซื้อสต็อกสำเร็จ รหัส ${orderId} (${pkg.name} x${quantity})`,
        },
      ],
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrderForPayment(newOrder);
    setIsPaymentModalOpen(true);
    pushOrderToGoogleSheets(newOrder).catch(() => null);
    return newOrder;
  };

  // Helper trigger Webhook Line Notify
  const triggerWebhookAlert = (order: TopUpOrder, eventType: 'paid' | 'delivered') => {
    if (!webhookConfig.enabled) return;
    const timeStr = new Date().toLocaleTimeString('th-TH');
    const eventName = eventType === 'paid' ? '💰 ชำระเงินเรียบร้อยแล้ว' : '🚀 จัดส่งสต็อกสินค้าสำเร็จแล้ว';
    const logMsg = `[Line Notify Webhook] ส่งการแจ้งเตือนสำเร็จ: ${order.id} | ${order.gameName} - ${order.packageName} (฿${order.price.toLocaleString()}) [${eventName}] เวลา ${timeStr}`;
    setWebhookConfig((prev) => ({
      ...prev,
      lastTestedAt: `${new Date().toLocaleDateString('th-TH')} ${timeStr}`,
      lastTestStatus: 'success',
      lastLog: logMsg,
    }));
  };

  // เมื่อลูกค้าแนบสลิปแล้ว ให้ขึ้นสถานะชำระเงินได้แล้วเลยทันที!
  const attachSlipAndMarkPaid = (orderId: string, slipUrl: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH');

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        // Check if a paid step is already present
        const hasPaidStep = order.timeline.some(
          (t) => t.description.includes('ชำระเงินเรียบร้อยแล้ว') || t.description.includes('สลิป')
        );

        const newTimelineStep: TopUpTimeline = {
          id: `step_${Date.now()}`,
          status: 'verifying' as TopUpStatus,
          time: timeStr,
          description: `✅ ชำระเงินเรียบร้อยแล้ว (แนบสลิปการโอน ยอด ฿${order.price.toLocaleString()} สำเร็จ - ระบบเริ่มจัดส่งสต็อกผ่านเซิร์ฟเวอร์)`,
        };

        const updatedTimeline = hasPaidStep
          ? order.timeline.map((t, i) => (i === order.timeline.length - 1 ? newTimelineStep : t))
          : [...order.timeline, newTimelineStep];

        const updatedOrder: TopUpOrder = {
          ...order,
          paymentStatus: 'paid',
          slipUrl,
          status: 'verifying',
          timeline: updatedTimeline,
          updatedAt: now.toISOString(),
        };

        if (currentOrderForPayment?.id === orderId) {
          setCurrentOrderForPayment(updatedOrder);
        }

        triggerWebhookAlert(updatedOrder, 'paid');
        pushOrderToGoogleSheets(updatedOrder).catch(() => null);
        return updatedOrder;
      })
    );

    setNotification({
      type: 'success',
      message: 'แนบสลิปสำเร็จ! ระบบอัปเดตสถานะเป็น "ชำระเงินแล้ว" ทันที พร้อมเตรียมจัดส่งสต็อก',
    });
  };

  // Confirm Payment & Auto Stock Delivery Simulation
  const confirmPayment = (orderId: string, slipUrl?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH');

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const updatedTimeline = [
          ...order.timeline,
          {
            id: `step_${Date.now()}`,
            status: 'verifying' as TopUpStatus,
            time: timeStr,
            description: slipUrl
              ? `✅ ชำระเงินเรียบร้อยแล้ว (แนบสลิปหลักฐานยอด ฿${order.price.toLocaleString()} ผ่านการตรวจสอบ)`
              : `✅ ชำระเงินเรียบร้อยแล้ว (สแกนชำระผ่าน PromptPay QR สำเร็จ)`,
          },
        ];

        const updatedOrder = {
          ...order,
          paymentStatus: 'paid' as const,
          slipUrl: slipUrl || order.slipUrl,
          status: 'verifying' as TopUpStatus,
          timeline: updatedTimeline,
          updatedAt: now.toISOString(),
        };

        if (currentOrderForPayment?.id === orderId) {
          setCurrentOrderForPayment(updatedOrder);
        }

        triggerWebhookAlert(updatedOrder, 'paid');
        return updatedOrder;
      })
    );

    // Simulate fast automated stock delivery
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const processTime = new Date().toLocaleTimeString('th-TH');
          return {
            ...ord,
            status: 'processing',
            timeline: [
              ...ord.timeline,
              {
                id: `step_${Date.now()}_proc`,
                status: 'processing',
                time: processTime,
                description: `⚡ ระบบเซิร์ฟเวอร์กำลังจัดส่งสต็อกสินค้าเข้าไอดีผู้เล่น ${ord.playerUid}`,
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }, 1600);

    setTimeout(() => {
      setOrders((prev) => {
        const completeTime = new Date().toLocaleTimeString('th-TH');
        const updated = prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const doneOrder: TopUpOrder = {
            ...ord,
            status: 'completed',
            timeline: [
              ...ord.timeline,
              {
                id: `step_${Date.now()}_done`,
                status: 'completed',
                time: completeTime,
                description: `🎉 จัดส่งสต็อกสินค้าผ่านเซิร์ฟเวอร์เข้าไอดีสำเร็จเรียบร้อยแล้ว ยอดเข้าทันที!`,
              },
            ],
            updatedAt: new Date().toISOString(),
          };
          setLastCompletedOrder(doneOrder);
          triggerWebhookAlert(doneOrder, 'delivered');
          return doneOrder;
        });
        return updated;
      });

      setIsPaymentModalOpen(false);
      setIsOrderSuccessModalOpen(true);
      setNotification({
        type: 'success',
        message: `คำสั่งซื้อ ${orderId} จัดส่งสต็อกสินค้าสำเร็จเรียบร้อยแล้ว!`,
      });
    }, 3600);
  };

  // Single Admin Authentication
  const adminLogin = (username: string, passcode: string): boolean => {
    if (
      username.trim().toLowerCase() === adminCredentials.username.toLowerCase() &&
      passcode.trim() === adminCredentials.passcode
    ) {
      setIsAdminLoggedIn(true);
      setIsAdminLoginModalOpen(false);
      setNotification({
        type: 'success',
        message: 'ยินดีต้อนรับ แอดมินเข้าสู่ระบบจัดการราคาและคำสั่งซื้อ',
      });
      return true;
    } else {
      setNotification({
        type: 'error',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านแอดมินไม่ถูกต้อง (เฉพาะผู้ดูแลระบบคนเดียวเท่านั้น)',
      });
      return false;
    }
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    if (activeTab === 'admin') {
      setActiveTab('store');
    }
    setNotification({
      type: 'info',
      message: 'ออกจากระบบแอดมินเรียบร้อยแล้ว',
    });
  };

  const updateAdminPasscode = (newPasscode: string): boolean => {
    if (!newPasscode || newPasscode.trim().length < 4) {
      setNotification({
        type: 'error',
        message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร',
      });
      return false;
    }
    setAdminCredentials((prev) => ({
      ...prev,
      passcode: newPasscode.trim(),
    }));
    setNotification({
      type: 'success',
      message: 'เปลี่ยนรหัสผ่านแอดมินเรียบร้อยแล้ว',
    });
    return true;
  };

  // Customer User Management (Admin Only Registration)
  const addCustomerUser = (data: Omit<CustomerUser, 'id' | 'createdAt' | 'createdBy'>): CustomerUser => {
    const newUser: CustomerUser = {
      ...data,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      createdBy: 'แอดมิน (สร้างมือ)',
    };
    setCustomerUsers((prev) => [newUser, ...prev]);
    setNotification({
      type: 'success',
      message: `สมัครยูสเซอร์ "${newUser.username}" (${newUser.customerName}) สำเร็จเรียบร้อย`,
    });
    return newUser;
  };

  const updateCustomerUser = (id: string, updates: Partial<CustomerUser>) => {
    setCustomerUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    if (currentCustomerUser?.id === id) {
      setCurrentCustomerUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    setNotification({
      type: 'success',
      message: 'อัปเดตข้อมูลยูสเซอร์ลูกค้าเรียบร้อยแล้ว',
    });
  };

  const deleteCustomerUser = (id: string) => {
    setCustomerUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentCustomerUser?.id === id) {
      setCurrentCustomerUser(null);
    }
    setNotification({
      type: 'success',
      message: 'ลบยูสเซอร์ลูกค้าออกจากระบบแล้ว',
    });
  };

  const adjustCustomerBalance = (id: string, amount: number, note?: string) => {
    setCustomerUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const newBal = Math.max(0, u.balance + amount);
        return { ...u, balance: newBal };
      })
    );
    if (currentCustomerUser?.id === id) {
      setCurrentCustomerUser((prev) =>
        prev ? { ...prev, balance: Math.max(0, prev.balance + amount) } : null
      );
    }
    setNotification({
      type: 'success',
      message: `ปรับยอดเครดิต ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} บาท เรียบร้อย ${note ? `(${note})` : ''}`,
    });
  };

  const customerLogin = (username: string, passcode: string): boolean => {
    const cleanUser = username.trim().toLowerCase();
    const found = customerUsers.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === passcode.trim()
    );
    if (!found) {
      setNotification({
        type: 'error',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้รับการเปิดบัญชีโดยแอดมิน',
      });
      return false;
    }
    if (found.status === 'suspended') {
      setNotification({
        type: 'error',
        message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว โปรดติดต่อแอดมิน',
      });
      return false;
    }
    const updated: CustomerUser = { ...found, lastLoginAt: new Date().toISOString() };
    setCurrentCustomerUser(updated);
    setCustomerUsers((prev) => prev.map((u) => (u.id === found.id ? updated : u)));
    setNotification({
      type: 'success',
      message: `ยินดีต้อนรับคุณ ${found.customerName} (${found.username}) เข้าสู่ระบบราคาส่ง`,
    });
    return true;
  };

  const customerLogout = () => {
    setCurrentCustomerUser(null);
    setNotification({
      type: 'info',
      message: 'ออกจากระบบลูกค้าเรียบร้อยแล้ว',
    });
  };

  // PRICE EDITING AT ANY TIME
  const updatePackagePrice = (
    gameId: string,
    packageId: string,
    updates: Partial<Omit<GamePackage, 'id'>>
  ) => {
    setGames((prev) =>
      prev.map((game) => {
        if (game.id !== gameId) return game;
        return {
          ...game,
          packages: game.packages.map((pkg) => {
            if (pkg.id !== packageId) return pkg;
            return {
              ...pkg,
              ...updates,
            };
          }),
        };
      })
    );
    setNotification({
      type: 'success',
      message: 'บันทึกราคาและข้อมูลแพ็กเกจสำเร็จเรียบร้อย',
    });
  };

  const addPackageToGame = (gameId: string, pkg: Omit<GamePackage, 'id'>) => {
    const newPkg: GamePackage = {
      ...pkg,
      id: `${gameId}-pkg-${Date.now()}`,
    };

    setGames((prev) =>
      prev.map((game) => {
        if (game.id !== gameId) return game;
        return {
          ...game,
          packages: [...game.packages, newPkg],
        };
      })
    );
    setNotification({
      type: 'success',
      message: `เพิ่มแพ็กเกจ "${pkg.name}" ให้กับเกมสำเร็จ`,
    });
  };

  const deletePackage = (gameId: string, packageId: string) => {
    setGames((prev) =>
      prev.map((game) => {
        if (game.id !== gameId) return game;
        return {
          ...game,
          packages: game.packages.filter((p) => p.id !== packageId),
        };
      })
    );
    setNotification({
      type: 'info',
      message: 'ลบแพ็กเกจเรียบร้อยแล้ว',
    });
  };

  // Game Management
  const addNewGame = (gameData: Omit<Game, 'id'>) => {
    const newId =
      gameData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10) || `game_${Date.now()}`;

    const newGame: Game = {
      ...gameData,
      id: newId,
    };

    setGames((prev) => [newGame, ...prev]);
    setNotification({
      type: 'success',
      message: `เพิ่มเกม "${newGame.name}" เข้าสู่หน้าร้านสำเร็จ`,
    });
  };

  const updateGame = (gameId: string, updates: Partial<Game>) => {
    setGames((prev) =>
      prev.map((game) => {
        if (game.id !== gameId) return game;
        return {
          ...game,
          ...updates,
        };
      })
    );
    setNotification({
      type: 'success',
      message: 'อัปเดตข้อมูลเกมสำเร็จ',
    });
  };

  // อัปเดตรูปภาพประจำตัวเกม (Game Thumbnail) ถาวร
  const updateGameImage = (gameId: string, imageUrl: string) => {
    addGameImageVersion(gameId, imageUrl, 'อัปโหลดใหม่จากอุปกรณ์', true);
  };

  // กำหนดเวอร์ชันรูปภาพให้เป็นค่าเริ่มต้นในหน้าแรก (บันทึกถาวร)
  const setGameDefaultThumbnail = (gameId: string, versionId: string) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        const targetVersion = g.imageVersions?.find((v) => v.id === versionId);
        if (!targetVersion) return g;

        const updatedVersions = (g.imageVersions || []).map((v) => ({
          ...v,
          isDefault: v.id === versionId,
        }));

        const updatedGame = {
          ...g,
          iconUrl: targetVersion.url,
          imageVersions: updatedVersions,
        };

        if (selectedGame?.id === gameId) {
          setSelectedGame(updatedGame);
        }

        return updatedGame;
      })
    );

    setNotification({
      type: 'success',
      message: 'ตั้งค่ารูปภาพเวอร์ชันนี้เป็นค่าเริ่มต้นในหน้าแรกสำเร็จ (บันทึกถาวร)',
    });
  };

  // เพิ่มเวอร์ชันรูปภาพใหม่ในคลัง (รองรับการอัปโหลดจากมือถือ/คอมพิวเตอร์)
  const addGameImageVersion = (
    gameId: string,
    url: string,
    versionName?: string,
    setAsDefault: boolean = true
  ) => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('th-TH');
    const newVersion = {
      id: `ver-${Date.now()}`,
      url,
      name: versionName || `เวอร์ชัน ${dateStr} ${timeStr}`,
      uploadedAt: new Date().toISOString(),
      isDefault: setAsDefault,
    };

    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;

        const existingVersions = g.imageVersions && g.imageVersions.length > 0
          ? g.imageVersions
          : g.iconUrl
          ? [{
              id: `ver-orig-${g.id}`,
              url: g.iconUrl,
              name: 'รูปดั้งเดิมของระบบ',
              uploadedAt: new Date().toISOString(),
              isDefault: !setAsDefault,
            }]
          : [];

        const updatedVersions = setAsDefault
          ? [newVersion, ...existingVersions.map((v) => ({ ...v, isDefault: false }))]
          : [newVersion, ...existingVersions];

        const updatedGame = {
          ...g,
          iconUrl: setAsDefault ? url : g.iconUrl,
          imageVersions: updatedVersions,
        };

        if (selectedGame?.id === gameId) {
          setSelectedGame(updatedGame);
        }

        return updatedGame;
      })
    );

    setNotification({
      type: 'success',
      message: setAsDefault
        ? 'อัปโหลดรูปภาพประจำตัวเกมสำเร็จ พร้อมตั้งเป็นรูปเริ่มต้นหน้าแรก (บันทึกถาวร)'
        : 'เพิ่มเวอร์ชันรูปภาพเข้าสู่คลังเรียบร้อยแล้ว',
    });
  };

  // ลบเวอร์ชันรูปภาพออกจากคลัง
  const deleteGameImageVersion = (gameId: string, versionId: string) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        const remaining = (g.imageVersions || []).filter((v) => v.id !== versionId);
        return {
          ...g,
          imageVersions: remaining,
        };
      })
    );

    setNotification({
      type: 'info',
      message: 'ลบเวอร์ชันรูปภาพออกจากคลังเรียบร้อยแล้ว',
    });
  };

  const deleteGame = (gameId: string) => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
    if (selectedGame?.id === gameId) {
      setSelectedGame(null);
    }
    setNotification({
      type: 'info',
      message: 'ลบเกมออกจากระบบเรียบร้อยแล้ว',
    });
  };

  // Admin Order Status Update (ส่งสำเร็จเเล้ว | ยกเลิก | กำลังดำเนินการ | อื่นๆ ให้แอดมินพิมพ์แจ้งลูกค้า)
  const adminUpdateOrderStatus = (
    orderId: string,
    newStatus: TopUpStatus,
    note?: string,
    customStatusText?: string
  ) => {
    const timeStr = new Date().toLocaleTimeString('th-TH');
    const statusLabels: Record<TopUpStatus, string> = {
      completed: 'ส่งสำเร็จเเล้ว',
      processing: 'กำลังดำเนินการ',
      failed: 'ยกเลิก',
      custom: customStatusText || 'ข้อความพิเศษจากแอดมิน',
      verifying: 'กำลังตรวจสอบชำระเงิน',
      pending_payment: 'รอการชำระเงิน',
    };

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const displayLabel = newStatus === 'custom' ? (customStatusText || 'อื่นๆ') : (statusLabels[newStatus] || newStatus);
        const defaultDesc = note || `แอดมินอัปเดตสถานะ: ${displayLabel}`;
        const updatedOrd: TopUpOrder = {
          ...ord,
          status: newStatus,
          customStatus: newStatus === 'custom' ? (customStatusText || ord.customStatus) : undefined,
          adminNote: note || ord.adminNote,
          paymentStatus: newStatus === 'completed' || newStatus === 'verifying' ? 'paid' : ord.paymentStatus,
          timeline: [
            ...ord.timeline,
            {
              id: `step_${Date.now()}`,
              status: newStatus,
              time: timeStr,
              description: defaultDesc,
              actor: 'admin',
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        if (newStatus === 'completed') {
          triggerWebhookAlert(updatedOrd, 'delivered');
        } else if (newStatus === 'verifying') {
          triggerWebhookAlert(updatedOrd, 'paid');
        }
        return updatedOrd;
      })
    );
    const finalLabel = newStatus === 'custom' ? (customStatusText || 'อื่นๆ') : (statusLabels[newStatus] || newStatus);
    setNotification({
      type: 'success',
      message: `แอดมินอัปเดตสถานะออเดอร์ ${orderId} เป็น "${finalLabel}" เรียบร้อยแล้ว`,
    });
  };

  // Dealer Management
  const addDealer = (dealerData: Omit<Dealer, 'id' | 'totalOrders' | 'totalSpent' | 'joinedAt'>) => {
    const newDealer: Dealer = {
      ...dealerData,
      id: `dealer-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setDealers((prev) => [newDealer, ...prev]);
    setNotification({
      type: 'success',
      message: `เพิ่มดีลเลอร์ "${newDealer.name}" (${newDealer.shopName || newDealer.tier}) เรียบร้อยแล้ว`,
    });
  };

  const updateDealerStatus = (dealerId: string, status: Dealer['status']) => {
    setDealers((prev) =>
      prev.map((d) => (d.id === dealerId ? { ...d, status } : d))
    );
    const statusLabels: Record<Dealer['status'], string> = {
      approved: 'อนุมัติการเข้าถึงสต็อกเรียบร้อยแล้ว',
      pending: 'เปลี่ยนสถานะเป็นรอการอนุมัติ',
      suspended: 'ระงับการเข้าถึงสต็อกชั่วคราว',
    };
    setNotification({
      type: 'info',
      message: statusLabels[status],
    });
  };

  const updateDealerTier = (dealerId: string, tier: Dealer['tier'], discountPercent: number) => {
    setDealers((prev) =>
      prev.map((d) => (d.id === dealerId ? { ...d, tier, discountPercent } : d))
    );
    setNotification({
      type: 'success',
      message: `ปรับระดับดีลเลอร์เป็น ${tier} (ส่วนลดสต็อก ${discountPercent}%) สำเร็จ`,
    });
  };

  const deleteDealer = (dealerId: string) => {
    setDealers((prev) => prev.filter((d) => d.id !== dealerId));
    setNotification({
      type: 'info',
      message: 'ลบข้อมูลดีลเลอร์เรียบร้อยแล้ว',
    });
  };

  // Webhook & Line Notify
  const updateWebhookConfig = (updates: Partial<WebhookConfig>) => {
    setWebhookConfig((prev) => ({ ...prev, ...updates }));
    setNotification({
      type: 'success',
      message: 'บันทึกการตั้งค่า Webhook / Line Notify เรียบร้อยแล้ว',
    });
  };

  const testWebhook = () => {
    const timeStr = new Date().toLocaleTimeString('th-TH');
    if (!webhookConfig.enabled) {
      setNotification({
        type: 'error',
        message: 'กรุณาเปิดใช้งาน Webhook ก่อนทดสอบ',
      });
      return { success: false, message: 'กรุณาเปิดใช้งาน Webhook ก่อนทดสอบ' };
    }
    const sampleLog = `[Line Notify Test] ทดสอบส่งข้อความแจ้งเตือนสำเร็จ Token: ${webhookConfig.lineNotifyToken ? webhookConfig.lineNotifyToken.slice(0, 8) + '...' : 'MockToken'} เวลา ${timeStr}`;
    setWebhookConfig((prev) => ({
      ...prev,
      lastTestedAt: `${new Date().toLocaleDateString('th-TH')} ${timeStr}`,
      lastTestStatus: 'success',
      lastLog: sampleLog,
    }));
    setNotification({
      type: 'success',
      message: '🚀 ส่งข้อความทดสอบไปยัง Line Notify สำเร็จ (HTTP 200 OK)',
    });
    return { success: true, message: sampleLog };
  };

  // แอดมินเพิ่มขั้นตอนใน "บันทึกความคืบหน้าระบบอัตโนมัติ" จากหลังบ้าน
  const adminAddTimelineStep = (
    orderId: string,
    step: { status: TopUpStatus; description: string; time?: string }
  ) => {
    const timeStr = step.time || new Date().toLocaleTimeString('th-TH');
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: step.status,
          paymentStatus:
            step.status === 'completed' || step.status === 'verifying'
              ? 'paid'
              : ord.paymentStatus,
          timeline: [
            ...ord.timeline,
            {
              id: `step_${Date.now()}_adm`,
              status: step.status,
              time: timeStr,
              description: step.description,
              actor: 'admin',
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setNotification({
      type: 'success',
      message: `บันทึกขั้นตอนความคืบหน้าใหม่ของ ${orderId} สำเร็จ`,
    });
  };

  // แอดมินลบขั้นตอนใน "บันทึกความคืบหน้าระบบอัตโนมัติ"
  const adminDeleteTimelineStep = (orderId: string, stepIndex: number) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const newTimeline = ord.timeline.filter((_, idx) => idx !== stepIndex);
        return {
          ...ord,
          timeline: newTimeline,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setNotification({
      type: 'info',
      message: 'ลบขั้นตอนความคืบหน้าเรียบร้อยแล้ว',
    });
  };

  // แอดมินแก้ไขขั้นตอนใน "บันทึกความคืบหน้าระบบอัตโนมัติ"
  const adminUpdateTimelineStep = (
    orderId: string,
    stepIndex: number,
    updated: { status: TopUpStatus; description: string; time?: string }
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const newTimeline = ord.timeline.map((step, idx) => {
          if (idx !== stepIndex) return step;
          return {
            ...step,
            status: updated.status,
            description: updated.description,
            time: updated.time || step.time,
            actor: 'admin' as const,
          };
        });
        return {
          ...ord,
          timeline: newTimeline,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setNotification({
      type: 'success',
      message: 'อัปเดตขั้นตอนความคืบหน้าสำเร็จ',
    });
  };

  // แอดมินกดสถานะ "ชำระเงินแล้ว" ทันที
  const adminQuickSetPaid = (orderId: string, note?: string) => {
    const timeStr = new Date().toLocaleTimeString('th-TH');
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          paymentStatus: 'paid',
          status: 'verifying',
          timeline: [
            ...ord.timeline,
            {
              id: `step_${Date.now()}_paid`,
              status: 'verifying',
              time: timeStr,
              description: note || `✅ แอดมินยืนยันยอดชำระเงินจากหลังบ้านเรียบร้อยแล้ว`,
              actor: 'admin',
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setNotification({
      type: 'success',
      message: `ปรับสถานะคำสั่งซื้อ ${orderId} เป็น "ชำระเงินแล้ว" เรียบร้อย`,
    });
  };

  // แอดมินแนบสลิปแทนลูกค้าจากหลังบ้าน
  const adminUploadSlip = (orderId: string, slipUrl: string) => {
    const timeStr = new Date().toLocaleTimeString('th-TH');
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          paymentStatus: 'paid',
          slipUrl,
          slipUploadedAt: nowIso,
          status: 'verifying',
          timeline: [
            ...ord.timeline,
            {
              id: `step_${Date.now()}_slip`,
              status: 'verifying',
              time: timeStr,
              description: `📎 แอดมินแนบสลิปการโอนจากหลังบ้าน และบันทึกสถานะเป็น "ชำระเงินแล้ว" ทันที`,
              actor: 'admin',
            },
          ],
          updatedAt: nowIso,
        };
      })
    );
    setNotification({
      type: 'success',
      message: `แนบสลิปและปรับสถานะเป็น "ชำระเงินแล้ว" ให้กับ ${orderId} สำเร็จ`,
    });
  };

  // Reset to initial mock data
  const resetAllData = () => {
    setGames(INITIAL_GAMES);
    setOrders(INITIAL_TOPUP_ORDERS);
    setDealers(INITIAL_DEALERS);
    setWebhookConfig(DEFAULT_WEBHOOK_CONFIG);
    setCart([]);
    setAdminCredentials(DEFAULT_ADMIN);
    localStorage.removeItem(LOCAL_STORAGE_GAMES);
    localStorage.removeItem(LOCAL_STORAGE_ORDERS);
    localStorage.removeItem(LOCAL_STORAGE_DEALERS);
    localStorage.removeItem(LOCAL_STORAGE_WEBHOOK);
    localStorage.removeItem(LOCAL_STORAGE_CART);
    localStorage.removeItem(LOCAL_STORAGE_ADMIN_CRED);
    setNotification({
      type: 'info',
      message: 'รีเซ็ตข้อมูลเกมและคำสั่งซื้อเริ่มต้นเรียบร้อยแล้ว',
    });
  };

  return (
    <AppContext.Provider
      value={{
        games,
        orders,
        dealers,
        webhookConfig,
        cart,
        isCartOpen,
        selectedGame,
        selectedPackage,
        activeTab,
        isAdminLoggedIn,
        adminCredentials,
        isPaymentModalOpen,
        currentOrderForPayment,
        setCurrentOrderForPayment,
        isOrderSuccessModalOpen,
        lastCompletedOrder,
        isAdminLoginModalOpen,
        notification,
        setSelectedGame,
        setSelectedPackage,
        setActiveTab,
        setIsCartOpen,
        setIsPaymentModalOpen,
        setIsOrderSuccessModalOpen,
        setIsAdminLoginModalOpen,
        isTopupModalOpen,
        setIsTopupModalOpen,
        setNotification,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkoutCart,
        createTopUpOrder,
        confirmPayment,
        simulateUidCheck,
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
        attachSlipAndMarkPaid,
        resetAllData,
        customerUsers,
        currentCustomerUser,
        addCustomerUser,
        updateCustomerUser,
        deleteCustomerUser,
        adjustCustomerBalance,
        customerLogin,
        customerLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
