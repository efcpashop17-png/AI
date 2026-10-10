import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
  PaymentConfig,
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
import { soundService } from '../services/soundService';
import {
  fetchServerData,
  saveOrderToServer,
  saveOrdersBatchToServer,
  deleteOrderFromServer,
  saveCustomerToServer,
  saveCustomersBatchToServer,
  deleteCustomerFromServer,
  fetchCustomersFromServer,
  restoreCustomersFromServerBackup,
  saveSettingsToServer,
  saveGamesToServer,
  saveSinglePackageToServer,
  saveSingleGameToServer,
  addPackageToServer,
  deletePackageFromServer,
  subscribeToLiveEvents,
} from '../services/persistentStorageService';
import { PAYMENT_CONFIG } from '../utils/promptpay';
import { formatPackageQuantityTag, formatOrderPackagesNotation, getOrderItems } from '../utils/orderHelper';

interface AppContextType {
  games: Game[];
  orders: TopUpOrder[];
  deletedOrderIds: string[];
  dealers: Dealer[];
  webhookConfig: WebhookConfig;
  cart: CartItem[];
  isCartOpen: boolean;
  selectedGame: Game | null;
  selectedPackage: GamePackage | null;
  activeTab: ActiveTab;
  isAdminLoggedIn: boolean;
  adminCredentials: AdminCredentials;
  paymentConfig: PaymentConfig;
  updatePaymentConfig: (newConfig: Partial<PaymentConfig>) => void;
  isPaymentModalOpen: boolean;
  currentOrderForPayment: TopUpOrder | null;
  setCurrentOrderForPayment: (order: TopUpOrder | null) => void;
  isOrderSuccessModalOpen: boolean;
  lastCompletedOrder: TopUpOrder | null;
  selectedOrderForPackagePopup: TopUpOrder | null;
  setSelectedOrderForPackagePopup: (order: TopUpOrder | null) => void;
  isAdminLoginModalOpen: boolean;
  notification: { type: 'success' | 'info' | 'error'; message: string } | null;

