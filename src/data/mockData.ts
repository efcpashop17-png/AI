import { Game, TopUpOrder, AdminCredentials, Dealer, WebhookConfig, CustomerUser } from '../types';
import { INITIAL_GAMES } from './gamesData';

export { INITIAL_GAMES };

export const DEFAULT_ADMIN: AdminCredentials = {
  username: 'Arm',
  passcode: 'Arm15658',
  lastLogin: '2026-10-02T12:00:00Z',
};

export const INITIAL_DEALERS: Dealer[] = [
  {
    id: 'dealer-1',
    name: 'คุณชัยพงศ์ มงคลชัย',
    shopName: 'CyberPay Shop BKK',
    phone: '089-123-4567',
    email: 'chaiphong.cyber@gmail.com',
    lineId: '@cyberpay_bkk',
    status: 'approved',
    tier: 'VIP',
    discountPercent: 12,
    totalOrders: 38,
    totalSpent: 14250,
    joinedAt: '2026-08-15',
    notes: 'ตัวแทนส่งสต็อกประจำสาขาสยาม ยอดสั่งซื้อสม่ำเสมอ',
  },
  {
    id: 'dealer-2',
    name: 'คุณณัฐนันท์ วงศ์สุวรรณ',
    shopName: 'GamerStock Express',
    phone: '081-987-6543',
    email: 'natthanan.stock@hotmail.com',
    lineId: 'stock_express',
    status: 'approved',
    tier: 'Gold',
    discountPercent: 8,
    totalOrders: 21,
    totalSpent: 8790,
    joinedAt: '2026-09-02',
    notes: 'ดีลเลอร์สาย eFootball, FC Mobile & FPS สต็อกออกไว',
  },
  {
    id: 'dealer-3',
    name: 'คุณกิตติศักดิ์ พรหมมินทร์',
    shopName: 'K-Game Supply',
    phone: '095-443-2211',
    email: 'kitti.supply@gmail.com',
    lineId: 'kgame_th',
    status: 'approved',
    tier: 'Silver',
    discountPercent: 5,
    totalOrders: 14,
    totalSpent: 4320,
    joinedAt: '2026-09-18',
    notes: 'ร้านเกมเซ็นเตอร์ขอนแก่น',
  },
  {
    id: 'dealer-4',
    name: 'คุณวราภรณ์ สุขประเสริฐ',
    shopName: 'VP Game Hub',
    phone: '092-778-9900',
    email: 'waraporn.hub@yahoo.com',
    lineId: 'vphub_online',
    status: 'pending',
    tier: 'Standard',
    discountPercent: 3,
    totalOrders: 2,
    totalSpent: 640,
    joinedAt: '2026-09-30',
    notes: 'สมาชิกสมัครใหม่ รอแอดมินอนุมัติการเข้าถึงสต็อก',
  },
  {
    id: 'dealer-5',
    name: 'คุณธีรภัทร เจริญกุล',
    shopName: 'Nexus Gaming Stock',
    phone: '084-555-1122',
    email: 'nexus.corp@gmail.com',
    lineId: 'nexus_game',
    status: 'suspended',
    tier: 'Silver',
    discountPercent: 5,
    totalOrders: 8,
    totalSpent: 2890,
    joinedAt: '2026-07-20',
    notes: 'ระงับการเข้าถึงชั่วคราวเนื่องจากมียอดค้างตรวจสอบสลิป',
  },
];

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  enabled: true,
  lineNotifyToken: 'LN-MockToken-GameStock2026-XYZ',
  webhookUrl: 'https://notify-api.line.me/api/notify',
  notifyOnPayment: true,
  notifyOnDelivered: true,
  customMessageTemplate: '⚡ [GameStock Alert] คำสั่งซื้อ #{orderId}\nเกม: {gameName}\nแพ็กเกจ: {packageName}\nยอดชำระ: ฿{price}\nสถานะสต็อก: {status}\nเวลา: {time}',
  lastTestedAt: '2026-10-01 08:30:00',
  lastTestStatus: 'success',
  lastLog: 'ส่งข้อความทดสอบแจ้งเตือน Line Notify สำเร็จ (HTTP 200 OK)',
};

