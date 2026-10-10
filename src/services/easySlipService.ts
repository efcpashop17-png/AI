export interface EasySlipVerifyResult {
  success: boolean;
  status?: number;
  data?: {
    payload?: string;
    transRef?: string;
    date?: string;
    amount?: {
      amount?: number;
      local?: {
        amount?: number;
        currency?: string;
      };
    };
    sender?: {
      bank?: {
        id?: string;
        name?: string;
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
    };
    receiver?: {
      bank?: {
        id?: string;
        name?: string;
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
    };
  };
  error?: {
    message?: string;
  };
  cached?: boolean;
  message?: string;
}

export async function verifySlipWithServer(imageOrBase64: string): Promise<EasySlipVerifyResult> {
  try {
    const res = await fetch('/api/verify-slip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageOrBase64 }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return {
      success: false,
      error: { message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจสอบสลิปได้' },
    };
  }
}
