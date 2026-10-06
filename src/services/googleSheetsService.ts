import { TopUpOrder } from '../types';
import { getAccessToken } from './googleAuthService';

const STORAGE_KEYS = {
  SPREADSHEET_ID: 'efcpa_google_sheet_id',
  SPREADSHEET_TITLE: 'efcpa_google_sheet_title',
  AUTO_BACKUP: 'efcpa_google_sheet_auto_backup',
  LAST_BACKUP: 'efcpa_google_sheet_last_backup',
  LAST_COUNT: 'efcpa_google_sheet_last_count',
  LAST_STATUS: 'efcpa_google_sheet_last_status',
  LAST_MESSAGE: 'efcpa_google_sheet_last_message',
};

export const SHEET_HEADERS = [
  'รหัสคำสั่งซื้อ (Order ID)',
  'วัน-เวลาทำรายการ',
  'ชื่อลูกค้า',
  'เบอร์โทรศัพท์',
  'อีเมล',
  'เกม',
  'แพ็กเกจ',
  'จำนวนสต็อกสินค้า',
  'ยอดเงินชำระ (บาท)',
  'ช่องทางชำระเงิน',
  'สถานะคำสั่งซื้อ',
  'สถานะการชำระเงิน',
  'Player UID / บัญชีเกม',
  'เซิร์ฟเวอร์ (Server)',
  'URL สลิปหลักฐานโอนเงิน',
];

export const getStoredSheetConfig = () => {
  return {
    spreadsheetId: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID) || '',
    spreadsheetTitle: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_TITLE) || 'EF CPA Shop - Order Records',
    autoBackupEnabled: localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP) !== 'false', // default true
    lastBackupTime: localStorage.getItem(STORAGE_KEYS.LAST_BACKUP) || '',
    lastBackupCount: Number(localStorage.getItem(STORAGE_KEYS.LAST_COUNT) || 0),
    lastBackupStatus: (localStorage.getItem(STORAGE_KEYS.LAST_STATUS) || 'idle') as 'idle' | 'success' | 'error' | 'syncing',
    lastBackupMessage: localStorage.getItem(STORAGE_KEYS.LAST_MESSAGE) || '',
  };
};

export const saveStoredSheetConfig = (config: Partial<ReturnType<typeof getStoredSheetConfig>>) => {
  if (config.spreadsheetId !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, config.spreadsheetId);
  }
  if (config.spreadsheetTitle !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SPREADSHEET_TITLE, config.spreadsheetTitle);
  }
  if (config.autoBackupEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, String(config.autoBackupEnabled));
  }
  if (config.lastBackupTime !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, config.lastBackupTime);
  }
  if (config.lastBackupCount !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LAST_COUNT, String(config.lastBackupCount));
  }
  if (config.lastBackupStatus !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LAST_STATUS, config.lastBackupStatus);
  }
  if (config.lastBackupMessage !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LAST_MESSAGE, config.lastBackupMessage);
  }
};

const formatOrderToRow = (order: TopUpOrder): (string | number)[] => {
  return [
    order.id,
    new Date(order.createdAt).toLocaleString('th-TH'),
    order.customerName || order.playerNamePreview || 'ลูกค้า EF CPA',
    order.contactPhone || '-',
    order.contactEmail || '-',
    order.gameName,
    order.packageName,
    `${order.itemAmount.toLocaleString()} ${order.inGameItem}`,
    order.price,
    order.paymentMethod,
    order.status === 'completed'
      ? 'จัดส่งสำเร็จ'
      : order.status === 'processing'
      ? 'กำลังดำเนินการ'
      : order.status === 'failed'
      ? 'ยกเลิก'
      : 'รอชำระเงิน',
    order.paymentStatus === 'paid' ? 'ชำระเงินแล้ว' : 'รอตรวจสอบชำระเงิน',
    order.playerUid,
    order.serverId || '-',
    order.slipUrl || '-',
  ];
};

/**
 * Creates a brand new Google Spreadsheet configured for order syncing
 */
export const createNewOrderSpreadsheet = async (
  accessToken: string,
  title: string = 'EF CPA Shop - บันทึกออเดอร์สต็อก'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Orders',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Initialize header row
  await appendRowsToSpreadsheet(accessToken, spreadsheetId, 'Orders!A1', [SHEET_HEADERS]);

  saveStoredSheetConfig({
    spreadsheetId,
    spreadsheetTitle: title,
    lastBackupMessage: `สร้างและเชื่อมต่อ Google Sheet สำเร็จ (${new Date().toLocaleTimeString('th-TH')})`,
    lastBackupStatus: 'success',
  });

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Appends row(s) to a Google Spreadsheet
 */
export const appendRowsToSpreadsheet = async (
  accessToken: string,
  spreadsheetId: string,
  range: string = 'Orders!A1',
  values: (string | number)[][]
) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to append rows: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Push a single order directly into the connected Google Sheet in real-time
 */
export const pushOrderRealtime = async (
  order: TopUpOrder,
  customToken?: string
): Promise<{ success: boolean; message?: string }> => {
  const config = getStoredSheetConfig();
  if (!config.spreadsheetId) {
    return { success: false, message: 'Google Sheet ID not configured yet' };
  }

  const token = customToken || (await getAccessToken());
  if (!token) {
    return { success: false, message: 'User not signed into Google' };
  }

  try {
    const row = formatOrderToRow(order);
    await appendRowsToSpreadsheet(token, config.spreadsheetId, 'Orders!A1', [row]);
    
    saveStoredSheetConfig({
      lastBackupTime: new Date().toISOString(),
      lastBackupStatus: 'success',
      lastBackupMessage: `ซิงก์ออเดอร์ ${order.id} แบบ Real-time ลงชีตสำเร็จ (${new Date().toLocaleTimeString('th-TH')})`,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Realtime sync error:', err);
    saveStoredSheetConfig({
      lastBackupStatus: 'error',
      lastBackupMessage: `ซิงก์ออเดอร์ ${order.id} ล้มเหลว: ${err.message}`,
    });
    return { success: false, message: err.message };
  }
};

/**
 * Overwrite or full-backup of all orders into Google Sheets
 */
export const backupOrdersToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  orders: TopUpOrder[]
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    saveStoredSheetConfig({
      lastBackupStatus: 'syncing',
      lastBackupMessage: `กำลังสำรองข้อมูล ${orders.length} ออเดอร์ลง Google Sheet...`,
    });

    // 1. Clear existing rows in Orders sheet (or write from A1)
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:Z:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => null);

    // 2. Prepare Header + All Orders
    const allRows = [SHEET_HEADERS, ...orders.map(formatOrderToRow)];

    // 3. Write all rows
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1?valueInputOption=USER_ENTERED`;
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Orders!A1',
        majorDimension: 'ROWS',
        values: allRows,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Backup failed: ${response.statusText}`);
    }

    const nowIso = new Date().toISOString();
    saveStoredSheetConfig({
      lastBackupTime: nowIso,
      lastBackupCount: orders.length,
      lastBackupStatus: 'success',
      lastBackupMessage: `สำรองข้อมูลสำเร็จ ${orders.length} ออเดอร์ เมื่อ ${new Date().toLocaleTimeString('th-TH')}`,
    });

    return { success: true, count: orders.length };
  } catch (err: any) {
    console.error('Backup error:', err);
    saveStoredSheetConfig({
      lastBackupStatus: 'error',
      lastBackupMessage: `เกิดข้อผิดพลาดในการสำรองข้อมูล: ${err.message}`,
    });
    return { success: false, count: 0, error: err.message };
  }
};
