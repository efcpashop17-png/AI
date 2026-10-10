/**
 * PromptPay EMVCo Payload Generator
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let formattedTarget = cleanTarget;
  let targetType = '01'; // 01 for mobile phone, 02 for national ID

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile phone Thailand: replace leading 0 with 66
    formattedTarget = '0066' + cleanTarget.substring(1);
    targetType = '01';
  } else if (cleanTarget.length === 13) {
    // National ID
    formattedTarget = cleanTarget;
    targetType = '02';
  }

  const fTargetLen = ('00' + formattedTarget.length).slice(-2);
  const subTag = `0016A000000677010111${targetType}${fTargetLen}${formattedTarget}`;
  const tag29 = `29${('00' + subTag.length).slice(-2)}${subTag}`;

  let payload = `000201010212${tag29}5802TH5303764`;

  if (amount && amount > 0) {
    const amtStr = amount.toFixed(2);
    const amtLen = ('00' + amtStr.length).slice(-2);
    payload += `54${amtLen}${amtStr}`;
  }

  payload += '6304';
  const crc = crc16(payload);
  return payload + crc;
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
}
