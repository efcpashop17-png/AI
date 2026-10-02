export interface GamePackage {
  id: string;
  name: string;
  inGameItem: string;      // e.g. "คูปอง", "เพชร", "Genesis Crystals", "VP", "UC", "Robux"
  amount: number;
  bonusAmount?: number;
  originalPrice: number;   // ราคาเต็มปกติ
  price: number;           // ราคาโปรโมชั่นขายจริง (แอดมินแก้ไขได้ตลอดเวลา)
  isHot?: boolean;
  badge?: string;
  active: boolean;
  imageUrl?: string;       // รูปภาพแพ็กเกจ (URL หรือรูปภาพที่แอดมินอัปโหลด)
}

export interface GameAccountField {
  label: string;
  placeholder: string;
  helperText?: string;
  needsServerSelect?: boolean;
  servers?: string[];
  zoneIdRequired?: boolean;
  zoneIdLabel?: string;
  zoneIdPlaceholder?: string;
}

export interface GameImageVersion {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
  isDefault?: boolean;
}

export interface Game {
  id: string;
  name: string;
  thaiName?: string;
  aliases?: string[];
  publisher: string;
  category: 'MOBA' | 'Battle Royale' | 'RPG' | 'FPS' | 'Casual' | 'Sports';
  description: string;
  badge?: string;
  accountField: GameAccountField;
  packages: GamePackage[];
  active: boolean;
  iconBgColor?: string;
  iconUrl?: string;
  bannerGradient: string;
  imageVersions?: GameImageVersion[];
}

export interface CartItem {
  id: string;
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  inGameItem: string;
  itemAmount: number;
  bonusAmount?: number;
  originalPrice: number;
  unitPrice: number;
  quantity: number;
  playerUid: string;
  serverId?: string;
  zoneId?: string;
  playerNamePreview?: string;
  imageUrl?: string;
}

export type PaymentMethod = 'promptpay' | 'truemoney' | 'bank_transfer';

export type TopUpStatus =
  | 'completed'       // ส่งสำเร็จเเล้ว
  | 'processing'      // กำลังดำเนินการ
  | 'failed'          // ยกเลิก
  | 'custom'          // อื่นๆ (แอดมินกำหนดเอง)
  | 'verifying'
  | 'pending_payment';

export interface TopUpTimeline {
  id?: string;
  status: TopUpStatus;
  time: string;
  description: string;
  actor?: 'customer' | 'system' | 'admin';
}

export interface TopUpOrder {
  id: string;
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  inGameItem: string;
  itemAmount: number;
  bonusAmount?: number;
  playerUid: string;
  serverId?: string;
  zoneId?: string;
  playerNamePreview?: string;
  items?: CartItem[];
  quantity?: number;
  packageImageUrl?: string;
  originalPrice: number;
  price: number;
  customerName?: string;
  contactEmail?: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'verifying' | 'paid';
  slipUrl?: string;
  slipUploadedAt?: string;
  status: TopUpStatus;
  customStatus?: string;      // ข้อความสถานะที่แอดมินกำหนดเอง
  adminNote?: string;         // ข้อความที่แอดมินพิมพ์ส่งตรงถึงลูกค้า
  timeline: TopUpTimeline[];
  createdAt: string;
  updatedAt: string;
  dealerId?: string;
}

export interface Dealer {
  id: string;
  name: string;
  shopName?: string;
  phone: string;
  email?: string;
  lineId?: string;
  status: 'approved' | 'pending' | 'suspended';
  tier: 'VIP' | 'Gold' | 'Silver' | 'Standard';
  discountPercent: number;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
  notes?: string;
}

export interface WebhookConfig {
  enabled: boolean;
  lineNotifyToken: string;
  webhookUrl: string;
  notifyOnPayment: boolean;
  notifyOnDelivered: boolean;
  customMessageTemplate?: string;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed';
  lastLog?: string;
}

export interface CustomerUser {
  id: string;
  username: string;
  password: string;
  customerName: string;
  contactPhone: string;
  contactEmail?: string;
  role: 'wholesale_customer' | 'vip_dealer' | 'agent';
  balance: number;
  status: 'active' | 'suspended';
  notes?: string;
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
}

export interface AdminCredentials {
  username: string;
  passcode: string;
  lastLogin?: string;
}

export type ActiveTab = 'store' | 'dashboard' | 'tracking' | 'how_to' | 'admin';

