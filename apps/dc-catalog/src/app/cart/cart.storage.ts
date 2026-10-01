import { CartItem, Order } from './cart.model';

const CART_KEY = 'dc-catalog.cart';
const ORDERS_KEY = 'dc-catalog.orders';

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isCartItem(value: unknown): value is CartItem {
  return (
    isRecord(value) &&
    typeof value.heroId === 'number' &&
    typeof value.name === 'string' &&
    typeof value.imageUrl === 'string' &&
    typeof value.price === 'number'
  );
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.placedAt === 'string' &&
    typeof value.total === 'number' &&
    typeof value.paymentMethodId === 'string' &&
    typeof value.cardBrand === 'string' &&
    typeof value.cardLast4 === 'string' &&
    isUnknownArray(value.items) &&
    value.items.every(isCartItem)
  );
}

export function loadCart(): CartItem[] {
  const parsed = read(CART_KEY);
  return isUnknownArray(parsed) ? parsed.filter(isCartItem) : [];
}

export function saveCart(items: CartItem[]): boolean {
  return write(CART_KEY, items);
}

export function loadOrders(): Order[] {
  const parsed = read(ORDERS_KEY);
  return isUnknownArray(parsed) ? parsed.filter(isOrder) : [];
}

export function saveOrders(orders: Order[]): boolean {
  return write(ORDERS_KEY, orders);
}
