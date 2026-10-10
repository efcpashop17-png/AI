import { TopUpOrder, CustomerUser, PaymentConfig, Game } from '../types';

export interface ServerDataResponse {
  success: boolean;
  orders: TopUpOrder[];
  deletedOrderIds?: string[];
  customers: CustomerUser[];
  games?: Game[] | null;
  settings?: { paymentConfig?: PaymentConfig; logoUrl?: string } | null;
  timestamp?: number;
}

// Fetch all persistent data from the server (Cache-busted for real-time cross-device sync)
export async function fetchServerData(): Promise<{
  orders: TopUpOrder[];
  deletedOrderIds: string[];
  customers: CustomerUser[];
  games?: Game[] | null;
  settings?: { paymentConfig?: PaymentConfig; logoUrl?: string } | null;
} | null> {
  try {
    const res = await fetch(`/api/data/all?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) return null;
    const data: ServerDataResponse = await res.json();
    return {
      orders: Array.isArray(data.orders) ? data.orders : [],
      deletedOrderIds: Array.isArray(data.deletedOrderIds) ? data.deletedOrderIds : [],
      customers: Array.isArray(data.customers) ? data.customers : [],
      games: Array.isArray(data.games) && data.games.length > 0 ? data.games : null,
      settings: data.settings || null,
    };
  } catch (err) {
    console.warn('Could not fetch persistent data from server, falling back to local storage:', err);
    return null;
  }
}

// Save games, prices, packages, and thumbnails to server disk for cross-device sync
export async function saveGamesToServer(games: Game[]): Promise<boolean> {
  try {
    if (!Array.isArray(games) || games.length === 0) return false;
    const res = await fetch('/api/data/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(games),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to save games to server disk:', err);
    return false;
  }
}

// Compress image file to keep it lightweight (under 60KB) and prevent storage limits
export function compressImageFile(file: File, maxWidth = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

// Upload an image (File or base64) to server disk, returning permanent static URL
export async function uploadImageToServer(imageSource: File | string, filenameHint?: string): Promise<string> {
  try {
    let base64String = '';
    if (typeof imageSource === 'string') {
      if (!imageSource) return '';
      if (imageSource.startsWith('http://') || imageSource.startsWith('https://') || imageSource.startsWith('/uploads/') || imageSource.startsWith('/public/uploads/')) {
        return imageSource;
      }
      base64String = imageSource;
    } else {
      base64String = await compressImageFile(imageSource);
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64String, filename: filenameHint }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
    return base64String;
  } catch (err) {
    console.warn('Image upload to server disk failed, falling back to data URL:', err);
    return typeof imageSource === 'string' ? imageSource : '';
  }
}

// Save single package update directly to server disk
export async function saveSinglePackageToServer(gameId: string, packageId: string, updates: any): Promise<boolean> {
  try {
    const res = await fetch('/api/data/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, packageId, updates }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to save single package to server:', err);
    return false;
  }
}

// Add new package directly to server disk
export async function addPackageToServer(gameId: string, pkg: any): Promise<boolean> {
  try {
    const res = await fetch('/api/data/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_package', gameId, package: pkg }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to add package to server:', err);
    return false;
  }
}

// Delete package directly from server disk
export async function deletePackageFromServer(gameId: string, packageId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_package', gameId, packageId }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete package from server:', err);
    return false;
  }
}

// Save single game update directly to server disk
export async function saveSingleGameToServer(gameId: string, updates: any): Promise<boolean> {
  try {
    const res = await fetch('/api/data/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, updates }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to save single game to server:', err);
    return false;
  }
}

// Save system & payment settings to server disk
export async function saveSettingsToServer(settings: any): Promise<boolean> {
  try {
    const res = await fetch('/api/data/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to save settings to server disk:', err);
    return false;
  }
}

// Persist a single order to the server disk with automatic retry
export async function saveOrderToServer(order: TopUpOrder, retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch('/api/data/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn(`Attempt ${attempt}/${retries} failed to save order to server disk:`, err);
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
    }
  }
  return false;
}

// Persist multiple orders (batch sync)
export async function saveOrdersBatchToServer(orders: TopUpOrder[]): Promise<boolean> {
  try {
    const res = await fetch('/api/data/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to batch save orders to server disk:', err);
    return false;
  }
}

// Delete an order permanently on server (Admin only)
export async function deleteOrderFromServer(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete order from server disk:', err);
    return false;
  }
}

// Fetch customer users directly from server
export async function fetchCustomersFromServer(): Promise<CustomerUser[] | null> {
  try {
    const res = await fetch(`/api/data/customers?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('Failed to fetch customers from server:', err);
    return null;
  }
}

// Restore customer users from safe backup on server
export async function restoreCustomersFromServerBackup(): Promise<CustomerUser[] | null> {
  try {
    const res = await fetch('/api/data/customers/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.customers) ? data.customers : null;
  } catch (err) {
    console.warn('Failed to restore customers from server backup:', err);
    return null;
  }
}

// Persist a single customer user to the server disk
export async function saveCustomerToServer(customer: CustomerUser): Promise<boolean> {
  try {
    const res = await fetch('/api/data/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to save customer user to server disk:', err);
    return false;
  }
}

// Persist multiple customer users (batch sync)
export async function saveCustomersBatchToServer(customers: CustomerUser[]): Promise<boolean> {
  try {
    const res = await fetch('/api/data/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customers),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to batch save customers to server disk:', err);
    return false;
  }
}

// Delete a customer user permanently on server (Admin only)
export async function deleteCustomerFromServer(customerId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete customer user from server disk:', err);
    return false;
  }
}

// Subscribe to Real-Time Server-Sent Events across all devices
export function subscribeToLiveEvents(callbacks: {
  onOrdersUpdated?: (orders: TopUpOrder[], deletedId?: string, deletedOrderIds?: string[]) => void;
  onGamesUpdated?: (games: Game[]) => void;
  onCustomersUpdated?: (customers: CustomerUser[]) => void;
  onSettingsUpdated?: (settings: any) => void;
}): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  let isClosed = false;
  let reconnectTimer: any = null;
  let retryCount = 0;

  const connect = () => {
    if (isClosed) return;
    try {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      eventSource = new EventSource('/api/data/events');

      eventSource.onopen = () => {
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || !payload.type) return;

          if (payload.type === 'reconnect') {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            if (!isClosed) {
              clearTimeout(reconnectTimer);
              reconnectTimer = setTimeout(connect, 1500);
            }
            return;
          }

          if (payload.type === 'orders_updated' && payload.data?.orders && callbacks.onOrdersUpdated) {
            callbacks.onOrdersUpdated(payload.data.orders, payload.data.deletedId, payload.data.deletedOrderIds);
          } else if (payload.type === 'games_updated' && payload.data?.games && callbacks.onGamesUpdated) {
            callbacks.onGamesUpdated(payload.data.games);
          } else if (payload.type === 'customers_updated' && payload.data?.customers && callbacks.onCustomersUpdated) {
            callbacks.onCustomersUpdated(payload.data.customers);
          } else if (payload.type === 'settings_updated' && payload.data?.settings && callbacks.onSettingsUpdated) {
            callbacks.onSettingsUpdated(payload.data.settings);
          }
        } catch (_) {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          clearTimeout(reconnectTimer);
          const delay = Math.min(30000, 3000 * Math.pow(1.5, Math.min(retryCount++, 5)));
          reconnectTimer = setTimeout(connect, delay);
        }
      };
    } catch (_) {
      if (!isClosed) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 5000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    clearTimeout(reconnectTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
