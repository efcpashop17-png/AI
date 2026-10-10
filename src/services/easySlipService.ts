/**
 * EasySlip API Integration Service
 * Documented API for Thai Bank Transfer Slip Verification
 * Official Developer Token: c16cec69-0221-40c7-a2e1-71abd59a745c
 */

export const DEFAULT_EASYSLIP_API_KEY = 'c16cec69-0221-40c7-a2e1-71abd59a745c';

export interface EasySlipAmount {
  amount?: number;
  local?: {
    amount?: number;
    currency?: string;
  };
}

export interface EasySlipPerson {
  bank?: {
    id?: string;
    name?: string;
    short?: string;
  };
  account?: {
    name?: {
      th?: string;
      en?: string;
    };
    bank?: {
      type?: string;
      account?: string;
    };
  };
}

export interface EasySlipVerifyResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: {
    payload?: string;
    transRef?: string;
    date?: string;
    amount?: number | EasySlipAmount;
    sender?: EasySlipPerson;
    receiver?: EasySlipPerson;
    ref1?: string;
    ref2?: string;
    ref3?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface EasySlipVerifyResult {
  success: boolean;
  verified: boolean;
  amount?: number;
  transRef?: string;
  date?: string;
  senderName?: string;
  receiverName?: string;
  senderBank?: string;
  receiverBank?: string;
  message: string;
  raw?: any;
}

const STORAGE_USED_SLIPS = 'efcpa_used_slip_transrefs_v1';

/**
 * Get recorded used transRefs to prevent duplicate slip usage
 */
export function getUsedSlipTransRefs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_USED_SLIPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Record a transRef as used
 */
export function recordUsedSlipTransRef(transRef: string): void {
  if (!transRef) return;
  try {
    const list = getUsedSlipTransRefs();
    if (!list.includes(transRef)) {
      list.push(transRef);
      localStorage.setItem(STORAGE_USED_SLIPS, JSON.stringify(list.slice(-500))); // keep latest 500
    }
  } catch (e) {
    console.error('Failed to record used slip', e);
  }
}

export interface EasySlipInfo {
  application: string;
  usedQuota: number;
  maxQuota: number;
  remainingQuota: number;
  email: string;
  credit: number;
}

/**
 * Fetch live EasySlip application quota and account status
 */
export async function fetchEasySlipQuotaInfo(): Promise<EasySlipInfo | null> {
  const token =
    (typeof process !== 'undefined' && process.env?.EASYSLIP_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EASYSLIP_API_KEY) ||
    DEFAULT_EASYSLIP_API_KEY;

  // 1. Try server proxy route
  try {
    const res = await fetch('/api/easyslip/info');
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        return {
          application: json.data.application?.name || 'EF CPA Shop',
          usedQuota: json.data.quota?.used ?? 14,
          maxQuota: json.data.quota?.max ?? 250,
          remainingQuota: json.data.quota?.remaining ?? 236,
          email: json.data.account?.email || 'chayapol.arm2004@gmail.com',
          credit: json.data.account?.credit ?? 1,
        };
      }
    }
  } catch (_) {}

  // 2. Direct fallback
  try {
    const res = await fetch('https://api.easyslip.com/v2/info', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        return {
          application: json.data.application?.name || 'EF CPA Shop',
          usedQuota: json.data.quota?.used ?? 14,
          maxQuota: json.data.quota?.max ?? 250,
          remainingQuota: json.data.quota?.remaining ?? 236,
          email: json.data.account?.email || 'chayapol.arm2004@gmail.com',
          credit: json.data.account?.credit ?? 1,
        };
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Verify Thai bank slip using EasySlip API
 * Supports both base64 data URL and QR payload with anti-waste caching
 */
export async function verifySlipWithEasySlip(
  imageOrPayload: string,
  expectedAmount?: number,
  allowDuplicateCheck = true
): Promise<EasySlipVerifyResult> {
  const token =
    (typeof process !== 'undefined' && process.env?.EASYSLIP_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EASYSLIP_API_KEY) ||
    DEFAULT_EASYSLIP_API_KEY;

  if (!imageOrPayload) {
    return {
      success: false,
      verified: false,
      message: 'กรุณาอัปโหลดรูปภาพสลิปธนาคาร',
    };
  }

  // Check client-side slip cache first to prevent burning credits twice on the same slip
  const cacheKey = `efcpa_verified_slip_${imageOrPayload.slice(0, 120)}_${imageOrPayload.length}`;
  try {
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      const cachedResult: EasySlipVerifyResult = JSON.parse(cachedStr);
      if (cachedResult && cachedResult.success) {
        return {
          ...cachedResult,
          message: `${cachedResult.message} ⚡ (ผลตรวจเดิม - ป้องกันการตัดเครดิตซ้ำ)`,
        };
      }
    }
  } catch (_) {}

  let verifiedResult: EasySlipVerifyResult | null = null;

  // 1. Try server-side proxy route first (/api/verify-slip)
  try {
    const serverResponse = await fetch('/api/verify-slip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageOrPayload,
        expectedAmount,
      }),
    });

    if (serverResponse.ok) {
      const json: EasySlipVerifyResponse = await serverResponse.json();
      const parsed = parseEasySlipResponse(json, expectedAmount, allowDuplicateCheck);
      if (parsed.success) {
        verifiedResult = parsed;
      }
    }
  } catch {
    // If server route not available (e.g. dev/static hosting), fall through to direct call
  }

  // 2. Direct call to EasySlip API if proxy didn't return success
  if (!verifiedResult) {
    try {
      const res = await fetch('https://developer.easyslip.com/api/v1/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageOrPayload,
        }),
      });

      const data: EasySlipVerifyResponse = await res.json();
      verifiedResult = parseEasySlipResponse(data, expectedAmount, allowDuplicateCheck);
    } catch (err: any) {
      console.error('EasySlip verification error:', err);
      return {
        success: false,
        verified: false,
        message: `ไม่สามารถเชื่อมต่อระบบ EasySlip ได้: ${err?.message || 'เครือข่ายขัดข้อง'}`,
      };
    }
  }

  // Save successful verification to local cache
  if (verifiedResult && verifiedResult.success) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(verifiedResult));
    } catch (_) {}
  }

  return verifiedResult;
}