export const INITIAL_TOPUP_ORDERS: TopUpOrder[] = [
  {
    "id": "GP-892385",
    "gameId": "valorant",
    "gameName": "VALORANT (TH/SEA)",
    "packageId": "val-pkg-2",
    "packageName": "1,000 VP",
    "inGameItem": "Valorant Points",
    "itemAmount": 1000,
    "playerUid": "ViperMain#TH1",
    "playerNamePreview": "ViperMain",
    "originalPrice": 300,
    "price": 279,
    "contactPhone": "095-443-2211",
    "paymentMethod": "bank_transfer",
    "paymentStatus": "paid",
    "slipUrl": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
    "status": "processing",
    "timeline": [
      {
        "status": "pending_payment",
        "time": "2026-10-01 07:55:00",
        "description": "สร้างคำสั่งซื้อ และแนบสลิปธนาคาร"
      },
      {
        "status": "processing",
        "time": "2026-10-01 07:56:10",
        "description": "แอดมินกำลังตรวจสอบสลิปและโอน VP เข้าบัญชี Riot"
      }
    ],
    "createdAt": "2026-10-01T07:55:00Z",
    "updatedAt": "2026-10-01T07:56:10Z"
  },
  {
    "id": "GP-892398",
    "gameId": "genshin",
    "gameName": "Genshin Impact",
    "packageId": "gi-pkg-1",
    "packageName": "พรแห่งดวงจันทร์ (Blessing of Welkin Moon)",
    "inGameItem": "พรดวงจันทร์ (3,000 Primogems)",
    "itemAmount": 1,
    "playerUid": "809412984",
    "serverId": "Asia",
    "playerNamePreview": "Lumine_Traveler",
    "originalPrice": 179,
    "price": 159,
    "contactPhone": "081-987-6543",
    "contactEmail": "genshin.fan@hotmail.com",
    "paymentMethod": "promptpay",
    "paymentStatus": "paid",
    "status": "completed",
    "timeline": [
      {
        "status": "pending_payment",
        "time": "2026-10-01 07:30:00",
        "description": "สร้างคำสั่งซื้อ"
      },
      {
        "status": "verifying",
        "time": "2026-10-01 07:30:19",
        "description": "ชำระเงินสำเร็จ"
      },
      {
        "status": "completed",
        "time": "2026-10-01 07:31:05",
        "description": "ส่งมอบ Blessing of the Welkin Moon สำเร็จ"
      }
    ],
    "createdAt": "2026-10-01T07:30:00Z",
    "updatedAt": "2026-10-01T07:31:05Z"
  },
  {
    "id": "GP-892410",
    "customerId": "usr_001",
    "username": "client_arm",
    "customerName": "คุณอาร์ม ชัยพล (ลูกค้าราคาส่งประจำ)",
    "gameId": "efootball",
    "gameName": "eFootball",
    "packageId": "efb-pkg-3",
    "packageName": "1,050 eFootball Coins",
    "inGameItem": "eFootball Coins",
    "itemAmount": 1050,
    "playerUid": "384-918-294",
    "playerNamePreview": "⚡BarcaKing_TH",
    "originalPrice": 389,
    "price": 349,
    "contactPhone": "089-123-4567",
    "contactEmail": "player.efootball@gmail.com",
    "paymentMethod": "promptpay",
    "status": "completed",
    "paymentStatus": "paid",
    "createdAt": "2026-10-01 10:15:20",
    "paidAt": "2026-10-01 10:16:45",
    "completedAt": "2026-10-01 10:22:10",
    "timeline": [
      {
        "id": "t1",
        "status": "pending_payment",
        "time": "10:15",
        "description": "สร้างคำสั่งซื้อสำเร็จ รอชำระเงิน",
        "actor": "system"
      },
      {
        "id": "t2",
        "status": "verifying",
        "time": "10:16",
        "description": "ลูกค้าแนบสลิป EasySlip ตรวจสอบยอด 349฿ ถูกต้อง",
        "actor": "easyslip"
      },
      {
        "id": "t3",
        "status": "processing",
        "time": "10:18",
        "description": "ระบบส่งคำขอตัดสต็อกไปยังเซิร์ฟเวอร์เกม",
        "actor": "system"
      },
      {
        "id": "t4",
        "status": "completed",
        "time": "10:22",
        "description": "เติมเหรียญ 1,050 eFootball Coins เข้า UID เรียบร้อย",
        "actor": "admin"
      }
    ],
    "bonusAmount": 15,
    "updatedAt": "2026-10-01T07:46:12Z"
  },
  {
    "id": "GP-892409",
    "customerId": "usr_002",
    "username": "shop_pro_gamer",
    "customerName": "ร้านโปรเกมเมอร์ ขอนแก่น",
    "gameId": "fc-mobile",
    "gameName": "EA Sports FC Mobile",
    "packageId": "fc-pkg-3",
    "packageName": "1,000 FC Points",
    "inGameItem": "FC Points",
    "itemAmount": 1000,
    "playerUid": "912-443-128",
    "playerNamePreview": "MadridGalacticos_9",
    "originalPrice": 379,
    "price": 349,
    "contactPhone": "092-987-6543",
    "contactEmail": "fcmobile.pro@gmail.com",
    "paymentMethod": "promptpay",
    "status": "completed",
    "paymentStatus": "paid",
    "createdAt": "2026-10-01 09:40:00",
    "paidAt": "2026-10-01 09:41:15",
    "completedAt": "2026-10-01 09:48:30",
    "timeline": [
      {
        "id": "t1",
        "status": "pending_payment",
        "time": "09:40",
        "description": "สร้างคำสั่งซื้อสำเร็จ",
        "actor": "system"
      },
      {
        "id": "t2",
        "status": "verifying",
        "time": "09:41",
        "description": "สลิปธนาคารตรวจสอบผ่าน",
        "actor": "easyslip"
      },
      {
        "id": "t3",
        "status": "completed",
        "time": "09:48",
        "description": "เติม FC Points เรียบร้อย",
        "actor": "system"
      }
    ]
  }
];


