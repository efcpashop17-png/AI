import { TopUpOrder } from '../types';
import { getGoogleAccessToken } from './googleAuth';

export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowCount: number;
}

export interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  autoBackupEnabled: boolean;
  lastBackupTime: string;
  lastBackupCount: number;
  lastBackupStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastBackupMessage: string;
}

const STORAGE_KEYS = {
  SHEET_ID: 'efcpa_google_sheet_id',
  SHEET_TITLE: 'efcpa_google_sheet_title',
  AUTO_BACKUP: 'efcpa_google_sheet_auto_backup',
  LAST_BACKUP: 'efcpa_google_sheet_last_backup',
  LAST_COUNT: 'efcpa_google_sheet_last_count',
  LAST_STATUS: 'efcpa_google_sheet_last_status',
  LAST_MESSAGE: 'efcpa_google_sheet_last_message',
};

export const getSheetsConfig = (): SheetsConfig => {
  return {
    spreadsheetId: localStorage.getItem(STORAGE_KEYS.SHEET_ID) || '',
    spreadsheetTitle: localStorage.getItem(STORAGE_KEYS.SHEET_TITLE) || 'EF CPA Shop - Order Records',
    autoBackupEnabled: localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP) !== 'false',
    lastBackupTime: localStorage.getItem(STORAGE_KEYS.LAST_BACKUP) || '',
    lastBackupCount: Number(localStorage.getItem(STORAGE_KEYS.LAST_COUNT) || 0),
    lastBackupStatus: (localStorage.getItem(STORAGE_KEYS.LAST_STATUS) || 'idle') as SheetsConfig['lastBackupStatus'],
    lastBackupMessage: localStorage.getItem(STORAGE_KEYS.LAST_MESSAGE) || '',
  };
};

export const saveSheetsConfig = (config: Partial<SheetsConfig>) => {
  if (config.spreadsheetId !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, config.spreadsheetId);
  }
  if (config.spreadsheetTitle !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SHEET_TITLE, config.spreadsheetTitle);
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

export const SHEET_HEADERS = [
  'รหัสคำสั่งซื้อ (Order ID)',
  'วัน-เวลาทำรายการ',
  'ชื่อลูกค้า',
  'เบอร์โทรศัพท์',
  'อีเมลลูกค้า',
  'เกม',
  'แพ็กเกจ',
  'จำนวนสต็อก',
  'ยอดชำระ (บาท)',
  'ช่องทางชำระเงิน',
  'สถานะการชำระเงิน',
  'สถานะคำสั่งซื้อ',
  'UID ผู้เล่น / บัญชี',
  'เซิร์ฟเวอร์ (Server)',
  'ลิงก์สลิปโอนเงิน',
  'บันทึกเพิ่มเติม / ไทม์ไลน์',
];

const statusThaiMap: Record<string, string> = {
  completed: 'ส่งสำเร็จเเล้ว',
  processing: 'กำลังดำเนินการ',
  failed: 'ยกเลิก',
  cancelled: 'ยกเลิก',
  verifying: 'กำลังตรวจสอบชำระเงิน',
  pending_payment: 'รอชำระเงิน',
};

export const formatOrderRow = (ord: TopUpOrder): (string | number)[] => [
  ord.id,
  new Date(ord.createdAt).toLocaleString('th-TH'),
  ord.customerName || ord.playerNamePreview || 'ลูกค้า EF CPA',
  ord.contactPhone || '-',
  ord.contactEmail || '-',
  ord.gameName,
  ord.packageName,
  `${ord.itemAmount.toLocaleString()} ${ord.inGameItem}`,
  ord.price,
  ord.paymentMethod,
  ord.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอตรวจสอบชำระเงิน',
  statusThaiMap[ord.status] || ord.customStatus || ord.status,
  ord.playerUid,
  ord.serverId || '-',
  ord.slipUrl || '-',
  ord.adminNote || ord.timeline[ord.timeline.length - 1]?.description || '',
];

/**
 * Creates or appends orders to a Google Spreadsheet
 */
