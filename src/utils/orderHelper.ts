import { TopUpOrder } from '../types';

export interface NormalizedOrderItem {
  id?: string;
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  inGameItem: string;
  itemAmount: number;
  totalItemAmount: number;
  bonusAmount?: number;
  totalBonusAmount?: number;
  quantity: number; // จำนวนกี่ชิ้น/แพ็ค
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  playerUid: string;
  serverId?: string;
  zoneId?: string;
  playerNamePreview?: string;
}

/**
 * Returns a normalized list of ordered items from any TopUpOrder.
 * Guarantees every item has packageName, quantity (กี่ชิ้น), inGameItem amount, and UID.
 */
export function getOrderItems(order: TopUpOrder): NormalizedOrderItem[] {
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item, index) => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unitAmt = item.itemAmount || 0;
      const totalAmt = unitAmt * qty;
      const bonus = item.bonusAmount || 0;
      const totalBonus = bonus * qty;
      const unitPr = item.unitPrice || 0;
      const totalPr = unitPr * qty;
      return {
        id: item.id || `item-${index}`,
        gameId: item.gameId || order.gameId,
        gameName: item.gameName || order.gameName,
        packageId: item.packageId || order.packageId,
        packageName: item.packageName || order.packageName,
        inGameItem: item.inGameItem || order.inGameItem || '',
        itemAmount: unitAmt,
        totalItemAmount: totalAmt,
        bonusAmount: bonus,
        totalBonusAmount: totalBonus,
        quantity: qty,
        unitPrice: unitPr,
        totalPrice: totalPr,
        imageUrl: (item as any).imageUrl || order.packageImageUrl,
        playerUid: item.playerUid || order.playerUid,
        serverId: item.serverId || order.serverId,
        zoneId: item.zoneId || order.zoneId,
        playerNamePreview: item.playerNamePreview || order.playerNamePreview,
      };
    });
  }

  // Single direct order fallback
  const qty = order.quantity && order.quantity > 0 ? order.quantity : 1;
  const totalAmt = order.itemAmount || 0;
  const unitAmt = Math.round(totalAmt / qty) || totalAmt;
  const totalBonus = order.bonusAmount || 0;
  const unitBonus = Math.round(totalBonus / qty) || totalBonus;
  const totalPr = order.price || 0;
  const unitPr = Math.round(totalPr / qty) || totalPr;

  let cleanPackageName = order.packageName || '';

  // Check if packageName is a combined string like "5700 eFootball Coins และอีก 7 แพ็กเกจ (รวม 80 รายการ)"
  const multiMatch = cleanPackageName.match(/^(.*?)\s*และอีก\s*(\d+)\s*แพ็กเกจ\s*\(รวม\s*(\d+)\s*รายการ\)/);
  if (multiMatch) {
    const primaryName = multiMatch[1].trim();
    const otherCount = parseInt(multiMatch[2], 10) || 0;
    const totalCount = parseInt(multiMatch[3], 10) || 1;
    const primaryQty = Math.max(1, Math.round(totalCount / (otherCount + 1)));

    return [
      {
        id: `primary-${order.id}`,
        gameId: order.gameId,
        gameName: (order.gameName || '').replace(/ และอื่นๆ.*$/, ''),
        packageId: order.packageId || 'pkg-primary',
        packageName: primaryName,
        inGameItem: order.inGameItem || '',
        itemAmount: order.itemAmount || 0,
        totalItemAmount: order.itemAmount || 0,
        bonusAmount: order.bonusAmount,
        totalBonusAmount: order.bonusAmount,
        quantity: primaryQty,
        unitPrice: Math.round(order.price / totalCount) * primaryQty,
        totalPrice: Math.round(order.price / totalCount) * primaryQty,
        imageUrl: order.packageImageUrl,
        playerUid: order.playerUid,
        serverId: order.serverId,
        zoneId: order.zoneId,
        playerNamePreview: order.playerNamePreview,
      },
      {
        id: `other-${order.id}`,
        gameId: order.gameId,
        gameName: (order.gameName || '').replace(/ และอื่นๆ.*$/, ''),
        packageId: 'other-packages',
        packageName: `รายการแพ็กเกจอื่นๆ ในออเดอร์นี้ (${otherCount} แพ็กเกจ)`,
        inGameItem: order.inGameItem || '',
        itemAmount: 0,
        totalItemAmount: 0,
        quantity: Math.max(1, totalCount - primaryQty),
        unitPrice: Math.round(order.price / totalCount),
        totalPrice: order.price - Math.round(order.price / totalCount) * primaryQty,
        imageUrl: order.packageImageUrl,
        playerUid: order.playerUid,
        serverId: order.serverId,
        zoneId: order.zoneId,
        playerNamePreview: order.playerNamePreview,
      },
    ];
  }

  if (cleanPackageName.endsWith(` (x${qty})`)) {
    cleanPackageName = cleanPackageName.replace(new RegExp(` \\(x${qty}\\)$`), '');
  }

  return [
    {
      id: `single-${order.id}`,
      gameId: order.gameId,
      gameName: order.gameName,
      packageId: order.packageId,
      packageName: cleanPackageName,
      inGameItem: order.inGameItem || '',
      itemAmount: unitAmt,
      totalItemAmount: totalAmt,
      bonusAmount: unitBonus,
      totalBonusAmount: totalBonus,
      quantity: qty,
      unitPrice: unitPr,
      totalPrice: totalPr,
      imageUrl: order.packageImageUrl,
      playerUid: order.playerUid,
      serverId: order.serverId,
      zoneId: order.zoneId,
      playerNamePreview: order.playerNamePreview,
    },
  ];
}

/**
 * Format a single package item into the shop notation requested by user:
 * e.g. 12800x10, 5700x10, 3250x2
 */
export function formatPackageQuantityTag(item: { packageName: string; itemAmount?: number; quantity: number }): string {
  const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const pkgName = (item.packageName || '').trim();

  // Try extracting number from start of package name, e.g. "12,800 eFootball Coins" -> "12800"
  const leadingNumMatch = pkgName.match(/^([\d,]+)/);
  if (leadingNumMatch) {
    const cleanNum = leadingNumMatch[1].replace(/,/g, '');
    return `${cleanNum}x${qty}`;
  }

  // If itemAmount is a meaningful number (> 1), e.g. 5700 -> "5700"
  if (item.itemAmount && item.itemAmount > 1) {
    return `${item.itemAmount}x${qty}`;
  }

  // Otherwise, use clean package name
  const cleanName = pkgName.replace(/\s*x\d+$/i, '');
  return `${cleanName}x${qty}`;
}

/**
 * Returns formatted notation string for an order, e.g. "12800x10  5700x10  3250x2"
 */
export function formatOrderPackagesNotation(order: TopUpOrder): string {
  const items = getOrderItems(order);
  if (!items || items.length === 0) {
    return order.packageName || '';
  }
  return items.map(formatPackageQuantityTag).join('  ');
}