export const INITIAL_CUSTOMER_USERS: CustomerUser[] = [
  {
    "id": "usr_001",
    "username": "client_arm",
    "password": "User@8899",
    "customerName": "คุณอาร์ม ชัยพล (ลูกค้าราคาส่งประจำ)",
    "contactPhone": "089-123-4567",
    "contactEmail": "arm.client@gmail.com",
    "role": "vip_dealer",
    "balance": 5400,
    "status": "active",
    "notes": "ลูกค้าเหมาสต็อก eFootball & Last War ประจำร้าน",
    "createdAt": "2026-09-15T10:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T11:00:00Z"
  },
  {
    "id": "usr_002",
    "username": "shop_pro_gamer",
    "password": "ProShop#2026",
    "customerName": "ร้านโปรเกมเมอร์ ขอนแก่น",
    "contactPhone": "092-987-6543",
    "contactEmail": "progamer.kk@gmail.com",
    "role": "wholesale_customer",
    "balance": 12500,
    "status": "active",
    "notes": "ตัวแทนส่งสต็อกหน้าร้านเกม รับโค้ดเหรียญตลอด 24 ชม.",
    "createdAt": "2026-09-20T14:20:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T10:40:00Z"
  },
  {
    "id": "usr_003",
    "username": "efootball_king_th",
    "password": "PesKing@77",
    "customerName": "กัปตันทีม eFootball Thailand",
    "contactPhone": "081-555-8899",
    "contactEmail": "captain.efootball@hotmail.com",
    "role": "vip_dealer",
    "balance": 3200,
    "status": "active",
    "notes": "เปิดแพ็กนักเตะทุกสัปดาห์ ส่งข้อมูล UID ตรง",
    "createdAt": "2026-09-25T11:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T09:45:00Z"
  },
  {
    "id": "usr_004",
    "username": "top_esport",
    "password": "TopEsport#99",
    "customerName": "แอดมินท็อป E-Sport",
    "contactPhone": "095-881-2233",
    "contactEmail": "top.esport@gmail.com",
    "role": "wholesale_customer",
    "balance": 4100,
    "status": "active",
    "notes": "ผู้จัดการทีมอีสปอร์ต สั่งเหรียญ eFootball & COD",
    "createdAt": "2026-09-28T16:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T08:10:00Z"
  },
  {
    "id": "usr_005",
    "username": "chang_nueng",
    "password": "Chang1#Mobile",
    "customerName": "ช่างหนึ่ง โมบายโฟน",
    "contactPhone": "083-991-8822",
    "contactEmail": "changnueng.mobile@gmail.com",
    "role": "regular_customer",
    "balance": 1800,
    "status": "active",
    "notes": "ร้านซ่อมมือถือรับเติมเกมให้ลูกค้าหน้าร้าน",
    "createdAt": "2026-09-29T12:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T09:05:00Z"
  },
  {
    "id": "usr_006",
    "username": "boss_win",
    "password": "WinBoss@2026",
    "customerName": "บอสวิน LastWar Alliance",
    "contactPhone": "086-441-2299",
    "contactEmail": "win.lastwar@gmail.com",
    "role": "vip_dealer",
    "balance": 6700,
    "status": "active",
    "notes": "หัวหน้าพันธมิตร Last War เหมาเพชรแจกสมาชิกกิลด์",
    "createdAt": "2026-09-30T10:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T09:25:00Z"
  },
  {
    "id": "usr_007",
    "username": "nat_genshin",
    "password": "NatGenshin#1",
    "customerName": "นัท Genshin Explorer",
    "contactPhone": "082-334-1188",
    "contactEmail": "nat.genshin@gmail.com",
    "role": "regular_customer",
    "balance": 2400,
    "status": "active",
    "notes": "สายสำรวจกาชา Genshin Impact เติมตรง UID",
    "createdAt": "2026-10-01T08:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T08:35:00Z"
  },
  {
    "id": "usr_008",
    "username": "client_mekin",
    "password": "MekinLive#88",
    "customerName": "เมฆินทร์ สตรีมเมอร์",
    "contactPhone": "087-221-9944",
    "contactEmail": "mekin.stream@gmail.com",
    "role": "regular_customer",
    "balance": 1500,
    "status": "active",
    "notes": "สตรีมเมอร์เกมคอนเทนต์ eFootball & HSR",
    "createdAt": "2026-10-02T13:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T06:45:00Z"
  },
  {
    "id": "usr_009",
    "username": "nooknick_gamer",
    "password": "NickGamer#55",
    "customerName": "นุ๊กนิ๊ก กิลด์เมอร์",
    "contactPhone": "084-551-9922",
    "contactEmail": "nooknick.gamer@gmail.com",
    "role": "regular_customer",
    "balance": 2900,
    "status": "active",
    "notes": "ชอบเปิดการ์ด Pokemon TCG และเล่น Zenless Zone Zero",
    "createdAt": "2026-10-03T09:00:00Z",
    "createdBy": "แอดมิน (สร้างมือ)",
    "lastLoginAt": "2026-10-08T04:05:00Z"
  }
];
