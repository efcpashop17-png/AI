/**
 * Thai PromptPay & SCB EMVCo QR Code Generator
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
}

function f(id: string, value: string): string {
  const len = ('00' + value.length).slice(-2);
  return id + len + value;
}

export function generatePromptPayPayload(
  target: string, // phone number or national ID
  amount?: number
): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let tag29Value = '';

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile Phone (e.g. 0948201166 -> 0066948201166)
    const intlPhone = '0066' + cleanTarget.slice(1);
    tag29Value = f('00', 'A000000677010111') + f('01', intlPhone);
  } else if (cleanTarget.length === 13) {
    // National ID
    tag29Value = f('00', 'A000000677010111') + f('02', cleanTarget);
  } else if (cleanTarget.length === 15) {
    // e-Wallet ID
    tag29Value = f('00', 'A000000677010111') + f('03', cleanTarget);
  } else {
    // Fallback standard mobile
    const intl = cleanTarget.startsWith('0') ? '0066' + cleanTarget.slice(1) : cleanTarget;
    tag29Value = f('00', 'A000000677010111') + f('01', intl);
  }

  let raw =
    f('00', '01') + // Format
    f('01', amount && amount > 0 ? '12' : '11') + // Static or Dynamic
    f('29', tag29Value) + // Merchant Info PromptPay
    f('53', '764') + // Currency code THB
    f('58', 'TH'); // Country code

  if (amount && amount > 0) {
    raw += f('54', amount.toFixed(2));
  }

  raw += '6304';
  const checksum = crc16(raw);
  return raw + checksum;
}

export const PAYMENT_CONFIG = {
  accountName: 'ชยพล ปุญนนท์',
  bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
  bankCode: 'SCB',
  bankAccount: '419-056-6897',
  bankAccountRaw: '4190566897',
  trueMoney: '094-820-1166',
  trueMoneyRaw: '0948201166',
  promptPayId: '0948201166',
};
