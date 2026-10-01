import { CartItem, Order } from './cart.model';

export type CheckoutStatus = 'idle' | 'paying' | 'done' | 'error';

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
