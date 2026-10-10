import { TopUpOrder, OrderItem } from '../types';

export function cleanPackageName(name: string): string {
  if (!name) return '';
  return name.replace(/\s*\(รหัส:[^)]+\)/gi, '').trim();
}

/**
 * Safely extracts items from an order. Never returns duplicate items.
 */
export function getOrderItems(order: TopUpOrder | null | undefined): OrderItem[] {
  if (!order) return [];

  if (Array.isArray(order.items) && order.items.length > 0) {
    // Deduplicate any accidental identical package entries if they share same packageId and were added erroneously
    const itemMap = new Map<string, OrderItem>();
    for (const it of order.items) {
      if (!it || !it.packageName) continue;
      const key = `${it.packageId || ''}_${it.packageName}`;
      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!;
        existing.quantity += it.quantity || 1;
        existing.price += it.price || 0;
      } else {
        itemMap.set(key, {
          packageId: it.packageId || order.packageId || 'pkg',
          packageName: it.packageName,
          quantity: it.quantity && it.quantity > 0 ? it.quantity : 1,
          price: it.price || 0,
          originalPrice: it.originalPrice,
          inGameItem: it.inGameItem,
          amount: it.amount || 0,
        });
      }
    }
    const result = Array.from(itemMap.values());
    if (result.length > 0) return result;
  }

  // Fallback to single order item: EXACTLY 1 item with order.quantity
  const qty = order.quantity && order.quantity > 0 ? order.quantity : 1;
  return [
    {
      packageId: order.packageId || 'pkg',
      packageName: order.packageName || 'แพ็กเกจเกม',
      quantity: qty,
      price: order.totalPrice || 0,
      amount: order.itemAmount || 0,
    },
  ];
}

/**
 * Calculates total pieces/packs count of an order
 */
export function getOrderTotalPieces(order: TopUpOrder | null | undefined): number {
  if (!order) return 0;
  const items = getOrderItems(order);
  if (items.length > 0) {
    return items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  }
  return order.quantity || 1;
}

/**
 * Formats shop notation (e.g. 12800x10) or tag
 */
export function formatPackageQuantityTag(item: OrderItem): string {
  if (!item) return '';
  const qty = item.quantity || 1;
  return `${qty} แพ็ก`;
}

/**
 * Format order packages summary string
 */
export function formatOrderPackagesNotation(order: TopUpOrder | null | undefined): string {
  if (!order) return '';
  const items = getOrderItems(order);
  if (items.length === 1) {
    return `${cleanPackageName(items[0].packageName)} (${items[0].quantity} แพ็ก)`;
  }
  if (items.length > 1) {
    const totalQty = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    return `${cleanPackageName(items[0].packageName)} และอีก ${items.length - 1} รายการ (รวม ${totalQty} แพ็ก)`;
  }
  return cleanPackageName(order.packageName || '');
}
