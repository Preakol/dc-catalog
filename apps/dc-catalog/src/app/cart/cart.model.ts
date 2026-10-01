export interface CartItem {
  heroId: number;
  name: string;
  imageUrl: string;
  price: number;
}

export type CheckoutStatus = 'idle' | 'paying' | 'done' | 'error';

export type OrderItem = CartItem;

export interface Order {
  id: string;
  placedAt: string;
  total: number;
  items: OrderItem[];
  paymentMethodId: string;
  cardBrand: string;
  cardLast4: string;
}

export interface CartState {
  items: CartItem[];
  orders: Order[];
  status: CheckoutStatus;
  error: string | null;
}

export const initialCartState: CartState = {
  items: [],
  orders: [],
  status: 'idle',
  error: null,
};

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function ownsHero(orders: Order[], heroId: number): boolean {
  return orders.some((order) => order.items.some((item) => item.heroId === heroId));
}