export const exportOrdersToGoogleSheets = async (
  orders: TopUpOrder[],
  existingSpreadsheetId?: string
): Promise<SheetExportResult> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนส่งออกข้อมูลไปยัง Google Sheets');
  }

  let spreadsheetId = existingSpreadsheetId || getSheetsConfig().spreadsheetId;
  let spreadsheetUrl = '';

  // 1. Create a new Spreadsheet if not provided
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `EF CPA Shop - บันทึกออเดอร์สต็อกสินค้า (${new Date().toLocaleDateString('th-TH')})`,
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

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheets ได้');
    }

    const createdData = await createRes.json();
    spreadsheetId = createdData.spreadsheetId;
    spreadsheetUrl = createdData.spreadsheetUrl;

    // Header row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:P1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_HEADERS],
        }),
      }
    );

    saveSheetsConfig({
      spreadsheetId,
      spreadsheetTitle: `EF CPA Shop - บันทึกออเดอร์สต็อกสินค้า (${new Date().toLocaleDateString('th-TH')})`,
      lastBackupStatus: 'success',
      lastBackupMessage: 'สร้างและเชื่อมต่อ Google Sheet สำเร็จ',
    });
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 2. Prepare Order Rows
  const rows = orders.map(formatOrderRow);

  if (rows.length > 0) {
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );

    if (!appendRes.ok) {
      const err = await appendRes.json();
      throw new Error(err.error?.message || 'ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้');
    }
  }

  saveSheetsConfig({
    lastBackupTime: new Date().toISOString(),
    lastBackupCount: orders.length,
    lastBackupStatus: 'success',
    lastBackupMessage: `ส่งออกข้อมูล ${orders.length} ออเดอร์ลง Google Sheet สำเร็จ`,
  });

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl,
    rowCount: rows.length,
  };
};

/**
 * Pushes a single new order into Google Sheets in Real-time
 */
export const pushOrderToGoogleSheets = async (
  order: TopUpOrder,
  customToken?: string
): Promise<{ success: boolean; message?: string }> => {
  const config = getSheetsConfig();
  if (!config.spreadsheetId) {
    return { success: false, message: 'ยังไม่ได้ระบุ Spreadsheet ID' };
  }

  const token = customToken || (await getGoogleAccessToken());
  if (!token) {
    return { success: false, message: 'ยังไม่ได้เชื่อมต่อ Google Account' };
  }

  try {
    const row = formatOrderRow(order);
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Orders!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    if (!appendRes.ok) {
      const err = await appendRes.json();
      throw new Error(err.error?.message || 'Failed to append order');
    }

    const displayName = order.customerName || order.playerNamePreview || order.contactPhone || 'ลูกค้า';
    saveSheetsConfig({
      lastBackupTime: new Date().toISOString(),
      lastBackupStatus: 'success',
      lastBackupMessage: `ซิงก์ออเดอร์ ${order.id} (${displayName}) ลง Google Sheet เรียลไทม์สำเร็จ`,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error syncing order realtime to Google Sheets:', err);
    saveSheetsConfig({
      lastBackupStatus: 'error',
      lastBackupMessage: `ซิงก์ออเดอร์ ${order.id} ล้มเหลว: ${err.message}`,
    });
    return { success: false, message: err.message };
  }
};

/**
 * Full automatic backup every 24 hours of all orders to Google Sheets
 */
export const backupOrdersDatabase24h = async (
  orders: TopUpOrder[],
  customToken?: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  const config = getSheetsConfig();
  if (!config.spreadsheetId) {
    return { success: false, count: 0, error: 'ยังไม่ได้ตั้งค่า Google Sheet ID' };
  }

  const token = customToken || (await getGoogleAccessToken());
  if (!token) {
    return { success: false, count: 0, error: 'ยังไม่ได้เข้าสู่ระบบ Google' };
  }

  try {
    saveSheetsConfig({
      lastBackupStatus: 'syncing',
      lastBackupMessage: `กำลังสำรองข้อมูล ${orders.length} ออเดอร์ลง Google Sheet...`,
    });

    // 1. Clear existing rows in Orders sheet to write fresh full snapshot
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Orders!A1:Z:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    ).catch(() => null);

    // 2. Write headers + all orders
    const allData = [SHEET_HEADERS, ...orders.map(formatOrderRow)];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Orders!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Orders!A1',
          majorDimension: 'ROWS',
          values: allData,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update sheet');
    }

    const nowIso = new Date().toISOString();
    saveSheetsConfig({
      lastBackupTime: nowIso,
      lastBackupCount: orders.length,
      lastBackupStatus: 'success',
      lastBackupMessage: `สำรองข้อมูลอัตโนมัติสำเร็จ ${orders.length} ออเดอร์ เมื่อ ${new Date().toLocaleTimeString('th-TH')}`,
    });

    return { success: true, count: orders.length };
  } catch (err: any) {
    console.error('24h backup error:', err);
    saveSheetsConfig({
      lastBackupStatus: 'error',
      lastBackupMessage: `การสำรองข้อมูลอัตโนมัติล้มเหลว: ${err.message}`,
    });
    return { success: false, count: 0, error: err.message };
  }
};