/**
 * Helper to parse EasySlip response
 */
function parseEasySlipResponse(
  json: EasySlipVerifyResponse,
  expectedAmount?: number,
  allowDuplicateCheck = true
): EasySlipVerifyResult {
  // Check for errors
  if (json.status === 400 && json.message === 'invalid_image') {
    return {
      success: false,
      verified: false,
      message: 'รูปแบบรูปภาพไม่ถูกต้อง กรุณาอัปโหลดภาพสลิปที่ชัดเจน (JPG หรือ PNG)',
      raw: json,
    };
  }

  if (json.status === 404 || json.message === 'qrcode_not_found') {
    return {
      success: false,
      verified: false,
      message: 'ไม่พบ QR Code ในรูปภาพสลิป กรุณาใช้สลิปที่มี Mini QR Code ของธนาคารอย่างชัดเจน',
      raw: json,
    };
  }

  if (json.error) {
    return {
      success: false,
      verified: false,
      message: json.error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป',
      raw: json,
    };
  }

  // Success response from EasySlip
  if (json.status === 200 && json.data) {
    const slipData = json.data;

    // Extract amount
    let slipAmount = 0;
    if (typeof slipData.amount === 'number') {
      slipAmount = slipData.amount;
    } else if (slipData.amount && typeof slipData.amount === 'object') {
      slipAmount = slipData.amount.amount ?? slipData.amount.local?.amount ?? 0;
    }

    const transRef = slipData.transRef || '';
    const dateStr = slipData.date || new Date().toISOString();

    // Check duplicate
    if (allowDuplicateCheck && transRef) {
      const usedRefs = getUsedSlipTransRefs();
      if (usedRefs.includes(transRef)) {
        return {
          success: false,
          verified: false,
          amount: slipAmount,
          transRef,
          message: `สลิปนี้ (รหัสอ้างอิง: ${transRef}) เคยถูกใช้ในระบบไปแล้ว ไม่สามารถใช้ซ้ำได้`,
          raw: json,
        };
      }
    }

    // Check expected amount
    if (expectedAmount !== undefined && expectedAmount > 0) {
      if (slipAmount < expectedAmount - 0.5) {
        return {
          success: false,
          verified: true, // It is a real slip, but amount does not match
          amount: slipAmount,
          transRef,
          message: `ยอดเงินในสลิป ฿${slipAmount.toLocaleString()} น้อยกว่ายอดที่ต้องชำระ ฿${expectedAmount.toLocaleString()}`,
          raw: json,
        };
      }
    }

    const senderName =
      slipData.sender?.account?.name?.th ||
      slipData.sender?.account?.name?.en ||
      'บัญชีผู้โอน';
    const receiverName =
      slipData.receiver?.account?.name?.th ||
      slipData.receiver?.account?.name?.en ||
      'EF CPA Shop';
    const senderBank = slipData.sender?.bank?.name || slipData.sender?.bank?.id || 'ธนาคาร';
    const receiverBank = slipData.receiver?.bank?.name || slipData.receiver?.bank?.id || 'ธนาคาร';

    // Record as used if valid
    if (transRef) {
      recordUsedSlipTransRef(transRef);
    }

    return {
      success: true,
      verified: true,
      amount: slipAmount,
      transRef,
      date: dateStr,
      senderName,
      receiverName,
      senderBank,
      receiverBank,
      message: `ตรวจสอบสลิปผ่าน EasySlip สำเร็จ! ยอดโอน ฿${slipAmount.toLocaleString()} (${senderName} ➔ ${receiverName})`,
      raw: json,
    };
  }

  return {
    success: false,
    verified: false,
    message: json.message || 'ไม่สามารถยืนยันความถูกต้องของสลิปได้',
    raw: json,
  };
}
