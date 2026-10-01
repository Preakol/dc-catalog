import { CartItem, Order, PurchaseState } from './cart.model';

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function ownsHero(orders: Order[], heroId: number): boolean {
  return orders.some((order) => order.items.some((item) => item.heroId === heroId));
}

export function toPurchaseState(owned: boolean, inCart: boolean): PurchaseState {
  if (owned) {
    return 'owned';
  }

  return inCart ? 'in-cart' : 'buy';
}