  // Navigation & Game Selection
  setSelectedGame: (game: Game | null) => void;
  setSelectedPackage: (pkg: GamePackage | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  setIsOrderSuccessModalOpen: (open: boolean) => void;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  setNotification: (notif: { type: 'success' | 'info' | 'error'; message: string } | null) => void;
  soundEnabled: boolean;
  toggleSound: () => void;

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
  deleteOrder: (orderId: string) => Promise<boolean>;
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
  adminUploadDeliveryProof: (
    orderId: string,
    proofs: { preDeliveryImageUrl?: string; postDeliveryImageUrl?: string }
  ) => void;
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
  downloadDatabaseBackup: () => void;
  restoreDatabaseBackup: (backupData: any) => Promise<{ success: boolean; orderCount: number; customerCount: number }>;
  refreshOrders: () => Promise<void>;
  forceSyncAllDevices: () => Promise<void>;
  addRecoveredCustomerOrder: (orderData: Partial<TopUpOrder>) => Promise<TopUpOrder>;
  deepScanAndRecoverOrders: () => Promise<number>;
  purgeAllBotOrders: () => Promise<void>;
  restoreAllCustomerUsers: () => Promise<void>;
  shopLogoUrl: string;
  updateShopLogo: (options: { logoUrl?: string; logoBase64?: string }) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_GAMES = 'gamepay_games_v2';
const LOCAL_STORAGE_ORDERS = 'gamepay_orders_v2';
const LOCAL_STORAGE_VAULT = 'gamepay_orders_vault_permanent';
const LOCAL_STORAGE_DELETED_ORDERS = 'gamepay_deleted_orders_v2';
const LOCAL_STORAGE_DEALERS = 'gamepay_dealers_v2';
const LOCAL_STORAGE_WEBHOOK = 'gamepay_webhook_v2';
const LOCAL_STORAGE_CART = 'gamepay_cart_v2';
const LOCAL_STORAGE_ADMIN_CRED = 'gamepay_admin_cred_v2';
const LOCAL_STORAGE_ADMIN_AUTH = 'gamepay_admin_auth_v2';
const LOCAL_STORAGE_CUSTOMER_USERS = 'efcpa_customer_users_v2';
const LOCAL_STORAGE_CURRENT_CUSTOMER = 'efcpa_current_customer_v2';
const LOCAL_STORAGE_PAYMENT_CONFIG = 'efcpa_payment_config_v2';
const LOCAL_STORAGE_LOGO_URL = 'efcpa_shop_logo_url_v2';

// Bot mock order blacklist - ensure NO fake/bot orders ever pollute customer or admin tracking
export const BOT_ORDER_IDS = new Set<string>([]);

export const isBotOrder = (order: any): boolean => {
  if (!order || !order.id) return true;
  if (BOT_ORDER_IDS.has(order.id)) return true;
  return false;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Track last local game edit to prevent background sync from overwriting newly edited prices/names
  const lastLocalGameUpdateRef = useRef<number>(0);

  // Helper to ensure each game has completely unique packages by package ID
  const deduplicateGamePackages = useCallback((packages?: GamePackage[]): GamePackage[] => {
    if (!Array.isArray(packages)) return [];
    const seenIds = new Set<string>();
    return packages.filter((pkg) => {
      if (!pkg || !pkg.id) return false;
      const cleanId = String(pkg.id).trim();
      if (seenIds.has(cleanId)) return false;
      seenIds.add(cleanId);
      return true;
    });
  }, []);

  // Load Games
  const [games, setGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GAMES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedMap = new Map<string, Game>();
          parsed.forEach((pg: Game) => savedMap.set(pg.id, pg));

          const result: Game[] = parsed.map((pg: Game) => {
            const initG = INITIAL_GAMES.find((ig) => ig.id === pg.id);
            const seenIds = new Set<string>();
            const uniquePkgs = (pg.packages || initG?.packages || []).filter((p) => {
              if (!p || !p.id) return false;
              const cleanId = String(p.id).trim();
              if (seenIds.has(cleanId)) return false;
              seenIds.add(cleanId);
              return true;
            });

            return {
              ...initG,
              ...pg,
              iconUrl: pg.iconUrl || initG?.iconUrl,
              iconBgColor: pg.iconBgColor || initG?.iconBgColor,
              bannerGradient: pg.bannerGradient || initG?.bannerGradient,
              packages: uniquePkgs,
              thaiName: pg.thaiName || initG?.thaiName || pg.name,
              aliases: pg.aliases || initG?.aliases || [pg.name.toLowerCase()],
              todayRate: pg.todayRate !== undefined ? pg.todayRate : initG?.todayRate,
              accountField: {
                label: 'กรอก User ที่ลงทะเบียนไว้กับแอดมิน',
                placeholder: 'กรอก User ที่ลงทะเบียนไว้กับแอดมิน',
                helperText: 'กรอก User ที่ลงทะเบียนไว้กับแอดมินเพื่อความถูกต้องในการส่งสต็อก',
                needsServerSelect: false,
              },
            };
          });

          // Ensure any default games from INITIAL_GAMES that weren't in saved state are included
          INITIAL_GAMES.forEach((ig) => {
            if (!savedMap.has(ig.id)) {
              result.push(ig);
            }
          });

          return result;
        }
      }
    } catch (e) {
      console.error('Failed to load games from localStorage', e);
    }
    return INITIAL_GAMES;
  });

  // Track permanently deleted order IDs to prevent resurrection from stale tabs/syncs
  const [deletedOrderIds, setDeletedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const deletedOrderIdsRef = useRef<Set<string>>(new Set(deletedOrderIds.map((d) => String(d || '').trim().toLowerCase())));
  useEffect(() => {
    deletedOrderIds.forEach((id) => {
      if (id) {
        deletedOrderIdsRef.current.add(String(id).trim());
        deletedOrderIdsRef.current.add(String(id).trim().toLowerCase());
      }
    });
  }, [deletedOrderIds]);

  const isOrderDeleted = useCallback((orderId?: string | null): boolean => {
    if (!orderId) return false;
    const clean = String(orderId).trim();
    const lower = clean.toLowerCase();
    if (deletedOrderIdsRef.current.has(clean) || deletedOrderIdsRef.current.has(lower)) return true;
    return deletedOrderIds.some((d) => {
      const dClean = String(d || '').trim().toLowerCase();
      return dClean === lower || dClean === clean;
    });
  }, [deletedOrderIds]);

  // Load Orders with guaranteed persistence of real customer orders (Zero Bots)
  const [orders, setOrders] = useState<TopUpOrder[]>(() => {
    try {
      const deletedSet = new Set<string>();
      try {
        const deletedSaved = localStorage.getItem(LOCAL_STORAGE_DELETED_ORDERS);
        if (deletedSaved) {
          const parsedDeleted = JSON.parse(deletedSaved);
          if (Array.isArray(parsedDeleted)) {
            parsedDeleted.forEach((id: string) => {
              if (id) {
                deletedSet.add(String(id).trim());
                deletedSet.add(String(id).trim().toLowerCase());
              }
            });
          }
        }
      } catch (_) {}

      const isInitialDeleted = (id?: string) => {
        if (!id) return true;
        const clean = String(id).trim().toLowerCase();
        return deletedSet.has(clean) || deletedSet.has(String(id).trim());
      };

      const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS);
      const vaultSaved = localStorage.getItem(LOCAL_STORAGE_VAULT);
      const orderMap = new Map<string, TopUpOrder>();

      if (vaultSaved) {
        try {
          const parsedVault: TopUpOrder[] = JSON.parse(vaultSaved);
          if (Array.isArray(parsedVault)) {
            parsedVault.forEach((o) => {
              if (o && o.id && !isBotOrder(o) && !isInitialDeleted(o.id)) orderMap.set(o.id, o);
            });
          }
        } catch (_) {}
      }
      if (saved) {
        try {
          const parsed: TopUpOrder[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((o) => {
              if (o && o.id && !isBotOrder(o) && !isInitialDeleted(o.id)) {
                const notation = formatOrderPackagesNotation(o);
                const cleanOrder = notation && (o.packageName?.includes('และอีก') || o.gameName?.includes('และอื่นๆ'))
                  ? { ...o, packageName: notation, gameName: o.gameName.replace(/ และอื่นๆ.*$/, '') }
                  : o;
                orderMap.set(cleanOrder.id, cleanOrder);
              }
            });
          }
        } catch (_) {}
      }
      if (orderMap.size === 0 && Array.isArray(INITIAL_TOPUP_ORDERS) && INITIAL_TOPUP_ORDERS.length > 0) {
        INITIAL_TOPUP_ORDERS.forEach((o) => {
          if (o && o.id && !isInitialDeleted(o.id)) {
            orderMap.set(o.id, o);
          }
        });
      }
      const initialList = Array.from(orderMap.values());
      initialList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(initialList));
        localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(initialList));
      } catch (_) {}
      return initialList;
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
    }
    return [];
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
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

  // Load Payment & PromptPay Configuration
  const [shopLogoUrl, setShopLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_LOGO_URL) || "/logo.png";
    } catch (_) {
      return "/logo.png";
    }
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAYMENT_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.promptPayId === '0948201166') {
          return { ...PAYMENT_CONFIG, ...parsed, promptPayId: '1100401206065', promptPayType: 'citizen_id' };
        }
        return { ...PAYMENT_CONFIG, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load paymentConfig', e);
    }
    return PAYMENT_CONFIG;
  });

  // Two-way synchronization with permanent server database
  useEffect(() => {
    let active = true;
    fetchServerData().then((serverData) => {
      if (!active || !serverData) return;

      // 1. Sync Games (Prices, Packages, Thumbnails, Versions) from server database
      if (serverData.games && serverData.games.length > 0) {
        setGames((prev) => {
          // If we edited locally recently (within 20s), protect local edits
          if (lastLocalGameUpdateRef.current > 0 && Date.now() - lastLocalGameUpdateRef.current < 20000) return prev;

          const serverGameMap = new Map<string, Game>();
          serverData.games!.forEach((g) => serverGameMap.set(g.id, g));

          const merged: Game[] = [...serverData.games!];
          INITIAL_GAMES.forEach((ig) => {
            if (!serverGameMap.has(ig.id)) {
              merged.push(ig);
            }
          });
          prev.forEach((pg) => {
            if (!serverGameMap.has(pg.id) && !merged.some((m) => m.id === pg.id)) {
              merged.push(pg);
            }
          });

          try {
            localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      } else if (games && games.length > 0) {
        // If server database is clean or empty, seed local games to server disk
        saveGamesToServer(games);
      }

      if (serverData.deletedOrderIds && Array.isArray(serverData.deletedOrderIds)) {
        serverData.deletedOrderIds.forEach((id) => deletedOrderIdsRef.current.add(id));
        setDeletedOrderIds((prev) => {
          const merged = Array.from(new Set([...prev, ...serverData.deletedOrderIds]));
          try {
            localStorage.setItem(LOCAL_STORAGE_DELETED_ORDERS, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }

      if (serverData.orders && Array.isArray(serverData.orders)) {
        setOrders((prev) => {
          const map = new Map<string, TopUpOrder>();
          serverData.orders.forEach((o) => {
            if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
              map.set(o.id, o);
            }
          });

          // Only preserve fresh in-flight local orders (< 30s) not yet saved on server
          prev.forEach((o) => {
            if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
              if (!map.has(o.id)) {
                const isFreshInFlight = o.createdAt && (Date.now() - new Date(o.createdAt).getTime() < 30000) && o.status === 'pending_payment';
                if (isFreshInFlight) {
                  map.set(o.id, o);
                  saveOrderToServer(o);
                }
              }
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          try {
            localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(merged));
            localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });

        setLastCompletedOrder((prev) => (prev && isOrderDeleted(prev.id) ? null : prev));
      }

      if (serverData.customers && serverData.customers.length > 0) {
        setCustomerUsers((prev) => {
          const map = new Map<string, CustomerUser>();
          INITIAL_CUSTOMER_USERS.forEach((c) => map.set(c.id, c));
          serverData.customers.forEach((c) => map.set(c.id, c));
          prev.forEach((c) => {
            if (c && c.id) {
              map.set(c.id, c);
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }

      if (serverData.settings?.logoUrl) {
        setShopLogoUrl(serverData.settings.logoUrl);
        try { localStorage.setItem(LOCAL_STORAGE_LOGO_URL, serverData.settings.logoUrl); } catch (_) {}
      }
      if (serverData.settings?.paymentConfig) {
        setPaymentConfig((prev) => {
          const cfg = serverData.settings!.paymentConfig;
          if (cfg.promptPayId === '0948201166') {
            cfg.promptPayId = '1100401206065';
            cfg.promptPayType = 'citizen_id';
          }
          const merged = { ...prev, ...cfg };
          try {
            localStorage.setItem(LOCAL_STORAGE_PAYMENT_CONFIG, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const serverData = await fetchServerData();
      if (serverData && Array.isArray(serverData.orders)) {
        if (serverData.deletedOrderIds && Array.isArray(serverData.deletedOrderIds)) {
          serverData.deletedOrderIds.forEach((id) => deletedOrderIdsRef.current.add(id));
          setDeletedOrderIds((prev) => {
            const merged = Array.from(new Set([...prev, ...serverData.deletedOrderIds]));
            try {
              localStorage.setItem(LOCAL_STORAGE_DELETED_ORDERS, JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });
        }

        setOrders((prev) => {
          const map = new Map<string, TopUpOrder>();
          serverData.orders.forEach((o) => {
            if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
              map.set(o.id, o);
            }
          });

          // Only preserve fresh in-flight local orders (< 30s) not yet saved on server
          prev.forEach((o) => {
            if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
              if (!map.has(o.id)) {
                const isFreshInFlight = o.createdAt && (Date.now() - new Date(o.createdAt).getTime() < 30000) && o.status === 'pending_payment';
                if (isFreshInFlight) {
                  map.set(o.id, o);
                  saveOrderToServer(o);
                }
              }
            }
          });
          const updated = Array.from(map.values());
          updated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          try {
            localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
            localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        setLastCompletedOrder((prev) => (prev && isOrderDeleted(prev.id) ? null : prev));
      }
    } catch (err) {
      console.warn('Failed to refresh orders from server', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(customerUsers));
    } catch (e) {
      console.error('Failed to save customerUsers to localStorage', e);
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username === 'admin' && parsed.passcode === 'admin8888') {
          return DEFAULT_ADMIN;
        }
        return parsed;
      }
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
  const [selectedOrderForPackagePopup, setSelectedOrderForPackagePopup] = useState<TopUpOrder | null>(null);

  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [notification, setNotificationState] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !soundService.getIsMuted());

  const toggleSound = () => {
    const isNowMuted = soundService.toggleMute();
    setSoundEnabled(!isNowMuted);
    setNotificationState({
      type: 'info',
      message: !isNowMuted ? 'เปิดเสียงเอฟเฟกต์ (Sound ON)' : 'ปิดเสียงเอฟเฟกต์ (Muted)',
    });
  };

  const setNotification = (notif: { type: 'success' | 'info' | 'error'; message: string } | null) => {
    setNotificationState(notif);
    if (notif) {
      if (notif.type === 'error') {
        soundService.playErrorSound();
      } else {
        soundService.playNotificationSound();
      }
    }
  };

  // Sync games to localStorage only (server persistence is handled explicitly on user edits)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(games));
    } catch (e) {
      console.warn('Error saving games to localStorage', e);
    }
  }, [games]);

  // Real-time synchronization across all devices (phones, computers, browsers)
  // Powered by Server-Sent Events (SSE) with fast 3-second polling fallback
  useEffect(() => {
    let active = true;

    // 1. Instant Real-Time Push via Server-Sent Events (SSE)
    const unsubscribeSSE = subscribeToLiveEvents({
      onOrdersUpdated: (serverOrders, deletedId, serverDeletedIds) => {
        if (!active || !Array.isArray(serverOrders)) return;

        const newDeleted = [
          ...(deletedId ? [deletedId] : []),
          ...(Array.isArray(serverDeletedIds) ? serverDeletedIds : []),
        ];
        if (newDeleted.length > 0) {
          newDeleted.forEach((id) => deletedOrderIdsRef.current.add(id));
          setDeletedOrderIds((prev) => {
            const merged = Array.from(new Set([...prev, ...newDeleted]));
            try {
              localStorage.setItem(LOCAL_STORAGE_DELETED_ORDERS, JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });
        }

        setOrders((prev) => {
          const map = new Map<string, TopUpOrder>();
          // Server disk is source of truth
          serverOrders.forEach((o) => {
            if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
              map.set(o.id, o);
            }
          });

          // Detect if any brand new orders arrived that were not in prev
          const prevIds = new Set(prev.map((o) => o.id));
          const newIncomingOrders = serverOrders.filter(
            (o) => !prevIds.has(o.id) && !isBotOrder(o) && !isOrderDeleted(o.id)
          );
          if (newIncomingOrders.length > 0 && isAdminLoggedIn) {
            soundService.playNotificationSound();
            const first = newIncomingOrders[0];
            setNotificationState({
              type: 'info',
              message: `🔔 มีคำสั่งซื้อใหม่จากลูกค้า! รหัส ${first.id} (${first.gameName} - ฿${first.price.toLocaleString()})`,
            });
          }

          // Only preserve fresh in-flight local orders (< 30s) not yet saved on server; never resurrect deleted orders
          prev.forEach((o) => {
            if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
              if (!map.has(o.id)) {
                const isFreshInFlight = o.createdAt && (Date.now() - new Date(o.createdAt).getTime() < 30000) && o.status === 'pending_payment';
                if (isFreshInFlight) {
                  map.set(o.id, o);
                  saveOrderToServer(o);
                }
              }
            }
          });

          const mergedOrders = Array.from(map.values());
          mergedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          try {
            localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(mergedOrders));
            localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(mergedOrders));
          } catch (_) {}
          return mergedOrders;
        });

        setLastCompletedOrder((prev) => (prev && deletedOrderIdsRef.current.has(prev.id) ? null : prev));
      },
      onGamesUpdated: (serverGames) => {
        if (!active || !Array.isArray(serverGames) || serverGames.length === 0) return;
        // Don't interrupt if admin is actively typing inside an edit input
        if (lastLocalGameUpdateRef.current > 0 && Date.now() - lastLocalGameUpdateRef.current < 5000) return;
        setGames(serverGames);
        try {
          localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(serverGames));
        } catch (_) {}
      },
      onCustomersUpdated: (serverCustomers) => {
        if (!active || !Array.isArray(serverCustomers) || serverCustomers.length === 0) return;
        setCustomerUsers(serverCustomers);
        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(serverCustomers));
        } catch (_) {}
      },
      onSettingsUpdated: (serverSettings) => {
        if (!active || !serverSettings) return;
        if (serverSettings.paymentConfig) {
          setPaymentConfig((prev) => ({ ...prev, ...serverSettings.paymentConfig }));
        }
      },
    });

    // 2. High-Reliability Periodic Polling (every 3 seconds)
    const syncAcrossDevices = () => {
      fetchServerData().then((serverData) => {
        if (!active || !serverData) return;

        // 1. Sync games across all devices
        if (serverData.games && serverData.games.length > 0 && (lastLocalGameUpdateRef.current === 0 || Date.now() - lastLocalGameUpdateRef.current >= 5000)) {
          setGames((prev) => {
            const serverGameMap = new Map<string, Game>();
            serverData.games!.forEach((g) => serverGameMap.set(g.id, g));

            const merged: Game[] = [...serverData.games!];
            INITIAL_GAMES.forEach((ig) => {
              if (!serverGameMap.has(ig.id)) {
                merged.push(ig);
              }
            });
            prev.forEach((pg) => {
              if (!serverGameMap.has(pg.id) && !merged.some((m) => m.id === pg.id)) {
                merged.push(pg);
              }
            });

            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(merged);
            if (prevStr !== nextStr) {
              try {
                localStorage.setItem(LOCAL_STORAGE_GAMES, nextStr);
              } catch (_) {}
              return merged;
            }
            return prev;
          });
        }

        // 2. Sync payment config
        if (serverData.settings?.logoUrl) {
          setShopLogoUrl(serverData.settings.logoUrl);
          try { localStorage.setItem(LOCAL_STORAGE_LOGO_URL, serverData.settings.logoUrl); } catch (_) {}
        }
        if (serverData.settings?.paymentConfig) {
          setPaymentConfig((prev) => {
            const cfg = serverData.settings!.paymentConfig;
            if (cfg.promptPayId === '0948201166') {
              cfg.promptPayId = '1100401206065';
              cfg.promptPayType = 'citizen_id';
            }
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify({ ...prev, ...cfg });
            if (prevStr !== nextStr) {
              try {
                localStorage.setItem(LOCAL_STORAGE_PAYMENT_CONFIG, nextStr);
              } catch (_) {}
              return JSON.parse(nextStr);
            }
            return prev;
          });
        }

        // 3. Sync orders across all devices
        if (serverData.deletedOrderIds && Array.isArray(serverData.deletedOrderIds)) {
          serverData.deletedOrderIds.forEach((id) => deletedOrderIdsRef.current.add(id));
          setDeletedOrderIds((prev) => {
            const merged = Array.from(new Set([...prev, ...serverData.deletedOrderIds!]));
            try {
              localStorage.setItem(LOCAL_STORAGE_DELETED_ORDERS, JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });
        }
        if (serverData.orders && Array.isArray(serverData.orders)) {
          setOrders((prev) => {
            const map = new Map<string, TopUpOrder>();
            serverData.orders!.forEach((o) => {
              if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
                map.set(o.id, o);
              }
            });

            // Detect if any brand new orders arrived that were not in prev
            const prevIds = new Set(prev.map((o) => o.id));
            const newIncomingOrders = serverData.orders!.filter(
              (o) => !prevIds.has(o.id) && !isBotOrder(o) && !isOrderDeleted(o.id)
            );
            if (newIncomingOrders.length > 0 && isAdminLoggedIn) {
              soundService.playNotificationSound();
              const first = newIncomingOrders[0];
              setNotificationState({
                type: 'info',
                message: `🔔 มีคำสั่งซื้อใหม่จากลูกค้า! รหัส ${first.id} (${first.gameName} - ฿${first.price.toLocaleString()})`,
              });
            }

            // Only keep fresh in-flight local orders (< 30s) not yet saved on server; never resurrect deleted orders
            prev.forEach((o) => {
              if (o && o.id && !isBotOrder(o) && !isOrderDeleted(o.id)) {
                if (!map.has(o.id)) {
                  const isFreshInFlight = o.createdAt && (Date.now() - new Date(o.createdAt).getTime() < 30000) && o.status === 'pending_payment';
                  if (isFreshInFlight) {
                    map.set(o.id, o);
                    saveOrderToServer(o);
                  }
                }
              }
            });

            const mergedOrders = Array.from(map.values());
            mergedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(mergedOrders);
            if (prevStr !== nextStr) {
              try {
                localStorage.setItem(LOCAL_STORAGE_ORDERS, nextStr);
                localStorage.setItem(LOCAL_STORAGE_VAULT, nextStr);
              } catch (_) {}
              return mergedOrders;
            }
            return prev;
          });
          setLastCompletedOrder((prev) => (prev && deletedOrderIdsRef.current.has(prev.id) ? null : prev));
        }

        // 4. Sync Customer Users across all devices (Never let users vanish)
        if (serverData.customers && Array.isArray(serverData.customers) && serverData.customers.length > 0) {
          setCustomerUsers((prev) => {
            const map = new Map<string, CustomerUser>();
            INITIAL_CUSTOMER_USERS.forEach((c) => map.set(c.id, c));
            serverData.customers.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (c && c.id) map.set(c.id, c);
            });
            const merged = Array.from(map.values());
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(merged);
            if (prevStr !== nextStr) {
              try {
                localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, nextStr);
              } catch (_) {}
              return merged;
            }
            return prev;
          });
        }
      });
    };

    window.addEventListener('focus', syncAcrossDevices);
    document.addEventListener('visibilitychange', syncAcrossDevices);
    const syncInterval = setInterval(syncAcrossDevices, 3000); // 3 seconds polling fallback

    return () => {
      active = false;
      unsubscribeSSE();
      window.removeEventListener('focus', syncAcrossDevices);
      document.removeEventListener('visibilitychange', syncAcrossDevices);
      clearInterval(syncInterval);
    };
  }, [isAdminLoggedIn]);

  // Persist orders to localStorage cleanly (server persistence is handled via dedicated action calls)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
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
        imageUrl: pkg.imageUrl,
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
          : primaryItem.gameName,
      packageId: primaryItem.packageId,
      packageName:
        cart.length === 1
          ? formatPackageQuantityTag(primaryItem)
          : cart.map(formatPackageQuantityTag).join('  '),
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
      packageImageUrl: primaryItem.imageUrl,
      originalPrice: totalOriginalPrice,
      price: totalPrice,
      customerId: currentCustomerUser ? currentCustomerUser.id : (isAdminLoggedIn ? 'admin' : undefined),
      username: currentCustomerUser ? currentCustomerUser.username : (isAdminLoggedIn ? 'arm' : undefined),
      customerName: currentCustomerUser ? (currentCustomerUser.customerName || currentCustomerUser.username) : (isAdminLoggedIn ? 'Admin Arm' : undefined),
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

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
        localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    saveOrderToServer(newOrder, 5);
    clearCart();
    setIsCartOpen(false);
    setCurrentOrderForPayment(newOrder);
    setIsPaymentModalOpen(true);
    soundService.playSuccessSound();
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
    if (!cleanUid) {
      return { valid: false, nickname: '', level: 0 };
    }

    // If matches registered customer username, validate immediately with their customer name
    const matchedCustomer = customerUsers.find(
      (c) => c.username.toLowerCase() === cleanUid.toLowerCase()
    );
    if (matchedCustomer) {
      return {
        valid: true,
        nickname: `${matchedCustomer.customerName || matchedCustomer.username} (ผู้ใช้งาน)`,
        level: 99,
      };
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
      packageName: formatPackageQuantityTag({ packageName: pkg.name, itemAmount: pkg.amount, quantity }),
      inGameItem: pkg.inGameItem,
      itemAmount: pkg.amount * quantity,
      bonusAmount: pkg.bonusAmount ? pkg.bonusAmount * quantity : undefined,
      playerUid: playerUid.trim(),
      serverId,
      zoneId,
      playerNamePreview: playerNamePreview || `Player_${playerUid.slice(-4)}`,
      quantity,
      packageImageUrl: pkg.imageUrl,
      items: [
        {
          id: `${pkg.id}-${timestamp.getTime()}`,
          gameId: game.id,
          gameName: game.name,
          packageId: pkg.id,
          packageName: pkg.name,
          inGameItem: pkg.inGameItem,
          itemAmount: pkg.amount,
          bonusAmount: pkg.bonusAmount,
          originalPrice: pkg.originalPrice,
          unitPrice: pkg.price,
          quantity,
          playerUid: playerUid.trim(),
          serverId,
          zoneId,
          playerNamePreview: playerNamePreview || `Player_${playerUid.slice(-4)}`,
          imageUrl: pkg.imageUrl,
        },
      ],
      originalPrice: finalOriginalPrice,
      price: finalPrice,
      customerId: currentCustomerUser ? currentCustomerUser.id : (isAdminLoggedIn ? 'admin' : undefined),
      username: currentCustomerUser ? currentCustomerUser.username : (isAdminLoggedIn ? 'arm' : undefined),
      customerName: currentCustomerUser ? (currentCustomerUser.customerName || currentCustomerUser.username) : (isAdminLoggedIn ? 'Admin Arm' : undefined),
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

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
        localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    saveOrderToServer(newOrder, 5);
    setCurrentOrderForPayment(newOrder);
    setIsPaymentModalOpen(true);
    soundService.playSuccessSound();
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

        saveOrderToServer(updatedOrder);
        triggerWebhookAlert(updatedOrder, 'paid');
        pushOrderToGoogleSheets(updatedOrder).catch(() => null);
        return updatedOrder;
      })
    );

    soundService.playSuccessSound();

    setNotification({
      type: 'success',
      message: 'แนบสลิปสำเร็จ! ระบบอัปเดตสถานะเป็น "ชำระเงินแล้ว" ทันที พร้อมเตรียมจัดส่งสต็อก',
    });
  };

  // Confirm Payment & Auto Stock Delivery Simulation
  const confirmPayment = (orderId: string, slipUrl?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH');

    soundService.playSuccessSound();

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

        saveOrderToServer(updatedOrder);
        triggerWebhookAlert(updatedOrder, 'paid');
        return updatedOrder;
      })
    );

    // Simulate fast automated stock delivery
    setTimeout(() => {
      soundService.playStatusUpdateSound();
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const processTime = new Date().toLocaleTimeString('th-TH');
          const procOrder: TopUpOrder = {
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
          saveOrderToServer(procOrder);
          return procOrder;
        })
      );
    }, 1600);

    setTimeout(() => {
      soundService.playSuccessSound();
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
          saveOrderToServer(doneOrder);
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

  // Delete Order (ลบออเดอร์ออกจากระบบและเซิร์ฟเวอร์ถาวร)
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    if (!orderId) return false;
    const cleanId = orderId.trim();
    const lowerId = cleanId.toLowerCase();

    // 1. Immediately register in deleted blacklist ref, state and localStorage
    deletedOrderIdsRef.current.add(cleanId);
    deletedOrderIdsRef.current.add(lowerId);
    setDeletedOrderIds((prev) => {
      const next = Array.from(new Set([...prev, cleanId, lowerId]));
      try {
        localStorage.setItem(LOCAL_STORAGE_DELETED_ORDERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    // 2. Clear lastCompletedOrder if matching
    setLastCompletedOrder((prev) => {
      if (prev?.id && (prev.id.trim() === cleanId || prev.id.trim().toLowerCase() === lowerId)) {
        setIsOrderSuccessModalOpen(false);
        return null;
      }
      return prev;
    });

    // 3. Immediately remove from local state and update BOTH localStorage and permanent vault
    setOrders((prev) => {
      const remaining = prev.filter((o) => {
        if (!o || !o.id) return false;
        const oClean = o.id.trim().toLowerCase();
        return oClean !== lowerId && oClean !== cleanId.toLowerCase();
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(remaining));
        localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(remaining));
      } catch (_) {}
      return remaining;
    });

    // 4. Clean out from any possible legacy or emergency storage keys
    try {
      const storageKeys = [
        LOCAL_STORAGE_ORDERS,
        LOCAL_STORAGE_VAULT,
        'gamepay_orders_v1',
        'efcpa_orders_v1',
        'efcpa_orders_vault_permanent',
        'efcpa_emergency_orders_backup_v1',
      ];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('order') || k.includes('Order')) && !storageKeys.includes(k) && k !== LOCAL_STORAGE_DELETED_ORDERS) {
          storageKeys.push(k);
        }
      }
      for (const k of storageKeys) {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => {
              if (!item || !item.id) return true;
              const itemIdClean = String(item.id).trim().toLowerCase();
              return itemIdClean !== lowerId;
            });
            localStorage.setItem(k, JSON.stringify(filtered));
          } else if (parsed && parsed.id && String(parsed.id).trim().toLowerCase() === lowerId) {
            localStorage.removeItem(k);
          }
        } catch (_) {}
      }
    } catch (_) {}

    // 5. Delete permanently on server disk
    try {
      await deleteOrderFromServer(cleanId);
    } catch (e) {
      console.warn('Failed to delete order on server:', e);
    }

    soundService.playNotificationSound();
    setNotification({
      type: 'info',
      message: `ลบออเดอร์ ${cleanId} ออกจากระบบและประวัติลูกค้าเรียบร้อยแล้ว`,
    });
    return true;
  };

  // Single Admin Authentication
  const adminLogin = (username: string, passcode: string): boolean => {
    const isArmCreds =
      username.trim().toLowerCase() === 'arm' && passcode.trim() === 'Arm15658';
    const isConfigCreds =
      username.trim().toLowerCase() === adminCredentials.username.toLowerCase() &&
      passcode.trim() === adminCredentials.passcode;

    if (isArmCreds || isConfigCreds) {
      if (isArmCreds && adminCredentials.username !== 'Arm') {
        setAdminCredentials(DEFAULT_ADMIN);
      }
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
    saveCustomerToServer(newUser);
    setNotification({
      type: 'success',
      message: `สมัครยูสเซอร์ "${newUser.username}" (${newUser.customerName}) สำเร็จเรียบร้อย`,
    });
    return newUser;
  };

  const updateCustomerUser = (id: string, updates: Partial<CustomerUser>) => {
    setCustomerUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, ...updates };
        saveCustomerToServer(updated);
        return updated;
      })
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
    deleteCustomerFromServer(id);
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
        const updated = { ...u, balance: newBal };
        saveCustomerToServer(updated);
        return updated;
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
    saveCustomerToServer(updated);
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
    lastLocalGameUpdateRef.current = Date.now();
    const updatedGames = games.map((game) => {
      const hasPackage = game.packages.some((p) => p.id === packageId);
      if (game.id !== gameId && !hasPackage) return game;
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
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    // Save directly and permanently to server disk (updates all devices immediately)
    saveGamesToServer(updatedGames);
    saveSinglePackageToServer(gameId, packageId, updates);

    setNotification({
      type: 'success',
      message: 'บันทึกราคาและข้อมูลแพ็กเกจสำเร็จเรียบร้อย (ซิงค์ทุกเครื่องทันที)',
    });
  };

  const addPackageToGame = (gameId: string, pkg: Omit<GamePackage, 'id'>) => {
    lastLocalGameUpdateRef.current = Date.now();
    const newPkg: GamePackage = {
      ...pkg,
      id: `${gameId}-pkg-${Date.now()}`,
    };

    const updatedGames = games.map((game) => {
      if (game.id !== gameId) return game;
      const filtered = (game.packages || []).filter((p) => p.id !== newPkg.id);
      return {
        ...game,
        packages: deduplicateGamePackages([...filtered, newPkg]),
      };
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    saveGamesToServer(updatedGames);

    setNotification({
      type: 'success',
      message: `เพิ่มแพ็กเกจ "${pkg.name}" ให้กับเกมสำเร็จ (ซิงค์ทุกเครื่องทันที)`,
    });
  };

  const deletePackage = (gameId: string, packageId: string) => {
    lastLocalGameUpdateRef.current = Date.now();
    const updatedGames = games.map((game) => {
      const hasPackage = game.packages.some((p) => p.id === packageId);
      if (game.id !== gameId && !hasPackage) return game;
      return {
        ...game,
        packages: game.packages.filter((p) => p.id !== packageId),
      };
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    saveGamesToServer(updatedGames);
    deletePackageFromServer(gameId, packageId);

    setNotification({
      type: 'info',
      message: 'ลบแพ็กเกจเรียบร้อยแล้ว (บันทึกถาวร)',
    });
  };

  // Game Management
  const addNewGame = (gameData: Omit<Game, 'id'>) => {
    lastLocalGameUpdateRef.current = Date.now();
    const newId =
      gameData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10) || `game_${Date.now()}`;

    const newGame: Game = {
      ...gameData,
      id: newId,
    };

    const updatedGames = [newGame, ...games];
    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    saveGamesToServer(updatedGames);

    setNotification({
      type: 'success',
      message: `เพิ่มเกม "${newGame.name}" เข้าสู่หน้าร้านสำเร็จ (บันทึกถาวร)`,
    });
  };

  const updateGame = (gameId: string, updates: Partial<Game>) => {
    lastLocalGameUpdateRef.current = Date.now();
    const updatedGames = games.map((game) => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        ...updates,
      };
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    saveSingleGameToServer(gameId, updates);
    saveGamesToServer(updatedGames);

    setNotification({
      type: 'success',
      message: 'อัปเดตข้อมูลเกมสำเร็จเรียบร้อย (บันทึกถาวร)',
    });
  };

  // อัปเดตรูปภาพประจำตัวเกม (Game Thumbnail) ถาวร
  const updateGameImage = (gameId: string, imageUrl: string) => {
    addGameImageVersion(gameId, imageUrl, 'อัปโหลดใหม่จากอุปกรณ์', true);
  };

  // กำหนดเวอร์ชันรูปภาพให้เป็นค่าเริ่มต้นในหน้าแรก (บันทึกถาวร)
  const setGameDefaultThumbnail = (gameId: string, versionId: string) => {
    lastLocalGameUpdateRef.current = Date.now();
    let targetIconUrl = '';
    let targetVersions: any[] = [];

    const updatedGames = games.map((g) => {
      if (g.id !== gameId) return g;
      const targetVersion = g.imageVersions?.find((v) => v.id === versionId);
      if (!targetVersion) return g;

      const updatedVersions = (g.imageVersions || []).map((v) => ({
        ...v,
        isDefault: v.id === versionId,
      }));

      targetIconUrl = targetVersion.url;
      targetVersions = updatedVersions;

      const updatedGame = {
        ...g,
        iconUrl: targetVersion.url,
        imageVersions: updatedVersions,
      };

      if (selectedGame?.id === gameId) {
        setSelectedGame(updatedGame);
      }
      return updatedGame;
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    if (targetIconUrl) {
      saveSingleGameToServer(gameId, { iconUrl: targetIconUrl, imageVersions: targetVersions });
    }
    saveGamesToServer(updatedGames);

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
    lastLocalGameUpdateRef.current = Date.now();
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('th-TH');
    const newVersion = {
      id: `ver-${Date.now()}`,
      url,
      name: versionName || `เวอร์ชัน ${dateStr} ${timeStr}`,
      uploadedAt: new Date().toISOString(),
      isDefault: setAsDefault,
    };

    let targetIconUrl = '';
    let targetVersions: any[] = [];

    const updatedGames = games.map((g) => {
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

      targetIconUrl = setAsDefault ? url : g.iconUrl;
      targetVersions = updatedVersions;

      const updatedGame = {
        ...g,
        iconUrl: setAsDefault ? url : g.iconUrl,
        imageVersions: updatedVersions,
      };

      if (selectedGame?.id === gameId) {
        setSelectedGame(updatedGame);
      }

      return updatedGame;
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }

    if (targetIconUrl) {
      saveSingleGameToServer(gameId, { iconUrl: targetIconUrl, imageVersions: targetVersions });
    }
    saveGamesToServer(updatedGames);

    setNotification({
      type: 'success',
      message: setAsDefault
        ? 'อัปโหลดรูปภาพประจำตัวเกมสำเร็จ พร้อมตั้งเป็นรูปเริ่มต้นหน้าแรก (บันทึกถาวร)'
        : 'เพิ่มเวอร์ชันรูปภาพเข้าสู่คลังเรียบร้อยแล้ว (บันทึกถาวร)',
    });
  };

  // ลบเวอร์ชันรูปภาพออกจากคลัง
  const deleteGameImageVersion = (gameId: string, versionId: string) => {
    lastLocalGameUpdateRef.current = Date.now();
    let remainingVersions: any[] = [];

    const updatedGames = games.map((g) => {
      if (g.id !== gameId) return g;
      const remaining = (g.imageVersions || []).filter((v) => v.id !== versionId);
      remainingVersions = remaining;
      return {
        ...g,
        imageVersions: remaining,
      };
    });

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (_) {}

    saveSingleGameToServer(gameId, { imageVersions: remainingVersions });
    saveGamesToServer(updatedGames);

    setNotification({
      type: 'info',
      message: 'ลบเวอร์ชันรูปภาพออกจากคลังเรียบร้อยแล้ว (บันทึกถาวร)',
    });
  };

  const deleteGame = (gameId: string) => {
    lastLocalGameUpdateRef.current = Date.now();
    const updatedGames = games.filter((g) => g.id !== gameId);

    setGames(updatedGames);
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(updatedGames));
    } catch (_) {}

    saveGamesToServer(updatedGames);
    if (selectedGame?.id === gameId) {
      setSelectedGame(null);
    }
    setNotification({
      type: 'info',
      message: 'ลบเกมออกจากระบบเรียบร้อยแล้ว (บันทึกถาวร)',
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
        saveOrderToServer(updatedOrd);
        return updatedOrd;
      })
    );
    soundService.playStatusUpdateSound();
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
    soundService.playSuccessSound();
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
    soundService.playSuccessSound();
    setNotification({
      type: 'success',
      message: `แนบสลิปและปรับสถานะเป็น "ชำระเงินแล้ว" ให้กับ ${orderId} สำเร็จ`,
    });
  };

  // แอดมินอัปโหลดและเชื่อมโยงภาพหลักฐานการจัดส่งสินค้า (ภาพก่อนส่ง และ ภาพหลังส่ง)
  const adminUploadDeliveryProof = (
    orderId: string,
    proofs: { preDeliveryImageUrl?: string; postDeliveryImageUrl?: string }
  ) => {
    const timeStr = new Date().toLocaleTimeString('th-TH');
    const nowIso = new Date().toISOString();
    soundService.playStatusUpdateSound();
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const updatedOrd: TopUpOrder = {
          ...ord,
          preDeliveryImageUrl:
            proofs.preDeliveryImageUrl !== undefined
              ? proofs.preDeliveryImageUrl
              : ord.preDeliveryImageUrl,
          postDeliveryImageUrl:
            proofs.postDeliveryImageUrl !== undefined
              ? proofs.postDeliveryImageUrl
              : ord.postDeliveryImageUrl,
          deliveryProofUploadedAt: nowIso,
          deliveredBy: 'แอดมิน',
          updatedAt: nowIso,
        };

        const hasProofTimeline = updatedOrd.timeline.some((t) =>
          t.description.includes('หลักฐานการจัดส่ง')
        );
        if (
          !hasProofTimeline &&
          (proofs.preDeliveryImageUrl || proofs.postDeliveryImageUrl)
        ) {
          updatedOrd.timeline = [
            ...updatedOrd.timeline,
            {
              id: `step_${Date.now()}_proof`,
              status: updatedOrd.status,
              time: timeStr,
              description: `📸 แอดมินได้แนบภาพหลักฐานการจัดส่งสินค้า (ก่อนส่ง / หลังส่ง) เรียบร้อยแล้ว`,
              actor: 'admin',
            },
          ];
        }
        return updatedOrd;
      })
    );
    setNotification({
      type: 'success',
      message: `บันทึกรูปภาพหลักฐานการจัดส่งสำหรับ ${orderId} สำเร็จแล้ว`,
    });
  };

  // Reset non-critical temporary session data safely without wiping games or custom orders
  const resetAllData = () => {
    setCart([]);
    localStorage.removeItem(LOCAL_STORAGE_CART);
    setNotification({
      type: 'info',
      message: 'รีเฟรชข้อมูลเรียบร้อยแล้ว',
    });
  };

  const downloadDatabaseBackup = () => {
    window.location.href = '/api/data/backup/download';
  };

  const restoreDatabaseBackup = async (backupData: any): Promise<{ success: boolean; orderCount: number; customerCount: number }> => {
    try {
      const incomingOrders: TopUpOrder[] = Array.isArray(backupData.orders) ? backupData.orders : [];
      const incomingCustomers: CustomerUser[] = Array.isArray(backupData.customers) ? backupData.customers : [];

      if (incomingOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, TopUpOrder>();
          prev.forEach((o) => map.set(o.id, o));
          incomingOrders.forEach((o) => map.set(o.id, o));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
        await saveOrdersBatchToServer(incomingOrders);
      }

      if (incomingCustomers.length > 0) {
        setCustomerUsers((prev) => {
          const map = new Map<string, CustomerUser>();
          prev.forEach((c) => map.set(c.id, c));
          incomingCustomers.forEach((c) => map.set(c.id, c));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
        await saveCustomersBatchToServer(incomingCustomers);
      }

      return {
        success: true,
        orderCount: incomingOrders.length,
        customerCount: incomingCustomers.length,
      };
    } catch (err) {
      console.error('Failed to restore backup data:', err);
      return { success: false, orderCount: 0, customerCount: 0 };
    }
  };

  const forceSyncAllDevices = async () => {
    try {
      lastLocalGameUpdateRef.current = 0;
      await saveGamesToServer(games);
      const serverData = await fetchServerData();
      if (serverData?.games && serverData.games.length > 0) {
        setGames(serverData.games);
        try {
          localStorage.setItem(LOCAL_STORAGE_GAMES, JSON.stringify(serverData.games));
        } catch (_) {}
      }
      setNotification({
        type: 'success',
        message: 'ซิงค์ข้อมูลราคาและรูปภาพขึ้นเซิร์ฟเวอร์เรียบร้อย ทุกเครื่องจะอัปเดตตรงกันทันที!',
      });
    } catch (e) {
      setNotification({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลกับเซิร์ฟเวอร์',
      });
    }
  };

  const updatePaymentConfig = (newConfig: Partial<PaymentConfig>) => {
    setPaymentConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem(LOCAL_STORAGE_PAYMENT_CONFIG, JSON.stringify(updated));
        saveSettingsToServer({ paymentConfig: updated });
      } catch (e) {
        console.error('Failed to save paymentConfig', e);
      }
      return updated;
    });
    setNotification({
      type: 'success',
      message: 'บันทึกการตั้งค่าบัญชีรับเงินและพร้อมเพย์เรียบร้อยแล้ว',
    });
  };

  // Add / Recover a customer order manually (for yesterday's orders or slip recovery)
  const addRecoveredCustomerOrder = async (orderData: Partial<TopUpOrder>): Promise<TopUpOrder> => {
    const orderId = orderData.id || `GP-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const orderDate = orderData.createdAt ? new Date(orderData.createdAt) : now;

    const game = games.find((g) => g.id === orderData.gameId) || games[0];
    const pkg = game?.packages.find((p) => p.id === orderData.packageId) || game?.packages[0];

    const finalPrice = orderData.price !== undefined ? orderData.price : (pkg?.price || 0);

    const newOrder: TopUpOrder = {
      id: orderId,
      gameId: orderData.gameId || game?.id || 'efootball',
      gameName: orderData.gameName || game?.name || 'eFootball',
      packageId: orderData.packageId || pkg?.id || 'manual-pkg',
      packageName: orderData.packageName || pkg?.name || 'แพ็กเกจเติมสต็อก',
      inGameItem: orderData.inGameItem || pkg?.inGameItem || 'Coins',
      itemAmount: orderData.itemAmount || pkg?.amount || 1,
      playerUid: (orderData.playerUid || '').trim(),
      serverId: orderData.serverId,
      zoneId: orderData.zoneId,
      playerNamePreview: orderData.playerNamePreview || `Player_${(orderData.playerUid || '9999').slice(-4)}`,
      quantity: orderData.quantity || 1,
      price: finalPrice,
      originalPrice: orderData.originalPrice || pkg?.originalPrice || finalPrice,
      customerName: orderData.customerName || 'ลูกค้า (กู้คืนจากสลิป)',
      contactPhone: orderData.contactPhone || '-',
      contactEmail: orderData.contactEmail,
      paymentMethod: orderData.paymentMethod || 'promptpay',
      paymentStatus: (orderData.paymentStatus as any) || 'paid',
      status: (orderData.status as any) || 'verifying',
      slipUrl: orderData.slipUrl,
      timeline: [
        {
          id: `step_${Date.now()}`,
          status: 'verifying',
          time: orderDate.toLocaleTimeString('th-TH'),
          description: `กู้คืนและบันทึกออเดอร์ของลูกค้าสำเร็จ (ยอด ฿${finalPrice.toLocaleString()})`,
        },
      ],
      createdAt: orderDate.toISOString(),
      updatedAt: now.toISOString(),
    };

    setOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== newOrder.id && !isBotOrder(o));
      const updated = [newOrder, ...filtered];
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
        localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    await saveOrderToServer(newOrder, 5);
    pushOrderToGoogleSheets(newOrder).catch(() => null);
    soundService.playSuccessSound();

    setNotification({
      type: 'success',
      message: `บันทึกออเดอร์ลูกค้า ${newOrder.id} (${newOrder.gameName} - ฿${newOrder.price.toLocaleString()}) สำเร็จและซิงค์ถาวรแล้ว`,
    });

    return newOrder;
  };

  // Deep Scan browser local storage for any previously placed orders that were cached
  const deepScanAndRecoverOrders = async (): Promise<number> => {
    let recoveredCount = 0;
    const candidates = new Map<string, TopUpOrder>();

    const storageKeys = [
      LOCAL_STORAGE_ORDERS,
      LOCAL_STORAGE_VAULT,
      'gamepay_orders_v1',
      'efcpa_orders_v1',
      'efcpa_orders_vault_permanent',
      'efcpa_emergency_orders_backup_v1',
    ];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('order') || k.includes('Order')) && !storageKeys.includes(k)) {
          storageKeys.push(k);
        }
      }
    } catch (_) {}

    for (const key of storageKeys) {
      try {
        const val = localStorage.getItem(key);
        if (!val) continue;
        const parsed = JSON.parse(val);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          if (item && item.id && !isBotOrder(item) && !isOrderDeleted(item.id) && (item.playerUid || item.price)) {
            candidates.set(item.id, item);
          }
        }
      } catch (_) {}
    }

    if (candidates.size > 0) {
      setOrders((prev) => {
        const map = new Map<string, TopUpOrder>();
        prev.filter((o) => !isBotOrder(o) && !isOrderDeleted(o.id)).forEach((o) => map.set(o.id, o));
        candidates.forEach((cand, id) => {
          if (!map.has(id) && !isOrderDeleted(id)) {
            map.set(id, cand);
            saveOrderToServer(cand, 5);
            recoveredCount++;
          }
        });
        const updated = Array.from(map.values());
        updated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        try {
          localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
          localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    }

    if (recoveredCount > 0) {
      setNotification({
        type: 'success',
        message: `สแกนพบและกู้คืนออเดอร์ลูกค้าสำเร็จ ${recoveredCount} รายการ!`,
      });
    } else {
      setNotification({
        type: 'info',
        message: 'ไม่พบออเดอร์ตกค้างในแคชของเบราว์เซอร์นี้ คุณสามารถกด "นำเข้า/บันทึกออเดอร์เมื่อวาน" เพื่อบันทึกจากสลิปได้ทันที',
      });
    }

    return recoveredCount;
  };

  // Update Shop Logo (Admin Only - Permanent)
  const updateShopLogo = async (options: { logoUrl?: string; logoBase64?: string }): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (data.success && data.logoUrl) {
        setShopLogoUrl(data.logoUrl);
        try {
          localStorage.setItem(LOCAL_STORAGE_LOGO_URL, data.logoUrl);
        } catch (_) {}
        soundService.playNotificationSound();
        setNotification({
          type: "success",
          message: "บันทึกโลโก้ร้านค้าถาวรเรียบร้อยแล้ว ทุกเครื่องจะอัปเดตตรงกันทันที",
        });
        return true;
      }
      throw new Error(data.error || "Failed to update logo");
    } catch (e: any) {
      console.error("Failed to update shop logo:", e);
      setNotification({
        type: "error",
        message: `ไม่สามารถบันทึกโลโก้ได้: ${e.message || String(e)}`,
      });
      return false;
    }
  };

  // Purge all bot mock orders completely from everywhere
  const purgeAllBotOrders = async (): Promise<void> => {
    setOrders((prev) => {
      const clean = prev.filter((o) => !isBotOrder(o));
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(clean));
        localStorage.setItem(LOCAL_STORAGE_VAULT, JSON.stringify(clean));
      } catch (_) {}
      return clean;
    });

    try {
      await fetch('/api/data/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      });
    } catch (_) {}

    setNotification({
      type: 'info',
      message: 'ล้างข้อมูลบอททั้งหมดเรียบร้อยแล้ว ระบบสะอาดพร้อมใช้งานสำหรับลูกค้าจริง',
    });
  };

  // Restore all real customer users from safe backup and permanent server disk
  const restoreAllCustomerUsers = async (): Promise<void> => {
    try {
      let serverList = await restoreCustomersFromServerBackup();
      if (!serverList || serverList.length === 0) {
        serverList = await fetchCustomersFromServer();
      }

      const map = new Map<string, CustomerUser>();
      INITIAL_CUSTOMER_USERS.forEach((c) => map.set(c.id, c));
      if (Array.isArray(serverList)) {
        serverList.forEach((c) => map.set(c.id, c));
      }
      customerUsers.forEach((c) => {
        if (c && c.id) map.set(c.id, c);
      });

      const merged = Array.from(map.values());
      setCustomerUsers(merged);
      try {
        localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(merged));
      } catch (_) {}

      await saveCustomersBatchToServer(merged);
      setNotification({
        type: 'success',
        message: `กู้คืนและซิงค์ยูสเซอร์ลูกค้าทั้งหมดสำเร็จเรียบร้อย (${merged.length} บัญชี)`,
      });
    } catch (err) {
      console.error('Failed to restore customer users:', err);
      const merged = [...INITIAL_CUSTOMER_USERS];
      setCustomerUsers(merged);
      try {
        localStorage.setItem(LOCAL_STORAGE_CUSTOMER_USERS, JSON.stringify(merged));
      } catch (_) {}
      setNotification({
        type: 'info',
        message: `โหลดข้อมูลยูสเซอร์ลูกค้าตั้งต้นเรียบร้อยแล้ว (${merged.length} บัญชี)`,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        games,
        orders,
        deletedOrderIds,
        dealers,
        webhookConfig,
        cart,
        isCartOpen,
        selectedGame,
        selectedPackage,
        activeTab,
        isAdminLoggedIn,
        adminCredentials,
        paymentConfig,
        updatePaymentConfig,
        isPaymentModalOpen,
        currentOrderForPayment,
        setCurrentOrderForPayment,
        isOrderSuccessModalOpen,
        lastCompletedOrder,
        selectedOrderForPackagePopup,
        setSelectedOrderForPackagePopup,
        isAdminLoginModalOpen,
        notification,
        setSelectedGame,
        setSelectedPackage,
        setActiveTab,
        setIsCartOpen,
        setIsPaymentModalOpen,
        setIsOrderSuccessModalOpen,
        setIsAdminLoginModalOpen,
        setNotification,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkoutCart,
        createTopUpOrder,
        confirmPayment,
        deleteOrder,
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
        adminUploadDeliveryProof,
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
        downloadDatabaseBackup,
        restoreDatabaseBackup,
        refreshOrders,
        forceSyncAllDevices,
        addRecoveredCustomerOrder,
        deepScanAndRecoverOrders,
        purgeAllBotOrders,
        restoreAllCustomerUsers,
        shopLogoUrl,
        updateShopLogo,
        soundEnabled,
        toggleSound,
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
