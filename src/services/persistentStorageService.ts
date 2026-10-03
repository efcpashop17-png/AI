import { TopUpOrder, CustomerUser } from '../types';

export interface ServerDataResponse {
  success: boolean;
  orders: TopUpOrder[];
  customers: CustomerUser[];
  timestamp?: number;
}

// Fetch all persistent data from the server
export async function fetchServerData(): Promise<{ orders: TopUpOrder[]; customers: CustomerUser[] } | null> {
  try {
    const res = await fetch('/api/data/all');
    if (!res.ok) return null;
    const data: ServerDataResponse = await res.json();
    return {
      orders: Array.isArray(data.orders) ? data.orders : [],
      customers: Array.isArray(data.customers) ? data.customers : [],
    };
  } catch (err) {
    console.warn('Could not fetch persistent data from server, falling back to local storage:', err);
    return null;
  }
}

// Persist a single order to the server disk
export async function saveOrderToServer(order: TopUpOrder): Promise<boolean> {
  try {
    const res = await fetch('/api/data/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to save order to server disk:', err);
    return false;
  }
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
