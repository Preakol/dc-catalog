export interface CartItem {
  heroId: number;
  name: string;
  imageUrl: string;
  price: number;
}

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

export type PurchaseState = 'buy' | 'in-cart' | 'owned';
